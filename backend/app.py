from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend')
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def serve():
    """Serve the frontend"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "version": "1.0.0"})

@app.route('/api/settings/<scenario>')
def get_settings(scenario):
    """Camera settings endpoint"""
    presets = {
        'portrait': {
            'aperture': 'f/1.8-f/2.8',
            'shutter': '1/125s',
            'iso': '100-400'
        },
        'landscape': {
            'aperture': 'f/8-f/16',
            'shutter': '1/60s',
            'iso': '100-200'
        }
    }
    return jsonify(presets.get(scenario.lower(), {}))

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
