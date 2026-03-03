from flask import Blueprint, jsonify, request, current_app
import os
import pandas as pd
from werkzeug.utils import secure_filename
import joblib
import numpy as np
from datetime import datetime
import json
import traceback

# Create a Blueprint
main = Blueprint('main', __name__)

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'soil_model.pkl')
model = None

def load_model():
    """Load the ML model, creating it if it doesn't exist"""
    global model
    if model is not None:
        return model
    
    try:
        # Ensure models directory exists
        models_dir = os.path.dirname(MODEL_PATH)
        os.makedirs(models_dir, exist_ok=True)
        
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print(f"✓ Model loaded successfully from {MODEL_PATH}")
        else:
            print(f"⚠ Model not found at {MODEL_PATH}")
            print("  Training new model...")
            # Import and train model
            backend_dir = os.path.dirname(os.path.dirname(__file__))
            train_model_path = os.path.join(backend_dir, 'train_model.py')
            
            if os.path.exists(train_model_path):
                import importlib.util
                spec = importlib.util.spec_from_file_location("train_model", train_model_path)
                train_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(train_module)
                train_module.train_soil_model()
                
                if os.path.exists(MODEL_PATH):
                    model = joblib.load(MODEL_PATH)
                    print(f"✓ New model trained and loaded successfully!")
                else:
                    raise Exception("Model training completed but file not found")
            else:
                raise FileNotFoundError(f"train_model.py not found at {train_model_path}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print(traceback.format_exc())
        model = None
    
    return model

# Try to load model on startup
load_model()

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
SOIL_PROFILE_LIBRARY = {
    "Sandy": {
        "practices": [
            "Use drip irrigation with frequent low-volume watering",
            "Add compost or farmyard manure to improve water retention",
            "Apply mulch to reduce evaporation losses"
        ],
        "crops": ["Groundnut", "Watermelon", "Carrot", "Millets", "Cassava"]
    },
    "Clay": {
        "practices": [
            "Use raised beds and surface drainage to avoid waterlogging",
            "Incorporate organic matter to improve structure and aeration",
            "Limit tillage when soil is wet to prevent compaction"
        ],
        "crops": ["Paddy", "Wheat", "Cotton", "Soybean", "Cabbage"]
    },
    "Silt": {
        "practices": [
            "Use contour farming or cover crops to reduce erosion",
            "Maintain residue cover after harvest",
            "Apply balanced NPK with split nitrogen dosing"
        ],
        "crops": ["Wheat", "Maize", "Mustard", "Potato", "Pulses"]
    },
    "Loam": {
        "practices": [
            "Follow crop rotation to maintain long-term fertility",
            "Use integrated nutrient management (organic + inorganic)",
            "Schedule irrigation based on moisture monitoring"
        ],
        "crops": ["Rice", "Wheat", "Maize", "Vegetables", "Sugarcane"]
    },
    "Peat": {
        "practices": [
            "Improve drainage and avoid prolonged saturation",
            "Apply lime where pH is very low",
            "Use potassium-rich fertilizers and monitor micronutrients"
        ],
        "crops": ["Potato", "Onion", "Carrot", "Lettuce", "Forage grasses"]
    },
    "Chalky": {
        "practices": [
            "Apply organic matter to improve nutrient availability",
            "Use chelated micronutrients, especially iron and zinc",
            "Use split fertilizer application to reduce nutrient lock-up"
        ],
        "crops": ["Barley", "Spinach", "Beetroot", "Cabbage", "Chickpea"]
    },
    "Saline": {
        "practices": [
            "Leach salts using good-quality irrigation water",
            "Provide field drainage and avoid standing saline water",
            "Use gypsum where sodicity correction is required"
        ],
        "crops": ["Barley", "Cotton", "Sorghum", "Quinoa", "Salt-tolerant rice"]
    }
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def classify_soil_type(row):
    """Rule-based soil type classification from core soil indicators."""
    ph = float(row.get('ph', 7))
    organic_matter = float(row.get('organic_matter', 0))
    moisture = float(row.get('moisture', 50))
    nitrogen = float(row.get('nitrogen', 0))
    phosphorus = float(row.get('phosphorus', 0))
    potassium = float(row.get('potassium', 0))

    if ph > 8.2:
        return "Chalky"
    if ph < 5.5 and organic_matter > 2.5:
        return "Peat"
    if moisture < 30 and organic_matter < 1.0 and potassium < 180:
        return "Sandy"
    if moisture > 65 and organic_matter > 1.5:
        return "Clay"
    if ph >= 7.8 and moisture < 45:
        return "Saline"
    if 30 <= moisture <= 55 and 6.0 <= ph <= 7.8 and (nitrogen + phosphorus + potassium) > 320:
        return "Loam"
    if 35 <= moisture <= 60 and 6.0 <= ph <= 7.5:
        return "Silt"
    return "Loam"

def get_yield_potential(score):
    if score >= 70:
        return {
            "category": "High",
            "estimated_range": "4.5-6.5 t/ha",
            "interpretation": "Strong yield outlook under recommended management"
        }
    if score >= 40:
        return {
            "category": "Moderate",
            "estimated_range": "2.5-4.5 t/ha",
            "interpretation": "Moderate yield expected; improvements can raise performance"
        }
    return {
        "category": "Low",
        "estimated_range": "1.0-2.5 t/ha",
        "interpretation": "Low yield potential unless soil constraints are corrected"
    }

def get_feasibility_label(score):
    if score >= 70:
        return "Suitable"
    if score >= 40:
        return "Conditionally Suitable"
    return "Not Suitable"

def build_soil_profile(row, score):
    soil_type = classify_soil_type(row)
    profile = SOIL_PROFILE_LIBRARY.get(soil_type, SOIL_PROFILE_LIBRARY["Loam"])
    return {
        "soil_type": soil_type,
        "suitable_agricultural_practices": profile["practices"],
        "recommended_crops": profile["crops"],
        "expected_yield_potential": get_yield_potential(score),
        "farming_feasibility": get_feasibility_label(score)
    }

@main.route('/')
def index():
    return "Welcome to Soil Productivity Prediction API!"

@main.route('/api/health', methods=['GET'])
def health_check():
    # Try to reload model if not loaded
    current_model = load_model()
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'Soil Productivity Prediction API',
        'model_loaded': current_model is not None,
        'version': '1.0.0'
    }), 200

