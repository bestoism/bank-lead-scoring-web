from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session
from app.db.session import get_session
from app.models.customer import Customer, CustomerCreate, CustomerRead
from app.services.ml_service import ml_service
import pandas as pd
import io

router = APIRouter()

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
    
    # 1. Konversi ke Dictionary untuk ML Service
    customer_data = customer_in.dict()
    
    # 2. Panggil ML Service
    prediction_result = ml_service.predict(customer_data)
    
    # 3. Buat Instance Customer (Gabungan data input + hasil prediksi)
    customer_db = Customer.from_orm(customer_in)
    
    if prediction_result:
        customer_db.prediction_score = prediction_result['score']
        customer_db.prediction_label = prediction_result['label']
        # Disini nanti bisa tambah shap_values jika mau
    
    # 4. Simpan ke Database
    session.add(customer_db)
    session.commit()
    session.refresh(customer_db)
    
    return customer_db

@router.get("/", response_model=list[CustomerRead])
def read_customers(offset: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    """
    Melihat list nasabah yang sudah tersimpan (Dashboard View)
    """
    customers = session.query(Customer).offset(offset).limit(limit).all()
    return customers

@router.post("/upload", response_model=dict)
async def upload_customers_csv(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Fitur Unggulan RPL:
    1. Upload CSV Data Nasabah (Batch)
    2. Baca dengan Pandas
    3. Loop setiap baris -> Prediksi dengan ML
    4. Simpan ke Database secara bulk
    """
    
    # 1. Validasi File
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    try:
        # 2. Baca CSV ke Pandas DataFrame
        contents = await file.read()
        # Asumsi delimiter pakai ';' sesuai dataset UCI, kalau error ganti ','
        df = pd.read_csv(io.BytesIO(contents), sep=';') 
        
        # Ubah nama kolom jika perlu (opsional, sesuaikan dengan nama field Pydantic/DB)
        # Misalnya dataset asli pakai 'emp.var.rate', di DB kita pakai 'emp_var_rate'
        df.columns = df.columns.str.replace('.', '_')
        
        customers_to_add = []
        results_summary = {"total": 0, "potential": 0}

        # 3. Iterasi Data
        for index, row in df.iterrows():
            # Convert row ke dict
            customer_data = row.to_dict()
            
            # Bersihkan data (handle NaN dll jika ada)
            # ...
            
            # Lakukan Prediksi
            prediction = ml_service.predict(customer_data)
            
            # Buat Object Customer DB
            # Kita pakai try-except agar jika ada 1 data error, tidak membatalkan semua
            try:
                customer_db = Customer(**customer_data)
                
                if prediction:
                    customer_db.prediction_score = prediction['score']
                    customer_db.prediction_label = prediction['label']
                    
                    if prediction['label'] == 'Potential':
                        results_summary['potential'] += 1
                
                customers_to_add.append(customer_db)
            except Exception as e:
                print(f"Skipping row {index}: {e}")
                continue

        # 4. Simpan ke Database (Batch Insert)
        session.add_all(customers_to_add)
        session.commit()
        
        results_summary['total'] = len(customers_to_add)
        
        return {
            "message": "Batch upload processed successfully",
            "summary": results_summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")