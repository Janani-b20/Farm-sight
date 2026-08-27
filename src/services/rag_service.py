"""Optional Tavily and Gemini-backed crop disease analysis."""

import os
from typing import Any

import httpx


async def analyze_symptoms(crop: str, symptoms: str, location: str = "") -> dict[str, Any]:
    """Return an evidence-aware analysis, with a useful local fallback."""
    if not os.getenv("TAVILY_API_KEY") or not os.getenv("GEMINI_API_KEY"):
        return fallback_analysis(crop, symptoms)

    async with httpx.AsyncClient(timeout=20) as client:
        search = await client.post(
            "https://api.tavily.com/search",
            json={"api_key": os.environ["TAVILY_API_KEY"], "query": f"{crop} disease {symptoms} {location}", "max_results": 3},
        )
        search.raise_for_status()
        sources = search.json().get("results", [])
        context = "\n".join(f"{item.get('title')}: {item.get('content')}" for item in sources)
        prompt = (
            f"Analyze these {crop} symptoms: {symptoms}. Use this research:\n{context}\n"
            "Return concise JSON with diagnosis, confidence, and recommendation. State that a local agronomist should confirm."
        )
        gemini = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={os.environ['GEMINI_API_KEY']}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
        gemini.raise_for_status()
        text = gemini.json()["candidates"][0]["content"]["parts"][0]["text"]
    return {"diagnosis": text, "confidence": "research-assisted", "recommendation": "Confirm the diagnosis with a local agronomist before treatment.", "sources": [item.get("title", "Source") for item in sources]}


def fallback_analysis(crop: str, symptoms: str) -> dict[str, Any]:
    return {
        "diagnosis": f"Symptoms recorded for {crop}",
        "confidence": "screening only",
        "recommendation": f"Isolate affected plants, photograph the symptoms, and consult an agronomist. Notes: {symptoms}",
        "sources": [],
    }"""Optional Tavily retrieval and Gemini synthesis for crop disease questions."""

import os

import httpx


async def analyze_disease(crop: str, symptoms: str) -> dict:
    """Retrieve current agricultural sources and summarize them when configured."""
    tavily_key = os.getenv("TAVILY_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    query = f"{crop} crop disease symptoms: {symptoms}"
    if not tavily_key:
        return {"answer": "Add TAVILY_API_KEY to enable source-backed disease analysis.", "sources": []}

    async with httpx.AsyncClient(timeout=20) as client:
        search = await client.post(
            "https://api.tavily.com/search",
            json={"api_key": tavily_key, "query": query, "search_depth": "advanced", "max_results": 5},
        )
        search.raise_for_status()
        results = search.json().get("results", [])

    sources = [{"title": item.get("title", "Source"), "url": item.get("url", "")} for item in results]
    if not gemini_key:
        return {"answer": "Sources found. Add GEMINI_API_KEY to generate a summary.", "sources": sources}

    context = "\n".join(f"{item.get('title')}: {item.get('content', '')}" for item in results)
    prompt = f"Give cautious, concise crop disease guidance for {crop}. Symptoms: {symptoms}. Sources:\n{context}"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            params={"key": gemini_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
        response.raise_for_status()
        answer = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    return {"answer": answer, "sources": sources}