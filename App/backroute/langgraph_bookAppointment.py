from langgraph.graph import StateGraph
from typing import TypedDict
from datetime import datetime
from utils.doctor_available import get_all_specializations,extract_doctor_name


doctor_collection=None
appointment_collection=None

def init_collect(doc_col,appoint_col):
    global doctor_collection,appointment_collection
    doctor_collection=doc_col
    appointment_collection=appoint_col

class BookingState(TypedDict):
    user_input:str
    doctor_name:str
    date:str
    time:str
    phone:str
    user_name:str
    specialization: str
    city:str
    error:str
    confirmed:bool
    response:str
    age:int

def parse_doctor_and_specialization(state: BookingState) -> BookingState:
    query = state["user_input"]

    if not state.get("doctor_name"):
        doctor_name = extract_doctor_name(query, doctor_collection)
        state["doctor_name"] = doctor_name
        print("📤 Extracted doctor name:", doctor_name)
    else:
        print("📤 Using existing doctor name:", state["doctor_name"])

    if not state.get("specialization"):
        specialization = ""
        specializations = get_all_specializations(doctor_collection)
        for spec in specializations:
            if spec.lower() in query.lower():
                specialization = spec
                break
        state["specialization"] = specialization

    return state

def ask_confirmation(state: BookingState) -> BookingState:
    if state.get("confirmed"):
        return state
    elif state.get("confirmed") is False:
        state["response"] = "❌ Appointment cancelled."
        state["error"] = "User cancelled."
        return state
    state["response"]=(f"📌 Confirm appointment with Dr. {state['doctor_name']} on "
                       f"{state['date']} at {state['time']} in {state['city']}? (yes/no)")
    return state


def check_slot_availability(state: BookingState) -> BookingState:
    if not state["doctor_name"]:
        state["error"]= "Missing doctor name."
        return state
    if not state["date"] or not state["time"]:
        return state

    exists=appointment_collection.find_one({
        "doctor_name":state["doctor_name"],
        "date":state["date"],
        "time":state["time"]
    })
    if exists:
        state["error"] = f"❌ Slot already booked with {state['doctor_name']} on {state['date']} at {state['time']}."
    return state


def confirm_booking_node(state: BookingState) -> BookingState:
    if state.get("error"):
        return state
    doctor_query={"name":{"$regex":state["doctor_name"],"$options":"i"}}
    if state["specialization"]:
        doctor_query["specialization"]={"$regex":state["specialization"],"$options":"i"}

    doctor=doctor_collection.find_one(doctor_query)
    print("🔍 Doctor Query:", doctor_query)
    
    if not doctor:
        state["error"] = f"Doctor '{state['doctor_name']}' not found."
        return state
    
    appointment_collection.insert_one({
        "user_name": state["user_name"],
         "phone": state["phone"],
         "age":state["age"],
         "amount":doctor.get("fee","$0"),
         "doctor_name":state["doctor_name"],
         "specialization":state["specialization"] or doctor.get("specialization"),
         "contact":doctor.get("contact"),
         "status":"pending",
         "date":state["date"],
         "time":state["time"],
         "created_at": datetime.now().isoformat()
    })
    state["confirmed"]=True
    state["response"] = f"✅ Appointment booked with Dr. {state['doctor_name']} on {state['date']} at {state['time']}."
    return state

def check_missing_info(state: BookingState) -> str:
    if not state.get("confirmed"):
        return "ask_confirmation"
    return "confirm"

graph = StateGraph(BookingState)


graph.add_node("parse_doctor", parse_doctor_and_specialization)
graph.add_node("check_slot", check_slot_availability)
graph.add_node("confirm", confirm_booking_node)

graph.add_node("ask_confirmation", ask_confirmation)


graph.set_entry_point("parse_doctor")

graph.add_edge("parse_doctor", "check_slot")

graph.add_conditional_edges(
    "check_slot",  # Name of the node
    check_missing_info,    # Router function
    {
        "ask_confirmation": "ask_confirmation",
        "confirm": "confirm"
    }
)
graph.set_finish_point("confirm")

book_app_graph = graph.compile()  