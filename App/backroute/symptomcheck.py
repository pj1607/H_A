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
api_key = os.getenv("GEMINI_API_KEY")  
genai.configure(api_key=api_key)

def ask_gpt(question: str, role_prompt: str = "You are a rural health advisor. Give safe, simple advice in English only.") -> str:
    model = genai.GenerativeModel('models/gemini-1.5-flash')
    prompt = f"{role_prompt}\nQ: {question}"
    response = model.generate_content([prompt])
    return response.text

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

def safe_gpt(prompt: str, role_prompt: str = "") -> str:
    try:
        if not prompt.strip():
            return "⚠️ Empty prompt given."
        response = ask_gpt(prompt, role_prompt).strip()
        return response if response else "⚠️ No response received."
    except Exception as e:
        return f"⚠️ GPT error: {str(e)}"



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

    @router.post("/symptom-check")
    async def symptom_check(query: str = Form(...)):
        print("query",query)
        rewritten = safe_gpt(
            f"Extract a clean clinical keyword from this user message: {query}",
            role_prompt="You're a clinical parser. Return a single-word or short medical phrase like 'cough', 'fever', 'leg pain'. Only output the keyword — no full sentences."
        )
        print("Rewritten keyword for UMLS search:", rewritten)
        res = search_symptom(rewritten)
        explanation = ""
        specialist = "general physician"
        follow_up = ""
        final = False

        if res and res[0]["name"]:
            top = res[0]["name"]
            specialist = map_condition_to_specialist(top) or fallback_map_condition_to_specialist(top)

            severity = safe_gpt(
                f"Is '{top}' serious (yes/no)?",
                role_prompt="You are a medical assistant. Just answer yes or no."
            ).lower()

            explanation = safe_gpt(
                f"Explain '{top}' in 2 lines",
                role_prompt="Friendly explanation in 2 lines. Avoid medical jargon."
            )

            answer = safe_gpt(
                explanation + f"\nUser is feeling: {rewritten}",
                role_prompt=CONVERSATIONAL_WRAPPER_PROMPT
            )

            red_flag_addon = apply_red_flag_advice(query)
            if red_flag_addon:
                answer += "\n" + red_flag_addon
            

            if severity == "no":
                remedy = safe_gpt(
                    f"Suggest 1-line home remedy for '{top}'",
                    role_prompt="Friendly, warm tone. No complex terms."
                )
                explanation += f"\n💡 Remedy: {remedy}"
                answer=safe_gpt(
                    explanation,
                    role_prompt=CONVERSATIONAL_WRAPPER_PROMPT
                )
                
            else:
                follow_up = safe_gpt(
                    f"You are a rural doctor. Ask a gentle, non-repeating follow-up for symptom: {rewritten}. Prioritize duration, severity, or triggers.",
                    role_prompt="Polite follow-up question only. 1 line. Avoid repeating previous ones."
                )
        else:
            explanation = safe_gpt(
                f"User said: '{query}'. Clarify or ask follow-up.",
                role_prompt="If unclear, ask 1-line follow-up. If clear, give short advice."
            )
            answer = safe_gpt(
                explanation,
                role_prompt=CONVERSATIONAL_WRAPPER_PROMPT
            )
            follow_up = safe_gpt(
                f"Ask a soft, helpful follow-up for: {rewritten}",
                role_prompt="1 short follow-up question. No jargon."
            )
            specialist = fallback_map_condition_to_specialist(query)

        if not follow_up:
            follow_up = "Can you tell me how long this has been happening?"

        return {
            "answer": answer,
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
        no_response_count = sum(
            1 for msg in conversation if msg["role"] == "user"
            and msg["message"].strip().lower() in ["no", "nothing", "idk", "fine", "na", "nah"]
        )

        full = "\n".join(
            f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['message']}"
            for msg in conversation
        )

        known_symptoms = extract_symptoms(conversation)
        last_question = extract_next_question(full)
        latest_input = conversation[-1]["message"].strip().lower()

        follow_up = ""
        final = False
        answer = ""
        doctors = []

        answer = safe_gpt(
        full + "\nGive clear and useful health advice based on the above conversation in 1–2 lines. Do NOT include any questions, bookings, or suggestions like 'see me soon'. Be kind but stay factual.",
        role_prompt="You're a neutral, responsible doctor. Give concise advice. Do NOT offer to book or meet. Avoid saying things like 'I'll see you soon' or 'I'll book you'. Stay grounded and realistic."
)

        answer = safe_gpt(answer, role_prompt=CONVERSATIONAL_WRAPPER_PROMPT)

        if is_duplicate(conversation, answer):
            answer = "Thanks for the update. Be sure to keep resting and staying hydrated — your body needs it."

        specialist = safe_gpt(
            full + "\nSuggest specialist.",
            role_prompt="Return only 1 word like 'cardiologist', 'ENT', 'therapist', etc."
        ).strip().lower()

        if specialist not in [
            "cardiologist", "dermatologist", "neurologist", "orthopedist", "pulmonologist",
            "endocrinologist", "therapist", "general physician", "ent"
        ]:
            specialist = fallback_map_condition_to_specialist(full)

        
        red_flag_note = ""
        for symptom, note in RED_FLAG_SYMPTOMS.items():
            if symptom in latest_input:
               red_flag_note = note
               break
        if red_flag_note:
            answer += "\n" + red_flag_note
            
            if (  emergency_asked and latest_input in ["yes", "yeah", "ok", "okay", "sure", "please", "yess"]):
                summary = safe_gpt(
                    full +  "\nSummarize the issue urgently in 2 lines:",
                    role_prompt="You are a doctor responding to a possible emergency. Summarize the key issue briefly and explain what should be done immediately. Do NOT suggest waiting. Be clear, kind, and take the issue seriously."
                )
                
                answer =summary
                final = True

                doctors = await get_doctors_by_specialist(specialist)
                return {
                    "answer": answer,
                    "follow_up_question": None,
                    "final": final,
                    "specialist": specialist,
                     "doctors": doctors,
                     "emergency_asked": False
                }
            elif emergency_asked and latest_input in ["no", "nah", "not now"]:
                return {
                 "answer": "Okay, no pressure. But if symptoms get worse, please seek medical help.",
                 "follow_up_question": None,
                  "final": True,
                 "specialist": specialist,
                 "emergency_asked": False
          }
            elif not emergency_asked:
                follow_up = "Is it urgent? Can I suggest a doctor now?"
                emergency_asked = True
                return {
                    "answer": answer,
                    "follow_up_question": follow_up,
                    "final": False,
                    "specialist": specialist,
                    "emergency_asked": True
                }

        if no_response_count >= 2 or symptom_question_count >= 3:
            if "remedy" in latest_input or "home remedy" in latest_input:
                answer = safe_gpt(
                    full + "\nGive 1 best home remedy for the symptoms above.",
                    role_prompt="You're a caring doctor. Suggest only 1 simple home remedy clearly."
                )
                final = True
            elif "doctor" in latest_input or "specialist" in latest_input:
                doctors = await get_doctors_by_specialist(specialist)
                answer = f"Here are some {specialist.title()}s near you:\n" + "\n".join(
                    [f"- Dr. {doc['name']} ({doc['location']})" for doc in doctors]
                )
                final = True
            else:
                follow_up = "Would you like a specialist or a home remedy suggestion?"

            if answer.strip() == "":
                if "remedy" in latest_input:
                    answer = "Try sipping warm water with a pinch of turmeric – it might help ease things naturally."
                    final=True
                elif "doctor" in latest_input or "specialist" in latest_input:
                    answer = f"You can consult a {specialist} for a more thorough checkup."
                    final = True
                else:
                    answer = "Thanks for sharing. Let me know if you'd like to talk to a doctor or get a remedy."

            if not follow_up and not final:
                follow_up = "Is there anything else you'd like to tell me about how you're feeling?"

            return {
                "answer": answer,
                "follow_up_question": follow_up,
                "final": final,
                "specialist": specialist,
                "doctors": doctors
            }

        if not follow_up and not final:
            if symptom_question_count < 4:
                follow_up = safe_gpt(
                    f"""
Conversation so far:
{full}

Known symptoms: {', '.join(known_symptoms)}
Last assistant question: "{last_question}"
Latest user input: "{conversation[-1]['message']}"

👉 Ask a *new* follow-up question to clarify:
- Duration
- Type (dry, sharp, dull, etc.)
- Trigger (cold, light, stress, etc.)
- Red flags (pain, blood, fever, etc.)
""",
                    role_prompt="You're a kind doctor. Don't repeat. Ask a single, helpful question to get more detail."
                )
            else:
                follow_up = "Would you like me to suggest a specialist or share a home remedy?"

        if not answer:
            answer = "Thanks for sharing. Let me know if you'd like to talk to a doctor or get a remedy."

        if not follow_up and not final:
            follow_up = "Is there anything else you'd like to tell me about how you're feeling?"

        return {
            "answer": answer,
            "follow_up_question": follow_up,
            "final": final,
            "specialist": specialist
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