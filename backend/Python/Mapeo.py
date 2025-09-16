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
# Parámetros de calidad / FR
# ============================
UPSAMPLE = 1          # más sensible a caras pequeñas / baja luz
NUM_JITTERS = 1       # estabilidad del encoding (1 para velocidad)
MIN_FACE_SIZE = 80    # píxeles mínimos (lado menor del bbox)
LAP_VAR_THR = 90.0    # varianza Laplaciana mínima (enfoque)
MIN_BRIGHTNESS = 50.0 # brillo medio mínimo (0-255)

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
    """Notifica al servicio de reconocimiento que recargue su índice FAISS (bloqueado por lock)."""
    with faiss_reload_lock:
        try:
            response = requests.post(
                "http://localhost:4600/reload-faiss",
                headers={"Authorization": f"Bearer {RECONOCIMIENTO_API_KEY}"},
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
# Preprocesado / Calidad imagen
# ============================
def _auto_gamma_from_mean(y_float, target_mean=0.5):
    eps = 1e-6
    m = float(np.clip(y_float.mean(), eps, 1.0))
    gamma = np.log(target_mean + eps) / np.log(m + eps)
    return float(np.clip(gamma, 0.6, 2.0))

def preprocess_rgb(rgb_np):
    """
    Recibe imagen RGB (numpy), devuelve RGB preprocesado:
    - Gamma adaptativa + CLAHE (en Y/luma)
    - Bilateral para reducir ruido manteniendo bordes
    """
    # Pasar a BGR para usar OpenCV cómodamente
    bgr = cv2.cvtColor(rgb_np, cv2.COLOR_RGB2BGR)

    # YCrCb para tocar solo la luminancia
    ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)

    # Gamma adaptativa sobre Y
    y_float = y.astype(np.float32) / 255.0
    gamma = _auto_gamma_from_mean(y_float, target_mean=0.5)
    y_corr = np.power(y_float, gamma)

    # CLAHE suave
    y_u8 = np.clip(y_corr * 255.0, 0, 255).astype(np.uint8)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    y_eq = clahe.apply(y_u8)

    # Combinar y volver a BGR
    ycrcb_eq = cv2.merge([y_eq, cr, cb])
    bgr_eq = cv2.cvtColor(ycrcb_eq, cv2.COLOR_YCrCb2BGR)

    # Filtro bilateral para bajar ruido en baja luz
    bgr_filt = cv2.bilateralFilter(bgr_eq, d=7, sigmaColor=50, sigmaSpace=50)

    # Retornar como RGB
    rgb_out = cv2.cvtColor(bgr_filt, cv2.COLOR_BGR2RGB)
    return rgb_out

def is_blurry(gray_u8, thr_var_laplacian=LAP_VAR_THR):
    fm = cv2.Laplacian(gray_u8, cv2.CV_64F).var()
    return fm < thr_var_laplacian, fm

def brightness_score(gray_u8):
    return float(gray_u8.mean())

def face_quality_ok(rgb_np, top, right, bottom, left):
    """
    Evalúa calidad en el bbox. Retorna (ok: bool, info: dict).
    """
    # recortar bbox en RGB -> BGR para métricas
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
    """Carga desde disco como RGB numpy, aplicando autorotate EXIF si existe."""
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)  # respetar orientación EXIF
        rgb = np.array(img.convert('RGB'))
    return rgb

