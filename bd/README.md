# Backend API Documentation

## Overview

The backend is a Flask REST API that provides machine learning predictions for soil productivity. It uses a trained Random Forest model to predict productivity scores based on soil parameters.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Train the Model

```bash
python train_model.py
```

This will create `models/soil_model.pkl`.

### 4. Start the Server

**Windows:**
```bash
start_backend.bat
```

**Linux/Mac:**
```bash
chmod +x start_backend.sh
./start_backend.sh
```

Or manually:
```bash
python wsgi.py
```

The server will start on http://localhost:5000

## API Endpoints

### Health Check

**GET** `/api/health`

Returns the health status of the API and whether the model is loaded.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "service": "Soil Productivity Prediction API",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### Single Prediction

**POST** `/api/predict`

Predict productivity for a single soil sample.

**Request Body (JSON):**
```json
{
  "nitrogen": 150,
  "phosphorus": 30,
  "potassium": 200,
  "ph": 6.5,
  "organic_matter": 2.0,
  "moisture": 45,
  "temperature": 25
}
```

**Response:**
```json
{
  "message": "Prediction successful",
  "input": { ... },
  "productivity_score": 72.5,
  "productivity_level": "High"
}
```

### Batch Prediction (File Upload)

**POST** `/api/predict`

Upload a CSV or Excel file for batch predictions.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (CSV, XLS, or XLSX file)

**Response:**
```json
{
  "message": "File processed successfully",
  "data": [
    {
      "nitrogen": 150,
      "phosphorus": 30,
      "productivity_score": 72.5,
      ...
    },
    ...
  ],
  "total_records": 100,
  "average_productivity": 68.3,
  "min_productivity": 45.2,
  "max_productivity": 89.1
}
```

### Batch Prediction (JSON Array)

**POST** `/api/predict`

Predict productivity for multiple samples.

**Request Body (JSON Array):**
```json
[
  {
    "nitrogen": 150,
    "phosphorus": 30,
    "potassium": 200,
    "ph": 6.5,
    "organic_matter": 2.0,
    "moisture": 45,
    "temperature": 25
  },
  {
    "nitrogen": 180,
    "phosphorus": 35,
    "potassium": 220,
    "ph": 7.0,
    "organic_matter": 2.5,
    "moisture": 50,
    "temperature": 28
  }
]
```

**Response:**
```json
{
  "message": "Batch prediction successful",
  "results": [
    {
      "input": { ... },
      "productivity_score": 72.5,
      "productivity_level": "High"
    },
    ...
  ],
  "count": 2,
  "average_productivity": 75.2
}
```

### Get Soil Types

**GET** `/api/soil-types`

Returns available soil types.

**Response:**
```json
["Loam", "Clay", "Sandy", "Silt", "Peat"]
```

### Model Information

**GET** `/api/model/info`

Returns information about the loaded model.

**Response:**
```json
{
  "model_type": "RandomForestRegressor",
  "n_estimators": 100,
  "model_path": "/path/to/models/soil_model.pkl",
  "model_exists": true
}
```

### Retrain Model

**POST** `/api/model/retrain`

Retrain the ML model (admin endpoint).

**Response:**
```json
{
  "message": "Model retrained successfully",
  "model_path": "/path/to/models/soil_model.pkl"
}
```

## Required Input Parameters

All prediction endpoints require these parameters:

- `nitrogen` (float): Nitrogen content in kg/ha
- `phosphorus` (float): Phosphorus content in kg/ha
- `potassium` (float): Potassium content in kg/ha
- `ph` (float): Soil pH (0-14)
- `organic_matter` (float): Organic matter content (%)
- `moisture` (float): Soil moisture (%)
- `temperature` (float): Temperature in °C

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required columns: nitrogen, phosphorus"
}
```

### 503 Service Unavailable
```json
{
  "error": "Prediction model not loaded. Please train the model first."
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error: ...",
  "traceback": "..."
}
```

## Model Details

The model is a **Random Forest Regressor** with:
- 100 estimators
- Maximum depth: 10
- Trained on synthetic soil data
- Output: Productivity score (0-100)

### Productivity Levels

- **High**: Score > 70
- **Medium**: Score 40-70
- **Low**: Score < 40

## Configuration

Edit `app/__init__.py` to configure:
- `UPLOAD_FOLDER`: Directory for temporary file uploads
- `MAX_CONTENT_LENGTH`: Maximum file size (default: 16MB)
- `SECRET_KEY`: Flask secret key

## Development

### Running in Development Mode

```bash
python wsgi.py
```

The server runs with debug mode enabled by default.

### Running in Production

Use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

## Troubleshooting

### Model Not Loading

1. Check if `models/soil_model.pkl` exists
2. Run `python train_model.py` to create the model
3. Check file permissions

### Import Errors

1. Ensure virtual environment is activated
2. Run `pip install -r requirements.txt`
3. Check Python version (3.8+ required)

### CORS Errors

CORS is enabled by default. If you encounter issues:
1. Check `app/__init__.py` for CORS configuration
2. Verify frontend URL is allowed

### Port Already in Use

Change the port in `wsgi.py`:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```
