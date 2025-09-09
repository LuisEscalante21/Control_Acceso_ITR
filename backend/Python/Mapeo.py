import os
import requests
import tempfile
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition as fr
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from cloudinary.uploader import upload
from cloudinary import config as cloudinary_config
from PIL import Image
import numpy as np

# Blueprints y FAISS
from Health import health_bp
from faiss_index import FaissFaceIndex

# ============================
# Configuración inicial
# ============================
load_dotenv()
DB_URI = os.getenv('DB_URI')
DB_NAME = os.getenv('DB_NAME')
DB_COLLECTION = os.getenv('DB_COLLECTION')
MAPEO_API_KEY = os.getenv("MAPEO_API_KEY")
RECONOCIMIENTO_API_KEY = os.getenv("RECONOCIMIENTO_API_KEY")

if not DB_URI:
    raise Exception("DB_URI no está definida.")
if not MAPEO_API_KEY:
    raise Exception("MAPEO_API_KEY no está definida.")
if not RECONOCIMIENTO_API_KEY:
    raise Exception("RECONOCIMIENTO_API_KEY no está definida.")

# Configurar Cloudinary
cloudinary_config(
    cloud_name=os.getenv("CLOUDINARY_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# MongoDB
cliente = MongoClient(DB_URI)
db = cliente[DB_NAME]
coleccion_de_caras = db[DB_COLLECTION]

# FAISS
faiss_index = FaissFaceIndex(coleccion_de_caras)

# Lock para recarga FAISS
faiss_reload_lock = threading.Lock()

# Flask App
app = Flask(__name__)
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:5173"}})
app.register_blueprint(health_bp)

# ============================
# Utilidades
# ============================
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def Mapeo_cara(ruta_imagen):
    try:
        with Image.open(ruta_imagen) as img:
            imagen_np = np.array(img.convert('RGB'))
        ubicaciones = fr.face_locations(imagen_np)
        if not ubicaciones:
            return None
        encoding = fr.face_encodings(imagen_np, ubicaciones)[0]
        return encoding
    except Exception as e:
        print("Error en Mapeo_cara:", e)
        return None

def download_image_from_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        fd, temp_path = tempfile.mkstemp(suffix=".jpg")
        os.close(fd)
        with open(temp_path, 'wb') as f:
            f.write(response.content)
        return temp_path
    except Exception as e:
        print("Error al descargar imagen:", e)
        return None

def require_api_key(expected_key):
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth = request.headers.get('Authorization')
            if not auth or not auth.startswith("Bearer "):
                return jsonify({"status": "error", "message": "API Key faltante o inválida"}), 401
            token = auth.split(" ")[1]
            if token != expected_key:
                return jsonify({"status": "error", "message": "API Key inválida"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

def notificar_reload_faiss():
    """
    Notifica al servicio de reconocimiento que recargue su índice FAISS.
    Protegido por un lock para evitar concurrencia.
    """
    with faiss_reload_lock:
        try:
            response = requests.post(
                "http://localhost:4600/reload-faiss",
                headers={
                    "Authorization": f"Bearer {RECONOCIMIENTO_API_KEY}"
                },
                timeout=3
            )
            if response.status_code == 200:
                print("[MAPEO] FAISS recargado exitosamente en reconocimiento.")
            else:
                print(f"[MAPEO] Falló recarga de FAISS: {response.status_code} - {response.text}")
        except Exception as e:
            print("[MAPEO] No se pudo notificar a reconocimiento:", e)

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    traceback.print_exc()
    return jsonify({'status': 'error', 'message': str(e)}), 500

# ============================
# Endpoints
# ============================

# Registrar rostro
@app.route('/mapeo', methods=['POST'])
@require_api_key(MAPEO_API_KEY)
def mapeo():
    if 'image' not in request.files:
        return jsonify({'status': 'error', 'message': 'No se recibió imagen'}), 400

    name = request.form.get('name')
    employee_code = request.form.get('employee_code')
    schedule_id = request.form.get('schedule_id')
    gender = request.form.get('gender')
    area_id = request.form.get('area_id')
    image = request.files['image']

    if not all([name, employee_code, schedule_id, gender, area_id]):
        return jsonify({'status': 'error', 'message': 'Faltan campos obligatorios'}), 400
    if image.filename == '' or not allowed_file(image.filename):
        return jsonify({'status': 'error', 'message': 'Imagen no válida'}), 400

    # Validación de duplicado antes de procesar la imagen
    if coleccion_de_caras.find_one({'employee_code': employee_code}):
        return jsonify({'status': 'duplicate', 'message': 'Código duplicado'}), 409

    try:
        upload_result = upload(image, folder="rostros")
        image_url = upload_result.get("secure_url")
        if not image_url:
            raise Exception("No se obtuvo URL")
    except Exception as e:
        print("Error subiendo a Cloudinary:", e)
        return jsonify({'status': 'error', 'message': 'Error al subir imagen'}), 500

    temp_path = download_image_from_url(image_url)
    if not temp_path:
        return jsonify({'status': 'error', 'message': 'Error descargando imagen'}), 400

    codificacion = Mapeo_cara(temp_path)
    os.remove(temp_path)

    if codificacion is None:
        return jsonify({'status': 'error', 'message': 'No se detectó rostro'}), 400

    documento = {
        'image_url': image_url,
        'encoding': codificacion.tolist(),
        'name': name,
        'employee_code': employee_code,
        'schedule_id': schedule_id,
        'gender': gender,
        'area_id': area_id
    }

    coleccion_de_caras.insert_one(documento)
    faiss_index.add_face(codificacion, employee_code, gender, area_id)
    notificar_reload_faiss()

    return jsonify({
        'status': 'success',
        'message': 'Rostro guardado',
        'image_url': image_url,
        'encoding': codificacion.tolist()
    }), 200

# Actualizar rostro
@app.route('/faces/<id>', methods=['PUT'])
@require_api_key(MAPEO_API_KEY)
def actualizar_face(id):
    name = request.form.get('name')
    code = request.form.get('code')
    schedule_id = request.form.get('schedule_id')
    gender = request.form.get('gender')
    area_id = request.form.get('area_id')
    image = request.files.get('image')

    if not any([name, code, schedule_id, gender, area_id, image]):
        return jsonify({'status': 'error', 'message': 'Nada que actualizar'}), 400

    documento_anterior = coleccion_de_caras.find_one({'_id': ObjectId(id)})
    if not documento_anterior:
        return jsonify({'status': 'error', 'message': 'No encontrado'}), 404

    codigo_anterior = documento_anterior.get('employee_code')
    campos_a_actualizar = {}

    if name: campos_a_actualizar['name'] = name
    if code: campos_a_actualizar['employee_code'] = code
    if schedule_id: campos_a_actualizar['schedule_id'] = schedule_id
    if gender: campos_a_actualizar['gender'] = gender
    if area_id: campos_a_actualizar['area_id'] = area_id
    nuevo_codigo = code if code else codigo_anterior

    if image and image.filename != '':
        if not allowed_file(image.filename):
            return jsonify({'status': 'error', 'message': 'Imagen no válida'}), 400
        try:
            upload_result = upload(image, folder="rostros")
            image_url = upload_result.get("secure_url")
        except Exception as e:
            print("Error Cloudinary:", e)
            return jsonify({'status': 'error', 'message': 'Error subiendo a Cloudinary'}), 500

        temp_path = download_image_from_url(image_url)
        if not temp_path:
            return jsonify({'status': 'error', 'message': 'Error al descargar imagen'}), 400

        codificacion = Mapeo_cara(temp_path)
        os.remove(temp_path)

        if codificacion is None:
            return jsonify({'status': 'error', 'message': 'No se detectó rostro'}), 400

        campos_a_actualizar['image_url'] = image_url
        campos_a_actualizar['encoding'] = codificacion.tolist()

    if not campos_a_actualizar:
        return jsonify({'status': 'error', 'message': 'Sin cambios'}), 400

    resultado = coleccion_de_caras.update_one({'_id': ObjectId(id)}, {'$set': campos_a_actualizar})

    if resultado.matched_count == 1:
        if codigo_anterior and 'encoding' in campos_a_actualizar:
            faiss_index.remove_face(codigo_anterior)
            faiss_index.add_face(
                np.array(campos_a_actualizar['encoding']),
                nuevo_codigo,
                gender=campos_a_actualizar.get('gender', documento_anterior.get('gender')),
                area_id=campos_a_actualizar.get('area_id', documento_anterior.get('area_id'))
            )
            # Recarga FAISS en segundo plano, protegido por lock
            threading.Thread(target=notificar_reload_faiss, daemon=True).start()

        return jsonify({'status': 'success', 'message': 'Rostro actualizado'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'No encontrado'}), 404

# Listar rostros
@app.route('/faces', methods=['GET'])
@require_api_key(MAPEO_API_KEY)
def listar_faces():
    faces = list(coleccion_de_caras.find({}))
    for face in faces:
        face['_id'] = str(face['_id'])
    return jsonify({'status': 'success', 'faces': faces}), 200

# Eliminar rostro
@app.route('/faces/<id>', methods=['DELETE'])
@require_api_key(MAPEO_API_KEY)
def eliminar_face(id):
    documento = coleccion_de_caras.find_one({'_id': ObjectId(id)})
    employee_code = documento.get("employee_code") if documento else None

    resultado = coleccion_de_caras.delete_one({'_id': ObjectId(id)})

    if resultado.deleted_count == 1:
        if employee_code:
            faiss_index.remove_face(employee_code)
        # Responde rápido y recarga FAISS en segundo plano, protegido por lock
        response = jsonify({'status': 'success', 'message': 'Eliminado'})
        threading.Thread(target=notificar_reload_faiss, daemon=True).start()
        return response, 200
    else:
        return jsonify({'status': 'error', 'message': 'No encontrado'}), 404

# ============================
# Inicialización
# ============================
def iniciar_api_mapeo():
    print("[MAPEO] Cargando FAISS desde Mongo...")
    faiss_index.load_encodings()  # <--- Carga inicial
    port = int(os.getenv('PORT_MAPEO', 5001))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)

if __name__ == '__main__':
    iniciar_api_mapeo()