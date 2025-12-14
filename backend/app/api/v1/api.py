from fastapi import APIRouter
from app.api.v1.endpoints import customers

api_router = APIRouter()

# Daftarkan router customers
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])