def preprocess_input(data):
    # Enhanced column mapping for flexibility
    column_mapping = {
        # Basic nutrients
        'N': 'nitrogen',
        'n': 'nitrogen', 
        'nitrogen': 'nitrogen',
        
        'P': 'phosphorus',
        'p': 'phosphorus',
        'phosphorus': 'phosphorus',
        
        'K': 'potassium',
        'k': 'potassium',
        'potassium': 'potassium',
        
        # Soil properties
        'pH': 'ph',
        'ph': 'ph',
        'ph_value': 'ph',
        'acidity': 'ph',
        
        # Organic matter
        'OC': 'organic_matter',
        'oc': 'organic_matter',
        'organic_carbon': 'organic_matter',
        'organiccarbon': 'organic_matter',
        'OM': 'organic_matter',
        'om': 'organic_matter',
        'organic_matter': 'organic_matter',
        'organicmatter': 'organic_matter',
        
        # Environmental factors
        'Moisture': 'moisture',
        'moisture': 'moisture',
        'soil_moisture': 'moisture',
        'soilmoisture': 'moisture',
        'water_content': 'moisture',
        'watercontent': 'moisture',
        
        'Temp': 'temperature',
        'temp': 'temperature',
        'temperature': 'temperature',
        'soil_temp': 'temperature',
        'soiltemp': 'temperature',
    }
    
    # Apply column mapping
    if isinstance(data, dict):
        mapped_data = {}
        for col, value in data.items():
            mapped_col = column_mapping.get(col, col)
            mapped_data[mapped_col] = value
        data = mapped_data
    else:
        # For DataFrames, rename columns
        data = data.copy()
        rename_dict = {col: column_mapping[col] for col in data.columns if col in column_mapping}
        if rename_dict:
            data = data.rename(columns=rename_dict)
    
    required_columns = ['nitrogen', 'phosphorus', 'potassium', 'ph', 
                       'organic_matter', 'moisture', 'temperature']
    
    if isinstance(data, dict):
        missing_columns = [col for col in required_columns if col not in data]
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
        df = pd.DataFrame([data])
    else:
        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns in the file: {', '.join(missing_columns)}. Found columns: {', '.join(data.columns.tolist())}")
        df = data[required_columns].copy()
    
    for col in required_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    if df.isnull().any().any():
        raise ValueError("Input contains invalid or missing values")
    
    return df

