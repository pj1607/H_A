from langgraph.graph import StateGraph, END
from typing import TypedDict
import google.generativeai as genai
import re
from fastapi import APIRouter, Form
from models.umlsclient import (
    search_symptom,
    map_condition_to_specialist,
    fallback_map_condition_to_specialist
)
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")  
genai.configure(api_key=API_KEY)

def ask_gpt(question: str, role_prompt: str = "You are a rural health advisor. Give safe, simple advice in English only.") -> str:
    model = genai.GenerativeModel('models/gemini-1.5-flash')
    prompt = f"{role_prompt}\nQ: {question}"
    response = model.generate_content([prompt])
    return response.text

def safe_gpt(prompt: str, role_prompt: str = "") -> str:
    try:
        if not prompt.strip():
            return "⚠️ Empty prompt given."
        response = ask_gpt(prompt, role_prompt).strip()
        return response if response else "⚠️ No response received."
    except Exception as e:
        return f"⚠️ GPT error: {str(e)}"
    
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

class SymptomState(TypedDict):
    user_input:str
    symptom:str
    condition_name: str
    specialist:str
    red_flags:str
    advice:str
    follow_up:str
    emergency:bool

#__nodes__
def extract_symptom_node(state: SymptomState) -> SymptomState:
    state["symptom"]=safe_gpt( f"Extract a clinical keyword from this: {state['user_input']}",
        role_prompt="Return a short keyword like 'fever', 'pain', 'cough'.").lower()
    return state

def search_condition_node(state: SymptomState) -> SymptomState:
    re=search_symptom(state["symptom"])
    if re and re[0].get("name"):
        state["condition_name"]=re[0]["name"]
    else:
        state["condition_name"]=state["symptom"]
    return state

def specialist_mapping_node(state: SymptomState) -> SymptomState:
    condition=state["condition_name"]
    state["specialist"]=(map_condition_to_specialist(condition) or fallback_map_condition_to_specialist(condition) or "general physician")
    return state

def red_flag_node(state: SymptomState) -> SymptomState:
    found=[]
    for symptom,msg in RED_FLAG_SYMPTOMS.items():
        if symptom in state["condition_name"].lower():
            found.append(msg)
    state["red_flags"]="\n".join(found)
    return state

def condition_info_node(state: SymptomState) -> SymptomState:
    explanation=safe_gpt(f"Explain '{state['condition_name']}' in 2 lines",
        role_prompt="Friendly explanation in 2 lines. Avoid medical jargon.")
    
    state["advice"]=safe_gpt(explanation + f"\nUser is feeling: {state['symptom']}",
                             role_prompt="You are a warm health assistant. Rephrase kindly in under 2 lines. Avoid clinical words.")
    return state

def emergency_check_node(state: SymptomState) -> SymptomState:
    state["emergency"]=bool(state.get("red_flags"))
    return state

def follow_up_node(state: SymptomState) -> SymptomState:
    state["follow_up"]=safe_gpt(f"Ask gentle follow-up for: {state['symptom']}",
                                   role_prompt="1 line follow-up. Simple English. Avoid repeating. Avoid jargon.")
    return state

graph = StateGraph(SymptomState)
graph.add_node("extract_symptom", extract_symptom_node)
graph.add_node("search_condition", search_condition_node)
graph.add_node("map_specialist", specialist_mapping_node)
graph.add_node("check_red_flags", red_flag_node)
graph.add_node("get_condition_info", condition_info_node)
graph.add_node("check_emergency", emergency_check_node)
graph.add_node("follow_up", follow_up_node)
graph.set_entry_point("extract_symptom")

graph.add_edge("extract_symptom", "search_condition")
graph.add_edge("search_condition", "map_specialist")
graph.add_edge("map_specialist", "check_red_flags")
graph.add_edge("check_red_flags", "get_condition_info")
graph.add_edge("get_condition_info", "check_emergency")
graph.add_edge("check_emergency", "follow_up")
graph.set_finish_point("follow_up")

app = graph.compile()

def create_router(doctor_collection):
    router=APIRouter()
    @router.post("/symptom-check")
    async def symptom_check(query:str=Form(...)):
        result=app.invoke({"user_input":query})
        return{
             "answer":result["advice"]+("\n"+result["red_flags"] if result["red_flags"] else ""),
             "follow_up_question":result["follow-up"],
             "final":False,
             "specialist":result["specialist"],
             "emergency":result["emergency"]
        }
    return router