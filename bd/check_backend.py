#!/usr/bin/env python3
"""
Quick backend health check script
Run this to verify the backend is set up correctly
"""

import sys
import os

def check_imports():
    """Check if all required packages can be imported"""
    print("Checking imports...")
    required_packages = [
        ('flask', 'Flask'),
        ('flask_cors', 'Flask-CORS'),
        ('pandas', 'pandas'),
        ('numpy', 'numpy'),
        ('sklearn', 'scikit-learn'),
        ('joblib', 'joblib'),
    ]
    
    failed = []
    for module_name, package_name in required_packages:
        try:
            __import__(module_name)
            print(f"  ✓ {package_name}")
        except ImportError:
            print(f"  ❌ {package_name} - NOT INSTALLED")
            failed.append(package_name)
    
    return len(failed) == 0

def check_model():
    """Check if model exists"""
    print("\nChecking model...")
    model_path = os.path.join("models", "soil_model.pkl")
    if os.path.exists(model_path):
        print(f"  ✓ Model found at {model_path}")
        try:
            import joblib
            model = joblib.load(model_path)
            print(f"  ✓ Model loaded successfully (type: {type(model).__name__})")
            return True
        except Exception as e:
            print(f"  ❌ Failed to load model: {e}")
            return False
    else:
        print(f"  ⚠ Model not found at {model_path}")
        print("     Run: python train_model.py")
        return False

def check_directories():
    """Check if required directories exist"""
    print("\nChecking directories...")
    directories = ["uploads", "models"]
    all_exist = True
    for directory in directories:
        if os.path.exists(directory):
            print(f"  ✓ {directory}/")
        else:
            print(f"  ⚠ {directory}/ - will be created on startup")
            all_exist = False
    return True  # Directories will be created automatically

def check_app():
    """Check if Flask app can be created"""
    print("\nChecking Flask app...")
    try:
        from app import create_app
        app = create_app()
        print("  ✓ Flask app created successfully")
        
        # Check routes
        with app.app_context():
            from app.routes import main, load_model
            model = load_model()
            if model is not None:
                print("  ✓ Model loaded in app context")
            else:
                print("  ⚠ Model not loaded (will be loaded on first request)")
        
        return True
    except Exception as e:
        print(f"  ❌ Failed to create app: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("Backend Health Check")
    print("=" * 60)
    
    results = []
    results.append(("Imports", check_imports()))
    results.append(("Model", check_model()))
    results.append(("Directories", check_directories()))
    results.append(("Flask App", check_app()))
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    all_ok = True
    for name, result in results:
        status = "✓ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
        if not result:
            all_ok = False
    
    print("=" * 60)
    
    if all_ok:
        print("\n✅ All checks passed! Backend is ready to run.")
        print("\nStart the server with:")
        print("  python wsgi.py")
        return 0
    else:
        print("\n❌ Some checks failed. Please fix the issues above.")
        print("\nTry running:")
        print("  python setup_backend.py")
        return 1

if __name__ == "__main__":
    sys.exit(main())
