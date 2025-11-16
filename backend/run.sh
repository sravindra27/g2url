#!/bin/bash

echo "Starting g2url.in Backend Server..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "Installing dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo ""
echo "Backend server starting on http://localhost:8000"
echo "Press CTRL+C to stop the server"
echo ""

python main.py

