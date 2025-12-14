"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface CustomerDetail {
  id: number;
  age: number;
  job: string;
  marital: string;
  education: string;
  default: string;
  housing: string;
  loan: string;
  contact: string;
  prediction_score: number;
  prediction_label: string;
  shap_values_json: string;
  recommendation_script: string;
  lead_status: string;
  sales_notes: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [shapData, setShapData] = useState<[string, number][]>([]);

  // URL Backend
  const API_URL = "http://127.0.0.1:8000/api/v1";

  useEffect(() => {
    // Safety check: pastikan params.id ada
    if (!params?.id) return;
    fetchDetail();
  }, [params.id]);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${API_URL}/customers/${params.id}`);
      if (!res.ok) throw new Error("Nasabah tidak ditemukan");
      const data = await res.json();
      setCustomer(data);

      // Parsing SHAP JSON String menjadi Array untuk ditampilkan
      if (data.shap_values_json && data.shap_values_json !== "null") {
        try {
          const parsedShap = JSON.parse(data.shap_values_json);
          // Konversi ke array [key, value], urutkan berdasarkan impact mutlak terbesar
          const sortedShap = Object.entries(parsedShap)
            .map(([k, v]) => [k, v as number] as [string, number])
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 5); // Ambil Top 5 Faktor
          setShapData(sortedShap);
        } catch (e) {
          console.warn("Gagal parse SHAP:", e);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!customer) return;
    try {
      const res = await fetch(`${API_URL}/customers/${customer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_status: newStatus, sales_notes: "Updated via CRM" }),
      });
      if (res.ok) {
        fetchDetail(); // Refresh data
      }
    } catch (error) {
      alert("Gagal update status");
    }
  };

  if (loading) return <div className="p-10 text-center text-blue-600 animate-pulse">Loading AI Analysis...</div>;
  if (!customer) return <div className="p-10 text-center text-gray-500">Data not found (ID: {params.id}).</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigasi Balik */}
        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 mb-4 inline-block font-medium">
          ← Back to Dashboard
        </Link>

        {/* Header Profil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-800">Nasabah #{customer.id}</h1>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                    customer.lead_status === 'NEW' ? 'bg-blue-100 text-blue-800' : 
                    customer.lead_status === 'CLOSED' ? 'bg-green-100 text-green-800' : 
                    customer.lead_status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100'
                }`}>
                    {customer.lead_status}
                </span>
            </div>
            <p className="text-gray-500 capitalize">{customer.job} • {customer.marital} • {customer.education}</p>
          </div>
          <div className="text-right">
             <div className="text-sm text-gray-400 mb-1">AI Score</div>
             <div className={`text-3xl font-bold ${customer.prediction_label === 'Potential' ? 'text-green-600' : 'text-gray-400'}`}>
                {(customer.prediction_score * 100).toFixed(1)}%
             </div>
             <div className="text-xs font-medium text-gray-500">{customer.prediction_label}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
          {/* KOLOM 1: AI EXPLANATION (SHAP) */}
          <div className="md:col-span-2 space-y-6">
            {/* Kartu Script Rekomendasi */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h3 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
                    💬 AI Recommendation Script
                </h3>
                <p className="text-blue-800 italic leading-relaxed">
                    "{customer.recommendation_script || "Tidak ada rekomendasi spesifik."}"
                </p>
            </div>

            {/* Kartu Faktor Penentu */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Kenapa Skor Nasabah Ini Sekian? (Top 5 Factors)</h3>
                <div className="space-y-3">
                    {shapData.map(([feature, impact], idx) => (
                        <div key={idx} className="flex items-center text-sm">
                            <div className="w-48 font-medium text-gray-600 truncate mr-4" title={feature}>
                                {feature}
                            </div>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${impact > 0 ? 'bg-green-500' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(Math.abs(impact) * 50, 100)}%` }}
                                ></div>
                            </div>
                            <div className={`w-16 text-right font-mono ${impact > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {impact > 0 ? '+' : ''}{impact.toFixed(3)}
                            </div>
                        </div>
                    ))}
                    {shapData.length === 0 && <p className="text-sm text-gray-400">Data SHAP belum tersedia.</p>}
                </div>
                <p className="text-xs text-gray-400 mt-4">*Hijau = Meningkatkan peluang deposit, Merah = Menurunkan.</p>
            </div>
          </div>

          {/* KOLOM 2: ACTIONS */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Sales Actions</h3>
                
                <div className="space-y-3">
                    <button 
                        onClick={() => updateStatus("CONTACTED")}
                        disabled={customer.lead_status === 'CONTACTED' || customer.lead_status === 'CLOSED'}
                        className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        📞 Mark as Contacted
                    </button>
                    
                    <button 
                        onClick={() => updateStatus("CLOSED")}
                        disabled={customer.lead_status === 'CLOSED'}
                        className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ✅ Deal / Closed
                    </button>
                    
                    <button 
                        onClick={() => updateStatus("REJECTED")}
                        className="w-full py-2 px-4 bg-red-50 text-red-600 border border-red-100 font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                        ❌ Customer Refused
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-2">Customer Data</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex justify-between border-b border-gray-50 pb-2">
                        <span>Housing Loan:</span>
                        <span className="font-medium text-gray-900 capitalize">{customer.housing}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-50 pb-2">
                        <span>Personal Loan:</span>
                        <span className="font-medium text-gray-900 capitalize">{customer.loan}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-50 pb-2">
                        <span>Contact Type:</span>
                        <span className="font-medium text-gray-900 capitalize">{customer.contact}</span>
                    </li>
                    <li className="flex justify-between">
                        <span>Default Credit:</span>
                        <span className="font-medium text-gray-900 capitalize">{customer.default}</span>
                    </li>
                </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}