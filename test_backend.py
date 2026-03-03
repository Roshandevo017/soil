#!/usr/bin/env python3
"""
Test script to verify backend API is working correctly
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("[PASS] Health check passed")
            print(f"  Status: {data.get('status')}")
            print(f"  Model loaded: {data.get('model_loaded')}")
            return True
        else:
            print(f"[FAIL] Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("[FAIL] Cannot connect to backend. Is it running?")
        return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print("\nTesting prediction endpoint...")
    try:
        sample_data = {
            "nitrogen": 150,
            "phosphorus": 30,
            "potassium": 200,
            "ph": 6.5,
            "organic_matter": 2.0,
            "moisture": 45,
            "temperature": 25
        }

        response = requests.post(
            f"{BASE_URL}/api/predict",
            json=sample_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print("[PASS] Prediction successful")
            print(f"  Productivity Score: {data.get('productivity_score'):.2f}")
            print(f"  Productivity Level: {data.get('productivity_level')}")
            return True
        else:
            print(f"[FAIL] Prediction failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False

def test_soil_types():
    """Test soil types endpoint"""
    print("\nTesting soil types endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/soil-types", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Soil types retrieved: {len(data)} types")
            print(f"  Types: {', '.join(data)}")
            return True
        else:
            print(f"[FAIL] Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False

def main():
    print("=" * 50)
    print("Backend API Test Suite")
    print("=" * 50)

    results = []
    results.append(("Health Check", test_health()))
    results.append(("Prediction", test_prediction()))
    results.append(("Soil Types", test_soil_types()))

    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n[PASS] All tests passed! Backend is working correctly.")
        sys.exit(0)
    else:
        print("\n[FAIL] Some tests failed. Please check the backend.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
