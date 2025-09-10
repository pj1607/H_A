import google.generativeai as genai
import sqlite3
from datetime import datetime 
import os
import random
from bson import ObjectId
from pydantic import BaseModel
from fastapi import FastAPI, Form,Query,HTTPException,Request,Body,UploadFile,File
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from twilio.rest import Client
from fastapi.responses import JSONResponse
from langchain_bot import query_health_bot
from models.location import get_nearby_places
from collections import defaultdict
from typing import Optional,List,Dict
from backroute.symptomcheck import create_router
from backroute.userpro import profile_router
from backroute.health_agents import init_collections
from agent.agentic import health_agent
from backroute.langgraph_bookAppointment import book_app_graph,init_collect
import json
load_dotenv()


app=FastAPI()

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


# MongoDB setup
mongo_url = os.getenv("MONGO_URL")
client = MongoClient(mongo_url, tls=True)
print(client.list_database_names())
db = client["ruralbot"]
users_collection = db["users"]
appointments_collection = db["appointments"]
doctor_collection=db["doctors"]
report_collection=db["symptom_reports"]
med_collection=db["report"]
chat_histroy=db["chat-hi"]

init_collections(report_col=db["symptom_reports"],med_col=db["report"],doc_col=db["doctors"],appoint_col=db["appointments"])
init_collect(doc_col=db["doctors"],appoint_col=db["appointments"])
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dr-care-brown.vercel.app","http://localhost:5173","http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(create_router(doctor_collection))
app.include_router(profile_router(appointments_collection))



class DoctorModel(BaseModel):
    name:str
    specialization:str
    city:str
    contact:str
    fee:str
    available_slots:Dict[str,List[str]]

@app.post("/doctor-login")
async def doctor_login(doctor:DoctorModel):
    exist= doctor_collection.find_one({"contact":doctor.contact})
    if exist:
        doctor_collection.update_one({"contact":doctor.contact},{"$set":doctor.dict()})
        return {"success":True,"message":"Doctor profile Updated."}
    doctor_collection.insert_one({
        "name":doctor.name,
        "specialization":doctor.specialization,
        "contact":doctor.contact,
        "city":doctor.city,
        "fee":doctor.fee,
        "available_slots":doctor.available_slots
    })
    return {"success":True,"message":"Doctor Profile Created."}


@app.get("/get-doctor-profile")
async def get_doctor_profile(contact:str):
    doctor=doctor_collection.find_one({"contact":contact},{"_id":0})
    if doctor:
        return {"success":True,"doctor":doctor}
    return {"success": False, "message": "Doctor not found"}


@app.get("/get-doctor-appointment")
async def get_doctor_appointment(contact:str):
    doctor= doctor_collection.find_one({"contact":contact})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    appointment=list(appointments_collection.find({"contact":contact}))
    appoint=[]
    for appt in appointment:
        appt["_id"]=str(appt["_id"])
        appoint.append(appt)

    return {"appointments":appoint}

@app.delete("/cancel-appointment/{id}")
async def cancel_appointment(id:str):
    appoint=appointments_collection.delete_one({"_id":ObjectId(id)})
    if appoint.deleted_count==1:
         return {"success": True, "message": "Appointment cancelled"}
    else:
        raise HTTPException(status_code=404, detail="Appointment not found")
   

class StatusUpdate(BaseModel):
    status: str

@app.put("/update-appointment-status/{id}")
async def update_appointment_status(id: str,payload: StatusUpdate):
    res=appointments_collection.update_one(
        {"_id":ObjectId(id)},
         {"$set":{"status":payload.status}}
    )
   
    if res.modified_count == 1:
        return {"success": True, "message": "Status updated"}
    raise HTTPException(status_code=404, detail="Appointment not found")

class RescheduleUpdate(BaseModel):
    date:str
    time:str

@app.put("/reschedule-appointment/{id}")
async def reschedule_appointment(id:str,payload:RescheduleUpdate):
    re=appointments_collection.update_one(
        {"_id":ObjectId(id)},
        {
            "$set":{"date":payload.date,"time":payload.time}
        }
    )

    if re.modified_count==1:
        return {"success": True, "message": "Meeting Rescheduled"}
    raise HTTPException(status_code=404, detail="Appointment not found")


