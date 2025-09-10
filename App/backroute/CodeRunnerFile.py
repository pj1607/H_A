from fastapi import APIRouter,Form
import google.generativeai as genai
from fastapi.responses import JSONResponse
import re
import logging
from pymongo import ASCENDING
from pymongo.collection import Collection

from dotenv import load_dotenv
import os

from models.umlsclient import search_symptom, get_related_cuis, map_condition_to_specialist,fallback_map_condition_to_specialist
router = APIRouter()
logger = logging.getLogger(__name__)

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
def safe_gpt(prompt: str, role_prompt: str = "You are a rural health advisor. Give safe, simple advice in English only.") -> str:
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



# def safe_gpt(question: str, role_prompt: str = "You are a rural health advisor. Give safe, simple advice in English only.") -> str:
#     model = genai.GenerativeModel('models/gemini-1.5-flash')
#     prompt = f"{role_prompt}\nQ: {question}"
#     response = model.generate_content([prompt])
#     return response.text

RED_FLAG_SYMPTOMS = {
    "chest pain": "⚠️ Chest pain can be serious. Please consult a doctor immediately.",
    "loss of smell": "👃 Loss of smell might mean a sinus issue or post-viral symptom. Keep monitoring.",
    "smell": "👃 Smell issues often point to congestion or sinus problems.",
    "dizziness": "⚠️ Dizziness may be a sign of dehydration or something more serious. Please rest and monitor.",
    "shortness of breath": "⚠️ Trouble breathing could be a sign of something serious. See a doctor if it continues.",
    "numbness": "⚠️ Numbness can be a nerve issue. Please get checked if it continues.",
    "severe headache": "⚠️ Severe headaches that don’t go away might need medical attention.",
    "vomiting": "⚠️ Persistent vomiting can lead to dehydration. Keep fluids up, and see a doctor if it doesn’t improve."
}


CONVERSATIONAL_WRAPPER_PROMPT = (
    "You are a friendly, non-robotic health assistant. "
    "Rephrase the following response so it sounds like you're talking to a real person. "
    "Use short, kind sentences. Be warm, supportive, and avoid sounding like a report. "
    "Avoid medical terms unless necessary. Example: Instead of 'dyspnea', say 'trouble breathing'. "
    "Keep it short — no more than 2 lines. Be warm, but don’t over-explain."
)
VALID_SPECIALISTS = [
    "cardiologist",
    "dermatologist",
    "neurologist",
    "orthopedist",
    "pulmonologist",
    "endocrinologist",
    "therapist",
    "general physician",
    "ent",
    "gastroenterologist",
    "psychiatrist",
    "urologist",
    "gynecologist",
    "oncologist"
]

# def safe_gpt(prompt: str, role_prompt: str = "") -> str:
#     try:
#         if not prompt.strip():
#             return "⚠️ Empty prompt given."
#         response = safe_gpt(prompt, role_prompt).strip()
#         return response if response else "⚠️ No response received."
#     except Exception as e:
#         return f"⚠️ GPT error: {str(e)}"



def extract_symptoms(conversation):
    keywords = []
    for msg in conversation:
        if msg["role"] == "user":
            keyword = safe_gpt(
                f"Extract symptom keyword from: {msg['message']}",
                role_prompt="Give 1-word symptom like 'fever', 'pain', 'cough'. No full sentence."
            )
            if keyword and keyword.lower() not in keywords:
                keywords.append(keyword.lower())
    return keywords

def extract_next_question(full_convo):
    # Naively extract last assistant question
    lines = full_convo.strip().split("\n")
    for line in reversed(lines):
        if line.startswith("Assistant:") and line.endswith("?"):
            return line.replace("Assistant:", "").strip()
    return ""


def is_duplicate(conversation, message):
    recent = [m["message"].lower().strip() for m in conversation[-4:] if m["role"] == "assistant"]
    return message.lower().strip() in recent


def apply_red_flag_advice(text: str) -> str:
    lower = text.lower()
    messages = []
    for symptom, message in RED_FLAG_SYMPTOMS.items():
        if re.search(rf'\b{re.escape(symptom)}\b', lower):
            messages.append(message)
    return "\n".join(messages)


def create_router(doctor_collection: Collection):
    router = APIRouter()

    async def get_doctors_by_specialist(specialist: str):
        cursor = doctor_collection.find({"specialist": specialist})
        return cursor.to_list(length=5)
    router.get_doctors_by_specialist = get_doctors_by_specialist

