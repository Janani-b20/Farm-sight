import os
import json
import re
import requests

from google import genai
from google.genai import types


# ============================================================
# API KEYS
# ============================================================

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found — check your .env file "
        "and load_dotenv() call in main.py"
    )

client = genai.Client(api_key=GEMINI_API_KEY)


# ============================================================
# LANGUAGE CONFIG
# ============================================================

LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
}


def _normalize_language(language: str | None) -> str:
    """
    Ensures only supported farmer-facing languages are used.
    """
    if not language:
        return "en"

    language = language.strip().lower()

    if language not in LANGUAGE_NAMES:
        return "en"

    return language


# ============================================================
# HELPERS
# ============================================================

def _readable(text: str) -> str:
    """
    Converts model class-name style strings
    e.g. dead_heart -> dead heart
    """
    return (
        text.replace("_", " ")
        .replace("-", " ")
        .strip()
    )


# ============================================================
# STATIC FALLBACK
# ============================================================

def _static_fallback(
    crop_readable: str,
    disease_readable: str,
    sources: list[dict],
    language: str = "en",
) -> dict:
    """
    Demo safety fallback.

    Used when Gemini fails because of:
    - quota
    - API/network issues
    - invalid JSON
    - timeout
    - any unexpected failure

    Returns the same structure as Gemini output.
    """

    language = _normalize_language(language)

    # --------------------------------------------------------
    # TAMIL
    # --------------------------------------------------------

    if language == "ta":
        return {
            "why_this_happening": [
                f"{crop_readable} பயிரில் {disease_readable} நோய் ஈரப்பதம், வானிலை மாற்றம் அல்லது தாவர அழுத்தத்தால் ஏற்படலாம்.",
                "ஆரம்ப நிலையில் அறிகுறிகள் தெளிவாக இல்லாமல் இருக்கலாம்.",
            ],

            "what_to_do_now": [
                "பாதிக்கப்பட்ட செடிகளை குறியிட்டு நோய் பரவலை கண்காணிக்கவும்.",
                "பாதிக்கப்பட்ட இலைகளுக்கு மேலிருந்து நீர் பாய்ச்சுவதை தவிர்க்கவும்.",
                "தெளிவான புகைப்படம் எடுத்து மீண்டும் பரிசோதிக்கவும்.",
            ],

            "treatment": [
                "கடுமையாக பாதிக்கப்பட்ட இலைகளை அகற்றி பாதுகாப்பாக அழிக்கவும்.",
                "KVK அல்லது வேளாண்மை அதிகாரியிடம் சரியான சிகிச்சையை உறுதிப்படுத்தவும்.",
            ],

            "weather_warning": None,

            "sources": [
                {
                    "title": s["title"],
                    "url": s["url"],
                }
                for s in sources
            ] if sources else [],
        }

    # --------------------------------------------------------
    # HINDI
    # --------------------------------------------------------

    if language == "hi":
        return {
            "why_this_happening": [
                f"{crop_readable} में {disease_readable} नमी, मौसम बदलाव या पौधे के तनाव से बढ़ सकता है.",
                "शुरुआती अवस्था में लक्षण स्पष्ट रूप से पहचानना कठिन हो सकता है.",
            ],

            "what_to_do_now": [
                "प्रभावित पौधों को चिन्हित करें और फैलाव पर नज़र रखें.",
                "ऊपर से सिंचाई करने से बचें.",
                "साफ़ फोटो लेकर कुछ समय बाद दोबारा जांच करें.",
            ],

            "treatment": [
                "गंभीर रूप से प्रभावित पत्तियों को हटाकर सुरक्षित रूप से नष्ट करें.",
                "सही उपचार के लिए KVK या कृषि अधिकारी से सलाह लें.",
            ],

            "weather_warning": None,

            "sources": [
                {
                    "title": s["title"],
                    "url": s["url"],
                }
                for s in sources
            ] if sources else [],
        }

    # --------------------------------------------------------
    # ENGLISH
    # --------------------------------------------------------

    return {
        "why_this_happening": [
            f"{disease_readable} in {crop_readable} may increase due to humidity, weather stress, or plant stress.",
            "Early-stage symptoms can be difficult to distinguish clearly.",
        ],

        "what_to_do_now": [
            "Mark the affected plants and monitor whether the condition is spreading.",
            "Avoid overhead irrigation on affected plants.",
            "Take another clear daylight photo and re-check shortly.",
        ],

        "treatment": [
            "Remove severely infected leaves and dispose of them safely.",
            "Consult your local KVK or agriculture officer for confirmed treatment.",
        ],

        "weather_warning": None,

        "sources": [
            {
                "title": s["title"],
                "url": s["url"],
            }
            for s in sources
        ] if sources else [],
    }


