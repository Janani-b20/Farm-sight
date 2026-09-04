import json
import re
from pathlib import Path

DATA_FILE = Path(__file__).parent / "data" / "broad_schemes.json"

def load_broad_schemes():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def normalize_text(text):
    if not text:
        return ""
    # Remove all non-alphanumeric characters and lowercase for strict comparison
    return re.sub(r'[^a-z0-9]', '', str(text).lower())

def normalize_keyword(text):
    if not text:
        return ""
    return str(text).strip().lower()

def has_whole_word(word, text):
    return bool(re.search(r'\b' + re.escape(word) + r'\b', text))

def is_unrelated_sector(scheme_name, text, crop):
    text_lower = normalize_keyword(text)
    name_lower = normalize_keyword(scheme_name)
    
    # Absolute rejects regardless of crop
    forestry_keywords = ["forestry", "afforestation", "forest", "tribal forest"]
    animal_keywords = ["animal husbandry", "livestock", "dairy", "poultry", "fishery", "fisheries", "milch", "cattle", "sheep", "goat"]
    
    for kw in forestry_keywords + animal_keywords:
        if has_whole_word(kw, text_lower):
            return True
            
    # Crop specific conflicts in scheme name
    specific_crops = [
        "paddy", "rice", "wheat", "maize", "jowar", "bajra", "ragi",
        "cotton", "jute", "sugarcane", "tobacco", "rubber",
        "groundnut", "soybean", "sunflower", "mustard", "sesame",
        "coconut", "tea", "coffee", "cardamom", "pepper", "spices",
        "apple", "mango", "banana", "citrus", "grapes", "cashew", "plantation"
    ]
    
    if crop:
        crop_kw = crop.lower()
        selected_crops = [crop_kw]
        if crop_kw == "paddy":
            selected_crops.append("rice")
            
        for c in specific_crops:
            if c not in selected_crops:
                if has_whole_word(c, name_lower):
                    has_selected = any(has_whole_word(sc, name_lower) for sc in selected_crops)
                    if not has_selected:
                        return True
                        
    return False

def get_fallback_schemes(state, crop, scheme_scope, primary_schemes=None, top_n=5):
    """
    Search the broader Hugging Face catalogue for fallback schemes.
    """
    schemes = load_broad_schemes()
    state = normalize_keyword(state)
    crop = normalize_keyword(crop)
    
    if not primary_schemes:
        primary_schemes = []
        
    # Build deduplication sets
    primary_names = {normalize_text(s.get("scheme_name")) for s in primary_schemes if s.get("scheme_name")}
    
    results = []
    
    for scheme in schemes:
        scheme_name = scheme.get("name", "")
        scheme_desc = scheme.get("description", "")
        scheme_state = normalize_keyword(scheme.get("state", ""))
        scheme_url = scheme.get("official_url", "")
        
        # 1. Deduplication Check
        norm_name = normalize_text(scheme_name)
        if norm_name in primary_names:
            continue
            
        # 2. Scope & State Check
        if scheme_scope == "central":
            if scheme_state != "central":
                continue
        elif scheme_scope == "state":
            if scheme_state != state:
                continue
        else: # both
            if scheme_state not in ("central", state):
                continue
                
        # 3. Relevance Filtering
        combined_text = scheme_name + " " + scheme_desc
        
        # Check if unrelated sector
        if is_unrelated_sector(scheme_name, combined_text, crop):
            continue
            
        # 4. Scoring (Basic prioritization)
        score = 0
        text_lower = normalize_keyword(combined_text)
        
        # Boost if specific crop is mentioned
        if crop in text_lower or (crop == "paddy" and "rice" in text_lower):
            score += 5
            
        # Boost if general ag keywords are mentioned
        general_keywords = ["insurance", "credit", "irrigation", "machinery", "seed", "soil", "equipment", "kisan", "farmer"]
        for kw in general_keywords:
            if kw in text_lower:
                score += 2
                break
                
        # We accept schemes with score >= 0 since they passed negative filtering
        # and belong to "Agriculture,Rural & Environment" category implicitly
        
        results.append({
            "scheme_name": scheme_name,
            "description": scheme_desc,
            "state": scheme.get("state", ""),
            "official_url": scheme_url,
            "score": score
        })
        
    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return results[:top_n]
