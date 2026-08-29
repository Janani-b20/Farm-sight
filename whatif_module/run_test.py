"""
FarmSight - End-to-End Pipeline & Guardrail Test Suite
"""
import time
from whatif_module.service import execute_whatif_pipeline

def run_all_tests():
    weather = {
        "rain_probability": 75,
        "humidity": 85,
        "temperature": 28
    }

    print("\n" + "="*60)
    print("TEST 1: Confirmed Disease (dead_heart + Spray Under Rain)")
    print("=======================================================")
    res1 = execute_whatif_pipeline(
        ml_result={
            "crop": "paddy",
            "disease": "dead_heart",
            "confidence": 99.69,
            "message": "Prediction successful."
        },
        weather_data=weather,
        farmer_action="spray_chemical_now"
    )
    print("Status:", res1["status"])
    print("\n[AI Tamil Advisory]:\n", res1["tamil_advice"])
    print("Audio:", res1["audio_file"])
    time.sleep(5)  # Audio play aagi mudiyara varaikkum chinna wait

    print("\n" + "="*60)
    print("TEST 2: Guardrail Check (uncertain / Confidence < 50%)")
    print("=======================================================")
    res2 = execute_whatif_pipeline(
        ml_result={
            "crop": "paddy",
            "disease": "uncertain",
            "confidence": 35.0,
            "message": "Low confidence prediction."
        },
        weather_data=weather,
        farmer_action="spray_chemical_now"
    )
    print("Status:", res2["status"])
    print("\n[Halt Message / Guidance]:\n", res2["tamil_advice"])
    print("Audio:", res2["audio_file"])
    time.sleep(5)

    print("\n" + "="*60)
    print("TEST 3: Healthy Crop Check (normal / Healthy Path)")
    print("=======================================================")
    res3 = execute_whatif_pipeline(
        ml_result={
            "crop": "paddy",
            "disease": "normal",
            "confidence": 98.50,
            "message": "Prediction successful."
        },
        weather_data=weather,
        farmer_action="spray_chemical_now"
    )
    print("Status:", res3["status"])
    print("\n[Healthy Crop Advisory]:\n", res3["tamil_advice"])
    print("Audio:", res3["audio_file"])

if __name__ == "__main__":
    run_all_tests()