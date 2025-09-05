import os
import requests
from dotenv import load_dotenv
load_dotenv()
locationIq_api_key = os.getenv("LOCATIONIQ_API_KEY")
headers = {
    "User-Agent": "ruralbot-agent"
}
def get_lat_lng(place_name):
    url= f"https://us1.locationiq.com/v1/search?key={locationIq_api_key}&q={place_name}&format=json"
    res=requests.get(url,headers=headers)
    data=res.json()
    print("NEARBY DATA:", data)  
    if data:
        return data[0]['lat'], data[0]['lon']
    return None, None

def get_fallback_places(lat, lng, query="hospital"):
    # Define viewbox (left, top, right, bottom)
    left = lng - 0.05
    right = lng + 0.05
    top = lat + 0.05
    bottom = lat - 0.05

    url = f"https://us1.locationiq.com/v1/search.php?key={locationIq_api_key}&q={query}&format=json&limit=5&viewbox={left},{top},{right},{bottom}&bounded=1"
    print("FALLBACK URL:", url)

    try:
        res = requests.get(url, headers=headers)
        data = res.json()
    except Exception as e:
        print("Fallback request failed:", e)
        return ["⚠️ Fallback API error"]

    places = []
    for place in data:
        name = place.get("display_name", "Unknown")
        lat2 = place.get("lat")
        lon2 = place.get("lon")
        gmap_link = f"https://www.google.com/maps/search/?api=1&query={lat2},{lon2}"
        places.append(f"{name}\n📍 {gmap_link}")
    return places



def extract_places_from_list(data):
    places = []
    for place in data[:5]:
        name = place.get("display_name", "unknown")
        lat2 = place.get("lat")
        lon2 = place.get("lon")
        gmap_link = f"https://www.google.com/maps/search/?api=1&query={lat2},{lon2}"
        places.append(f"{name}\n📍 {gmap_link}")
    return places


def get_nearby_places(lat,lng,tag="hospital"):
    url = f"https://us1.locationiq.com/v1/nearby.php?key={locationIq_api_key}&lat={lat}&lon={lng}&tag={tag}&radius=5000&format=json"
    try:
        res = requests.get(url, headers=headers)
        data = res.json()
    except Exception as e:
        print("Primary request failed:", e)
        return ["⚠️ Primary API error"]
    
    if isinstance(data, list):
        print("✅ Response is a list — fallback or alt structure.")
        return extract_places_from_list(data)
    
    if isinstance(data, dict) or "error" in data:
        print("Primary API error:", data["error"])
        return get_fallback_places(lat, lng, tag)
    
    print("NEARBY DATA:", data)  
    places = []
    for place in data.get("places",[])[:5]:
        name=place.get("name","unknown")
        address=place.get("address", {}).get("road", "")
        lat2=place.get("lat")
        lon2=place.get("lon")
        gmap_link = f"https://www.google.com/maps/search/?api=1&query={lat2},{lon2}"
        places.append(f"{name}, {address}\n📍 {gmap_link}")
    return places

def get_place_nearby_msg(lat,lng,tag):
    places=get_nearby_places(lat,lng,tag)
    if not places:
        return "⚠️ No places found nearby."
    
    response = f"📍 *Nearby {tag.capitalize()}s*:\n\n"
    for idx, place in enumerate(places, start=1):
        response += f"{idx}. {place}\n\n"
    return response.strip()