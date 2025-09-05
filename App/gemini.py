import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")  
genai.configure(api_key=api_key)


def test_gemini_key():
    try:
        

        model = genai.GenerativeModel("models/gemini-1.5-flash")
        response = model.generate_content("Tell me a fun fact about space.")

        print("✅ Gemini API Key is working!")
        print("🔍 Response:", response.text)

    except Exception as e:
        print("❌ Gemini API Key is NOT working.")
        print("Error:", str(e))

if __name__ == "__main__":
    test_gemini_key()