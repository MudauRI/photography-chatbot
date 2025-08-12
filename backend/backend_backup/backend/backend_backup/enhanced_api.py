# enhanced_api.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import base64
import time
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Enhanced Photography Knowledge Base
PHOTOGRAPHY_KB = {
    "settings": {
        # ... (previous settings) ...
        "macro": {
            "aperture": "f/8-f/16",
            "shutter": "1/200s or faster",
            "iso": "100-400",
            "tips": "Use manual focus, tripod essential, consider focus stacking"
        }
    },
    "composition": [
        # ... (previous composition tips) ...
        "Color theory: Use complementary colors for visual impact",
        "Depth of field: Control what's in focus to guide viewer attention"
    ],
    "lighting": {
        "golden_hour": "Warm, soft light perfect for portraits and landscapes",
        "blue_hour": "Cool tones great for cityscapes and moody shots",
        "midday": "Harsh light - use diffusers or find shaded areas"
    }
}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_image_with_opencv(image_path):
    """Perform actual image analysis using OpenCV"""
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    analysis = {}
    
    # Basic image properties
    height, width = img.shape[:2]
    analysis['dimensions'] = f"{width}x{height}"
    
    # Color analysis
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    analysis['dominant_color'] = f"HSV: {np.mean(hsv[:,:,0]):.1f}°, {np.mean(hsv[:,:,1]):.1f}%, {np.mean(hsv[:,:,2]):.1f}%"
    
    # Edge detection (composition analysis)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edge_percentage = np.count_nonzero(edges) / (width * height) * 100
    analysis['edge_analysis'] = f"{edge_percentage:.1f}% of image contains edges"
    
    # Brightness analysis
    brightness = np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    analysis['brightness'] = f"{brightness:.1f}/255"
    
    # Focus/blur analysis
    fm = cv2.Laplacian(gray, cv2.CV_64F).var()
    analysis['focus_measure'] = f"{fm:.1f} (higher is sharper)"
    
    return analysis

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
        
        # Perform analysis
        cv_analysis = analyze_image_with_opencv(filepath)
        if not cv_analysis:
            return jsonify({"error": "Could not process image"}), 500
        
        # Generate thumbnail
        thumbnail_path = os.path.join(app.config['UPLOAD_FOLDER'], f"thumb_{filename}")
        img = Image.open(filepath)
        img.thumbnail((300, 300))
        img.save(thumbnail_path)
        
        return jsonify({
            "filename": filename,
            "analysis": cv_analysis,
            "thumbnail_url": f"/api/thumb/{filename}"
        })
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/thumb/<filename>')
def get_thumbnail(filename):
    return send_from_directory(
        app.config['UPLOAD_FOLDER'],
        f"thumb_{filename}",
        mimetype='image/jpeg'
    )

@app.route('/api/advanced/lighting', methods=['POST'])
def lighting_analysis():
    data = request.json
    scenario = data.get('scenario', 'general')
    
    if scenario in PHOTOGRAPHY_KB['lighting']:
        return jsonify({
            "analysis": PHOTOGRAPHY_KB['lighting'][scenario],
            "tips": [
                "Use reflectors to bounce light",
                "Consider time of day for natural light",
                "Experiment with artificial light angles"
            ]
        })
    return jsonify({"error": "Scenario not found"}), 404

@app.route('/api/advanced/composition', methods=['POST'])
def composition_analysis():
    data = request.json
    technique = data.get('technique', 'general')
    
    if technique == 'rule_of_thirds':
        return jsonify({
            "description": "Divide image into 9 equal parts using 2 horizontal and 2 vertical lines",
            "tips": [
                "Place important elements along the lines or intersections",
                "Align horizon with top or bottom line",
                "Put eyes on top line for portraits"
            ],
            "visual": "/static/rule_of_thirds.png"
        })
    # ... other composition techniques ...

# ... (previous API endpoints) ...

# New AI-powered endpoint (would connect to actual AI service)
@app.route('/api/ai/analyze', methods=['POST'])
def ai_analysis():
    data = request.json
    prompt = data.get('prompt', 'Analyze this photo')
    image_url = data.get('image_url', '')
    
    # In a real implementation, this would call an AI service
    # Here we simulate a response
    return jsonify({
        "analysis": {
            "composition": random.choice(PHOTOGRAPHY_KB['composition']),
            "lighting": random.choice(list(PHOTOGRAPHY_KB['lighting'].values())),
            "improvements": [
                "Try a lower angle for more dramatic perspective",
                "Consider cropping to emphasize the main subject"
            ]
        },
        "aesthetic_score": random.randint(5, 10),
        "technical_score": random.randint(5, 10)
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)