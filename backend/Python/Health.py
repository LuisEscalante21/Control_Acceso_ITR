# health se usa para ver el estado de los endpoints
from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200
