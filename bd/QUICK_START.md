# Backend Quick Start Guide

## 🚀 Fastest Way to Start

### Windows
```bash
cd backend
start_backend.bat
```

### Linux/Mac
```bash
cd backend
chmod +x start_backend.sh
./start_backend.sh
```

That's it! The script will:
- ✅ Create virtual environment (if needed)
- ✅ Install all dependencies
- ✅ Train the model (if needed)
- ✅ Start the Flask server

## 📋 Manual Setup (If Needed)

### Step 1: Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Train Model (if not exists)
```bash
python train_model.py
```

### Step 4: Start Server
```bash
python wsgi.py
```

## ✅ Verify Backend is Working

### Option 1: Use Check Script
```bash
python check_backend.py
```

### Option 2: Test API
Open browser: http://localhost:5000/api/health

Or use curl:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "Soil Productivity Prediction API"
}
```

## 🔧 Troubleshooting

### Port Already in Use
Change port in `wsgi.py`:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Model Not Found
Run:
```bash
python train_model.py
```

### Import Errors
Ensure virtual environment is activated:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Dependencies Not Installed
```bash
pip install -r requirements.txt
```

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/predict` - Single or batch prediction
- `GET /api/soil-types` - Get soil types
- `GET /api/model/info` - Model information

See `README.md` for full API documentation.