# ============================================================
# TAVILY WEB SEARCH
# ============================================================

def search_web(
    query: str,
    max_results: int = 3,
) -> list[dict]:
    """
    Searches Tavily and returns:
    title + url + content
    """

    if not TAVILY_API_KEY:
        print(
            "TAVILY_API_KEY missing — "
            "continuing without web sources"
        )
        return []

    try:
        url = "https://api.tavily.com/search"

        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "max_results": max_results,
        }

        response = requests.post(
            url,
            json=payload,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        results = data.get(
            "results",
            [],
        )

        return [
            {
                "title": item.get(
                    "title",
                    "Untitled Source",
                ),

                "url": item.get(
                    "url",
                    "",
                ),

                "content": item.get(
                    "content",
                    "",
                ),
            }
            for item in results
            if item.get("url")
        ]

    except Exception as e:
        print(
            f"Tavily Search Error: {e}"
        )

        return []


# ============================================================
# GENERIC RAG
# ============================================================

def get_rag_response(
    user_query: str,
    crop_name: str = "",
) -> str:
    """
    Generic free-form agricultural RAG endpoint.
    """

    search_prompt = (
        f"{crop_name} {user_query} "
        f"agriculture farming solution"
    ).strip()

    sources = search_web(
        search_prompt
    )

    retrieved_context = (
        "\n".join(
            [
                f"- {s['content']}"
                for s in sources
            ]
        )
        or
        "No extra information found."
    )

    prompt = f"""
You are an expert agricultural AI assistant.

User Query:
{user_query}

Crop/Context:
{crop_name}

Retrieved agricultural information:
{retrieved_context}

Provide a concise, practical and helpful answer
for a farmer.
"""

    try:
        response = (
            client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
            )
        )

        return (
            response.text
            or
            "No response generated."
        )

    except Exception as e:
        print(
            f"get_rag_response Gemini error: {e}"
        )

        return (
            "Sorry, I couldn't generate "
            "a response right now."
        )


# ============================================================
# DISEASE INTELLIGENCE
# ============================================================

