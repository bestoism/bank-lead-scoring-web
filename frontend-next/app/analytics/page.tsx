"use client";

import { useEffect, useState, useMemo } from "react"; 
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface Customer {
  id: number;
  job: string;
  marital: string;
  education: string;
  age: number;
  housing: string;
  loan: string;
  campaign: number;
  prediction_score: number;
  prediction_label: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data (Ambil banyak sampel untuk statistik)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/customers?limit=2000", { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- STAT CALCULATION LOGIC ---

  const stats = useMemo(() => {
    if (!data.length) return null;

    // 1. KPI Cards
    const total = data.length;
    const high = data.filter(c => c.prediction_score > 0.7).length;
    const medium = data.filter(c => c.prediction_score >= 0.4 && c.prediction_score <= 0.7).length;
    const low = data.filter(c => c.prediction_score < 0.4).length;

    // 2. Job Distribution (Top 5 + Others)
    const jobCounts: Record<string, number> = {};
    data.forEach(c => { jobCounts[c.job] = (jobCounts[c.job] || 0) + 1 });
    const jobData = Object.entries(jobCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const topJobs = jobData.slice(0, 5);
    const otherJobs = jobData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    if (otherJobs > 0) topJobs.push({ name: 'Others', value: otherJobs });

    // 3. Score Distribution (Histogram like)
    const scoreBins = [
      { name: '0-20%', count: 0 },
      { name: '21-40%', count: 0 },
      { name: '41-60%', count: 0 },
      { name: '61-80%', count: 0 },
      { name: '81-100%', count: 0 },
    ];
    data.forEach(c => {
      const score = c.prediction_score * 100;
      if (score <= 20) scoreBins[0].count++;
      else if (score <= 40) scoreBins[1].count++;
      else if (score <= 60) scoreBins[2].count++;
      else if (score <= 80) scoreBins[3].count++;
      else scoreBins[4].count++;
    });

    // 4. Age Groups
    const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56-65': 0, '65+': 0 };
    data.forEach(c => {
      if (c.age <= 25) ageGroups['18-25']++;
      else if (c.age <= 35) ageGroups['26-35']++;
      else if (c.age <= 45) ageGroups['36-45']++;
      else if (c.age <= 55) ageGroups['46-55']++;
      else if (c.age <= 65) ageGroups['56-65']++;
      else ageGroups['65+']++;
    });
    const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));

    // 5. Financial Profile (Loans)
    const financialData = [
      { name: 'No Loans', value: data.filter(c => c.housing === 'no' && c.loan === 'no').length },
      { name: 'Housing Only', value: data.filter(c => c.housing === 'yes' && c.loan === 'no').length },
      { name: 'Personal Only', value: data.filter(c => c.housing === 'no' && c.loan === 'yes').length },
      { name: 'Double Loans', value: data.filter(c => c.housing === 'yes' && c.loan === 'yes').length },
    ];

    return { total, high, medium, low, topJobs, scoreBins, ageData, financialData };
  }, [data]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading) return <div className="p-10 text-center text-blue-500 animate-pulse">Computing Analytics...</div>;
  if (!stats) return <div className="p-10 text-center">No data available.</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
       {/* --- SIDEBAR SAMA SEPERTI DASHBOARD --- */}
       <aside className="w-64 bg-[#1e293b] text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-wider text-green-400">SMART<span className="text-white">CONVERT</span></h2>
          <p className="text-xs text-gray-400 mt-1">Analytics View</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition">
            <span>📊</span> Leads Data
          </Link>

          <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 bg-green-600 rounded-lg text-sm font-medium shadow-lg shadow-green-900/20">
            <span>📈</span> Analytics
          </Link>

          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition">
            <span>👤</span> My Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium w-full px-4 py-2">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Campaign Performance Analytics</h1>

        {/* ROW 1: KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Total Leads</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
            <h3 className="text-gray-500 text-sm font-medium">High Potential</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.high}</p>
            <p className="text-xs text-gray-400 mt-1">Score &gt; 70%</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-yellow-400">
            <h3 className="text-gray-500 text-sm font-medium">Medium Potential</h3>
            <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.medium}</p>
            <p className="text-xs text-gray-400 mt-1">Score 40% - 70%</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-red-400">
            <h3 className="text-gray-500 text-sm font-medium">Low Potential</h3>
            <p className="text-3xl font-bold text-red-500 mt-2">{stats.low}</p>
            <p className="text-xs text-gray-400 mt-1">Score &lt; 40%</p>
          </div>
        </div>

        {/* ROW 2: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Chart 1: Lead Score Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Lead Score Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.scoreBins}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Menunjukkan seberapa banyak leads yang masuk ke kategori skor tertentu.</p>
          </div>

          {/* Chart 2: Job Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Job Profiles</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topJobs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: PIE CHARTS & DEMOGRAPHICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 3: Financial Profile */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Profile (Loans)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.financialData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.financialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Age Group */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Demographics by Age Group</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}