import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def train_soil_model():
    # Generate sample data (replace with your actual data)
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'nitrogen': np.random.uniform(0, 200, n_samples),
        'phosphorus': np.random.uniform(5, 100, n_samples),
        'potassium': np.random.uniform(50, 300, n_samples),
        'ph': np.random.uniform(4.5, 8.5, n_samples),
        'organic_matter': np.random.uniform(0.5, 5.0, n_samples),
        'moisture': np.random.uniform(10, 60, n_samples),
        'temperature': np.random.uniform(15, 35, n_samples),
    }
    
    # Create target variable (productivity score 0-100)
    X = pd.DataFrame(data)
    # Calculate base productivity score
    base_score = (
        0.3 * (X['nitrogen'] / 200) * 100 +  # Normalize to 0-100 scale
        0.2 * (X['phosphorus'] / 100) * 100 +
        0.2 * (X['potassium'] / 300) * 100 +
        0.15 * (X['organic_matter'] / 5.0) * 100 +
        0.1 * (X['moisture'] / 60) * 100 +
        0.05 * (1 - abs(X['ph'] - 7.0) / 3.5) * 100  # Optimal pH around 7
    )
    
    # Add some noise and ensure range is 0-100
    y = np.clip(base_score + np.random.normal(0, 5, n_samples), 0, 100)
    
    # Train the model
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    model.fit(X, y)
    
    # Evaluate model
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model trained successfully!")
    print(f"Test MSE: {mse:.2f}")
    print(f"Test R² Score: {r2:.3f}")
    
    # Save the model
    models_dir = 'models'
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'soil_model.pkl')
    joblib.dump(model, model_path)
    print(f"✓ Model saved to {model_path}")
    print(f"  Model type: {type(model).__name__}")
    print(f"  Test R² Score: {r2:.3f}")
    print(f"  Test MSE: {mse:.2f}")
    
    return model

if __name__ == "__main__":
    train_soil_model()