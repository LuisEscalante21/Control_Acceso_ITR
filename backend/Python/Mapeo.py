import os
import cv2
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
from PIL import Image, ImageOps
import numpy as np
from datetime import datetime

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

# Lock para sincronización FAISS
faiss_lock = threading.Lock()

# Flask App
app = Flask(__name__)
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:5173"}})
app.register_blueprint(health_bp)

# ============================
# Parámetros de calidad / FR
# ============================
UPSAMPLE = 1
NUM_JITTERS = 1
MIN_FACE_SIZE = 80
LAP_VAR_THR = 90.0
MIN_BRIGHTNESS = 50.0

# ============================
# Utilidades
# ============================
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def download_image_from_url(url):
    try:
        response = requests.get(url, timeout=10)
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
    Se ejecuta SOLO cuando hay cambios (ADD/UPDATE/DELETE).
    """
    try:
        response = requests.post(
            "http://localhost:4600/reload-faiss",
            headers={"Authorization": f"Bearer {RECONOCIMIENTO_API_KEY}"},
            timeout=5
        )
        if response.status_code == 200:
            print("[MAPEO] FAISS recargado exitosamente en servicio de reconocimiento.")
        else:
            print(f"[MAPEO] Falló recarga de FAISS: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[MAPEO] No se pudo notificar a reconocimiento: {e}")

def actualizar_faiss_local_y_notificar(operacion, employee_code=None, encoding=None, gender=None, area_id=None):
    """
    Actualiza el índice FAISS LOCAL de forma thread-safe y notifica al servicio de reconocimiento.
    
    Args:
        operacion: 'add', 'update', 'delete'
        employee_code: código del empleado
        encoding: vector del rostro (numpy array o list)
        gender: género del empleado
        area_id: área del empleado
    """
    with faiss_lock:
        try:
            if operacion == 'add':
                print(f"[MAPEO-FAISS] Agregando rostro: {employee_code}")
                faiss_index.add_face(encoding, employee_code, gender, area_id)
                
            elif operacion == 'update':
                print(f"[MAPEO-FAISS] Actualizando rostro: {employee_code}")
                # Primero eliminar la entrada antigua
                faiss_index.remove_face(employee_code)
                # Luego agregar la nueva
                if encoding is not None:
                    faiss_index.add_face(encoding, employee_code, gender, area_id)
                    
            elif operacion == 'delete':
                print(f"[MAPEO-FAISS] Eliminando rostro: {employee_code}")
                faiss_index.remove_face(employee_code)
            
            # Notificar al servicio de reconocimiento en un thread separado
            threading.Thread(target=notificar_reload_faiss, daemon=True).start()
            print(f"[MAPEO-FAISS] Operación '{operacion}' completada para {employee_code}")
            
        except Exception as e:
            print(f"[MAPEO-FAISS] Error en operación '{operacion}': {e}")

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    traceback.print_exc()
    return jsonify({'status': 'error', 'message': str(e)}), 500

# ============================
# Preprocesado / Calidad imagen
# ============================
def _auto_gamma_from_mean(y_float, target_mean=0.5):
    eps = 1e-6
    m = float(np.clip(y_float.mean(), eps, 1.0))
    gamma = np.log(target_mean + eps) / np.log(m + eps)
    return float(np.clip(gamma, 0.6, 2.0))

def preprocess_rgb(rgb_np):
    bgr = cv2.cvtColor(rgb_np, cv2.COLOR_RGB2BGR)
    ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)

    y_float = y.astype(np.float32) / 255.0
    gamma = _auto_gamma_from_mean(y_float, target_mean=0.5)
    y_corr = np.power(y_float, gamma)

    y_u8 = np.clip(y_corr * 255.0, 0, 255).astype(np.uint8)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    y_eq = clahe.apply(y_u8)

    ycrcb_eq = cv2.merge([y_eq, cr, cb])
    bgr_eq = cv2.cvtColor(ycrcb_eq, cv2.COLOR_YCrCb2BGR)
    bgr_filt = cv2.bilateralFilter(bgr_eq, d=7, sigmaColor=50, sigmaSpace=50)
    rgb_out = cv2.cvtColor(bgr_filt, cv2.COLOR_BGR2RGB)
    return rgb_out

def is_blurry(gray_u8, thr_var_laplacian=LAP_VAR_THR):
    fm = cv2.Laplacian(gray_u8, cv2.CV_64F).var()
    return fm < thr_var_laplacian, fm

def brightness_score(gray_u8):
    return float(gray_u8.mean())

def face_quality_ok(rgb_np, top, right, bottom, left):
    face_rgb = rgb_np[top:bottom, left:right]
    if face_rgb.size == 0:
        return False, {"reason": "empty_roi"}

    h, w = face_rgb.shape[:2]
    if min(h, w) < MIN_FACE_SIZE:
        return False, {"reason": "small", "size": (w, h)}

    bgr = cv2.cvtColor(face_rgb, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    blurry, fm = is_blurry(gray, LAP_VAR_THR)
    if blurry:
        return False, {"reason": "blurry", "lap_var": float(fm)}

    b = brightness_score(gray)
    if b < MIN_BRIGHTNESS:
        return False, {"reason": "dark", "brightness": float(b)}

    return True, {"lap_var": float(fm), "brightness": float(b)}

def load_rgb_image(path):
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)
        rgb = np.array(img.convert('RGB'))
    return rgb

def Mapeo_cara(ruta_imagen):
    try:
        rgb = load_rgb_image(ruta_imagen)
        rgb_proc = preprocess_rgb(rgb)

        ubicaciones = fr.face_locations(rgb_proc, number_of_times_to_upsample=UPSAMPLE, model="hog")
        if not ubicaciones:
            return None, {"reason": "no_face"}

        def _area(loc):
            top, right, bottom, left = loc
            return (bottom - top) * (right - left)
        ubicaciones.sort(key=_area, reverse=True)
        top, right, bottom, left = ubicaciones[0]

        ok, qinfo = face_quality_ok(rgb_proc, top, right, bottom, left)
        if not ok:
            return None, {"reason": "low_quality", **qinfo}

        encs = fr.face_encodings(rgb_proc, [ubicaciones[0]], num_jitters=NUM_JITTERS)
        if not encs:
            return None, {"reason": "encode_failed"}

        return encs[0], {"quality": qinfo}
    except Exception as e:
        print("Error en Mapeo_cara:", e)
        return None, {"reason": "exception", "detail": str(e)}

# ============================
# Validación de empleados
# ============================
def validar_empleado_existe(employee_code):
    employee_collection = db["employees"]
    coordinator_collection = db["coordinators"] 
    admin_collection = db["administrators"]
    
    collections_to_check = [
        ("Employee", employee_collection),
        ("Coordinator", coordinator_collection),
        ("Administrator", admin_collection)
    ]
    
    for user_type, collection in collections_to_check:
        user = None
        if ObjectId.is_valid(employee_code):
            user = collection.find_one({"_id": ObjectId(employee_code)})
        
        if not user:
            user = collection.find_one({"numEmpleado": employee_code})
            
        if user:
            return True, user_type, user
            
    return False, None, None

# ============================
# Endpoints
# ============================

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

    # Validar que el empleado exista
    empleado_existe, user_type, user_data = validar_empleado_existe(employee_code)
    if not empleado_existe:
        return jsonify({
            'status': 'error', 
            'message': f'El código de empleado "{employee_code}" no existe en el sistema.'
        }), 404

    # Validación de duplicado
    if coleccion_de_caras.find_one({'employee_code': employee_code}):
        return jsonify({'status': 'duplicate', 'message': 'Este empleado ya tiene un rostro registrado'}), 409

    print(f"[MAPEO] Empleado validado: {employee_code} - Tipo: {user_type}")

    # Subir a Cloudinary
    try:
        upload_result = upload(image, folder="rostros")
        image_url = upload_result.get("secure_url")
        if not image_url:
            raise Exception("No se obtuvo URL")
    except Exception as e:
        print("Error subiendo a Cloudinary:", e)
        return jsonify({'status': 'error', 'message': 'Error al subir imagen'}), 500

    # Descargar y mapear
    temp_path = download_image_from_url(image_url)
    if not temp_path:
        return jsonify({'status': 'error', 'message': 'Error descargando imagen'}), 400

    encoding, info = Mapeo_cara(temp_path)
    os.remove(temp_path)

    if encoding is None:
        motivo = info.get("reason", "unknown")
        return jsonify({'status': 'error', 'message': f'No se pudo mapear rostro ({motivo})', 'detail': info}), 400

    # Guardar en MongoDB
    documento = {
        'image_url': image_url,
        'encoding': encoding.tolist(),
        'name': name,
        'employee_code': employee_code,
        'schedule_id': schedule_id,
        'gender': gender,
        'area_id': area_id,
        'user_type': user_type,
        'validated_at': datetime.now()
    }

    coleccion_de_caras.insert_one(documento)
    
    # ACTUALIZACIÓN CRÍTICA: Sincronizar FAISS solo cuando hay cambio
    actualizar_faiss_local_y_notificar('add', employee_code, encoding, gender, area_id)

    return jsonify({
        'status': 'success',
        'message': f'Rostro guardado para {user_type}: {user_data.get("names", "N/A")}',
        'employee_validated': True,
        'user_type': user_type,
        'image_url': image_url,
        'quality_info': info.get("quality", {})
    }), 200

@app.route('/faces/<id>', methods=['PUT'])
@require_api_key(MAPEO_API_KEY)
def actualizar_face(id):
    is_multipart = bool(request.files) or bool(request.form)
    data = request.form if is_multipart else (request.get_json(silent=True) or {})

    name = data.get('name')
    employee_code_new = data.get('employee_code') or data.get('code')
    schedule_id = data.get('schedule_id')
    gender = data.get('gender')
    area_id = data.get('area_id')
    image = request.files.get('image') if is_multipart else None

    if not any([name, employee_code_new, schedule_id, gender, area_id, image]):
        return jsonify({'status': 'error', 'message': 'Nada que actualizar'}), 400

    try:
        documento_anterior = coleccion_de_caras.find_one({'_id': ObjectId(id)})
    except Exception:
        return jsonify({'status': 'error', 'message': 'ID inválido'}), 400

    if not documento_anterior:
        return jsonify({'status': 'error', 'message': 'No encontrado'}), 404

    codigo_anterior = documento_anterior.get('employee_code')
    campos_a_actualizar = {}

    if name: campos_a_actualizar['name'] = name
    if schedule_id: campos_a_actualizar['schedule_id'] = schedule_id
    if gender: campos_a_actualizar['gender'] = gender
    if area_id: campos_a_actualizar['area_id'] = area_id

    # Validar cambio de código
    if employee_code_new and employee_code_new != codigo_anterior:
        existente = coleccion_de_caras.find_one({'employee_code': employee_code_new})
        if existente:
            return jsonify({'status': 'duplicate', 'message': 'employee_code ya existe'}), 409
        campos_a_actualizar['employee_code'] = employee_code_new

    # Procesar nueva imagen si existe
    nuevo_encoding = None
    quality_info = None
    if image and image.filename != '':
        if not allowed_file(image.filename):
            return jsonify({'status': 'error', 'message': 'Imagen no válida'}), 400
        
        try:
            upload_result = upload(image, folder="rostros")
            image_url = upload_result.get("secure_url")
            if not image_url:
                raise Exception("No se obtuvo URL de Cloudinary")
        except Exception as e:
            print("Error Cloudinary:", e)
            return jsonify({'status': 'error', 'message': 'Error subiendo a Cloudinary'}), 500

        temp_path = download_image_from_url(image_url)
        if not temp_path:
            return jsonify({'status': 'error', 'message': 'Error al descargar imagen'}), 400

        nuevo_encoding, info = Mapeo_cara(temp_path)
        os.remove(temp_path)
        
        if nuevo_encoding is None:
            motivo = info.get("reason", "unknown")
            return jsonify({'status': 'error', 'message': f'No se pudo mapear rostro ({motivo})', 'detail': info}), 400

        quality_info = info.get("quality", {})
        campos_a_actualizar['image_url'] = image_url
        campos_a_actualizar['encoding'] = nuevo_encoding.tolist()

    if not campos_a_actualizar:
        return jsonify({'status': 'error', 'message': 'Sin cambios'}), 400

    # Actualizar en MongoDB
    try:
        resultado = coleccion_de_caras.update_one(
            {'_id': ObjectId(id)},
            {'$set': campos_a_actualizar}
        )
    except Exception as e:
        print("Error MongoDB:", e)
        msg = str(e)
        if '11000' in msg or 'duplicate key' in msg.lower():
            return jsonify({'status': 'duplicate', 'message': 'employee_code ya existe'}), 409
        return jsonify({'status': 'error', 'message': 'Error al actualizar'}), 500

    if resultado.matched_count != 1:
        return jsonify({'status': 'error', 'message': 'No encontrado'}), 404

    # ACTUALIZACIÓN CRÍTICA: Sincronizar FAISS solo cuando hay cambio
    codigo_final = campos_a_actualizar.get('employee_code', codigo_anterior)
    gender_final = campos_a_actualizar.get('gender', documento_anterior.get('gender'))
    area_final = campos_a_actualizar.get('area_id', documento_anterior.get('area_id'))
    
    # Determinar el encoding a usar
    encoding_final = None
    if nuevo_encoding is not None:
        encoding_final = nuevo_encoding
    elif 'encoding' not in campos_a_actualizar:
        # Si no hay nuevo encoding, usar el anterior de la DB
        enc_list = documento_anterior.get('encoding')
        if enc_list:
            encoding_final = np.array(enc_list, dtype=np.float32)
    
    # Solo actualizar FAISS si hubo cambios relevantes
    if (employee_code_new and employee_code_new != codigo_anterior) or \
       nuevo_encoding is not None or \
       'gender' in campos_a_actualizar or \
       'area_id' in campos_a_actualizar:
        
        actualizar_faiss_local_y_notificar(
            'update', 
            codigo_anterior,  # Usar el código anterior para eliminar
            encoding_final,
            gender_final,
            area_final
        )

    return jsonify({
        'status': 'success',
        'message': 'Rostro actualizado',
        'quality_info': quality_info or {}
    }), 200

@app.route('/faces', methods=['GET'])
@require_api_key(MAPEO_API_KEY)
def listar_faces():
    faces = list(coleccion_de_caras.find({}))
    for face in faces:
        face['_id'] = str(face['_id'])
    return jsonify({'status': 'success', 'faces': faces}), 200

@app.route('/faces/<id>', methods=['DELETE'])
@require_api_key(MAPEO_API_KEY)
def eliminar_face(id):
    try:
        documento = coleccion_de_caras.find_one({'_id': ObjectId(id)})
    except Exception:
        return jsonify({'status': 'error', 'message': 'ID inválido'}), 400
        
    if not documento:
        return jsonify({'status': 'error', 'message': 'No encontrado'}), 404

    employee_code = documento.get("employee_code")
    
    resultado = coleccion_de_caras.delete_one({'_id': ObjectId(id)})

    if resultado.deleted_count == 1:
        # ACTUALIZACIÓN CRÍTICA: Sincronizar FAISS solo cuando hay cambio
        if employee_code:
            actualizar_faiss_local_y_notificar('delete', employee_code)
        
        return jsonify({'status': 'success', 'message': 'Eliminado'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'No encontrado'}), 404

# ============================
# Endpoint para recargar FAISS manualmente (útil para debug)
# ============================
@app.route('/reload-faiss-local', methods=['POST'])
@require_api_key(MAPEO_API_KEY)
def reload_faiss_local():
    """Endpoint para forzar recarga completa del índice FAISS local"""
    with faiss_lock:
        try:
            print("[MAPEO] Recargando índice FAISS completo desde MongoDB...")
            faiss_index.load_encodings()
            return jsonify({
                'status': 'success',
                'message': 'Índice FAISS recargado',
                'total_indexed': faiss_index.index.ntotal
            }), 200
        except Exception as e:
            print(f"[MAPEO] Error recargando FAISS: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

# ============================
# Inicialización
# ============================
def iniciar_api_mapeo():
    print("[MAPEO] ========================================")
    print("[MAPEO] Inicializando servicio de mapeo...")
    print("[MAPEO] Cargando índice FAISS desde MongoDB...")
    faiss_index.load_encodings()
    print(f"[MAPEO] Índice FAISS cargado: {faiss_index.index.ntotal} rostros")
    print("[MAPEO] Sistema listo - Actualizaciones ON-DEMAND activadas")
    print("[MAPEO] ========================================")
    
    port = int(os.getenv('PORT_MAPEO'))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)

if __name__ == '__main__':
    iniciar_api_mapeo()