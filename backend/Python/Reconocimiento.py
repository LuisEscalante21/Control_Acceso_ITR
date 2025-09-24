import os
import cv2
import time
import threading
import dlib
import face_recognition
import requests
from datetime import datetime
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from functools import wraps
from Health import health_bp
from faiss_index import FaissFaceIndex

# ---------------- APP FLASK ----------------
app = Flask(__name__)
CORS(app)

# ---------------- ENV ----------------
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(dotenv_path)

RECONOCIMIENTO_API_KEY = os.getenv("RECONOCIMIENTO_API_KEY")
mongo_uri = os.getenv("DB_URI")
port = int(os.getenv("PORT_RECONOCIMIENTO", 5000))
db_name = os.getenv("DB_NAME", "PTC_2025")
collection_name = os.getenv("DB_COLLECTION")
SCHEDULES_URL = os.getenv("SCHEDULES_URL", "http://localhost:4000/api/schedules")
ACCESS_API_URL = os.getenv("ACCESS_API_URL", "http://localhost:4800/api/access")
ACCESS_API_KEY = os.getenv("API_ACCESS_KEY")

# ---------------- DB ----------------
mongo_client = MongoClient(mongo_uri)
db = mongo_client[db_name]
collection = db[collection_name]

# ---------------- BLUEPRINT HEALTH ----------------
app.register_blueprint(health_bp)

# ---------------- CLASIFICADORES ----------------
haarcascade_dir = os.path.join(os.path.dirname(__file__), 'Clasificadores')
face_cascade_path = os.path.join(haarcascade_dir, 'haarcascade_frontalface_default.xml')
landmark_predictor_path = os.path.join(haarcascade_dir, 'shape_predictor_68_face_landmarks.dat')

if not os.path.exists(face_cascade_path) or not os.path.exists(landmark_predictor_path):
    raise FileNotFoundError("Faltan los clasificadores necesarios en /Clasificadores.")

face_cascade = cv2.CascadeClassifier(face_cascade_path)
landmark_predictor = dlib.shape_predictor(landmark_predictor_path)
face_detector = dlib.get_frontal_face_detector()

# ---------------- ESTADO GLOBAL ----------------
webcam_en_uso = False
webcam_lock = threading.Lock()
ultimo_estado = {
    'rostros_detectados': False,
    'hora': None,
    'ultima_imagen': None,
    'id_employee': None,
    'name': None,
    'gender': None,
    'tipo': None
}

# ---------------- FAISS ----------------
faiss_index = FaissFaceIndex(collection)
faiss_reload_lock = threading.Lock()  # Protección de concurrencia

# Recarga automática del índice FAISS cada 10 segundos
def recargar_faiss_periodicamente(intervalo=10):
    while True:
        time.sleep(intervalo)
        try:
            with faiss_reload_lock:
                faiss_index.load_encodings()
            print("[FAISS] Índice recargado automáticamente.")
        except Exception as e:
            print("[FAISS] Error al recargar automáticamente:", e)

threading.Thread(target=recargar_faiss_periodicamente, daemon=True).start()

# ---------------- UTILS ----------------
def _norm(s: str) -> str:
    if not s:
        return ""
    return (s.lower()
             .replace("á", "a")
             .replace("é", "e")
             .replace("í", "i")
             .replace("ó", "o")
             .replace("ú", "u"))

