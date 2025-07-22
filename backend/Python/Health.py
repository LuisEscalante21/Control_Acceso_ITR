from flask import Flask, jsonify
from Config import PORT_HEALTH

app = Flask("HealthAPI")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok - Health Service"})

def iniciar_api_health():
    print(f"Iniciando API Health en puerto {PORT_HEALTH}")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=PORT_HEALTH)
