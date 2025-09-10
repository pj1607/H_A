import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()


API_KEYS = [
   os.getenv("GEMINI_API_KEY1"),
    os.getenv("GEMINI_API_KEY2"),
    os.getenv("GEMINI_API_KEY3"),
    os.getenv("GEMINI_API_KEY4"),
    os.getenv("GEMINI_API_KEY5"),
]
current_index = 0

def configure_genai():
    """Set the current API key for genai."""
    global current_index
    genai.configure(api_key=API_KEYS[current_index])

def safe_gpt(prompt: str, role_prompt: str = "") -> str:
    """
    Call Gemini safely using multiple API keys with rotation if quota exceeded.
    """
    global current_index
    if not prompt.strip():
        return "⚠️ Empty prompt given."

    full_prompt = f"{role_prompt}\nQ: {prompt}"
    attempts = 0

    while attempts < len(API_KEYS):
        try:
            configure_genai()
            model = genai.GenerativeModel("models/gemini-1.5-flash")
            response = model.generate_content([full_prompt])
            return response.text.strip()
        except Exception as e:
            if "quota exceeded" in str(e).lower() or "limit" in str(e).lower():
                current_index = (current_index + 1) % len(API_KEYS)
                attempts += 1
            else:
                return f"⚠️ GPT error: {str(e)}"
    
    return "⚠️ All API keys have reached their limits."


def test_gemini_key():
    prompt = "Tell me a fun fact about space."
    try:
        result = safe_gpt(prompt)
        print("✅ Gemini API Key is working!")
        print("🔍 Response:", result)
    except Exception as e:
        print("❌ Gemini API Key is NOT working.")
        print("Error:", str(e))


if __name__ == "__main__":
    test_gemini_key()
