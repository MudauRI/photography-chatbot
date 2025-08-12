from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
import cv2
import numpy as np
from PIL import Image
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Photography Knowledge Base
PHOTOGRAPHY_KB = {
    "settings": {
        "portrait": {
            "aperture": "f/1.8-f/2.8",
            "shutter": "1/125s",
            "iso": "100-400",
            "tips": "Use single-point AF, focus on eyes"
        },
        "landscape": {
            "aperture": "f/8-f/16",
            "shutter": "1/60s",
            "iso": "100-200",
            "tips": "Use manual focus, shoot during golden hour"
        },
        "macro": {
            "aperture": "f/8-f/16",
            "shutter": "1/200s",
            "iso": "100-400",
            "tips": "Use manual focus, tripod essential"
        }
    },
    "composition": [
        "Rule of thirds",
        "Leading lines",
        "Frame within a frame",
        "Color theory"
    ],
    "lighting": {
        "golden_hour": "Warm, soft light",
        "blue_hour": "Cool tones",
        "midday": "Use diffusers"
    }
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_image(image_path):
    """Basic image analysis using OpenCV"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
            
        analysis = {
            "dimensions": f"{img.shape[1]}x{img.shape[0]}",
            "brightness": f"{np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)):.1f}/255"
        }
        return analysis
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        return None

# Core Endpoints
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})

# Photography Features
@app.route('/api/settings/<scenario>')
def get_settings(scenario):
    return jsonify(PHOTOGRAPHY_KB['settings'].get(scenario.lower(), {}))

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        analysis = analyze_image(filepath)
        if not analysis:
            return jsonify({"error": "Image processing failed"}), 500
            
        return jsonify({
            "filename": filename,
            "analysis": analysis
        })
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/lighting/<scenario>')
def lighting_analysis(scenario):
    if scenario in PHOTOGRAPHY_KB['lighting']:
        return jsonify({
            "analysis": PHOTOGRAPHY_KB['lighting'][scenario],
            "tips": [
                "Use reflectors",
                "Consider time of day",
                "Experiment with angles"
            ]
        })
    return jsonify({"error": "Scenario not found"}), 404

# AI Simulation Endpoint
@app.route('/api/analyze', methods=['POST'])
def ai_analysis():
    return jsonify({
        "analysis": {
            "composition": random.choice(PHOTOGRAPHY_KB['composition']),
            "lighting": random.choice(list(PHOTOGRAPHY_KB['lighting'].values())),
            "score": random.randint(5, 10)
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