def Mapeo_cara(ruta_imagen):
    """
    Devuelve (encoding: np.ndarray, info_calidad: dict) o (None, motivo_dict).
    Aplica preprocesado y filtro de calidad en el rostro detectado.
    """
    try:
        rgb = load_rgb_image(ruta_imagen)
        # Preprocesado para poca luz
        rgb_proc = preprocess_rgb(rgb)

        # Detección de rostros (RGB)
        ubicaciones = fr.face_locations(rgb_proc, number_of_times_to_upsample=UPSAMPLE, model="hog")
        if not ubicaciones:
            return None, {"reason": "no_face"}

        # Elegimos la cara más grande si hay varias
        def _area(loc):
            top, right, bottom, left = loc
            return (bottom - top) * (right - left)
        ubicaciones.sort(key=_area, reverse=True)
        top, right, bottom, left = ubicaciones[0]

        # Calidad del rostro
        ok, qinfo = face_quality_ok(rgb_proc, top, right, bottom, left)
        if not ok:
            return None, {"reason": "low_quality", **qinfo}

        # Encoding
        encs = fr.face_encodings(rgb_proc, [ubicaciones[0]], num_jitters=NUM_JITTERS)
        if not encs:
            return None, {"reason": "encode_failed"}

        return encs[0], {"quality": qinfo}
    except Exception as e:
        print("Error en Mapeo_cara:", e)
        return None, {"reason": "exception", "detail": str(e)}

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

    documento = {
        'image_url': image_url,
        'encoding': encoding.tolist(),
        'name': name,
        'employee_code': employee_code,
        'schedule_id': schedule_id,
        'gender': gender,
        'area_id': area_id
    }

    coleccion_de_caras.insert_one(documento)
    faiss_index.add_face(encoding, employee_code, gender, area_id)
    notificar_reload_faiss()

    return jsonify({
        'status': 'success',
        'message': 'Rostro guardado',
        'image_url': image_url,
        'encoding': encoding.tolist(),
        'quality_info': info.get("quality", {})
    }), 200

# Actualizar rostro
@app.route('/faces/<id>', methods=['PUT'])
@require_api_key(MAPEO_API_KEY)
def actualizar_face(id):
    # Soportar JSON o multipart/form-data
    is_multipart = bool(request.files) or bool(request.form)
    data = request.form if is_multipart else (request.get_json(silent=True) or {})

    # Normaliza nombres de campos (aceptamos 'code' por compatibilidad)
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

    # Si solicitó cambiar el código, validamos duplicado
    if employee_code_new and employee_code_new != codigo_anterior:
        existente = coleccion_de_caras.find_one({'employee_code': employee_code_new})
        if existente:
            return jsonify({'status': 'duplicate', 'message': 'employee_code ya existe'}), 409
        campos_a_actualizar['employee_code'] = employee_code_new

    # Si llegó imagen, la procesamos y recalculamos encoding
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

    # Ejecutar update en Mongo
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

    # --- Sincronizar FAISS ---
    codigo_final = campos_a_actualizar.get('employee_code', codigo_anterior)
    gender_final = campos_a_actualizar.get('gender', documento_anterior.get('gender'))
    area_final = campos_a_actualizar.get('area_id', documento_anterior.get('area_id'))

    def _update_faiss():
        try:
            if (employee_code_new and employee_code_new != codigo_anterior) or (nuevo_encoding is not None) \
               or ('gender' in campos_a_actualizar) or ('area_id' in campos_a_actualizar):
                # Eliminamos entrada anterior (si existía)
                if codigo_anterior:
                    faiss_index.remove_face(codigo_anterior)

                # Encoding a usar: el nuevo si hubo imagen; si no, el anterior desde DB
                encoding_np = None
                if nuevo_encoding is not None:
                    encoding_np = nuevo_encoding
                else:
                    enc_list = campos_a_actualizar.get('encoding') or documento_anterior.get('encoding')
                    if enc_list:
                        encoding_np = np.array(enc_list, dtype=np.float32)

                if encoding_np is not None:
                    faiss_index.add_face(
                        encoding_np,
                        codigo_final,
                        gender=gender_final,
                        area_id=area_final
                    )
                # Avisar al otro servicio que recargue
                threading.Thread(target=notificar_reload_faiss, daemon=True).start()
        except Exception as fe:
            print("[MAPEO] Error actualizando FAISS:", fe)

    _update_faiss()

    return jsonify({
        'status': 'success',
        'message': 'Rostro actualizado',
        'quality_info': quality_info or {}
    }), 200

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
    faiss_index.load_encodings()  # Carga inicial
    port = int(os.getenv('PORT_MAPEO', 5001))
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=port)

if __name__ == '__main__':
    iniciar_api_mapeo()
