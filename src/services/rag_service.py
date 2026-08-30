import os
import json
import re
import requests
from google import genai
from google.genai import types

# API Keys setup (loaded from .env via load_dotenv() in main.py)
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found — check your .env file and load_dotenv() call in main.py")

client = genai.Client(api_key=GEMINI_API_KEY)


def _readable(text: str) -> str:
    """Converts model class-name style strings (e.g. 'dead_heart') into
    plain readable words ('dead heart') for search queries and prompts."""
    return text.replace("_", " ").replace("-", " ").strip()


def _static_fallback(crop_readable: str, disease_readable: str, sources: list[dict]) -> dict:
    """
    Demo-safety net. Called whenever Gemini fails for ANY reason — quota
    exhausted, JSON parse failure, network issue, timeout, whatever.
    NEVER shows a raw error to the farmer. Returns generic-but-genuinely-useful
    agronomic advice instead, in the exact same shape as the real response.
    """
    return {
        "why_this_happening": [
            f"{disease_readable} in {crop_readable} is usually triggered by weather stress, pest activity, or nutrient imbalance.",
            "Early stages can be hard to tell apart, so quick action now limits spread.",
        ],
        "what_to_do_now": [
            "Isolate or mark the affected plants/area so you can monitor spread.",
            "Avoid overhead irrigation or spraying until you confirm the exact cause.",
            "Take a few clear close-up photos in daylight and re-check with the app shortly.",
        ],
        "treatment": [
            "Remove and destroy visibly infected leaves/plants to reduce spread.",
            "Consult your local Krishi Vigyan Kendra (KVK) or agri extension officer for a confirmed, crop-specific treatment.",
        ],
        "weather_warning": None,
        "sources": [{"title": s["title"], "url": s["url"]} for s in sources] if sources else [],
    }


def search_web(query: str, max_results: int = 3) -> list[dict]:
    """
    Tavily search — returns REAL source data (title + url + content), not just
    a flattened text blob. This is what lets us show actual citations instead
    of placeholder labels like "Agricultural Research Database".
    Never raises — always returns a list (possibly empty) so callers don't
    need to defend against network failures here.
    """
    try:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "max_results": max_results,
        }
        response = requests.post(url, json=payload, timeout=10)
        data = response.json()
        results = data.get("results", [])

        return [
            {
                "title": item.get("title", "Untitled Source"),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
            }
            for item in results
            if item.get("url")  # skip anything without a real URL
        ]
    except Exception as e:
        print(f"Tavily Search Error: {e}")
        return []


def get_rag_response(user_query: str, crop_name: str = "") -> str:
    """
    Kept for the generic /api/rag endpoint (free-form questions).
    Disease-specific structured advice now goes through get_disease_advice() instead.
    """
    search_prompt = f"{crop_name} {user_query} agriculture farming solution".strip()
    sources = search_web(search_prompt)
    retrieved_context = "\n".join([f"- {s['content']}" for s in sources]) or "No extra information found."

    prompt = f"""
    You are an expert agricultural AI assistant.

    User Query: {user_query}
    Crop/Context: {crop_name}

    Real-time Information Retrieved from Web:
    {retrieved_context}

    Please provide a concise, practical, and helpful answer for the farmer based on the retrieved information and your knowledge.
    """

    try:
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return response.text
    except Exception as e:
        print(f"get_rag_response Gemini error: {e}")
        return "Sorry, I couldn't generate a response right now. Please try again in a moment."


