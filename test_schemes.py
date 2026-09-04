import json
import sys
import os

try:
    from schemes.scheme_service import get_scheme_recommendations
except ImportError:
    sys.path.append(os.path.abspath('.'))
    from schemes.scheme_service import get_scheme_recommendations

scenarios = [
    ("Tamil Nadu", "Paddy", "state"),   # Test A
    ("Tamil Nadu", "Paddy", "central"), # Test B
    ("Tamil Nadu", "Paddy", "both"),    # Test C
    ("Maharashtra", "Groundnut", "both"), # Test D
]

print("=== VERIFICATION TESTS AFTER FIX ===")

for state, crop, scope in scenarios:
    res = get_scheme_recommendations(state=state, crop=crop, scheme_scope=scope, top_n=10)
    print(f"\n--- Scenario: {state} + {crop} + {scope} ---")
    
    primary_schemes = res.get("schemes", [])
    fallback_schemes = res.get("fallback_schemes", [])
    
    print(f"Primary result count: {len(primary_schemes)}")
    print(f"Fallback result count: {len(fallback_schemes)}")
    
    print("\nPrimary Schemes:")
    for s in primary_schemes:
        print(f"  - {s.get('scheme_name')} | Layer: Primary | Rel: {s.get('relevance')} | URL: {s.get('official_url', 'N/A')}")
        
    print("\nFallback Schemes:")
    for s in fallback_schemes:
        print(f"  - {s.get('scheme_name')} | Layer: Fallback | Rel: {s.get('relevance', 'N/A')} | URL: {s.get('official_url', 'N/A')}")
        
    print("\nDisclaimer:", res.get("disclaimer"))
