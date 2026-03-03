#!/usr/bin/env python3
"""
Backend Setup Script
This script ensures all dependencies are installed and the model is trained.
"""

import os
import sys
import subprocess

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        return False
    print(f"✓ Python version: {sys.version.split()[0]}")
    return True

def check_virtual_env():
    """Check if virtual environment is activated"""
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    if not in_venv:
        print("⚠ Warning: Virtual environment not detected")
        print("   It's recommended to activate the virtual environment first")
        print("   Windows: venv\\Scripts\\activate")
        print("   Linux/Mac: source venv/bin/activate")
    else:
        print("✓ Virtual environment activated")
    return True

def install_dependencies():
    """Install required dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_model():
    """Check if model exists, train if not"""
    model_path = os.path.join("models", "soil_model.pkl")
    if os.path.exists(model_path):
        print(f"✓ Model found at {model_path}")
        return True
    else:
        print(f"\n🤖 Model not found. Training new model...")
        try:
            from train_model import train_soil_model
            train_soil_model()
            if os.path.exists(model_path):
                print(f"✓ Model trained and saved to {model_path}")
                return True
            else:
                print("❌ Model training failed")
                return False
        except Exception as e:
            print(f"❌ Failed to train model: {e}")
            return False

def check_directories():
    """Ensure required directories exist"""
    directories = ["uploads", "models"]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✓ Directory '{directory}' ready")
    return True

def main():
    print("=" * 60)
    print("Soil Productivity Prediction - Backend Setup")
    print("=" * 60)
    
    success = True
    
    # Check Python version
    if not check_python_version():
        success = False
    
    # Check virtual environment
    check_virtual_env()
    
    # Check/create directories
    print("\n📁 Checking directories...")
    check_directories()
    
    # Install dependencies
    if not install_dependencies():
        success = False
    
    # Check/train model
    print("\n🤖 Checking model...")
    if not check_model():
        success = False
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Backend setup completed successfully!")
        print("\nYou can now start the backend with:")
        print("  python wsgi.py")
        print("\nOr use the startup script:")
        print("  Windows: start_backend.bat")
        print("  Linux/Mac: ./start_backend.sh")
    else:
        print("❌ Setup completed with errors. Please check the messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
