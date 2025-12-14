from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class CustomerBase(SQLModel):
    # Field Identitas & Demografi
    age: int
    job: str
    marital: str
    education: str
    default: str
    housing: str
    loan: str
    
    # Field Kontak (Tanpa Duration!)
    contact: str
    month: str
    day_of_week: str
    campaign: int
    pdays: int      # Nanti kita convert jadi 'pernah_dihubungi' di logic, tapi simpan aslinya di DB
    previous: int
    poutcome: str
    
    # Field Makro Ekonomi
    emp_var_rate: float
    cons_price_idx: float
    cons_conf_idx: float
    euribor3m: float
    nr_employed: float

    # Status Lead (Untuk Sales)
    is_contacted: bool = Field(default=False)
    status_notes: Optional[str] = None

class Customer(CustomerBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Hasil Prediksi ML (Disimpan otomatis saat upload/create)
    prediction_score: Optional[float] = None  # Probabilitas (0.0 - 1.0)
    prediction_label: Optional[str] = None    # "Potential" / "Non-Potential"
    shap_explanation: Optional[str] = None    # JSON string untuk menyimpan alasan (top features)

class CustomerCreate(CustomerBase):
    pass

class CustomerRead(CustomerBase):
    id: int
    created_at: datetime
    prediction_score: Optional[float]
    prediction_label: Optional[str]