import cv2
import os
import base64
import numpy as np
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import threading
import time
from datetime import datetime
import dlib
import face_recognition
from pymongo import MongoClient

# Importar configuración desde el archivo Config.py
from Config import RECONOCIMIENTO_API_KEY, DB_URI, PORT_RECONOCIMIENTO

# --- Configuración global y carga de modelos ---
# Variables de bloqueo para evitar acceso concurrente a la webcam
webcam_en_uso = False
webcam_lock = threading.Lock()

# Carga clasificadores y modelos (asegúrate que las rutas son correctas desde la raíz del proyecto si el archivo Clasificadores no está en el mismo directorio)
haarcascade_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Clasificadores')
face_cascade_path = os.path.join(haarcascade_dir, 'haarcascade_frontalface_default.xml')
landmark_predictor_path = os.path.join(haarcascade_dir, 'shape_predictor_68_face_landmarks.dat')

# Verificar que los archivos existen
if not os.path.exists(face_cascade_path):
    print(f"Error: No se encontró el archivo {face_cascade_path}")
    exit(1)
if not os.path.exists(landmark_predictor_path):
    print(f"Error: No se encontró el archivo {landmark_predictor_path}")
    exit(1)

face_cascade = cv2.CascadeClassifier(face_cascade_path)
landmark_predictor = dlib.shape_predictor(landmark_predictor_path)
face_detector = dlib.get_frontal_face_detector()

ultimo_estado = {'rostros_detectados': False, 'hora': None, 'ultima_imagen': None}

# --- Inicialización de la aplicación Flask ---
app_reconocimiento = Flask("ReconocimientoAPI")
CORS(app_reconocimiento) # Habilitar CORS para todas las rutas

# --- Decorador para requerir API Key ---
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

# --- Función de logging en segundo plano ---
def log_estado_reconocimiento():
    while True:
        time.sleep(2)
        ahora = datetime.now()
        # Si no hay imagen reciente (más de 5 segundos), resetea el estado de detección
        if ultimo_estado['ultima_imagen'] is None or (ahora - ultimo_estado['ultima_imagen']).total_seconds() > 5:
            if ultimo_estado['rostros_detectados']: # Solo imprime si antes se detectaron rostros
                print(f"[{ahora.strftime('%Y-%m-%d %H:%M:%S')}] No se detectaron rostros (timeout).")
            ultimo_estado.update({'rostros_detectados': False, 'hora': None, 'ultima_imagen': None})
        else:
            hora_str = ultimo_estado['hora'].strftime("%Y-%m-%d %H:%M:%S") if ultimo_estado['hora'] else "Nunca"
            print(f"[{hora_str}] {'Rostros detectados' if ultimo_estado['rostros_detectados'] else 'No se detectaron rostros'}.")

# Iniciar el hilo de logging al cargar el módulo
threading.Thread(target=log_estado_reconocimiento, daemon=True).start()

# --- Funciones de procesamiento de imágenes ---
def deteccion_rostros(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return face_detector(gray)

def malla_facial(image, faces, padding=10):
    """Dibuja rectángulos y landmarks faciales en la imagen."""
    for face in faces:
        # Extraer coordenadas de la cara y aplicar padding
        left, top, right, bottom = face.left() - padding, face.top() - padding, face.right() + padding, face.bottom() + padding
        # Dibujar rectángulo alrededor de la cara
        cv2.rectangle(image, (left, top), (right, bottom), (0, 255, 0), 2)
        
        # Detectar y dibujar landmarks faciales (68 puntos)
        landmarks = landmark_predictor(image, face)
        for n in range(0, 68):
            x, y = landmarks.part(n).x, landmarks.part(n).y
            cv2.circle(image, (x, y), 1, (255, 0, 39), -1) # Pequeños círculos para los puntos
        
        # Dibujar líneas conectando algunos landmarks (borde de la cara)
        # Esto es solo un ejemplo de cómo conectar puntos si fuera necesario, puedes ajustar o eliminar.
        for i in range(1, 17): # Conecta puntos del contorno de la mandíbula
            x1, y1 = landmarks.part(i - 1).x, landmarks.part(i - 1).y
            x2, y2 = landmarks.part(i).x, landmarks.part(i).y
            cv2.line(image, (x1, y1), (x2, y2), (2, 64, 150), 1)
    return image

# --- Rutas de la API de Reconocimiento ---

@app_reconocimiento.route('/capture', methods=['POST'])
@require_api_key(RECONOCIMIENTO_API_KEY)
def capture():
    global webcam_en_uso
    with webcam_lock:
        if webcam_en_uso:
            return jsonify({"error": "La webcam esta en uso por otro proceso."}), 409
        webcam_en_uso = True # Bloquea la webcam para este proceso

    try:
        data = request.get_json()
        image_data = data.get('image', '')
        if not image_data:
            return jsonify({"error": "No se recibio imagen"}), 400

        # Decodificar imagen Base64
        img_bytes = base64.b64decode(image_data)
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"error": "No se pudo decodificar la imagen."}), 400

        # Procesamiento de la imagen
        faces = deteccion_rostros(frame)
        rostro_detectado = len(faces) > 0

        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
              f"{'Se detectó un rostro.' if rostro_detectado else 'No se detectaron rostros.'}")
        
        # Actualizar estado para el log en segundo plano
        ultimo_estado.update({
            'rostros_detectados': rostro_detectado,
            'hora': datetime.now(),
            'ultima_imagen': datetime.now()
        })

        # Dibujar resultados en el frame
        frame_con_malla = malla_facial(frame, faces)
        
        # Codificar el frame resultante de nuevo a Base64
        _, buffer = cv2.imencode('.png', frame_con_malla)
        frame_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Formatear detecciones
        detections = [[int(face.left()), int(face.top()), int(face.width()), int(face.height())] for face in faces]

        return jsonify({"image": frame_b64, "detections": detections})
    finally:
        webcam_en_uso = False # Libera la webcam