@main.route('/api/predict', methods=['POST'])
def predict():
    current_model = load_model()
    if current_model is None:
        return jsonify({'error': 'Prediction model not loaded. Please train the model first.'}), 503
    
    try:
        if 'file' in request.files:
            file = request.files['file']
            file_filename = file.filename
            if not file_filename or file_filename == '':
                return jsonify({'error': 'No selected file'}), 400
                
            if not allowed_file(file_filename):
                return jsonify({'error': 'File type not allowed. Allowed types: CSV, XLS, XLSX'}), 400
            
            filename = secure_filename(file_filename)
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            try:
                # Read file based on extension
                if filename.endswith('.csv'):
                    data = pd.read_csv(filepath)
                else:
                    data = pd.read_excel(filepath)
                
                if data.empty:
                    return jsonify({'error': 'File is empty or could not be parsed'}), 400
                
                processed_data = preprocess_input(data)
                predictions = current_model.predict(processed_data).tolist()
                
                # Ensure predictions are within reasonable range (0-100)
                predictions = [max(0, min(100, float(p))) for p in predictions]
                
                result = data.copy()
                result['productivity_score'] = predictions
                profiles = []
                for idx, row in processed_data.iterrows():
                    profile = build_soil_profile(row.to_dict(), predictions[idx])
                    profiles.append(profile)

                result['productivity_level'] = [
                    'High' if p > 70 else ('Medium' if p > 40 else 'Low') for p in predictions
                ]
                result['soil_type'] = [p['soil_type'] for p in profiles]
                result['suitable_agricultural_practices'] = [
                    p['suitable_agricultural_practices'] for p in profiles
                ]
                result['recommended_crops'] = [p['recommended_crops'] for p in profiles]
                result['expected_yield_potential'] = [p['expected_yield_potential'] for p in profiles]
                result['farming_feasibility'] = [p['farming_feasibility'] for p in profiles]
                
                # Convert to records, handling all data types
                result_dict = result.head(1000).to_dict(orient='records')
                
                return jsonify({
                    'message': 'File processed successfully',
                    'data': result_dict,
                    'total_records': len(result),
                    'average_productivity': float(np.mean(predictions)),
                    'min_productivity': float(np.min(predictions)),
                    'max_productivity': float(np.max(predictions))
                }), 200
                
            except ValueError as e:
                return jsonify({'error': f'Data validation error: {str(e)}'}), 400
            except Exception as e:
                return jsonify({'error': f'Processing error: {str(e)}', 'traceback': traceback.format_exc()}), 500
            finally:
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except:
                        pass
                    
        elif request.is_json:
            json_data = request.get_json()
            
            # Handle both single object and array of objects
            if isinstance(json_data, list):
                # Multiple predictions
                try:
                    results = []
                    for item in json_data:
                        processed_data = preprocess_input(item)
                        prediction = current_model.predict(processed_data)[0]
                        prediction = max(0, min(100, float(prediction)))
                        profile = build_soil_profile(processed_data.iloc[0].to_dict(), prediction)
                        results.append({
                            'input': item,
                            'productivity_score': prediction,
                            'productivity_level': 'High' if prediction > 70 else ('Medium' if prediction > 40 else 'Low'),
                            'soil_type': profile['soil_type'],
                            'suitable_agricultural_practices': profile['suitable_agricultural_practices'],
                            'recommended_crops': profile['recommended_crops'],
                            'expected_yield_potential': profile['expected_yield_potential'],
                            'farming_feasibility': profile['farming_feasibility']
                        })
                    
                    return jsonify({
                        'message': 'Batch prediction successful',
                        'results': results,
                        'count': len(results),
                        'average_productivity': float(np.mean([r['productivity_score'] for r in results]))
                    }), 200
                except Exception as e:
                    return jsonify({'error': str(e)}), 400
            else:
                # Single prediction
                try:
                    processed_data = preprocess_input(json_data)
                    prediction = current_model.predict(processed_data)[0]
                    prediction = max(0, min(100, float(prediction)))
                    profile = build_soil_profile(processed_data.iloc[0].to_dict(), prediction)
                    
                    return jsonify({
                        'message': 'Prediction successful',
                        'input': json_data,
                        'productivity_score': prediction,
                        'productivity_level': 'High' if prediction > 70 else ('Medium' if prediction > 40 else 'Low'),
                        'soil_type': profile['soil_type'],
                        'suitable_agricultural_practices': profile['suitable_agricultural_practices'],
                        'recommended_crops': profile['recommended_crops'],
                        'expected_yield_potential': profile['expected_yield_potential'],
                        'farming_feasibility': profile['farming_feasibility']
                    }), 200
                except ValueError as e:
                    return jsonify({'error': f'Data validation error: {str(e)}'}), 400
                except Exception as e:
                    return jsonify({'error': str(e)}), 400
                
        return jsonify({'error': 'No valid input provided. Send JSON data or upload a file.'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}', 'traceback': traceback.format_exc()}), 500

@main.route('/api/soil-types', methods=['GET'])
def get_soil_types():
    soil_types = list(SOIL_PROFILE_LIBRARY.keys())
    return jsonify(soil_types), 200

@main.route('/api/model/info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    current_model = load_model()
    if current_model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        model_type = type(current_model).__name__
        if hasattr(current_model, 'n_estimators'):
            n_estimators = current_model.n_estimators
        else:
            n_estimators = None
        
        return jsonify({
            'model_type': model_type,
            'n_estimators': n_estimators,
            'model_path': MODEL_PATH,
            'model_exists': os.path.exists(MODEL_PATH)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/model/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model (admin endpoint)"""
    try:
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        from train_model import train_soil_model
        
        train_soil_model()
        global model
        model = joblib.load(MODEL_PATH)
        
        return jsonify({
            'message': 'Model retrained successfully',
            'model_path': MODEL_PATH
        }), 200
    except Exception as e:
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500
