"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Customer {
  id: number;
  job: string;
  marital: string;
  education: string;
  prediction_score?: number;
  prediction_label?: string;
  lead_status?: string;
  housing?: string;
  loan?: string;
  contact?: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Search
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [loanFilter, setLoanFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score_desc");
  
  // State Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const API_URL = "http://127.0.0.1:8000/api/v1";

  // 1. Fetch Data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/customers`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load customers");
        setItems(await res.json());
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Generate Unique Jobs for Filter
  const jobs = useMemo(() => {
    if (!items) return [];
    const setJobs = new Set(items.map((i) => i.job || "unknown"));
    return ["all", ...Array.from(setJobs)];
  }, [items]);

  // 3. Logic Filtering & Sorting
  const filtered = useMemo(() => {
    if (!items) return [];
    let list = items;

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          `${c.id}`.includes(q) ||
          (c.job || "").toLowerCase().includes(q) ||
          (c.lead_status || "").toLowerCase().includes(q)
      );
    }

    // Filters
    if (jobFilter !== "all") list = list.filter((c) => c.job === jobFilter);
    if (loanFilter !== "all") list = list.filter((c) => (c.loan || "").toLowerCase() === loanFilter);

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === "score_desc") return (b.prediction_score ?? 0) - (a.prediction_score ?? 0);
      if (sortBy === "score_asc") return (a.prediction_score ?? 0) - (b.prediction_score ?? 0);
      if (sortBy === "id_desc") return b.id - a.id;
      return a.id - b.id;
    });

    return list;
  }, [items, query, jobFilter, loanFilter, sortBy]);

  // 4. Pagination Slicing
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const displayed = filtered.slice((page - 1) * perPage, page * perPage);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      setItems(await res.json());
      setPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper function untuk warna progress bar
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "bg-green-500";
    if (score >= 0.4) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#1e293b] h-full text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-wider text-green-400">SMART<span className="text-white">CONVERT</span></h2>
          <p className="text-xs text-gray-400 mt-1">Predictive Lead Scoring</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-green-600 rounded-lg text-sm font-medium shadow-lg shadow-green-900/20">
            <span>📊</span> Leads Data
          </a>
          <a href="/analytics" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition">
            <span>📈</span> Analytics
          </a>
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

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
          <h1 className="text-lg font-bold text-gray-800">Leads Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
              Total: {items?.length || 0} items
            </span>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* FILTER BAR (Dark Style like Reference) */}
          <div className="bg-[#2d3748] p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-[#1a202c] border border-gray-600 text-white rounded-lg focus:outline-none focus:border-green-500 text-sm placeholder-gray-500"
                placeholder="Search name, job, status..."
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto">
              <select 
                value={jobFilter} 
                onChange={(e) => { setJobFilter(e.target.value); setPage(1); }} 
                className="px-4 py-2 bg-[#1a202c] border border-gray-600 text-gray-300 text-sm rounded-lg focus:outline-none"
              >
                {jobs.map((j) => <option key={j} value={j}>{j === "all" ? "All Jobs" : j}</option>)}
              </select>

              <select 
                value={loanFilter} 
                onChange={(e) => { setLoanFilter(e.target.value); setPage(1); }} 
                className="px-4 py-2 bg-[#1a202c] border border-gray-600 text-gray-300 text-sm rounded-lg focus:outline-none"
              >
                <option value="all">All Loans</option>
                <option value="yes">Has Loan</option>
                <option value="no">No Loan</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="px-4 py-2 bg-[#1a202c] border border-gray-600 text-gray-300 text-sm rounded-lg focus:outline-none"
              >
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
                <option value="id_desc">Newest</option>
              </select>

              <button 
                onClick={refresh} 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                ↻
              </button>
            </div>
          </div>

          {/* LIST HEADER (Label Columns) */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-green-500 text-white rounded-t-xl text-xs font-bold uppercase tracking-wider">
            <div className="col-span-4">Customer Name / Status</div>
            <div className="col-span-3">Probability Score</div>
            <div className="col-span-2">Job</div>
            <div className="col-span-2">Loan Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* LIST ITEMS */}
          <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-gray-500 animate-pulse">Loading data...</div>
            ) : displayed.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No customers found.</div>
            ) : (
              displayed.map((c) => (
                <div key={c.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition">
                  
                  {/* COL 1: Name & Status */}
                  <div className="col-span-4">
                    <h3 className="font-bold text-gray-800 text-sm">Nasabah-{c.id}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                      c.lead_status === 'NEW' ? 'text-blue-500' : 
                      c.lead_status === 'CONTACTED' ? 'text-yellow-600' :
                      c.lead_status === 'CLOSED' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {c.lead_status || "NEW LEAD"}
                    </span>
                  </div>

                  {/* COL 2: Progress Bar */}
                  <div className="col-span-3 flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      (c.prediction_score || 0) > 0.5 ? "text-green-600" : "text-gray-500"
                    }`}>
                      {c.prediction_score ? `${(c.prediction_score * 100).toFixed(0)}%` : "0%"}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getScoreColor(c.prediction_score || 0)}`} 
                        style={{ width: `${(c.prediction_score || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* COL 3: Job */}
                  <div className="col-span-2 text-sm text-gray-600 capitalize">
                    {c.job}
                  </div>

                  {/* COL 4: Loan Status */}
                  <div className="col-span-2">
                    {c.loan === 'yes' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded border border-red-200">
                        Has Loan
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded border border-gray-200">
                        No Loan
                      </span>
                    )}
                  </div>

                  {/* COL 5: Action */}
                  <div className="col-span-1 text-right">
                    <Link 
                      href={`/customers/${c.id}`} 
                      className="px-3 py-1.5 bg-[#2d3748] hover:bg-black text-white text-xs font-medium rounded transition shadow-sm"
                    >
                      Detail
                    </Link>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold">{(page - 1) * perPage + 1}</span> to <span className="font-bold">{Math.min(page * perPage, total)}</span> of {total} entries
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
              >
                &lt; Prev
              </button>
              
              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  // Logic simpel untuk pagination number (bisa diperbagus)
                  let p = i + 1;
                  if (page > 3 && totalPages > 5) p = page - 2 + i;
                  if (p > totalPages) return null;
                  
                  return (
                    <button 
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${
                        page === p ? "bg-green-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>

              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
              >
                Next &gt;
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}