@router.post("/symptom-check")
async def symptom_check(query: str = Form(...)):
    print("query", query)

    # --- Extract keyword locally or with a single GPT call ---
    rewritten = safe_gpt(
        f"Extract a single-word or short medical phrase from: '{query}'. Only output the keyword.",
        role_prompt="Clinical parser. No full sentences, just keyword."
    )
    print("Rewritten keyword for UMLS search:", rewritten)

    # --- Lookup UMLS ---
    res = search_symptom(rewritten)
    top_condition = res[0]["name"] if res and res[0].get("name") else None
    specialist = map_condition_to_specialist(top_condition) or fallback_map_condition_to_specialist(top_condition) if top_condition else fallback_map_condition_to_specialist(query)
    final = False

    # --- Prepare combined GPT prompt ---
    gpt_prompt = f"""
User said: "{query}"
Clinical keyword: "{rewritten}"
Top condition: "{top_condition or 'unknown'}"

Task:
1. Explain the condition in 2 lines (avoid jargon).
2. Suggest 1-line home remedy if not serious.
3. Ask 1 polite, non-repeating follow-up question if serious.
4. Be warm, short, and friendly like a rural health advisor.
"""
    gpt_response = safe_gpt(gpt_prompt, role_prompt=CONVERSATIONAL_WRAPPER_PROMPT)

    # --- Apply red-flag notes locally ---
    red_flag_addon = apply_red_flag_advice(query)
    if red_flag_addon:
        gpt_response += "\n" + red_flag_addon

    # --- Determine follow-up ---
    follow_up = ""
    if top_condition:
        severity = safe_gpt(
            f"Is '{top_condition}' serious (yes/no)?",
            role_prompt="Just answer yes or no."
        ).lower()
        if severity == "yes":
            follow_up = safe_gpt(
                f"You are a rural doctor. Ask 1 gentle follow-up about symptom '{rewritten}' (duration, severity, triggers).",
                role_prompt="Polite, 1 line, non-repeating."
            )
        else:
            # if not serious, follow-up optional
            follow_up = ""
    else:
        follow_up = safe_gpt(
            f"Ask a short follow-up for: '{rewritten}'",
            role_prompt="1 short follow-up question, no jargon."
        )

    if not follow_up:
        follow_up = "Can you tell me how long this has been happening?"

    return {
        "answer": gpt_response,
        "follow_up_question": follow_up,
        "final": final,
        "specialist": specialist
    }


@router.post("/follow-up")
async def follow_up_loop(payload: dict):
    conversation = payload["conversation"]
    symptom_question_count = payload.get("count", 1)
    emergency_asked = payload.get("emergency_asked", False)
    user_id = payload.get("user_id")

    latest_input = conversation[-1]["message"].strip().lower()
    full_convo = "\n".join(
        f"{'User' if m['role']=='user' else 'Assistant'}: {m['message']}" for m in conversation
    )
    known_symptoms = extract_symptoms(conversation)
    last_question = extract_next_question(full_convo)

    # Count unhelpful/no-response user messages
    no_response_count = sum(
        1 for m in conversation if m["role"] == "user" and m["message"].strip().lower() in ["no","nothing","idk","fine","na","nah"]
    )

    # --- COMBINED GPT PROMPT ---
    gpt_prompt = f"""
Conversation:
{full_convo}

Known symptoms: {', '.join(known_symptoms)}
Last assistant question: "{last_question}"
Latest user input: "{latest_input}"

Task:
1. Give clear, concise health advice (1-2 lines) without bookings or questions.
2. Suggest one short follow-up question if more info needed.
3. Suggest a specialist (one word like cardiologist, ENT, therapist, etc.) 
4. Suggest one simple home remedy if appropriate.
5. Summarize urgent issues if red-flag symptoms detected.
Return as JSON with keys: answer, follow_up, specialist, remedy, urgent_summary
"""
    gpt_response = safe_gpt(gpt_prompt, role_prompt="Friendly rural health assistant, JSON only")

    # --- Parse GPT response safely ---
    import json
    try:
        data = json.loads(gpt_response)
    except:
        data = {
            "answer": "Thanks for sharing. Let me know if you'd like a specialist or a home remedy.",
            "follow_up": "Can you tell me more about your symptoms?",
            "specialist": "general physician",
            "remedy": "",
            "urgent_summary": ""
        }

    # Apply red-flag notes locally
    red_flag_note = apply_red_flag_advice(latest_input)
    if red_flag_note:
        data["answer"] += "\n" + red_flag_note

    # Add remedy if not urgent
    if data.get("remedy") and not data.get("urgent_summary"):
        data["answer"] += f"\n💡 Remedy: {data['remedy']}"

    # Handle urgent summary
    final = False
    if data.get("urgent_summary"):
        data["answer"] = data["urgent_summary"]
        final = True
        # Optionally fetch doctors if needed
    doctors = await router.get_doctors_by_specialist(data["specialist"])

    return {
            "answer": data["answer"],
            "follow_up_question": None,
            "final": final,
            "specialist": data["specialist"],
            "doctors": doctors,
            "emergency_asked": False
        }

    # Handle no-response / repeated messages
    if is_duplicate(conversation, data["answer"]):
        data["answer"] = "Thanks for the update. Be sure to keep resting and staying hydrated — your body needs it."

    # Logic for suggesting specialist or remedy
    if (no_response_count >= 2 or symptom_question_count >= 3) and not final:
        if "remedy" in latest_input:
            final = True
        elif "doctor" in latest_input or "specialist" in latest_input:
            final = True
            doctors = await get_doctors_by_specialist(data["specialist"])
            data["answer"] = f"Here are some {data['specialist'].title()}s near you:\n" + "\n".join(
                [f"- Dr. {doc['name']} ({doc['location']})" for doc in doctors]
            )
        else:
            data["follow_up"] = "Would you like a specialist or a home remedy suggestion?"

    # Default follow-up if not final
    if not data.get("follow_up") and not final:
        if symptom_question_count < 4:
            data["follow_up"] = "Can you tell me more details about duration, severity, or triggers?"
        else:
            data["follow_up"] = "Would you like me to suggest a specialist or share a home remedy?"

    return {
        "answer": data["answer"],
        "follow_up_question": data["follow_up"],
        "final": final,
        "specialist": data["specialist"]
    }

    return router

def extract_next_question(text: str) -> str:
    """
    Extracts the last question from the given text.
    Returns an empty string if no question found.
    """
    # Find all sentences ending with ?
    questions = re.findall(r"[^.?!]*\?", text)
    return questions[-1].strip() if questions else ""