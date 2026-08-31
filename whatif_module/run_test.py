"""
FarmSight - Multilingual Test Suite (Tamil, English, Hindi)
"""
import time
from whatif_module.service import execute_whatif_pipeline

def test_multilingual():
    weather = {
        "rain_probability": 80,
        "humidity": 85,
        "temperature": 29
    }
    
    ml_data = {
        "crop": "paddy",
        "disease": "dead_heart",
        "confidence": 99.2,
        "message": "Prediction successful."
    }

    print("\n" + "="*60)
    print("1. TESTING TAMIL PIPELINE")
    print("="*60)
    res_ta = execute_whatif_pipeline(ml_data, weather, "spray_chemical_now", language="ta")
    print(res_ta["advisory_text"])
    time.sleep(14)

    print("\n" + "="*60)
    print("2. TESTING ENGLISH PIPELINE")
    print("="*60)
    res_en = execute_whatif_pipeline(ml_data, weather, "spray_chemical_now", language="en")
    print(res_en["advisory_text"])
    time.sleep(10)

    print("\n" + "="*60)
    print("3. TESTING HINDI PIPELINE")
    print("="*60)
    res_hi = execute_whatif_pipeline(ml_data, weather, "spray_chemical_now", language="hi")
    print(res_hi["advisory_text"])
    time.sleep(12)

if __name__ == "__main__":
    test_multilingual()