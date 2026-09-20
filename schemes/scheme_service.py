try:
    from scheme_matcher import match_schemes
    from fallback_matcher import get_fallback_schemes
except ImportError:
    from .scheme_matcher import match_schemes
    from .fallback_matcher import get_fallback_schemes

def get_scheme_recommendations(
    state,
    crop,
    farmer_type="farmer",
    has_land=None,
    age=None,
    income=None,
    risk_tags=None,
    scheme_scope="both",
    top_n=5,
):
    """
    Public interface for FarmSight Scheme Intelligence.

    Returns preliminary scheme recommendations.
    It does NOT determine official government eligibility.
    """

    matches = match_schemes(
        state=state,
        crop=crop,
        farmer_type=farmer_type,
        has_land=has_land,
        age=age,
        income=income,
        risk_tags=risk_tags,
        scheme_scope=scheme_scope,
        top_n=top_n,
    )

    fallback_schemes = []
    strong_matches = [m for m in matches if m['relevance'] in ("Highly Relevant", "May Be Relevant")]
    if len(strong_matches) < 3:
        fallback_schemes = get_fallback_schemes(state, crop, scheme_scope, matches)

    return {
        "status": "success",
        "recommendation_type": "preliminary",
        "farmer_context": {
            "state": state,
            "crop": crop,
            "farmer_type": farmer_type,
            "has_land": has_land,
            "age": age,
        },
        "total_recommendations": len(matches),
        "schemes": matches,
        "fallback_schemes": fallback_schemes,
        "disclaimer": (
            "These recommendations are based on schemes currently "
            "available in the FarmSight database. They do not confirm "
            "official eligibility. Check the official government portal "
            "before applying."
        ),
    }


if __name__ == "__main__":

    result = get_scheme_recommendations(
        state="Andhra Pradesh",
        crop="cotton",
        farmer_type="farmer",
        has_land=True,
        age=35,
        risk_tags=["crop_loss", "weather_risk"],
    )

    print("\nFarmSight Scheme Intelligence\n")

    for scheme in result["schemes"]:
        print(
            f"{scheme['scheme_name']} "
            f"- {scheme['relevance']}"
        )

    print("\nDisclaimer:")
    print(result["disclaimer"])