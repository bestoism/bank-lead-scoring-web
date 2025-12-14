import pandas as pd
import pickle
import os

class MLService:
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        # Sesuaikan path ini nanti
        model_path = "ml_artifacts/xgboost_tuned_v2.pkl"
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading model: {e}")

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Menerapkan preprocessing V2 (Sama persis dengan Notebook 01B-EDA)
        """
        data = df.copy()

        # 1. Hapus Duration (Mencegah Data Leakage)
        if 'duration' in data.columns:
            data = data.drop(columns=['duration'])

        # 2. Feature Engineering: pdays -> pernah_dihubungi
        # Logika: Jika 999 maka 0 (belum), selain itu 1 (sudah)
        if 'pdays' in data.columns:
            data['pernah_dihubungi'] = data['pdays'].apply(lambda x: 0 if x == 999 else 1)
            data = data.drop(columns=['pdays']) # Drop kolom asli pdays

        # 3. Handling Unknown & One-Hot Encoding
        # TANTANGAN: Kita harus memastikan kolom hasil One-Hot Encoding 
        # sama persis urutannya dengan model training.
        # Nanti kita isi logika detailnya disini.
        
        return data

    def predict(self, input_data: dict):
        # Convert dict ke DataFrame
        df = pd.DataFrame([input_data])
        
        # Preprocess
        df_processed = self.preprocess_data(df)
        
        # Predict
        # ... logic prediksi nanti
        pass

ml_service = MLService() # Singleton instance