
from dateparser import parse
from dateparser.search import search_dates
from pymongo.collection import Collection
from collections import defaultdict
from datetime import date as dt_date

def check_doctor_availability(name: str, specialization:str, date: str = "", city: str = "", doctor_collection: Collection = None, appointment_collection: Collection = None) -> str:
    """
    Check available doctors and time slots either by doctor name or specialization and city.
    Example: 'Cardiologist in Delhi on 2025-06-29' or 'Dr. Ramesh on 2025-06-29'.
    """
    if not (name or specialization):
        return "⚠️ Please provide a doctor's name or specialization."
    query={}
    if name:
        query["name"] = {"$regex": f".*{name}.*", "$options": "i"} # Fuzzy match anywhere in the name
    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}

    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    matching_doctors = list(doctor_collection.find(query))
    if not matching_doctors:
        return f"❌ No doctors found matching '{name or specialization}' in {city or 'your area'}."
    
    today = dt_date.today().isoformat()
    target_date = ""
    if date:
        try:
            target_date = parse(date).date().isoformat()
             #this allow input like tommorow monday etc
            print("📅 Target Date Parsed:", target_date)

        except:
            return "⚠️ Invalid date format. Use YYYY-MM-DD."
    responses = []
    for doc in matching_doctors:
        doc_name = doc.get("name", "Unknown")
        slots = doc.get("available_slots", {})
        doc_city = doc.get("city", "N/A")
        doc_spec = doc.get("specialization", "N/A")

        # Filter by date (if provided) and unbooked
        free_slots=[]

        if target_date:
            if target_date not in slots:
                responses.append(f"⚠️ {doc_name} ({doc_spec} in {doc_city}) is not available on {target_date}.")
                continue

        for slot_date, times in slots.items():
            if target_date  and slot_date != target_date:
                continue
            if slot_date < today:
                continue
        
            for time in times:
                is_booked = appointment_collection.find_one({  # Must be inside the date check
                        "doctor_name": doc_name,
                        "date": slot_date,
                        "time": time
                    })
                if not is_booked:
                    free_slots.append({
                    "date": slot_date,
                    "time": time
            })

        grouped_slots = defaultdict(list)
        for slot in free_slots:
            grouped_slots[slot["date"]].append(slot["time"])
            
        if grouped_slots:
            slot_strings = []
            for date, times in grouped_slots.items():
                slot_strings.append(f"{date}: {', '.join(times)}")
            slot_summary = "\n".join(slot_strings)
            responses.append( f"✅ {doc_name} ({doc_spec} in {doc_city}) is available at:\n{slot_summary}")
        elif target_date:
            responses.append(f"❌ {doc_name} ({doc_spec} in {doc_city}) has no free slots on {target_date}.")

    responses = list(set(responses)) 
    return "\n\n".join(responses)

  
def get_all_specializations(doctor_collection):
    """
    Return a list of unique specializations from the doctor collection.
    """
    return list(doctor_collection.distinct("specialization"))



def extract_doctor_name(query: str, doctor_collection)->str:
    """
    Try to extract doctor name from the query.
    1. Match 'Dr. Name' or 'Doctor Name'
    2. Else, match any known name from DB inside query
    """
    import re
    name_match = re.search(r"(Dr\.?\s?\w+|Doctor\s+\w+)", query, re.I) #re.search(pattern, string, flags) Yeh function poore string me pattern ko match karne ki koshish karta hai.
    if name_match:
        raw_name = name_match.group(1).strip()
        cleaned = re.sub(r"\b(dr\.?|doctor)\b", "", raw_name, flags=re.I).strip()
        return cleaned
    all_doctors = doctor_collection.find({})
    for doc in all_doctors:
        doc_name = doc.get("name", "").lower()
        # ✅ Clean the name using re.sub to remove titles like Dr. / Doctor
        clean_name = re.sub(r"\b(dr\.?|doctor)\b", "", doc_name, flags=re.I)
        name_parts = clean_name.strip().split()
        for part in name_parts:
            if part in query.lower():
                return doc.get("name")

    return ""


#Dr\.? → "Dr" ke baad . ho bhi sakta hai ya na bhi ho (optional dot)

#\s? → optional space

#\w+ → koi naam (jaise Sharma, Ramesh, Verma)

#Doctor\s+ → "Doctor" ke baad ek ya zyada space
#re.I mean doesnot mean lowwer case or upper
#re regular expression