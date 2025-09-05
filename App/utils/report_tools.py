from pymongo.collection import Collection


def get_latest_reports(phone: str, limit: int = 3, med_collection: Collection = None) -> list:
    if med_collection is None:
        raise ValueError("med_collection is required.")
    cursor = med_collection.find(
        {"phone": phone, "type": "lab_report"},
        sort=[("timestamp", -1)]
    ).limit(limit)
    reports = []
    for report in cursor:
        reports.append({
            "summary": report.get("summary", ""),
            "date": report.get("timestamp")  # ensure 'timestamp' exists in your docs
        })
    return reports


def compare_reports(old_report: str, new_report: str) -> str:
    """
    Compares two medical reports textually and highlights key differences.
    """
    import difflib
    
    old_lines = old_report.splitlines()
    new_lines = new_report.splitlines()
    
    diff = difflib.unified_diff(old_lines, new_lines, lineterm="")
    changes = "\n".join(diff)
    
    return changes if changes else "No significant changes found between reports."



