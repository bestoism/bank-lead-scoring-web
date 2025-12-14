"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// --- tambahkan interface User ---
interface User {
  name: string;
  role: string;
  email: string;
  phone: string;
  branch: string;
  joined: string;
  avatar_initial: string;
  employee_id?: string;
  department?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const handleSignOut = () => {
    router.push("/");
  };

  const API_URL = "http://127.0.0.1:8000/api/v1";

  // Fetch profile from backend and keep in state
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // initialize editableUser with safe defaults to avoid "possibly null" errors
  const [editableUser, setEditableUser] = useState<User>({
    name: "",
    role: "",
    email: "",
    phone: "",
    branch: "",
    joined: "",
    avatar_initial: "",
    employee_id: "",
    department: "",
  });

  // Mock KPI (will be used for CSV download) — you can also fetch from API later
  const [performance] = useState({
    total_calls: 342,
    successful_deals: 48,
    conversion_rate: 14.2,
    target_achievement: 92
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/profile`);
        if (!res.ok) throw new Error("Failed to fetch profile");
        const j = await res.json();
        setUser(j);
        // assert j has required fields (backend response shape)
        setEditableUser({
          name: j.name ?? "",
          role: j.role ?? "",
          email: j.email ?? "",
          phone: j.phone ?? "",
          branch: j.branch ?? "",
          joined: j.joined ?? "",
          avatar_initial: j.avatar_initial ?? "",
          employee_id: j.employee_id ?? "",
          department: j.department ?? "",
        });
      } catch (e) {
        console.error("Failed fetch profile", e);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  const [activeTab, setActiveTab] = useState("overview");

  // --- Settings state ---
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifDaily, setNotifDaily] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangePassword = async () => {
    if (!password) return setMessage("Enter new password");
    if (password !== confirmPassword) return setMessage("Passwords do not match");
    setSaving(true);
    // TODO: call backend API to change password
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setPassword("");
    setConfirmPassword("");
    setMessage("Password updated");
  };

  const toggleTwoFA = async () => {
    setSaving(true);
    // TODO: call backend to enable/disable 2FA
    await new Promise((r) => setTimeout(r, 500));
    setTwoFaEnabled((s) => !s);
    setSaving(false);
    setMessage(twoFaEnabled ? "Two-factor disabled" : "Two-factor enabled");
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    // TODO: persist notification preferences to backend
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setMessage("Settings saved");
  };

  const handleCancelSettings = () => {
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  };

  // --- Download KPI (CSV) ---
  const handleDownloadKPI = () => {
    setSaving(true);
    try {
      const period = new Date().toISOString().slice(0, 10);
      const kpi = {
        name: user?.name ?? "Unknown",
        email: user?.email ?? "",
        period,
        total_calls: performance.total_calls,
        successful_deals: performance.successful_deals,
        conversion_rate: performance.conversion_rate,
        target_achievement: performance.target_achievement,
      };

      const header = ["field", "value"];
      const rows = Object.entries(kpi).map(([k, v]) => [k, String(v)]);
      // gunakan ; sebagai pemisah agar aman bila nilai mengandung koma
      const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filenameName = (user?.name ?? "unknown").replace(/\s+/g, "_");
      a.download = `kpi_${filenameName}_${period}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("KPI downloaded");
    } catch (e) {
      console.error("Download KPI failed:", e);
      setMessage("Failed to download KPI");
    } finally {
      setSaving(false);
    }
  };

