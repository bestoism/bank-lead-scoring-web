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
    contact: str
    month: str
    day_of_week: str
    campaign: int
    pdays: int
    previous: int
    poutcome: str
    emp_var_rate: float
    cons_price_idx: float
    cons_conf_idx: float
    euribor3m: float
    nr_employed: float

    # Status Lead (Workflow Sales)
    # Pilihan: 'NEW', 'CONTACTED', 'INTERESTED', 'CLOSED', 'REJECTED'
    lead_status: str = Field(default="NEW") 
    sales_notes: Optional[str] = None

class Customer(CustomerBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Hasil AI
    prediction_score: Optional[float] = None
    prediction_label: Optional[str] = None
    
    # Explainable AI (Disimpan sebagai JSON String)
    # Contoh: {"euribor3m": 0.5, "contact": 0.2}
    shap_values_json: Optional[str] = None 
    
    # Script Rekomendasi (Next Best Conversation)
    recommendation_script: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerRead(CustomerBase):
    id: int
    created_at: datetime
    prediction_score: Optional[float]
    prediction_label: Optional[str]
    shap_values_json: Optional[str]
    recommendation_script: Optional[str]
    
# Model khusus untuk update status (Patch)
class CustomerUpdateStatus(SQLModel):
    lead_status: str
    sales_notes: Optional[str] = None