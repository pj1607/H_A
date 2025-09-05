from fastapi import APIRouter,Form
from typing import List
from bson import ObjectId
from fastapi.responses import JSONResponse
from pymongo.collection import Collection
router = APIRouter()



def profile_router(appointments_collection: Collection):
    router = APIRouter()
    @router.get("/get-user-appointments")
    async def get_user_appointments(phone:str):
        phone = str(phone).strip()
        appointments=list(appointments_collection.find({"phone":phone})) 
        for appt in appointments:
            appt["_id"]=str(appt["_id"])
        return {"appointments":appointments}
           
    @router.delete("/cancel-appointment/{appt_id}")
    async def cancel_appointment(appt_id: str):
        result = appointments_collection.delete_one({"_id": ObjectId(appt_id)})
        if result.deleted_count == 1:
            return {"message": "Appointment cancelled successfully"}
        return JSONResponse(status_code=404, content={"message": "Appointment not found"})
    
    return router