# --- Integración con MongoDB para encodings (si aplica) ---
# Asegúrate que el cliente de Mongo se inicialice una sola vez por app
# y preferiblemente fuera de las funciones de ruta para evitar sobrecarga.
try:
    mongo_client = MongoClient(DB_URI)
    db = mongo_client["PTC_2025"] # Usar el nombre de tu base de datos
    collection = db["faces"] # Usar el nombre de tu colección de caras
except Exception as e:
    print(f"Error al conectar con MongoDB: {e}")
    # Considera una estrategia de reintento o terminar la app si la DB es crítica

known_encodings_global = []
known_ids_global = []

def obtener_encodings_desde_db():
    documentos = collection.find({})
    encodings = []
    ids = []
    for doc in documentos:
        if "encoding" in doc and isinstance(doc["encoding"], list):
            encodings.append(np.array(doc["encoding"]))
            ids.append(str(doc["_id"])) # Asegúrate de que _id es el identificador deseado
    return encodings, ids

def cargar_encodings_en_memoria():
    global known_encodings_global, known_ids_global
    known_encodings_global, known_ids_global = obtener_encodings_desde_db()
    print(f"[INFO] Se cargaron {len(known_encodings_global)} encodings desde MongoDB.")


# --- Streaming de video con reconocimiento en tiempo real ---
def generar_frames():
    global webcam_en_uso
    with webcam_lock:
        if webcam_en_uso:
            print("Cámara ya en uso. Abortando streaming.")
            # Es importante no retornar un generador vacío si ya está en uso,
            # pero el cliente que llama a Response(generar_frames()) debe manejarlo.
            # Aquí, solo imprimimos y el generador no producirá frames.
            return # Esto significa que el generador no producirá nada
        webcam_en_uso = True

    # Intenta abrir la webcam (índice 0, 1, etc., dependiendo de tu sistema)
    # cv2.CAP_DSHOW es útil en Windows para evitar ciertos problemas de backend
    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW) # Puedes probar con 0 si tienes una sola cámara
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    if not cap.isOpened():
        print("Error: No se pudo abrir la cámara.")
        webcam_en_uso = False
        # Si la cámara no se puede abrir, el generador no debe producir frames.
        return # Sale de la función, el generador no se inicializa

    known_encodings = known_encodings_global
    known_ids = known_ids_global

    try:
        fps = 0
        frame_count = 0
        start_time = time.time()
        frame_index = 0
        process_every_n_frames = 10 # Procesa rostros cada N frames para optimización

        face_locations = []
        face_encodings = []

        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: No se pudo leer el frame de la cámara. Saliendo del stream.")
                break # Sale del bucle si no se puede leer el frame

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Procesar rostros solo cada cierto número de frames
            if frame_index % process_every_n_frames == 0:
                face_locations = face_recognition.face_locations(rgb_frame)
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

            # Dibujar y etiquetar rostros detectados
            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 1)
                
                name = "Desconocido" # Nombre por defecto
                if known_encodings: # Solo intenta comparar si hay encodings cargados
                    # Calcula la distancia euclidiana entre el rostro detectado y los conocidos
                    distances = np.linalg.norm(np.array(known_encodings) - face_encoding, axis=1)
                    min_distance = np.min(distances)
                    best_match_index = np.argmin(distances)

                    # Si la distancia es menor a un umbral, se considera una coincidencia
                    if min_distance < 0.5: # Umbral típico para face_recognition
                        name = known_ids[best_match_index] # Usa el ID conocido
                
                # Pone el texto en el frame
                cv2.putText(frame, name, (left, top - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0) if name != "Desconocido" else (0, 0, 255), 1)

            # Cálculo de FPS
            frame_index += 1
            frame_count += 1
            elapsed_time = time.time() - start_time
            if elapsed_time >= 1.0:
                fps = frame_count / elapsed_time
                frame_count = 0
                start_time = time.time()

            cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 2)

            # Codificar frame a JPEG para streaming (más eficiente)
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            # Yield del frame en formato multipart/x-mixed-replace
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    finally:
        cap.release() # Asegura que la cámara se libere al terminar o haber error
        webcam_en_uso = False # Libera el bloqueo de la webcam


@app_reconocimiento.route('/video-capture')
def realtime_face_recognition():
    """Endpoint para streaming de video con reconocimiento facial."""
    # Retorna un Response que consume el generador de frames
    return Response(generar_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- Health check para la API de Reconocimiento ---
@app_reconocimiento.route('/health', methods=['GET'])
@require_api_key(RECONOCIMIENTO_API_KEY)
def health_check_reconocimiento():
    """Endpoint para verificar el estado de la API de Reconocimiento."""
    return jsonify({'status': 'ok - Reconocimiento API'}), 200

# --- Función para iniciar la API de Reconocimiento ---
def iniciar_api_reconocimiento():
    cargar_encodings_en_memoria() # Carga los encodings al iniciar la API
    print(f"La API de reconocimiento facial está activa en puerto {PORT_RECONOCIMIENTO}.")
    # use_reloader=False es crucial para multiprocessing para evitar que Flask inicie la app dos veces
    app_reconocimiento.run(debug=True, use_reloader=False, host='0.0.0.0', port=PORT_RECONOCIMIENTO)


if __name__ == '__main__':
    iniciar_api_reconocimiento()
