from schemes.scheme_matcher import match_schemes

tests = [
    {"state": "Tamil Nadu", "crop": "Paddy", "scope": "both"},
    {"state": "Andhra Pradesh", "crop": "Groundnut", "scope": "both"},
    {"state": "Maharashtra", "crop": "Groundnut", "scope": "both"},
    {"state": "Central", "crop": "Paddy", "scope": "central"},
]

for t in tests:
    print(f"\n--- Testing: {t['state']} / {t['crop']} ---")
    results = match_schemes(state=t["state"], crop=t["crop"], scheme_scope=t["scope"], top_n=20)
    for r in results:
        print(f"  [{r['score']}] {r['relevance']} | URL: {r.get('url_type')} | {r['scheme_name']}")