@app.post("/chat-agent")
async def chat_agent(request: Request):
    data = await request.json()
    user_query = data.get("query")
    phone = data.get("phone")
    full_prompt = f"{user_query}\nPhone: {phone}"

    try:
        # Get bot response
        response = health_agent.invoke(full_prompt)
        if isinstance(response, dict):
            response = response.get("output", str(response))

        # Find existing session for this phone
        existing_chat = chat_histroy.find_one({"phone": phone}, sort=[("created_at", -1)])

        if existing_chat:
            # Append new messages
            chat_histroy.update_one(
                {"_id": existing_chat["_id"]},
                {"$push": {
                    "messages": {
                        "$each": [
                            {"sender": "user", "text": user_query, "timestamp": datetime.now().isoformat()},
                            {"sender": "bot", "text": response, "timestamp": datetime.now().isoformat()}
                        ]
                    }
                }}
            )
        else:
            # Create new session
            chat_histroy.insert_one({
                "phone": phone,
                "messages": [
                    {"sender": "user", "text": user_query, "timestamp": datetime.now().isoformat()},
                    {"sender": "bot", "text": response, "timestamp": datetime.now().isoformat()}
                ],
                "created_at": datetime.now().isoformat()
            })

        return {"text": response}

    except Exception as e:
        return {"error": str(e)}



@app.post("/rag-summary")
async def get_summary(
    ocr_text:str=Form(...),
    phone:str=Form(...),
    
):
    print("Received OCR text:",ocr_text)
    role_prompt = """
You are a health assistant. Summarize any medical report in **short, simple bullet points**.

✅ Format:
- Show test name clearly (e.g., Blood Glucose, CT Scan)
- Highlight each result with ✅ Normal / ❗ Low / ⚠️ High
- End with a one-line advice (non-prescriptive)

Keep response under 5 lines. Use emojis.

If report is unclear, say: "⚠️ Could not understand this report."
"""
    
    summary=safe_gpt(question=ocr_text,role_prompt=role_prompt)
    med_collection.insert_one({
        "phone": phone,
        "summary": summary,
        "timestamp": datetime.now().isoformat(),
        "type": "lab_report",
    })
    return {"summary":summary}


class SymptomReport(BaseModel):
    user_id:str
    date:datetime
    symptoms:str
    ai_suggestion: str
    suggested_tests: Optional[List[str]] = []
    urgency: Optional[str] = "Low"
    full_conversation: List[dict]
    phone:str

def compress_conversation(convo: List[dict]) -> str:
    """Summarize the full conversation into 4-5 lines using Gemini"""
    dialogue_lines = []
    for msg in convo:
        role=msg.get("role")
        message=msg.get("message","").strip()
        if not message:
            continue
        prefix="User:" if role=="user" else "Assistant:"
        dialogue_lines.append(f"{prefix} {message}")
    dialogue_text = "\n".join(dialogue_lines[-15:])
    prompt = f"""
You are a doctor. Summarize the following health chat in 3-4 short lines.

{dialogue_text}

Use empathetic and simple language.
Avoid giving false hope. No prescriptions.
Just tell the issue, cause (if known), and what to do.
"""
    return safe_gpt(prompt,role_prompt="You are a doctor.Summarize the following health chat in 3-4 short lines.")


@app.post("/save-report")
async def save_report(report:SymptomReport): # ye fucntion uss pydantic model ko recieve kr rha h in the form of object
    report_dict=report.dict()
    report_dict["date"] = report.date.isoformat()
    print("Saving report:", report_dict)
    report_dict["summary"] = compress_conversation(report.full_conversation)
    result=report_collection.insert_one(report_dict)
    print("Inserted ID:", result.inserted_id)
    return {"status": "success", "message": "Report saved"}

class PhoneRequest(BaseModel):
    phone: str


@app.post("/get-reports")
async def get_reports(request: PhoneRequest):
    reports=list(db["symptom_reports"].find({"phone":request.phone}))
    for report in reports:
        report["_id"]=str(report["_id"])
    return {"reports":reports}

@app.delete("/delete-report/{rep_id}")
async def delete_report(rep_id:str):
    re=report_collection.delete_one({"_id":ObjectId(rep_id)})
    if re.deleted_count == 1:
        return {"status": "success", "message": "Report deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Report not found")



@app.get("/all_doctors")
async def get_all_doctor(
    specialization: Optional[str] = Query(None),
    city: Optional[str] = Query(None)):
    query = {}

    # Only add to query if value is provided (not "all")
    if specialization and specialization.lower() != "all":
        query["specialization"] = specialization.lower()

    if city and city.lower() != "all":
        query["city"] = city.lower()

    doctors = list(doctor_collection.find(query, {"_id": 0}))
     #to not include id otherwise _id b to hota h agr qury na ho to use {}
    for doctor in doctors:
        contact=doctor["contact"]
        booked = defaultdict(list)
        appointment=appointments_collection.find({
            "contact":contact
        })
        for app in appointment:
            if app.get("status", "").lower() == "accepted":
                date=app.get("date")
                time=app.get("time")
                print("→ App Date:", repr(date), "Time:", repr(time))
                if date and time:
                    booked[date].append(time)
        print("Doctor:", doctor["contact"], "Booked Slots:", dict(booked))   
        doctor["booked_slots"] = dict(booked) 
        # convert defaultdict to regular dict
        doctor_collection.update_one(
            {"contact":contact},
            {
                "$set":{"booked_slots":dict(booked)}
            }
        )
    return {"doctors": doctors}