def get_disease_advice(
    crop: str,
    disease: str,
    confidence: float,
    weather_context: str | None = None,
    language: str = "en",
) -> dict:
    """
    Farmer-facing Disease Intelligence.

    Returns:
    - why_this_happening
    - what_to_do_now
    - treatment
    - weather_warning
    - sources
    """

    language = _normalize_language(
        language
    )

    language_name = (
        LANGUAGE_NAMES[language]
    )

    crop_readable = (
        _readable(crop)
    )

    disease_readable = (
        _readable(disease)
    )

    # ========================================================
    # SOURCE RETRIEVAL
    # ========================================================

    try:
        search_query = (
            f"{crop_readable} crop "
            f"{disease_readable} "
            f"disease symptoms treatment "
            f"management agriculture India"
        )

        sources = search_web(
            search_query,
            max_results=3,
        )

    except Exception as e:
        print(
            "Unexpected error "
            f"searching sources: {e}"
        )

        sources = []

    context_text = (
        "\n\n".join(
            [
                f"Source: {s['title']}\n"
                f"{s['content']}"
                for s in sources
            ]
        )
        or
        "No additional web context retrieved."
    )

    # ========================================================
    # WEATHER CONTEXT
    # ========================================================

    if weather_context:
        weather_clause = f"""
Current live weather at the farmer's location:
{weather_context}

If these weather conditions affect disease risk,
spraying, irrigation or treatment timing,
include ONE short weather_warning.

Otherwise weather_warning must be null.
"""

    else:
        weather_clause = """
No live weather information is currently available.
Set weather_warning to null.
"""

    # ========================================================
    # GEMINI PROMPT
    # ========================================================

    prompt = f"""
You are FarmSight, an agricultural decision-support
assistant speaking DIRECTLY to a farmer.

Crop:
{crop_readable}

Detected crop condition:
{disease_readable}

AI model confidence:
{confidence}%

IMPORTANT LANGUAGE RULE:

The farmer selected {language_name}.

ALL farmer-facing text values in your JSON response
MUST be written in {language_name}.

Do NOT translate JSON property names.

JSON keys MUST remain exactly:

why_this_happening
what_to_do_now
treatment
weather_warning

Only the VALUES must be written in {language_name}.

{weather_clause}

Reference agricultural information:

{context_text}

Return ONLY valid JSON in this exact shape:

{{
  "why_this_happening": [
    "reason 1",
    "reason 2"
  ],
  "what_to_do_now": [
    "action 1",
    "action 2",
    "action 3"
  ],
  "treatment": [
    "treatment 1",
    "treatment 2"
  ],
  "weather_warning": "short warning or null"
}}

Rules:

- Use simple farmer-friendly {language_name}.
- No long paragraphs.
- Maximum 3 items per list.
- Each item should be one short sentence.
- Avoid technical jargon whenever possible.
- Give practical field actions.
- Organic or low-risk action should be suggested first when appropriate.
- Do not prescribe dangerous or unsupported chemical dosages.
- Do not invent weather information.
- Do not invent web sources.
- Do not repeat the crop or disease name in every bullet.
"""

    generation_config = (
    types.GenerateContentConfig(
        response_mime_type="application/json",
        max_output_tokens=2048,
        thinking_config=types.ThinkingConfig(
            thinking_level="minimal"
        ),
    )
)
    raw_text = ""

    # ========================================================
    # GEMINI GENERATION
    # ========================================================

    try:
        response = (
            client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
                config=generation_config,
            )
        )

        raw_text = (
            response.text
            or
            ""
        ).strip()

        # Optional debug info
        try:
            finish_reason = (
                response
                .candidates[0]
                .finish_reason
            )

            if str(
                finish_reason
            ) not in (
                "STOP",
                "FinishReason.STOP",
                "1",
            ):
                print(
                    "Gemini finish_reason: "
                    f"{finish_reason}"
                )

        except Exception:
            pass

        # ====================================================
        # PARSE JSON
        # ====================================================

        try:
            parsed = json.loads(
                raw_text
            )

        except json.JSONDecodeError:
            # Extra defensive parsing
            match = re.search(
                r"\{.*\}",
                raw_text,
                re.DOTALL,
            )

            if not match:
                raise

            parsed = json.loads(
                match.group(0)
            )

        # ====================================================
        # VALIDATE IMPORTANT FIELD
        # ====================================================

        if not parsed.get(
            "what_to_do_now"
        ):
            print(
                "Gemini response missing "
                "what_to_do_now — "
                "using fallback"
            )

            return _static_fallback(
                crop_readable,
                disease_readable,
                sources,
                language,
            )

        # ====================================================
        # RETURN FINAL STRUCTURED RESPONSE
        # ====================================================

        return {
            "why_this_happening":
                parsed.get(
                    "why_this_happening",
                    [],
                )[:3],

            "what_to_do_now":
                parsed.get(
                    "what_to_do_now",
                    [],
                )[:3],

            "treatment":
                parsed.get(
                    "treatment",
                    [],
                )[:3],

            "weather_warning":
                parsed.get(
                    "weather_warning"
                )
                or
                None,

            "sources": [
                {
                    "title": s["title"],
                    "url": s["url"],
                }
                for s in sources
            ],
        }

    except Exception as e:
        print(
            "Gemini call failed, "
            f"using static fallback: {e}"
        )

        return _static_fallback(
            crop_readable,
            disease_readable,
            sources,
            language,
        )