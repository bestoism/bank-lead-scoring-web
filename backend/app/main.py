from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import create_db_and_tables
from app.api.v1.api import api_router

app = FastAPI(
    title="SmartConvert CRM API",
    description="Backend API for Lead Scoring Prediction using Clean Architecture",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",    # Untuk Next.js local
    "https://nama-project-kamu.vercel.app", # Untuk Vercel nanti
    "*" # (Opsional) Izinkan semua domain untuk sementara development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Membuat tabel database otomatis saat server nyala
    create_db_and_tables()

@app.get("/")
def root():
    return {"message": "Welcome to SmartConvert CRM API! Visit /docs for Swagger UI."}

# Include semua router V1
app.include_router(api_router, prefix="/api/v1")