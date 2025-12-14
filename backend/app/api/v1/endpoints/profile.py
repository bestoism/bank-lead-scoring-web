from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    employee_id: str | None = None
    department: str | None = None
    joined: str | None = None

# Simple in-memory store for demo (replace with DB in production)
PROFILE_STORE = {
    "name": "Ryan Besto Saragih",
    "email": "ryan.besto@student.unesa.ac.id",
    "phone": "+62 812 3456 7890",
    "employee_id": "EMP-2025-001",
    "department": "Sales & Marketing",
    "joined": "Agustus 2025"
}

@router.get("", response_model=ProfileUpdate)
def get_profile():
    return PROFILE_STORE

@router.put("", response_model=ProfileUpdate)
def update_profile(payload: ProfileUpdate):
    # Persist into in-memory store (demo). Replace with DB write.
    PROFILE_STORE.update(payload.dict(exclude_unset=True))
    return PROFILE_STORE