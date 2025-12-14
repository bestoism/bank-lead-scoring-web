import pandas as pd
import pickle
import json
import os
import shap  # pip install shap

class MLService:
    def __init__(self):
        self.model = None
        self.feature_columns = None
        self.explainer = None

        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.artifacts_path = os.path.join(self.base_path, "../../ml_artifacts")

        self.load_artifacts()

    def load_artifacts(self):
        """Load model, feature list, dan inisialisasi SHAP"""
        try:
            # 1. Load Model
            model_path = os.path.join(self.artifacts_path, "xgboost_tuned_v2.pkl")
            with open(model_path, "rb") as f:
                self.model = pickle.load(f)

            # 2. Load feature columns
            features_path = os.path.join(self.artifacts_path, "model_features.json")
            with open(features_path, "r") as f:
                self.feature_columns = json.load(f)

            # NOTE: jangan ubah format nama fitur di sini — model disimpan dengan nama fitur
            # yang sama seperti saat pelatihan (mengandung titik). Biarkan self.feature_columns
            # seperti di model_features.json supaya reindex menghasilkan kolom yang cocok
            # dengan model.

            # 3. Init SHAP Explainer (sekali saja)
            self.explainer = shap.TreeExplainer(self.model)

            print(f"✅ ML Artifacts loaded ({len(self.feature_columns)} features)")
            print("✅ SHAP Explainer initialized")

        except Exception as e:
            print(f"❌ Error loading ML artifacts: {e}")

    def preprocess_data(self, input_df: pd.DataFrame) -> pd.DataFrame:
        df = input_df.copy()

        # --- A. Drop Duration (Anti Data Leakage) ---
        if 'duration' in df.columns:
            df = df.drop(columns=['duration'])

        # --- B. Feature Engineering ---
        # pdays: 999 -> 0 (belum), others -> 1 (sudah)
        if 'pdays' in df.columns:
            df['pernah_dihubungi'] = df['pdays'].apply(lambda x: 0 if x == 999 else 1)
            df = df.drop(columns=['pdays'])

        # --- FIX UTAMA: KEMBALIKAN NAMA KOLOM KE FORMAT MODEL (TITIK) ---
        # Database/API pakai underscore (emp_var_rate), tapi Model pakai titik (emp.var.rate)
        rename_dict = {
            "emp_var_rate": "emp.var.rate",
            "cons_price_idx": "cons.price.idx",
            "cons_conf_idx": "cons.conf.idx",
            "nr_employed": "nr.employed",
            # Handle kolom One-Hot yang mungkin kena replace juga (Jaga-jaga)
            "job_blue-collar": "job_blue-collar", # Biasanya aman
            "education_high_school": "education_high.school",
            "education_basic_9y": "education_basic.9y",
            "education_basic_6y": "education_basic.6y",
            "education_university_degree": "education_university.degree",
            "education_professional_course": "education_professional.course",
        }
        df = df.rename(columns=rename_dict)
        
        # --- C. One-Hot Encoding ---
        categorical_cols = df.select_dtypes(include=['object']).columns
        df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
        
        # --- FIX KEDUA: PASTIIN KOLOM HASIL ONE-HOT JUGA PAKAI TITIK ---
        # Kadang get_dummies menghasilkan underscore jika input value ada underscore
        # Kita paksa rename lagi sesuai feature_columns model
        df_encoded.columns = df_encoded.columns.str.replace('education_high_school', 'education_high.school')
        df_encoded.columns = df_encoded.columns.str.replace('education_basic_9y', 'education_basic.9y')
        df_encoded.columns = df_encoded.columns.str.replace('education_basic_6y', 'education_basic.6y')
        df_encoded.columns = df_encoded.columns.str.replace('education_university_degree', 'education_university.degree')
        df_encoded.columns = df_encoded.columns.str.replace('education_professional_course', 'education_professional.course')

        # --- D. ALIGNMENT (CRITICAL STEP) ---
        # Paksa DataFrame memiliki kolom yang SAMA PERSIS dengan feature_columns model
        if self.feature_columns:
            df_final = df_encoded.reindex(columns=self.feature_columns, fill_value=0)
        else:
            print("⚠️ Warning: feature_columns not loaded, using raw encoded columns.")
            df_final = df_encoded
        
        return df_final

    def predict(self, input_data: dict):
        """
        PREDICT SAJA (TIDAK DIUBAH, backward compatible)
        """
        if not self.model:
            return None

        df = pd.DataFrame([input_data])
        df_processed = self.preprocess_data(df)

        try:
            prob = self.model.predict_proba(df_processed)[0][1]
            label = "Potential" if prob > 0.5 else "Non-Potential"

            return {
                "score": float(prob),
                "label": label
            }

        except Exception as e:
            print(f"Prediction Error: {e}")
            return None

    # ==============================
    # === BAGIAN BARU (REVISI) ===
    # ==============================

    def generate_recommendation(self, row_data: dict, top_features: list) -> str:
        """
        Rule-Based Recommendation Script berbasis SHAP
        """
        script = "Halo Bapak/Ibu, "

        top_feature_name = top_features[0][0]

        if "euribor3m" in top_feature_name:
            script += (
                "saat ini kondisi suku bunga pasar sedang sangat mendukung. "
                "Ini momen tepat untuk mengunci nilai deposito Anda."
            )
        elif "nr_employed" in top_feature_name:
            script += (
                "melihat kondisi ekonomi yang sedang aktif, "
                "kami memiliki penawaran investasi yang aman."
            )
        elif "contact" in top_feature_name:
            script += (
                "kami menghubungi melalui seluler karena ada kemudahan "
                "akses prioritas untuk Anda."
            )
        elif "poutcome_success" in top_feature_name:
            script += (
                "terima kasih atas kepercayaan Anda sebelumnya. "
                "Kami memiliki penawaran eksklusif lanjutan."
            )
        else:
            script += (
                "kami melihat profil finansial Anda sangat cocok "
                "untuk program Deposito Berjangka premium kami."
            )

        script += " Apakah boleh saya jelaskan simulasinya sebentar?"
        return script

    def predict_and_explain(self, input_data: dict):
        """
        SUPER FUNCTION:
        - Prediksi
        - SHAP Explainability
        - Recommendation Script
        """
        if not self.model or not self.explainer:
            return None

        # 1. Preprocess
        df = pd.DataFrame([input_data])
        df_processed = self.preprocess_data(df)

        # 2. Predict
        prob = self.model.predict_proba(df_processed)[0][1]
        label = "Potential" if prob > 0.5 else "Non-Potential"

        # 3. SHAP values
        shap_values = self.explainer.shap_values(df_processed)

        feature_importance = dict(
            zip(df_processed.columns, shap_values[0])
        )

        # Urutkan kontribusi positif
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )

        top_3_positive = [f for f in sorted_features if f[1] > 0][:3]

        # 4. Generate script
        script = self.generate_recommendation(
            input_data,
            top_3_positive if top_3_positive else [("general", 0)]
        )

        return {
    "score": float(prob),
    "label": label,
    "shap_json": json.dumps(
        {k: float(v) for k, v in feature_importance.items()}
    ),
    "script": script
}



# Singleton
ml_service = MLService()
