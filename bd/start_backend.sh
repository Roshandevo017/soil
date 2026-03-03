#!/bin/bash

echo "============================================================"
echo "Starting Soil Productivity Prediction Backend..."
echo "============================================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to activate virtual environment"
    exit 1
fi

# Run setup script to ensure everything is ready
echo ""
echo "Running setup checks..."
python setup_backend.py
if [ $? -ne 0 ]; then
    echo "ERROR: Setup failed"
    exit 1
fi

# Start Flask server
echo ""
echo "============================================================"
echo "Starting Flask server on http://localhost:5000"
echo "============================================================"
echo "Press Ctrl+C to stop the server"
echo ""
python wsgi.py
