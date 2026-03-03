"""
WSGI entry point for the Flask application
"""
import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from app import create_app
    
    app = create_app()
    
    if __name__ == "__main__":
        print("=" * 60)
        print("Soil Productivity Prediction API")
        print("=" * 60)
        print("Starting server on http://0.0.0.0:5000")
        print("API Health Check: http://localhost:5000/api/health")
        print("Press Ctrl+C to stop the server")
        print("=" * 60)
        print()
        
        try:
            app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
        except KeyboardInterrupt:
            print("\n\nServer stopped by user")
        except Exception as e:
            print(f"\n\nError starting server: {e}")
            sys.exit(1)
            
except ImportError as e:
    print(f"ERROR: Failed to import application: {e}")
    print("\nPlease ensure:")
    print("1. Virtual environment is activated")
    print("2. Dependencies are installed: pip install -r requirements.txt")
    print("3. You are in the backend directory")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Failed to create application: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)