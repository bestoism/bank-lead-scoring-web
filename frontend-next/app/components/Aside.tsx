import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useEffect } from "react";

export default function Aside() {
    const pathname = usePathname();
   
  return (
    <aside className="w-64 bg-[#1e293b] h-full text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-wider text-green-400">SMART<span className="text-white">CONVERT</span></h2>
          <p className="text-xs text-gray-400 mt-1">Predictive Lead Scoring</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium shadow-lg shadow-green-900/20 transition text-white ${pathname === "/" ? "bg-green-600" : " "}`}>
            <span>📊</span> Leads Data
          </a>
          <a href="/analytics" className={`flex items-center gap-3 px-4 py-3 text-white hover:text-white rounded-lg text-sm font-medium transition ${pathname === "/analytics" ? "bg-green-600" : ""}`}>
            <span>📈</span> Analytics
          </a>
          <Link href="/profile" className={`flex items-center gap-3 px-4 py-3 text-white hover:text-white rounded-lg text-sm font-medium transition ${pathname === "/profile" ? "bg-green-600" : ""}`}>
            <span>👤</span> My Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium w-full px-4 py-2">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    );
}