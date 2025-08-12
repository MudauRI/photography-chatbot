#!/bin/bash

# Activate virtual environment (if exists)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies from requirements.txt
pip install -r requirements.txt

# Set default port if not specified
PORT=${PORT:-5000}

# Start Gunicorn with optimal settings
exec gunicorn --bind 0.0.0.0:$PORT \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    app:app