def get_disease_advice(crop: str, disease: str, confidence: float, weather_context: str | None = None) -> dict:
    """
    Farmer-facing structured disease advisory. Returns a dict matching the
    AnalysisResponse structured fields:
      {why_this_happening, what_to_do_now, treatment, weather_warning, sources}

    GUARANTEE: this function never raises and never surfaces a raw error
    string to the farmer. Any failure — Tavily, Gemini quota, JSON parsing,
    network — falls through to _static_fallback().
    """
    crop_readable = _readable(crop)
    disease_readable = _readable(disease)

    # Sources are fetched defensively — search_web() itself never raises,
    # but we still wrap it so a totally unexpected error here can't kill
    # the whole request before we even reach the fallback path.
    try:
        search_query = (
            f"{crop_readable} crop {disease_readable} pest disease symptoms treatment "
            f"agriculture management India"
        )
        sources = search_web(search_query, max_results=3)
    except Exception as e:
        print(f"Unexpected error building/searching query: {e}")
        sources = []

    context_text = "\n\n".join(
        [f"Source: {s['title']}\n{s['content']}" for s in sources]
    ) or "No additional web context retrieved."

    weather_clause = (
        f"\nCurrent live weather at the farmer's location: {weather_context}\n"
        "If these conditions increase disease risk or affect what the farmer should do right now "
        "(e.g. avoid spraying before rain, high humidity raises fungal risk), include ONE short "
        "weather_warning line. Otherwise set weather_warning to null."
        if weather_context else
        "\nNo live weather data available — set weather_warning to null."
    )

    prompt = f"""
    You are an agricultural assistant writing DIRECTLY for a farmer with limited time, reading on a phone in a field.
    Be extremely concise. No long paragraphs. No essay-style explanations.

    Crop: {crop_readable} (agricultural crop, NOT a human medical context)
    Detected condition: {disease_readable} (a crop pest/disease symptom, NOT a human illness)
    Model confidence: {confidence}%
    {weather_clause}

    Reference information (use this to ground your answer, do not quote it verbatim):
    {context_text}

    Respond with ONLY valid JSON in this exact shape:
    {{
      "why_this_happening": ["short reason 1", "short reason 2"],
      "what_to_do_now": ["short actionable step 1", "short actionable step 2", "short actionable step 3"],
      "treatment": ["short treatment option 1", "short treatment option 2"],
      "weather_warning": "one short sentence, or null if not applicable"
    }}

    Rules:
    - Each bullet must be ONE short sentence (under 15 words), plain language, no jargon.
    - Maximum 3 items per list.
    - "what_to_do_now" = immediate field actions. "treatment" = specific remedies (organic first, chemical only if needed).
    - Do not repeat the crop/disease name in every bullet.
    """

    # Ask Gemini to enforce valid JSON at the API level (response_mime_type),
    # instead of relying only on prompt instructions.
    #
    # IMPORTANT: gemini-2.5-flash uses an internal "thinking" budget by
    # default, which eats into max_output_tokens and was causing the final
    # JSON answer to get cut off mid-string. Disabling thinking_budget=0
    # gives the full token budget to the actual JSON output.
    generation_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        max_output_tokens=2048,
        temperature=0.4,
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    )

    raw_text = ""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=generation_config,
        )
        raw_text = (response.text or "").strip()

        # Log finish_reason for debugging — "MAX_TOKENS" here would mean
        # the budget is still too small even after disabling thinking.
        try:
            finish_reason = response.candidates[0].finish_reason
            if str(finish_reason) not in ("STOP", "FinishReason.STOP", "1"):
                print(f"Gemini finish_reason: {finish_reason} (response may be incomplete)")
        except Exception:
            pass

        # Defensive parsing: even with response_mime_type enforced, extract
        # the first {...} block in case of any stray characters.
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        json_str = match.group(0) if match else raw_text
        parsed = json.loads(json_str)

        # Extra guard: if Gemini returned technically-valid JSON but with
        # empty/missing required lists, treat it as a failure and fall back
        # rather than showing the farmer an empty card.
        if not parsed.get("what_to_do_now"):
            print("Gemini returned JSON but what_to_do_now was empty — using fallback")
            return _static_fallback(crop_readable, disease_readable, sources)

        return {
            "why_this_happening": parsed.get("why_this_happening", [])[:3],
            "what_to_do_now": parsed.get("what_to_do_now", [])[:3],
            "treatment": parsed.get("treatment", [])[:3],
            "weather_warning": parsed.get("weather_warning") or None,
            "sources": [{"title": s["title"], "url": s["url"]} for s in sources],
        }

    except json.JSONDecodeError as e:
        print(f"Gemini returned non-JSON, falling back: {e} | raw: {raw_text[:200]}")
        return _static_fallback(crop_readable, disease_readable, sources)

    except Exception as e:
        # Covers quota exceeded (429 RESOURCE_EXHAUSTED), network errors,
        # timeouts, auth errors — anything at all. Farmer never sees this.
        print(f"Gemini call failed, using static fallback: {e}")
        return _static_fallback(crop_readable, disease_readable, sources)