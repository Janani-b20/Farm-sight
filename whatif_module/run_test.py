from simulator import run_simulation
from explainer import generate_farmer_explanation
from tts import speak_tamil_advice

def test_full_pipeline():
    # Scenario Test: High humidity & rain-la fertilizer poduvadha check pandrom
    crop_info = {"type": "paddy", "disease": "None"}
    weather_info = {
        "rain_probability": 70,
        "humidity": 85,
        "temperature": 32,
        "soil_moisture": 60
    }
    user_action = "apply_fertilizer"

    # 1. Rule Engine Simulation
    sim_result = run_simulation(crop_info, weather_info, user_action)
    print("=== RAW RULE ENGINE OUTPUT ===")
    print(sim_result)
    
    # 2. Gemini Tamil Explanation
    tamil_advice = generate_farmer_explanation(sim_result, crop_name="நெல் (Paddy)")
    print("\n=== AI EXPLAINER OUTPUT ===")
    print(tamil_advice)
    
    # 3. Audio Output (TTS)
    speak_tamil_advice(tamil_advice)

if __name__ == "__main__":
    test_full_pipeline()