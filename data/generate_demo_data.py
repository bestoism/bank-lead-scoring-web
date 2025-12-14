import pandas as pd

# 1. Konfigurasi
INPUT_FILE = 'data/bank-additional-full.csv'  # Pastikan path ini benar sesuai lokasi file aslimu
OUTPUT_FILE = 'demo_high_potential.csv'
TARGET_COUNT = 1000  # Total data yang mau diambil

# 2. Baca Data Asli
print("Membaca data asli...")
# Dataset bank marketing biasanya pakai separator titik koma (;)
df = pd.read_csv(INPUT_FILE, sep=';') 

# 3. Filter Data 'YES' (Ini yang nanti skornya bakal tinggi)
df_yes = df[df['y'] == 'yes']

# 4. Filter Data 'NO' (Ini yang skornya bakal rendah/sedang)
df_no = df[df['y'] == 'no']

print(f"Total Data Asli -> Yes: {len(df_yes)}, No: {len(df_no)}")

# 5. Ambil Campuran (Misal: 500 Yes + 500 No)
# Kita ambil 50% dari jatah target untuk 'Yes' agar dashboard terlihat hijau
count_yes = int(TARGET_COUNT * 0.5) 
count_no = TARGET_COUNT - count_yes

df_sample_yes = df_yes.sample(n=count_yes, random_state=42)
df_sample_no = df_no.sample(n=count_no, random_state=42)

# 6. Gabungkan dan Acak Urutannya
df_final = pd.concat([df_sample_yes, df_sample_no])
df_final = df_final.sample(frac=1, random_state=42).reset_index(drop=True)

# 7. (PENTING) Hapus kolom Target 'y' 
# Karena ini simulasi "Data Baru" yang belum ditelepon, 
# jadi sales tidak boleh tahu hasilnya duluan.
if 'y' in df_final.columns:
    df_final = df_final.drop(columns=['y'])

# 8. Simpan ke CSV baru
# Kita simpan pakai koma (,) biar standar, atau titik koma (;) sesuai selera.
# Kode backend kita yang terakhir sudah support auto-detect.
df_final.to_csv(OUTPUT_FILE, sep=';', index=False)

print(f"\nBerhasil membuat file '{OUTPUT_FILE}'")
print(f"Total baris: {len(df_final)}")
print(f"Komposisi rahasia: {count_yes} Potential (Ex-Yes), {count_no} Regular (Ex-No)")
print("Silakan upload file ini ke Dashboard!")