import json
from schemes.scheme_matcher import match_schemes
from schemes.fallback_matcher import get_fallback_schemes

def run_test(state, crop, scope):
    print(f"\n--- TEST: {state} + {crop} + {scope.upper()} ---")
    
    # 1. Get Primary Schemes
    matches = match_schemes(
        state=state,
        crop=crop,
        farmer_type="farmer",
        has_land=True,
        age=35,
        risk_tags=[],
        scheme_scope=scope,
        top_n=20
    )
    
    # 2. Get Fallback Schemes
    fallbacks = get_fallback_schemes(
        state=state,
        crop=crop,
        scheme_scope=scope,
        primary_schemes=matches,
        top_n=10
    )
    
    # Output Primary
    print("PRIMARY SCHEMES:")
    namo_count = 0
    central_count = 0
    state_count = 0
    
    for m in matches:
        # Load from json to check its level/state since it's not in the output dict
        with open('schemes/data/farmer_schemes.json', encoding='utf-8') as f:
            all_s = json.load(f)
            scheme_obj = next((s for s in all_s if s['id'] == m['scheme_id']), None)
            level = scheme_obj['level'] if scheme_obj else 'unknown'
            s_state = scheme_obj['state'] if scheme_obj else 'unknown'
        
        if level.lower() == 'central':
            central_count += 1
        elif level.lower() == 'state':
            state_count += 1
            
        name = m['scheme_name']
        print(f"  - [{level.upper()}] {name}")
        if 'namo' in name.lower():
            namo_count += 1
            
    # Output Fallback
    print("FALLBACK SCHEMES:")
    for f in fallbacks:
        st = f['state']
        if st.lower() == 'central':
            central_count += 1
        else:
            state_count += 1
            
        name = f['scheme_name']
        print(f"  - [{st.upper()}] {name}")
        if 'namo' in name.lower():
            namo_count += 1
            
    print(f"\nSUMMARY: Central={central_count}, State={state_count}, Namo Count={namo_count}")
    return central_count, state_count, namo_count

c1, s1, n1 = run_test("Tamil Nadu", "Paddy", "state")
c2, s2, n2 = run_test("Tamil Nadu", "Paddy", "central")
c3, s3, n3 = run_test("Tamil Nadu", "Paddy", "both")
c4, s4, n4 = run_test("Maharashtra", "Groundnut", "both")

# Validate broad_schemes.json
with open('schemes/data/broad_schemes.json', encoding='utf-8') as f:
    broad_count = len(json.load(f))
    print(f"\nbroad_schemes.json count: {broad_count}")
