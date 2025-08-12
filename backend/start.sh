services:
  - type: web
    name: photography-assistant
    runtime: python
    pythonVersion: "3.11.8"  # Downgrade for better compatibility
    buildCommand: |
      pip install --upgrade pip
      pip install --no-deps opencv-python-headless==4.9.0.80
      pip install -r backend/requirements.txt
    startCommand: ./backend/start.sh

#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")" || exit 1

# Upgrade pip first
python -m pip install --upgrade pip

# Install requirements with full path
pip install -r ./requirements.txt

# Start Gunicorn
exec gunicorn --bind 0.0.0.0:$PORT \
    --workers 4 \
    app:app
#!/bin/bash

# Install headless OpenCV first (special handling)
pip install --no-deps opencv-python-headless==4.9.0.80

