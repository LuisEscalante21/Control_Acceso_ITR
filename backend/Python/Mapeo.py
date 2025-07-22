import os
import shutil
import requests
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS 
import face_recognition as fr
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# Cargar variables de entorno
load_dotenv()
DB_URI = os.getenv('DB_URI')
MAPEO_API_KEY = os.getenv("MAPEO_API_KEY")

if not DB_URI:
    raise Exception("La variable de entorno DB_URI no está definida.")
if not MAPEO_API_KEY:
    raise Exception("La variable de entorno MAPEO_API_KEY no está definida.")

# Conexión a MongoDB
cliente = MongoClient(DB_URI)
base_de_datos = cliente['PTC_2025']
coleccion_de_caras = base_de_datos['faces']

# Configuración de Flask
app = Flask(__name__)
TEMP_FOLDER = './temp_faces'
app.config['TEMP_FOLDER'] = TEMP_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# Crear carpeta temporal si no existe
if not os.path.exists(TEMP_FOLDER):
    os.makedirs(TEMP_FOLDER)

# CORS: Cambia el origen por el de tu frontend
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

# Validar extensiones de imagen
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Extraer codificación de rostro
def Mapeo_cara(ruta_imagen):
    try:
        imagen = fr.load_image_file(ruta_imagen)
        ubicaciones_caras = fr.face_locations(imagen)
        if not ubicaciones_caras:
            return None
        codificacion = fr.face_encodings(imagen, ubicaciones_caras)[0]
        return codificacion
    except Exception as e:
        print("Error en Mapeo_cara:", e)
        return None

# Descargar imagen desde URL y guardar temporalmente
def download_image_from_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content))
        temp_path = os.path.join(app.config['TEMP_FOLDER'], "temp_image.jpg")
        img.save(temp_path)
        return temp_path
    except Exception as e:
        print("Error descargando imagen:", e)
        return None

# Decorador para validar API Key
def require_api_key(expected_key):
    def decorator(f):
        def wrapper(*args, **kwargs):
            auth = request.headers.get('Authorization')
            if not auth or not auth.startswith("Bearer "):
                return jsonify({"status": "error", "message": "API Key faltante o inválida"}), 401
            token = auth.split(" ")[1]
            if token != expected_key:
                return jsonify({"status": "error", "message": "API Key inválida"}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# Ruta para agregar rostro con URL de imagen
@app.route('/mapeo', methods=['POST'])
@require_api_key(MAPEO_API_KEY)
def mapeo():
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'No se recibieron datos JSON'}), 400

    name = data.get('name')
    code = data.get('code')
    image_url = data.get('image_url')

    if not name or not code or not image_url:
        return jsonify({'status': 'error', 'message': 'Faltan datos obligatorios (name, code, image_url)'}), 400

    temp_path = download_image_from_url(image_url)
    if not temp_path:
        return jsonify({'status': 'error', 'message': 'No se pudo descargar la imagen'}), 400

    codificacion = Mapeo_cara(temp_path)
    os.remove(temp_path)

    if codificacion is None:
        return jsonify({'status': 'error', 'message': 'No se pudo extraer el vector de la cara'}), 400

    # Verificar si ya existe por URL (opcional)
    if coleccion_de_caras.find_one({'image_url': image_url}):
        return jsonify({'status': 'duplicate', 'message': 'Rostro ya existente para esta imagen'}), 200

    documento_cara = {
        'image_url': image_url,
        'encoding': codificacion.tolist(),
        'name': name,
        'employee_code': code
    }
    coleccion_de_caras.insert_one(documento_cara)

    return jsonify({
        'status': 'success',
        'message': 'Rostro procesado y guardado correctamente',
        'encoding': codificacion.tolist()
    }), 200

# Ruta para actualizar rostro con URL de imagen
@app.route('/faces/<id>', methods=['PUT'])
@require_api_key(MAPEO_API_KEY)
def actualizar_face(id):    
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'No se recibieron datos JSON'}), 400

    name = data.get('name')
    code = data.get('code')
    image_url = data.get('image_url')

    if not name or not code or not image_url:
        return jsonify({'status': 'error', 'message': 'Faltan datos obligatorios (name, code, image_url)'}), 400

    temp_path = download_image_from_url(image_url)
    if not temp_path:
        return jsonify({'status': 'error', 'message': 'No se pudo descargar la imagen'}), 400

    codificacion = Mapeo_cara(temp_path)
    os.remove(temp_path)

    if codificacion is None:
        return jsonify({'status': 'error', 'message': 'No se pudo extraer el vector de la cara'}), 400

    resultado = coleccion_de_caras.update_one(
        {'_id': ObjectId(id)},
        {'$set': {
            'image_url': image_url,
            'encoding': codificacion.tolist(),
            'name': name,
            'employee_code': code
        }}
    )
    if resultado.matched_count == 1:
        return jsonify({'status': 'success', 'message': 'Rostro actualizado correctamente'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Rostro no encontrado'}), 404

# Ruta para listar rostros
@app.route('/faces', methods=['GET'])
@require_api_key(MAPEO_API_KEY)
def listar_faces():
    faces = list(coleccion_de_caras.find({}, {'_id': 1, 'image_url': 1, 'name': 1, 'employee_code': 1}))
    for face in faces:
        face['_id'] = str(face['_id'])
    return jsonify({'status': 'success', 'faces': faces}), 200

# Ruta para eliminar rostro
@app.route('/faces/<id>', methods=['DELETE'])
@require_api_key(MAPEO_API_KEY)
def eliminar_face(id):
    resultado = coleccion_de_caras.delete_one({'_id': ObjectId(id)})
    if resultado.deleted_count == 1:
        return jsonify({'status': 'success', 'message': 'Rostro eliminado correctamente'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Rostro no encontrado'}), 404

@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory('static/faces', filename)

# Iniciar servidor 
def iniciar_api_mapeo():
    port = int(os.getenv('PORT_MAPEO', 4500))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)

if __name__ == '__main__':
    iniciar_api_mapeo()