from pymongo.collection import Collection
from typing import Tuple
from datetime import datetime
def get_health_summary_from_symptoms(phone: str, report_collection: Collection, limit: int = 3) -> Tuple[str, str]:
    phone = str(phone)
    doc = report_collection.find({"phone": phone}).sort("date", -1).limit(limit)
    reports = list(doc)
    print(f" Searching for phone: {phone}")
    print(f" Reports found: {len(reports)}")
    print("report",reports)
    if not reports:
        return "No recent reports found"
    combined_summaries = []
    for cur in reversed(reports): #old to new
        date=cur.get("date")
        try:
            dt = datetime.fromisoformat(date) if isinstance(date, str) else date
            date_str = dt.strftime("%d %b %Y")
        except:
            date_str = "Unknown Date"
        summary = cur.get("summary", "").strip()
        if summary:
            combined_summaries.append(f"🗓 {date_str}: {summary}")
    old_summary = "\n".join(combined_summaries) if combined_summaries else "No summary available."

    
    latest_doc = reports[0]
    conversation = latest_doc.get("full_conversation", [])

    latest_lines = []
    for msg in conversation:
        role = msg.get("role")
        message = msg.get("message", "").strip()
        if not message:
            continue
        prefix = "User:" if role == "user" else "Assistant:"
        latest_lines.append(f"{prefix} {message}")
        if len(latest_lines) == 12:
            break

    combined_dialogue = "\n".join(latest_lines) if latest_lines else "No recent conversation found."

    return combined_dialogue, old_summary