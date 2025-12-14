import pandas as pd
import pickle
import json
import os

class MLService:
    def __init__(self):
        self.model = None
        self.feature_columns = None
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.artifacts_path = os.path.join(self.base_path, "../../ml_artifacts")
        
        self.load_artifacts()
    
    def load_artifacts(self):
        """Memuat Model PKL dan Daftar Fitur JSON"""
        try:
            # 1. Load Model
            model_path = os.path.join(self.artifacts_path, "xgboost_tuned_v2.pkl")
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # 2. Load Daftar Nama Kolom (Hasil Training)
            features_path = os.path.join(self.artifacts_path, "model_features.json")
            with open(features_path, 'r') as f:
                self.feature_columns = json.load(f)
                
            print(f"✅ ML Artifacts loaded! Model & {len(self.feature_columns)} features ready.")
        except Exception as e:
            print(f"❌ Error loading ML artifacts: {e}")
            print(f"Path dicari: {self.artifacts_path}")

    def preprocess_data(self, input_df: pd.DataFrame) -> pd.DataFrame:
        """
        Pipeline Preprocessing V2:
        1. Drop Duration
        2. Feature Engineering (pdays -> pernah_dihubungi)
        3. Handling Unknown (Simple Mode)
        4. One-Hot Encoding & Alignment
        """
        df = input_df.copy()

        # --- A. Drop Duration (Anti Data Leakage) ---
        if 'duration' in df.columns:
            df = df.drop(columns=['duration'])

        # --- B. Feature Engineering ---
        # pdays: 999 -> 0 (belum), others -> 1 (sudah)
        if 'pdays' in df.columns:
            df['pernah_dihubungi'] = df['pdays'].apply(lambda x: 0 if x == 999 else 1)
            df = df.drop(columns=['pdays'])

        # --- C. Handling Unknown (Sederhana untuk Inference) ---
        # Di production, idealnya kita punya nilai modus yang disimpan juga.
        # Untuk sekarang, kita biarkan apa adanya atau replace standar.
        # df.replace('unknown', df.mode().iloc[0], inplace=True) # Opsional

        # --- D. One-Hot Encoding ---
        # Identifikasi kolom kategorikal otomatis
        categorical_cols = df.select_dtypes(include=['object']).columns
        
        # Lakukan get_dummies
        df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

        # --- E. ALIGNMENT (CRITICAL STEP) ---
        # Paksa DataFrame memiliki kolom yang SAMA PERSIS dengan feature_columns model
        # 1. Tambahkan kolom yang hilang (isi dengan 0/False)
        # 2. Hapus kolom ekstra yang tidak dikenal model
        # 3. Urutkan posisi kolom sesuai training
        
        df_final = df_encoded.reindex(columns=self.feature_columns, fill_value=0)
        
        return df_final

    def predict(self, input_data: dict):
        """
        Menerima dictionary data nasabah -> Mengembalikan skor prediksi
        """
        if not self.model:
            return None

        # 1. Convert Dict ke DataFrame
        df = pd.DataFrame([input_data])
        
        # 2. Preprocess
        df_processed = self.preprocess_data(df)
        
        # 3. Predict Probability
        # XGBoost output: [prob_no, prob_yes] -> kita ambil index 1
        try:
            prob = self.model.predict_proba(df_processed)[0][1]
            
            # Labeling sederhana
            label = "Potential" if prob > 0.5 else "Non-Potential"
            
            return {
                "score": float(prob),
                "label": label
            }
        except Exception as e:
            print(f"Prediction Error: {e}")
            return None

# Singleton Instance
ml_service = MLService()