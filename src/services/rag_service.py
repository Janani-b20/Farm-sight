import os
import requests
import google.generativeai as genai

# API Keys setup
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "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")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6LEBMsmQYftllkNPh0DQIakIsP_gp_HIwC3ML0TO9gv8A")

genai.configure(api_key=GEMINI_API_KEY)

def search_web(query: str) -> str:
    """Tavily API மூலம் இணையத்தில் விவசாயத் தகவல்களைத் தேடுதல்"""
    try:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "max_results": 3
        }
        response = requests.post(url, json=payload, timeout=10)
        data = response.json()
        
        results = data.get("results", [])
        context = "\n".join([f"- {item['content']}" for item in results])
        return context if context else "No extra information found."
    except Exception as e:
        print(f"Tavily Search Error: {e}")
        return ""

def get_rag_response(user_query: str, crop_name: str = "") -> str:
    """RAG முறையில் Tavily + Gemini இணைத்து பதில் பெறுதல்"""
    search_prompt = f"{crop_name} {user_query} agriculture farming solution".strip()
    retrieved_context = search_web(search_prompt)

    prompt = f"""
    You are an expert agricultural AI assistant.
    
    User Query: {user_query}
    Crop/Context: {crop_name}
    
    Real-time Information Retrieved from Web:
    {retrieved_context}
    
    Please provide a concise, practical, and helpful answer for the farmer based on the retrieved information and your knowledge.
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating response: {str(e)}"