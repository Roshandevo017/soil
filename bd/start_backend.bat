@echo off
echo ============================================================
echo Starting Soil Productivity Prediction Backend...
echo ============================================================
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Run setup script to ensure everything is ready
echo.
echo Running setup checks...
python setup_backend.py
if errorlevel 1 (
    echo ERROR: Setup failed
    pause
    exit /b 1
)

REM Start Flask server
echo.
echo ============================================================
echo Starting Flask server on http://localhost:5000
echo ============================================================
echo Press Ctrl+C to stop the server
echo.
python wsgi.py

pause
