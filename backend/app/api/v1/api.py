from fastapi import APIRouter
from app.api.v1.endpoints import customers
from app.api.v1.endpoints import profile


api_router = APIRouter()

# Daftarkan router customers
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
# Daftarkan router profile
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])