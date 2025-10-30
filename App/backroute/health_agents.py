from fastapi import APIRouter
from utils.symptom_checker import get_health_summary_from_symptoms
from utils.report_tools import compare_reports, get_latest_reports
from utils.doctor_available import check_doctor_availability,get_all_specializations,extract_doctor_name
from datetime import datetime 
from langchain.tools import tool
from pymongo.collection import Collection
import google.generativeai as genai
from dateparser import parse
from dateparser.search import search_dates
from dotenv import load_dotenv
import os
report_collection = None  # For full_conversation
med_collection = None  
doctor_collection=None
appointment_collection=None

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
    global current_index
    if not prompt.strip():
        return "⚠️ Empty prompt given."
    
    full_prompt = f"{role_prompt}\nQ: {prompt}"
    attempts = 0

    while attempts < len(API_KEYS):
        try:
            configure_genai()
            model = genai.GenerativeModel("models/gemini-2.5-flash")
            response = model.generate_content([full_prompt])
            return response.text.strip()
        except Exception as e:
            if "quota exceeded" in str(e).lower() or "limit" in str(e).lower():
                current_index = (current_index + 1) % len(API_KEYS)
                attempts += 1
            else:
                return f"⚠️ GPT error: {str(e)}"
    
    return "⚠️ All API keys have reached their limits."

role_prompt = """
You are a compassionate and knowledgeable doctor. 
Write a short health summary based on the user's symptom history and medical reports.

- Keep it short and simple (4-5 lines)
- Use friendly tone, but avoid false reassurance
- Give useful advice if needed (no prescriptions)
- Avoid medical jargon
"""

role_prompt1= """
You are a diagnostic expert. 
Compare the last two lab reports of a patient and explain what changed.

- Use simple, clear language
- Highlight what improved or worsened
- Avoid scary or overly technical words
- End with one-line advice or observation
"""

# def safe_gpt(question: str, role_prompt: str = "you are a rural health advisor...") -> str:
#     model = genai.GenerativeModel('models/gemini-2.5-flash')
#     prompt = f"{role_prompt}\nQ: {question}"
#     response = model.generate_content([prompt])
#     return response.text


def init_collections(report_col, med_col,doc_col,appoint_col):
    global report_collection, med_collection,doctor_collection,appointment_collection
    report_collection = report_col
    med_collection = med_col
    doctor_collection=doc_col
    appointment_collection=appoint_col

router = APIRouter()
@tool
def health_summary(phone:str)->str:
    """Generate a health summary by combining recent and old compressed notes."""
    print(" health_summary tool called")
    print(f"[TOOL CALLED]  phone = {phone}")
    recent, old_summary = get_health_summary_from_symptoms(phone, report_collection,limit=3)
    reports = get_latest_reports(phone, limit=3, med_collection=med_collection)
    prompt = f"""
You are a doctor. Based on the user's old summary and recent conversation, write a short and simple health summary.
 Previous health summary:
{old_summary}
 Recent conversation (last few lines):
{recent}

Reports:
{reports}
Instructions:
- Use simple, short language (2-3 lines)
- Be friendly, clear, and non-alarming
- Mention if there is improvement or concern
- End with one actionable advice (no prescription)

Only reply with the summary.
"""
    print("[TOOL INPUT]:", prompt)
    result = safe_gpt(prompt, role_prompt=role_prompt)
    print("[TOOL OUTPUT]:", result)
    return result

@tool 
def report_diff(phone: str) -> str:
    """Compare recent medical reports and summarize differences."""
    reports = get_latest_reports(phone, limit=2, med_collection=med_collection)
    if(len(reports)<2):
        return {"error": "Not enough reports to compare."}
    comparison_result = compare_reports(reports[-2]["summary"], reports[-1]["summary"])
    prompt = f"""
Analyze this lab report comparison and explain clearly what changed and what it might indicate medically:

- Use simple, short language (4-5 lines)
- Be friendly, clear, and non-alarming
- Mention if there is improvement or concern
- End with one actionable advice (no prescription)
Use simple language. Be clear 
Textual Comparison:
{comparison_result}


Instructions:but not alarming. Offer gentle advice if needed.
"""
    explanation = safe_gpt(prompt, role_prompt=role_prompt1)
    return explanation

@tool(return_direct=True)
def doctor_availability_tool(query: str) -> str:
    """
    Check doctor availability using natural language query.
    Example queries:
    - "Doctor Tanu cardiologist in Delhi on 2025-06-30"
    - "Is Dr. Ramesh available tomorrow in Mumbai?"
    - "Any neurologist available in Jaipur?"
    """
    import re
    date = ""
    city = ""
    name = ""
    specialization = ""
    print(" Searching for date...")
    parsed_dates = search_dates(query, settings={"PREFER_DATES_FROM": "future"}) #Ye ek NLP-based date parser hota hai 
    #Output ho sakta hai:
    #[("next Tuesday", datetime.datetime(2025, 7, 8, 0, 0)), 
    #("25 July", datetime.datetime(2025, 7, 25, 0, 0))]
    if parsed_dates:
        for text, dt in parsed_dates:
            if dt:
                date = dt.date().isoformat()
                print(f"✅ Found date from '{text}' -> {date}")
                break
    
    city_match = re.search(r"in\s+([A-Za-z\s]+)", query)
    if city_match:
        city = city_match.group(1).strip() #city ko nikal lo regular expression me se

    name = extract_doctor_name(query, doctor_collection)

    specializations = get_all_specializations(doctor_collection)
    for spec in specializations:
        if spec.lower() in query.lower():
            specialization = spec
            break

    return check_doctor_availability(name=name,specialization=specialization, date=date, city=city,doctor_collection=doctor_collection,appointment_collection=appointment_collection)