  // --- Sidebar component lokal untuk konsistensi (sama dengan Dashboard) ---
  const Sidebar = () => {
    const pathname = usePathname() || "/";
    const isActive = (path: string) =>
      path === "/"
        ? pathname === "/"
        : pathname === path || pathname.startsWith(path);

    const linkClass = (active: boolean) =>
      active
        ? "flex items-center gap-3 px-4 py-3 bg-green-600 rounded-lg text-sm font-medium shadow-lg shadow-green-900/20"
        : "flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition";

    return (
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-wider text-green-400">
            SMART<span className="text-white">CONVERT</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Predictive Lead Scoring</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4" role="navigation" aria-label="Main">
          <Link href="/" className={linkClass(isActive("/"))}>
            <span>📊</span> Leads Data
          </Link>

          <Link href="/analytics" className={linkClass(isActive("/analytics"))}>
            <span>📈</span> Analytics
          </Link>

          <Link href="/profile" className={linkClass(isActive("/profile"))}>
            <span>👤</span> My Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button onClick={handleSignOut} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium w-full px-4 py-2">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    );
  };

  // --- Edit profile state & handlers ---
  const [editing, setEditing] = useState(false);
  const handleEditToggle = () => {
    // copy current user into editableUser (guard null)
    if (user) {
      setEditableUser({ ...user });
    }
    setEditing((s) => !s);
    setMessage("");
  };

  const handleChange = (key: keyof User, value: string) => {
    setEditableUser((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    if (!editableUser.name?.trim()) {
      setMessage("Full name required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableUser),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Save failed");
        setMessage(`Save failed: ${text}`);
        setSaving(false);
        return;
      }
      const updated = await res.json();
      // update React state (do not mutate)
      setUser(updated);
      setEditableUser({
        name: updated.name ?? "",
        role: updated.role ?? "",
        email: updated.email ?? "",
        phone: updated.phone ?? "",
        branch: updated.branch ?? "",
        joined: updated.joined ?? "",
        avatar_initial: updated.avatar_initial ?? "",
        employee_id: updated.employee_id ?? "",
        department: updated.department ?? "",
      });
      setMessage("Profile updated");
      setEditing(false);
    } catch (e) {
      console.error(e);
      setMessage("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // avoid "user is possibly null" errors — show loading / not-found early
  if (loadingUser) {
    return <div className="p-6 text-center">Loading profile...</div>;
  }
  if (!user) {
    return <div className="p-6 text-center">Profile not found.</div>;
  }

  return (
    <div className="min-h-screen  bg-gray-50 font-sans">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {/* Topbar for small screens */}
          <div className="lg:hidden bg-white border-b p-4 flex items-center justify-between">
            <div className="text-lg font-semibold">Profile</div>
            <Link href="/" className="text-sm text-gray-600">Dashboard</Link>
          </div>

          {/* NOTE: banner dihapus — kartu profil sekarang di posisi normal */}
          <div className="max-w-6xl mx-auto px-6 mt-8">
            {/* grid: single column mobile, 3 cols desktop; items aligned to top */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
               {/* PROFILE CARD */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-xl shadow p-6 border">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-700">
                      {user?.avatar_initial}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                      <p className="text-sm text-gray-500">{user?.role}</p>
                      <p className="text-xs text-gray-400 mt-2">{user?.branch}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><span>📧</span> {user?.email}</div>
                    <div className="flex items-center gap-2"><span>📱</span> {user?.phone}</div>
                    <div className="flex items-center gap-2"><span>📅</span> Joined {user?.joined}</div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    {editing ? (
                      <>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save Profile"}
                        </button>
                        <button onClick={handleEditToggle} className="px-4 py-2 border rounded">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={handleEditToggle} className="flex-1 px-4 py-2 bg-white border rounded text-gray-700">
                          Edit Profile
                        </button>
                        <button
                          onClick={handleDownloadKPI}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                        >
                          {saving ? "Downloading..." : "Download KPI"}
                        </button>
                      </>
                    )}
                  </div>
                  {message && <div className="mt-3 text-sm text-gray-600">{message}</div>}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="bg-white rounded-xl shadow p-4 border">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">My Performance</h4>
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between"><span>Calls</span><span className="font-bold">{performance.total_calls}</span></div>
                      <div className="h-2 bg-gray-100 rounded mt-2"><div className="h-2 bg-blue-500 w-[85%] rounded"></div></div>
                      <div className="mt-3 flex justify-between"><span>Deals</span><span className="font-bold">{performance.successful_deals}</span></div>
                      <div className="h-2 bg-gray-100 rounded mt-2"><div className="h-2 bg-green-500 w-[65%] rounded"></div></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow p-4 border">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Account Security</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex justify-between"><span>Change Password</span><span className="text-gray-400">30 days ago</span></div>
                      <div className="flex justify-between"><span>Two-Factor Auth</span><span className="text-green-600 font-bold">Enabled</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS / TABS (spans 2 cols on desktop) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                  <div className="flex border-b">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`flex-1 py-4 text-sm font-medium ${activeTab === 'overview' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('activity')}
                      className={`flex-1 py-4 text-sm font-medium ${activeTab === 'activity' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                    >
                      Recent Activity
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex-1 py-4 text-sm font-medium ${activeTab === 'settings' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                    >
                      Settings
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                          <input
                            readOnly={!editing}
                            value={editableUser.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            className={`w-full px-3 py-2 border rounded ${editing ? "bg-white" : "bg-gray-50"} text-gray-700`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Employee ID</label>
                          <input readOnly value={editableUser.employee_id ?? "EMP-2025-001"} onChange={(e) => handleChange("employee_id", e.target.value)} className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-700" />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Department</label>
                          <input readOnly={!editing} value={editableUser.department ?? "Sales & Marketing"} onChange={(e) => handleChange("department", e.target.value)} className={`w-full px-3 py-2 border rounded ${editing ? "bg-white" : "bg-gray-50"} text-gray-700`} />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Join Date</label>
                          <input readOnly={!editing} value={editableUser.joined ?? user?.joined} onChange={(e) => handleChange("joined", e.target.value)} className={`w-full px-3 py-2 border rounded ${editing ? "bg-white" : "bg-gray-50"} text-gray-700`} />
                        </div>

                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-800 mb-2">Notification Preferences</h4>
                          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="text-green-600" /> <span className="text-sm text-gray-600">Email me when a lead becomes "High Potential"</span></label>
                          <label className="flex items-center gap-2 mt-2"><input type="checkbox" defaultChecked className="text-green-600" /> <span className="text-sm text-gray-600">Daily Summary Report</span></label>
                        </div>
                      </div>
                    )}

                    {activeTab === 'activity' && (
                      <div className="space-y-4">
                        {[1,2,3,4].map((i) => {
                          const custId = i * 24;
                          return (
                            <div key={i} className="flex gap-4 items-start pb-4 border-b last:border-0">
                              <div className="w-2 h-2 mt-2 rounded-full bg-gray-300"></div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">You updated the status of <span className="font-bold">Nasabah-{custId}</span> to <span className="text-green-600 font-bold">Closed</span>.</p>
                                <p className="text-xs text-gray-400">2 hours ago</p>
                              </div>

                              <div className="flex items-center">
                                <Link
                                  href={`/customers/${custId}`}
                                  className="px-3 py-1.5 bg-[#2d3748] hover:bg-black text-white text-xs font-medium rounded transition shadow-sm"
                                  aria-label={`View Nasabah ${custId} detail`}
                                >
                                  Detail
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {activeTab === 'settings' && (
                      <div className="space-y-6">
                        <h4 className="font-semibold text-gray-800">Account Settings</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Change password */}
                          <div className="bg-white p-4 border rounded-lg">
                            <label className="block text-sm text-gray-700 mb-2">Change Password</label>
                            <input
                              type="password"
                              placeholder="New password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-3 py-2 border rounded mb-2"
                            />
                            <input
                              type="password"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 border rounded mb-3"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleChangePassword}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 text-white rounded"
                              >
                                Update Password
                              </button>
                              <button onClick={() => { setPassword(""); setConfirmPassword(""); setMessage(""); }} className="px-4 py-2 border rounded">
                                Reset
                              </button>
                            </div>
                          </div>

                          {/* Two-Factor Auth */}
                          <div className="bg-white p-4 border rounded-lg">
                            <label className="block text-sm text-gray-700 mb-2">Two-Factor Authentication</label>
                            <p className="text-sm text-gray-500 mb-3">Protect your account with an additional verification step.</p>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={toggleTwoFA}
                                disabled={saving}
                                className={`px-4 py-2 rounded ${twoFaEnabled ? 'bg-red-100 text-red-700 border' : 'bg-green-600 text-white'}`}
                              >
                                {twoFaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                              </button>
                              <div className="text-sm">
                                <div className="font-medium">{twoFaEnabled ? 'Enabled' : 'Disabled'}</div>
                                <div className="text-gray-500">Use authenticator app for login</div>
                              </div>
                            </div>
                            {twoFaEnabled && (
                              <div className="mt-3 text-xs text-gray-600">
                                Recovery codes: <span className="font-mono ml-2">•••• •••• ••••</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notification preferences */}
                        <div className="bg-white p-4 border rounded-lg">
                          <h5 className="font-medium text-gray-800 mb-3">Notification Preferences</h5>
                          <label className="flex items-center gap-3 mb-2">
                            <input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} />
                            <span className="text-sm text-gray-600">Email me when a lead becomes "High Potential"</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input type="checkbox" checked={notifDaily} onChange={(e) => setNotifDaily(e.target.checked)} />
                            <span className="text-sm text-gray-600">Daily summary report</span>
                          </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button onClick={handleSaveSettings} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">Save Settings</button>
                          <button onClick={handleCancelSettings} className="px-4 py-2 border rounded">Cancel</button>
                          {message && <div className="text-sm text-gray-600 ml-3">{message}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer small notes */}
            <div className="mt-8 text-sm text-gray-500">© 2025 SMARTCONVERT</div>
          </div>
        </main>
      </div>
    </div>
  );
}