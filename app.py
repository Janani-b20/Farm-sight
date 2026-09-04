from flask import Flask, render_template, request, jsonify
import sys
import os

# Add the current directory to sys.path so we can import schemes module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from schemes.scheme_service import get_scheme_recommendations

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/recommendations", methods=["POST"])
def get_recommendations():
    data = request.json
    
    scheme_scope = data.get("scheme_scope", "both")
    state = data.get("state")
    crop = data.get("crop")
    has_land = data.get("has_land")
    farmer_type = data.get("farmer_type", "farmer")
    
    # Handle age conversion if provided
    age = data.get("age")
    if age:
        try:
            age = int(age)
        except ValueError:
            age = None
            
    district = data.get("district")
    
    # Convert 'has_land' from string to boolean/None
    if has_land == "yes":
        has_land_val = True
    elif has_land == "no":
        has_land_val = False
    else:
        has_land_val = None
        
    result = get_scheme_recommendations(
        state=state,
        crop=crop,
        farmer_type=farmer_type,
        has_land=has_land_val,
        age=age,
        scheme_scope=scheme_scope
    )
    
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
