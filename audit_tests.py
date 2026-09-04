import os
import sys
import json

# Add schemes directory to path to import service
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemes"))
from scheme_service import get_scheme_recommendations

# 1 & 2. Verify JSON loads
farmer_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemes", "data", "farmer_schemes.json")
broad_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemes", "data", "broad_schemes.json")

print("=== DATASET VERIFICATION ===")
try:
    with open(farmer_path, "r", encoding="utf-8") as f:
        farmer_data = json.load(f)
        print(f"farmer_schemes.json Path: {farmer_path}")
        print(f"farmer_schemes.json Count: {len(farmer_data)}")
except Exception as e:
    print(f"farmer_schemes.json Error: {e}")

try:
    with open(broad_path, "r", encoding="utf-8") as f:
        broad_data = json.load(f)
        print(f"broad_schemes.json Path: {broad_path}")
        print(f"broad_schemes.json Count: {len(broad_data)}")
except Exception as e:
    print(f"broad_schemes.json Error: {e}")

# 11. Run Tests
tests = [
    {"state": "Tamil Nadu", "crop": "Paddy", "scheme_scope": "both"},
    {"state": "Tamil Nadu", "crop": "Cotton", "scheme_scope": "both"},
    {"state": "Tamil Nadu", "crop": "Groundnut", "scheme_scope": "both"},
    {"state": "Maharashtra", "crop": "Groundnut", "scheme_scope": "both"},
    {"state": "Tamil Nadu", "crop": "Paddy", "scheme_scope": "central"},
    {"state": "Tamil Nadu", "crop": "Paddy", "scheme_scope": "state"},
]

print("\n=== RUNTIME TESTS ===")
for t in tests:
    print(f"\n--- Testing: {t['state']} + {t['crop']} + {t['scheme_scope']} ---")
    res = get_scheme_recommendations(
        state=t["state"], 
        crop=t["crop"], 
        scheme_scope=t["scheme_scope"],
        has_land=True,
        age=35
    )
    
    print(f"Primary Results: {len(res['schemes'])}")
    for s in res['schemes']:
        print(f"  [Primary] {s['scheme_name']} | State: n/a (mixed) | Relevance: {s['relevance']} | URL: {s['official_url']}")
        
    fallback = res.get('fallback_schemes', [])
    print(f"Fallback Results: {len(fallback)}")
    for s in fallback:
        print(f"  [Fallback] {s['scheme_name']} | State: {s['state']} | Relevance Score: {s['score']} | URL: {s['official_url']}")
