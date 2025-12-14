from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.customer import (
    Customer,
    CustomerCreate,
    CustomerRead,
    CustomerUpdateStatus
)
from app.services.ml_service import ml_service
import pandas as pd
import io

router = APIRouter()

# =====================================================
# POST /predict → Single Prediction + Save DB
# =====================================================
@router.post("/predict", response_model=CustomerRead)
def create_customer_prediction(
    customer_in: CustomerCreate,
    session: Session = Depends(get_session)
):
    """
    1. Menerima data nasabah
    2. Melakukan Prediksi (ML)
    3. Menyimpan data + hasil prediksi ke Database
    """

    customer_data = customer_in.dict()

    prediction = ml_service.predict_and_explain(customer_data)

    customer_db = Customer.from_orm(customer_in)

    if prediction:
        customer_db.prediction_score = prediction["score"]
        customer_db.prediction_label = prediction["label"]
        customer_db.shap_values_json = prediction["shap_json"]
        customer_db.recommendation_script = prediction["script"]

    session.add(customer_db)
    session.commit()
    session.refresh(customer_db)

    return customer_db


# =====================================================
# GET / → List Customers (Dashboard)
# =====================================================
@router.get("/", response_model=list[CustomerRead])
def read_customers(
    offset: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    statement = select(Customer).offset(offset).limit(limit)
    customers = session.exec(statement).all()
    return customers


# =====================================================
# GET /{customer_id} → Detail Customer
# =====================================================
@router.get("/{customer_id}", response_model=CustomerRead)
def read_customer_detail(
    customer_id: int,
    session: Session = Depends(get_session)
):
    """
    Detail nasabah:
    - skor
    - label
    - SHAP
    - recommendation script
    - status sales
    """
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# =====================================================
# PATCH /{customer_id}/status → Sales Action
# =====================================================
@router.patch("/{customer_id}/status", response_model=CustomerRead)
def update_customer_status(
    customer_id: int,
    status_update: CustomerUpdateStatus,
    session: Session = Depends(get_session)
):
    """
    Sales update status lead:
    NEW → CONTACTED → CLOSED
    """
    customer = session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.lead_status = status_update.lead_status

    if status_update.sales_notes:
        customer.sales_notes = status_update.sales_notes

    session.add(customer)
    session.commit()
    session.refresh(customer)

    return customer


# =====================================================
# POST /upload → Batch CSV Prediction (SHAP + Script)
# =====================================================
@router.post("/upload", response_model=dict)
async def upload_customers_csv(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    try:
        contents = await file.read()
        
        # --- PERBAIKAN 1: Auto-Detect Separator ---
        # Coba baca 1 baris pertama decode ke string
        first_line = contents.decode("utf-8").split('\n')[0]
        separator = ';' if ';' in first_line else ','
        
        print(f"🔍 Terdeteksi separator: '{separator}'") # Debugging log
        
        df = pd.read_csv(io.BytesIO(contents), sep=separator)
        
        # --- PERBAIKAN 2: Normalisasi Nama Kolom ---
        # Ganti literal '.' jadi '_' (escape dot), lalu lowercase
        df.columns = df.columns.str.replace(r"\.", "_", regex=True)
         # Paksa huruf kecil semua (Age -> age)
        df.columns = df.columns.str.lower()
        
        customers_to_add = []
        errors = [] # Simpan error biar ketahuan

        for index, row in df.iterrows():
            customer_data = row.to_dict()
            
            try:
                # Lakukan Prediksi
                prediction = ml_service.predict_and_explain(customer_data)
                
                # Buat Object Customer DB
                # Pydantic akan validasi tipe data disini
                customer_db = Customer(**customer_data)
                
                if prediction:
                    customer_db.prediction_score = prediction['score']
                    customer_db.prediction_label = prediction['label']
                    customer_db.shap_values_json = prediction['shap_json']
                    customer_db.recommendation_script = prediction['script']
                    
                customers_to_add.append(customer_db)
                
            except Exception as e:
                error_msg = f"Row {index} Error: {str(e)}"
                print(error_msg) # Print ke terminal
                errors.append(error_msg)
                continue

        if customers_to_add:
            session.add_all(customers_to_add)
            session.commit()
        
        # --- PERBAIKAN 3: Response Jujur ---
        return {
            "message": "Batch upload processed",
            "summary": {
                "total_processed": len(customers_to_add),
                "total_failed": len(errors),
                "potential": sum(1 for c in customers_to_add if c.prediction_label == 'Potential'),
                "sample_error": errors[0] if errors else None # Tampilkan 1 error ke API response
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fatal Error: {str(e)}")