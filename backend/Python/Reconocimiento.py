import os
import cv2
import base64
import time
import threading
import numpy as np
import dlib
import face_recognition
import requests
from datetime import datetime
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from Health import health_bp
from faiss_index import FaissFaceIndex

app = Flask(__name__)
CORS(app)

# Cargar .env
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(dotenv_path)

# Variables de entorno
RECONOCIMIENTO_API_KEY = os.getenv("RECONOCIMIENTO_API_KEY")
mongo_uri = os.getenv("DB_URI")
port = int(os.getenv("PORT_RECONOCIMIENTO"))
db_name = os.getenv("DB_NAME", "PTC_2025")
collection_name = os.getenv("DB_COLLECTION")
SCHEDULES_URL = "http://localhost:4000/api/schedules"
ACCESS_API_URL = "http://localhost:4700/api/access" 
ACCESS_API_KEY = os.getenv("API_ACCESS_KEY")

# Conexión Mongo
mongo_client = MongoClient(mongo_uri)
db = mongo_client[db_name]
collection = db[collection_name]

# Blueprint health
app.register_blueprint(health_bp)

# Cargar clasificadores
haarcascade_dir = os.path.join(os.path.dirname(__file__), 'Clasificadores')
face_cascade_path = os.path.join(haarcascade_dir, 'haarcascade_frontalface_default.xml')
landmark_predictor_path = os.path.join(haarcascade_dir, 'shape_predictor_68_face_landmarks.dat')

if not os.path.exists(face_cascade_path) or not os.path.exists(landmark_predictor_path):
    raise FileNotFoundError("Faltan los clasificadores necesarios.")

face_cascade = cv2.CascadeClassifier(face_cascade_path)
landmark_predictor = dlib.shape_predictor(landmark_predictor_path)
face_detector = dlib.get_frontal_face_detector()

# Estado webcam
webcam_en_uso = False
webcam_lock = threading.Lock()
ultimo_estado = {'rostros_detectados': False, 'hora': None, 'ultima_imagen': None}

# Inicializar FAISS
faiss_index = FaissFaceIndex()

def require_api_key(expected_key):
    def decorator(f):
        def wrapper(*args, **kwargs):
            auth = request.headers.get('Authorization')
            if not auth or not auth.startswith("Bearer "):
                return jsonify({"error": "API Key faltante o inválida"}), 401
            token = auth.split(" ")[1]
            if token != expected_key:
                return jsonify({"error": "API Key inválida"}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def deteccion_rostros(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return face_detector(gray)

def malla_facial(image, faces, padding=10):
    for face in faces:
        left = face.left() - padding
        top = face.top() - padding
        right = face.right() + padding
        bottom = face.bottom() + padding
        cv2.rectangle(image, (left, top), (right, bottom), (0, 255, 0), 2)

        landmarks = landmark_predictor(image, face)
        for n in range(68):
            x, y = landmarks.part(n).x, landmarks.part(n).y
            cv2.circle(image, (x, y), 1, (255, 0, 39), -1)
    return image

def determinar_tipo_acceso(schedule, ahora):
    dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    dia = dias[ahora.weekday()]
    seccion = "Matutino" if ahora.hour < 12 else "Vespertino"

    bloque = schedule.get(dia, {}).get(seccion)
    if not bloque:
        return None

    hora_actual = ahora.strftime("%H:%M")
    if bloque["start"] <= hora_actual <= bloque["end"]:
        return "entrada"
    if hora_actual > bloque["end"]:
        return "salida"
    return None

def registrar_acceso_via_api(id_employee, tipo):
    ahora = datetime.now()
    headers = {
        "Authorization": f"Bearer {ACCESS_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "id_Employee": id_employee,
        "date": ahora.strftime("%Y-%m-%d")
    }
    if tipo == "entrada":
        data["entry_time"] = ahora.isoformat()
        data["entry_result"] = "Reconocido"
    elif tipo == "salida":
        data["exit_time"] = ahora.isoformat()
        data["exit_result"] = "Reconocido"
    else:
        return False

    try:
        response = requests.post(ACCESS_API_URL, json=data, headers=headers, timeout=5)
        if response.status_code in (200, 201):
            print(f"Acceso registrado para {id_employee} tipo {tipo}")
            return True
        else:
            print(f"Error API acceso: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Excepción al registrar acceso: {e}")
        return False

def log():
    while True:
        time.sleep(2)
        ahora = datetime.now()
        if ultimo_estado['ultima_imagen'] is None or (ahora - ultimo_estado['ultima_imagen']).total_seconds() > 5:
            if ultimo_estado['rostros_detectados']:
                print(f"[{ahora.strftime('%Y-%m-%d %H:%M:%S')}] No se detectaron rostros (timeout).")
            ultimo_estado.update({'rostros_detectados': False, 'hora': None, 'ultima_imagen': None})
        else:
            hora_str = ultimo_estado['hora'].strftime("%Y-%m-%d %H:%M:%S") if ultimo_estado['hora'] else "Nunca"
            print(f"[{hora_str}] {'Rostros detectados' if ultimo_estado['rostros_detectados'] else 'No se detectaron rostros'}.")

threading.Thread(target=log, daemon=True).start()

@app.route('/videoCapture')
def realtime_face_recognition():
    return Response(generar_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def generar_frames():
    global webcam_en_uso
    with webcam_lock:
        if webcam_en_uso:
            print("Camara ya en uso. Abortando streaming.")
            return
        webcam_en_uso = True

    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not cap.isOpened():
        webcam_en_uso = False
        return

    try:
        fps = 0
        frame_count = 0
        start_time = time.time()
        frame_index = 0
        process_every_n_frames = 10

        face_locations = []
        face_encodings = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            if frame_index % process_every_n_frames == 0:
                face_locations = face_recognition.face_locations(rgb_frame)
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                matched_id, distance = faiss_index.search_face(face_encoding, threshold=0.35)

                if matched_id:
                    face_doc = collection.find_one({"employee_code": matched_id})
                    if face_doc:
                        schedule_id = face_doc.get("schedule_id")
                        res = requests.get(SCHEDULES_URL)
                        if res.status_code == 200:
                            schedules = res.json()
                            schedule = next((s for s in schedules if s["_id"] == schedule_id), None)
                            if schedule:
                                tipo = determinar_tipo_acceso(schedule, datetime.now())
                                if tipo:
                                    registrar_acceso_via_api(matched_id, tipo)

                    color = (0, 255, 0)
                    label = f"{matched_id}"
                else:
                    color = (0, 0, 255)
                    label = "Desconocido"

                cv2.rectangle(frame, (left, top), (right, bottom), color, 1)
                cv2.putText(frame, label, (left, top - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

            frame_index += 1
            frame_count += 1
            elapsed_time = time.time() - start_time
            if elapsed_time >= 1.0:
                fps = frame_count / elapsed_time
                frame_count = 0
                start_time = time.time()

            cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 2)

            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    finally:
        cap.release()
        webcam_en_uso = False

def iniciar_api_reconocimiento():
    faiss_index.load_encodings(collection)
    print("La API de reconocimiento facial con FAISS está activa.")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)

if __name__ == '__main__':
    iniciar_api_reconocimiento()
