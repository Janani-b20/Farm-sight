import json
from pathlib import Path


DATA_FILE = Path(__file__).parent / "data" / "farmer_schemes.json"


def load_schemes():
    """Load verified government schemes from JSON."""
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def normalize(value):
    if value is None:
        return ""
    return str(value).strip().lower()


def match_schemes(
    state,
    crop,
    farmer_type="farmer",
    has_land=None,
    age=None,
    income=None,
    risk_tags=None,
    scheme_scope="both",
    top_n=10,
):
    """
    Return relevant schemes for a farmer.

    This is a relevance matcher, NOT an official eligibility checker.
    """

    schemes = load_schemes()

    state = normalize(state)
    crop = normalize(crop)
    farmer_type = normalize(farmer_type)

    risk_tags = {
        normalize(tag) for tag in (risk_tags or [])
    }

    results = []

    for scheme in schemes:

        # -----------------------------
        # 1. STATE FILTER
        # -----------------------------
        scheme_state = normalize(scheme.get("state"))
        scheme_level = normalize(scheme.get("level"))

        if scheme_scope == "central":
            if scheme_level != "central":
                continue
        elif scheme_scope == "state":
            if scheme_level != "state" or scheme_state != state:
                continue
        else:
            if not (scheme_level == "central" or (scheme_level == "state" and scheme_state == state)):
                continue

        # -----------------------------
        # 2. CROP FILTER / SCORE
        # -----------------------------
        scheme_crops = {
            normalize(c) for c in scheme.get("crops", [])
        }

        score = 0
        reasons = []

        if "all" in scheme_crops:
            score += 1
            reasons.append("Scheme applies across crops.")

        elif crop in scheme_crops:
            score += 3
            reasons.append(f"Scheme is relevant to {crop}.")

        else:
           # Exclude schemes meant for a different crop/category
           if scheme_crops:
               continue
        # -----------------------------
        # 3. LANDHOLDING CHECK
        # -----------------------------
        land_required = scheme.get("landholding_required")

        if land_required is True:
            if has_land is False:
                continue

            if has_land is True:
                score += 2
                reasons.append("Landholding condition appears relevant.")

        # -----------------------------
        # 4. FARMER TYPE
        # -----------------------------
        allowed_types = {
            normalize(x)
            for x in scheme.get("farmer_types_allowed", [])
        }

        if farmer_type in allowed_types:
            score += 2
            reasons.append("Farmer type matches the scheme.")

        elif "farmer" in allowed_types:
            score += 1

        # -----------------------------
        # 5. AGE
        # -----------------------------
        age_min = scheme.get("age_min")
        age_max = scheme.get("age_max")

        if age is not None:
            if age_min is not None and age < age_min:
                continue

            if age_max is not None and age > age_max:
                continue

        # -----------------------------
        # 6. INCOME
        # -----------------------------
        income_cap = scheme.get("income_cap")

        if (
            income is not None
            and income_cap is not None
            and income > income_cap
        ):
            continue

        # -----------------------------
        # 7. FARM/RISK CONTEXT
        # -----------------------------
        scheme_risks = {
            normalize(x)
            for x in scheme.get("risk_tags", [])
        }

        matched_risks = risk_tags.intersection(scheme_risks)

        if matched_risks:
            score += 2 * len(matched_risks)

            reasons.append(
                "Matches current farming context: "
                + ", ".join(sorted(matched_risks))
                + "."
            )

        # -----------------------------
        # 8. STATE-SPECIFIC BONUS
        # -----------------------------
        if scheme_state == state:
            score += 2
            reasons.append(
                f"Scheme is specific to {scheme.get('state')}."
            )

        # -----------------------------
        # 9. RELEVANCE LABEL
        # -----------------------------
        if score >= 7:
            relevance = "Highly Relevant"
        elif score >= 4:
            relevance = "May Be Relevant"
        else:
            relevance = "Low Relevance"

        results.append(
            {
                "scheme_id": scheme.get("id"),
                "scheme_name": scheme.get("scheme_name"),
                "short_name": scheme.get("short_name"),
                "relevance": relevance,
                "score": score,
                "why_recommended": reasons,
                "benefit": scheme.get("benefit"),
                "eligibility_note": scheme.get(
                    "eligibility_note"
                ),
                "documents": scheme.get("documents", []),
                "official_url": scheme.get("official_url"),
                "url_type": scheme.get("url_type", "invalid"),
                "coverage_level": scheme.get(
                    "coverage_level", "basic"
                ),
                "disclaimer": (
                    "This is a preliminary scheme recommendation. "
                    "Check official eligibility conditions before applying."
                ),
            }
        )

    def get_url_priority(item):
        t = item.get("url_type")
        if t in ["exact_info", "exact_apply"]:
            return 3
        if t == "exact_myscheme":
            return 2
        return 1

    # Highest score first, then verified URL priority
    results.sort(
        key=lambda item: (item["score"], get_url_priority(item)),
        reverse=True
    )

    dedup_results = []
    seen_names = set()
    seen_urls = set()

    for r in results:
        import re
        # Remove special characters to avoid mismatch due to minor formatting
        norm_name = re.sub(r'[^a-z0-9]', '', normalize(r.get("scheme_name", "")))
        
        if norm_name and norm_name in seen_names:
            continue
            
        if norm_name:
            seen_names.add(norm_name)
            
        dedup_results.append(r)

    return dedup_results[:top_n]


if __name__ == "__main__":

    # Temporary test farmer
    matches = match_schemes(
        state="Tamil Nadu",
        crop="paddy",
        farmer_type="farmer",
        has_land=True,
        age=35,
        risk_tags=["crop_loss", "weather_risk"],
        top_n=5,
    )

    print(f"\nFound {len(matches)} recommendations:\n")

    for index, scheme in enumerate(matches, start=1):
        print(
            f"{index}. {scheme['scheme_name']} "
            f"- {scheme['relevance']} "
            f"(score={scheme['score']})"
        )

        for reason in scheme["why_recommended"]:
            print(f"   - {reason}")

        print(f"   Official: {scheme['official_url']}")
        print()