def require_api_key(expected_key):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth = request.headers.get('Authorization')
            if not auth or not auth.startswith("Bearer "):
                return jsonify({"error": "API Key faltante o inválida"}), 401
            token = auth.split(" ")[1]
            if token != expected_key:
                return jsonify({"error": "API Key inválida"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

def determinar_tipo_acceso(schedule, ahora):
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    dia = dias[ahora.weekday()]
    seccion = "Matutino" if ahora.hour < 12 else "Vespertino"

    dia_key = _norm(dia)
    seccion_key = _norm(seccion)

    bloque_por_dia = (schedule or {}).get(dia_key) or (schedule or {}).get(dia) or {}
    bloque = {}
    if isinstance(bloque_por_dia, dict):
        bloque = bloque_por_dia.get(seccion_key) or bloque_por_dia.get(seccion)

    if not bloque:
        return None

    start = str(bloque.get("start", "")).strip()
    end = str(bloque.get("end", "")).strip()
    if not (start and end):
        return None

    hora_actual = ahora.strftime("%H:%M")
    if start <= hora_actual <= end:
        return "entrada"
    if hora_actual > end:
        return "salida"
    return None

def registrar_acceso_via_api(id_employee, tipo, area="Sin área"):
    ahora = datetime.now()
    headers = {
        "Authorization": f"Bearer {ACCESS_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "id_Employee": id_employee,
        "date": ahora.strftime("%Y-%m-%d"),
        "employeeArea": area
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
        ultima_imagen = ultimo_estado.get('ultima_imagen')
        rostros_detectados = ultimo_estado.get('rostros_detectados', False)
        if ultima_imagen is None or (isinstance(ultima_imagen, datetime) and (ahora - ultima_imagen).total_seconds() > 5):
            if rostros_detectados:
                print(f"[{ahora.strftime('%Y-%m-%d %H:%M:%S')}] No se detectaron rostros (timeout).")
            ultimo_estado.update({
                'rostros_detectados': False,
                'hora': None,
                'ultima_imagen': None,
                'id_employee': None,
                'name': None,
                'gender': None,
                'tipo': None
            })
        else:
            hora_str = ultimo_estado['hora'].strftime("%Y-%m-%d %H:%M:%S") if ultimo_estado['hora'] else "Nunca"
            estado_str = 'Rostros detectados' if rostros_detectados else 'No se detectaron rostros'
            print(f"[{hora_str}] {estado_str}.")
threading.Thread(target=log, daemon=True).start()

# ---------------- ENDPOINTS ----------------
@app.route("/api/last_recognized", methods=["GET"])
@require_api_key(RECONOCIMIENTO_API_KEY)
def last_recognized():
    estado = ultimo_estado.copy()
    if estado.get("rostros_detectados") and estado.get("id_employee"):
        return jsonify({
            "reconocido": True,
            "id": estado.get("id_employee"),
            "nombre": estado.get("name") or "Empleado",
            "gender": estado.get("gender"),
            "tipo": estado.get("tipo")
        })
    else:
        return jsonify({
            "reconocido": False,
            "mensaje": "No se detectó ningún rostro válido en este momento."
        })

@app.route('/videoCapture')
def realtime_face_recognition():
    return Response(generar_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def generar_frames():
    global webcam_en_uso
    with webcam_lock:
        if webcam_en_uso:
            print("Camara ya en uso. Abortando streaming.")
            return empty_gen()
        webcam_en_uso = True

    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not cap.isOpened():
        print("Error: no se pudo abrir la cámara")
        webcam_en_uso = False
        return empty_gen()

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
                print("Error: no se pudo leer frame de la cámara")
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            if frame_index % process_every_n_frames == 0:
                face_locations = face_recognition.face_locations(rgb_frame)
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                matched_id, distance = faiss_index.search_face(face_encoding)

                if matched_id:
                    face_doc = collection.find_one({"employee_code": matched_id})
                    if face_doc:
                        schedule_id = face_doc.get("schedule_id")
                        area = face_doc.get("area_id", "Sin área")

                        schedule = None
                        try:
                            res = requests.get(SCHEDULES_URL, timeout=5)
                            if res.status_code == 200:
                                schedules = res.json()
                                schedule = next((s for s in schedules if s.get("_id") == schedule_id), None)
                        except Exception as e:
                            print(f"Error obteniendo schedules: {e}")

                        now = datetime.now()
                        ultimo_estado.update({
                            "rostros_detectados": True,
                            "hora": now,
                            "ultima_imagen": now,
                            "id_employee": matched_id,
                            "name": face_doc.get("name"),
                            "gender": face_doc.get("gender", "M")
                        })

                        tipo = determinar_tipo_acceso(schedule, now) if schedule else None
                        ultimo_estado["tipo"] = tipo

                        if tipo:
                            exito = registrar_acceso_via_api(matched_id, tipo, area)
                            print(f"Registro acceso ({tipo}) para {matched_id}: {'Éxito' if exito else 'Falló'}")

                    color = (0, 255, 0)
                    label = matched_id
                else:
                    color = (0, 0, 255)
                    label = "Desconocido"

                cv2.rectangle(frame, (left, top), (right, bottom), color, 1)
                cv2.putText(frame, label, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

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
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    finally:
        cap.release()
        webcam_en_uso = False

def empty_gen():
    while True:
        time.sleep(1)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + b'' + b'\r\n')

# ---------------- FAISS ENDPOINTS ----------------
@app.route('/reload-faiss', methods=['POST'])
@require_api_key(RECONOCIMIENTO_API_KEY)
def reload_faiss():
    try:
        with faiss_reload_lock:
            faiss_index.load_encodings()
        return jsonify({'status': 'success', 'message': 'FAISS recargado correctamente'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/faiss-status', methods=['GET'])
@require_api_key(RECONOCIMIENTO_API_KEY)
def faiss_status():
    cantidad = faiss_index.index.ntotal if hasattr(faiss_index, "index") else 0
    return jsonify({'status': 'ok', 'total_faces_indexed': cantidad})

# ---------------- MAIN ----------------
def iniciar_api_reconocimiento():
    with faiss_reload_lock:
        faiss_index.load_encodings()
    print("La API de reconocimiento facial con FAISS está activa.")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)

if __name__ == '__main__':
    iniciar_api_reconocimiento()