@app.post("/book-appoint")
async def book_appoint(payload:dict):
    print("📥 Received payload:", payload)
    state = {**payload}
    state["user_input"] = payload.get("user_input", "")

    result=book_app_graph.invoke(state)
    print("🧾 Final state result:", result)
    if result.get("error"):
        return {"error":result["error"]}
    
    return {
        "text": result.get("response", "Something went wrong."),
        "state": result  # optional: helpful for debugging
    }

class AppointmentRequest(BaseModel): #pydantic model for appointment requests
    user_name:str
    phone:str
    age: int
    location: str
    doctor_name:str
    specialization:str
    date:str
    time:str 
    amount:int
    contact:str


@app.post("/book-appointment")
async def book_appointment(appt: AppointmentRequest):
    existing=appointments_collection.find_one({
        "doctor_name": appt.doctor_name,
        "specialization":appt.specialization,
        "date": appt.date,
        "time": appt.time,
        "contact":appt.contact
    })
    if existing:
        return JSONResponse(status_code=400, content={"message": "Slot already booked"})

    appointments_collection.insert_one({
          "user_name": appt.user_name,
        "phone": appt.phone,
        "age":appt.age,
        "location":appt.location,
        "amount":appt.amount,
        "doctor_name": appt.doctor_name,
        "specialization": appt.specialization,
        "contact":appt.contact,
        "date": appt.date,
        "time": appt.time,
         "status": "Pending",
        "created_at": datetime.now().isoformat()
    })
    msg = f"Appointment confirmed with Dr. {appt.doctor_name} on {appt.date} at {appt.time}."
    return {"message": msg}


@app.get("/doctor-slots")
async def get_doctor_slots(doctor_name: str, date: str):
    booked_slots=appointments_collection.find({
        "doctor_name": doctor_name,
        "date": date
    })
    slots = [b["time"] for b in booked_slots]
    return {"booked_slots": slots}

class DoctorSearchRequest(BaseModel):
    specialization: str

@app.post('/find-doctors')
async def find_doctors(req: DoctorSearchRequest):
    doctors=list(db["doctors"].find({"specialization": req.specialization}))
    unique={}
    for doc in doctors:
        key=(doc["name"],doc["contact"])
        if key not in unique:
            doc["_id"] = str(doc["_id"])
            unique[key]=doc
    return {"doctors":list(unique.values())}



def translate(text:str,dest:str="en")->str:
    model = genai.GenerativeModel('models/gemini-1.5-flash')
    prompt = f"Translate this to {dest} language:\n\n{text}"
    return model.generate_content(prompt).text.strip()


def safe_gpt(question: str, role_prompt: str ="you are a rural health advisor give advice to health related in friendly way.") -> str:
    model = genai.GenerativeModel('models/gemini-1.5-flash')
    prompt = f"{role_prompt}\nQ: {question}"
    response = model.generate_content([prompt])
    return response.text

class LocationInput(BaseModel):
    lat:float
    lng:float
    tag:str="hospital"

@app.post("/nearby-places")
async def nearby_places(data:LocationInput):
    print("Received lat/lng:", data.lat, data.lng, data.tag)
    return {
        "places":get_nearby_places(data.lat,data.lng,data.tag)
    }

@app.get("/history")
async def get_chat_history(phone: str):
    print(f"📞 Fetching history for phone: {phone}")
    chats = list(chat_histroy.find({"phone": phone}).sort("created_at", -1))

    history = [
        {
            "id": str(chat["_id"]),       # for delete
            "messages": chat.get("messages", []),
            "created_at": chat["created_at"]
        }
        for chat in chats
    ]
    return JSONResponse(content={"history": history})

@app.delete("/history/{chat_id}")
async def delete_chat(chat_id: str):
    try:
        result = chat_histroy.delete_one({"_id": ObjectId(chat_id)})
        if result.deleted_count == 1:
            return {"success": True}
        else:
            return {"success": False, "message": "Chat not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}




@app.post("/ask")
async def ask(name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    address: str = Form(...)):
    #q_en=translate(question,dest="en")
    now = datetime.now().isoformat()
    profile_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "age": age,
        "gender": gender,
        "address": address,
        "last_updated": now
    }
    users_collection.update_one(
        {"phone": phone},
        {"$set": profile_data},
        upsert=True
    )

    return {"message": "✅ Profile saved successfully"}
    
@app.get("/")
def read_root():
    return {"msg": "Ruralbot API is live."}

