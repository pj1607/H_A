import requests
import os
from dotenv import load_dotenv
load_dotenv()
umls_api_key= os.getenv("UMLS_API_KEY")
AUTH_URL = "https://utslogin.nlm.nih.gov/cas/v1/api-key"
SERVICE = "http://umlsks.nlm.nih.gov"

def get_tgt():
    res = requests.post(AUTH_URL, data={"apikey": umls_api_key})
    print("TGT response:", res.text)
    return res.text.split('action="')[1].split('"')[0]

def get_st(tgt):
    res = requests.post(tgt, data={"service": SERVICE})
    print("ST response:", res.text)
    return res.text

def search_symptom(q):
    tgt = get_tgt()
    st = get_st(tgt)
    print("Querying UMLS with:", q)
    resp = requests.get(
        f"https://uts-ws.nlm.nih.gov/rest/search/current",
        params={"string": q, "ticket": st, "pageSize": 5}
    )
    print("UMLS Response JSON:", resp.json())
    return resp.json().get("result", {}).get("results", [])

def get_related_cuis(cui):
    tgt = get_tgt()
    st = get_st(tgt)
    resp = requests.get(
        f"https://uts-ws.nlm.nih.gov/rest/content/current/CUI/{cui}/relations",
        params={"ticket": st}
    ).json()
    return resp.get("result", [])


def fallback_map_condition_to_specialist(condition: str) -> str:
    condition = condition.lower()

    rules = {
        "rash": "dermatologist",
        "skin": "dermatologist",
        "itch": "dermatologist",
        "headache": "neurologist",
        "migraine": "neurologist",
        "dizzy": "neurologist",
        "breathing": "pulmonologist",
        "asthma": "pulmonologist",
        "cough": "pulmonologist",
        "sugar": "endocrinologist",
        "diabetes": "endocrinologist",
        "chest pain": "cardiologist",
        "heart": "cardiologist",
        "palpitation": "cardiologist",
        "back": "orthopedist",
        "knee": "orthopedist",
        "leg": "orthopedist",
        "pain": "general physician",
        "fever": "general physician",
        "cold": "general physician",
        "tired": "general physician",
        "anxiety": "therapist",
        "depression": "therapist",
        "mental": "therapist",
        "stress": "therapist",
        "vomiting": "gastroenterologist",
        "stomach": "gastroenterologist",
        "abdomen": "gastroenterologist",
        "throat": "ENT",
        "ear": "ENT",
        "nose": "ENT",
        "eye": "ophthalmologist",
        "vision": "ophthalmologist",
        "blurry": "ophthalmologist",
    }

    for keyword, doctor in rules.items():
        if keyword in condition:
            return doctor

    return "general physician"

def map_condition_to_specialist(condition):
    print("CONDITION RECEIVED:", condition)
    # Example rule-based mapping
    rules = { "rash": "dermatologist",
    "skin": "dermatologist",
    "headache": "neurologist",
    "migraine": "neurologist",
    "breathing": "pulmonologist",
    "asthma": "pulmonologist",
    "sugar": "endocrinologist",
    "diabetes": "endocrinologist",
    "chest pain": "cardiologist",
    "palpitations": "cardiologist",
    "heart": "cardiologist",
    "back": "orthopedist",
    "leg": "orthopedist",
    "pain": "general physician",
    "fever": "general physician",
    "cold": "general physician",
    "anxiety": "therapist",
    "stress": "therapist",}
    for key in rules:
        if key.lower() in condition.lower():
            return rules[key]
    return "general physician"