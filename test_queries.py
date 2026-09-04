import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemes"))
from scheme_service import get_scheme_recommendations

tests = [
    {"state": "Tamil Nadu", "crop": "Paddy", "scheme_scope": "both"},
    {"state": "Tamil Nadu", "crop": "Cotton", "scheme_scope": "both"},
    {"state": "Maharashtra", "crop": "Groundnut", "scheme_scope": "both"},
    {"state": "Tamil Nadu", "crop": "Paddy", "scheme_scope": "central"},
    {"state": "Tamil Nadu", "crop": "Paddy", "scheme_scope": "state"},
]

for t in tests:
    print(f"\n--- Testing: {t} ---")
    res = get_scheme_recommendations(
        state=t["state"], 
        crop=t["crop"], 
        scheme_scope=t["scheme_scope"],
        has_land=True,
        age=35
    )
    
    print(f"Primary ({len(res['schemes'])}):")
    for s in res['schemes']:
        print(f"  - {s['scheme_name']} ({s['relevance']})")
        
    print(f"Fallback ({len(res.get('fallback_schemes', []))}):")
    for s in res.get('fallback_schemes', []):
        print(f"  - {s['scheme_name']} (Score: {s['score']})")
