import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
    Download,
    LogIn,
    Lock,
    Loader2,
    Users,
    ArrowLeft,
    LogOut,
    RefreshCw,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STORAGE_KEY = "mealur_admin_token";

export default function AdminPage() {
    const [token, setToken] = useState(
        () => sessionStorage.getItem(STORAGE_KEY) || ""
    );
    const [draft, setDraft] = useState("");
    const [authed, setAuthed] = useState(
        () => !!sessionStorage.getItem(STORAGE_KEY)
    );
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const fetchList = async (t) => {
        const useToken = t ?? token;
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/admin/waitlist`, {
                headers: { Authorization: `Bearer ${useToken}` },
            });
            setData(data);
            return true;
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401) {
                toast.error("Invalid admin token");
                logout();
            } else {
                toast.error("Failed to load subscribers");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const t = draft.trim();
        if (!t) return;
        setVerifying(true);
        try {
            await axios.get(`${API}/admin/waitlist`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            sessionStorage.setItem(STORAGE_KEY, t);
            setToken(t);
            setAuthed(true);
            setDraft("");
            toast.success("Welcome back");
            fetchList(t);
        } catch (err) {
            const status = err?.response?.status;
            toast.error(
                status === 401
                    ? "Invalid admin token"
                    : "Could not verify token. Try again."
            );
        } finally {
            setVerifying(false);
        }
    };

    const logout = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setToken("");
        setAuthed(false);
        setData(null);
    };

    const downloadCsv = async () => {
        try {
            const res = await axios.get(`${API}/admin/waitlist.csv`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });
            const blob = new Blob([res.data], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const stamp = new Date()
                .toISOString()
                .replace(/[:T]/g, "-")
                .slice(0, 19);
            a.download = `mealur-waitlist-${stamp}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("CSV downloaded");
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401) {
                toast.error("Session expired. Please sign in again.");
                logout();
            } else {
                toast.error("Could not download CSV");
            }
        }
    };

    React.useEffect(() => {
        if (authed && !data) fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authed]);

    if (!authed) {
        return (
            <div className="mealur-bg mealur-grain relative min-h-screen flex items-center justify-center px-6">
                <Toaster position="top-center" theme="light" />
                <motion.form
                    onSubmit={handleLogin}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 w-full max-w-md rounded-3xl bg-white/85 backdrop-blur-xl border border-[#EEDDCA] shadow-[0_30px_60px_-20px_rgba(44,36,33,0.18)] p-8"
                    data-testid="admin-login-form"
                >
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-medium text-[#6E5E58] hover:text-[#2C2421] transition-colors mb-6"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to landing
                    </a>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFEFE3]">
                            <Lock className="h-5 w-5 text-[#E05A3D]" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-semibold text-[#2C2421] tracking-tight">
                                Admin Access
                            </h1>
                            <p className="text-sm text-[#6E5E58]">
                                Enter your admin token to view subscribers.
                            </p>
                        </div>
                    </div>

                    <label
                        htmlFor="admin-token"
                        className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#6E5E58] mb-2"
                    >
                        Admin Token
                    </label>
                    <input
                        id="admin-token"
                        type="password"
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Paste your admin token"
                        data-testid="admin-token-input"
                        className="w-full h-12 rounded-xl bg-white border border-[#EEDDCA] px-4 text-[#2C2421] placeholder:text-[#b8a599] outline-none focus:border-[#E05A3D] focus:ring-2 focus:ring-[#E05A3D]/15 transition-all"
                    />

                    <button
                        type="submit"
                        disabled={verifying || !draft.trim()}
                        data-testid="admin-login-button"
                        className="cta-glow mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E05A3D] h-12 text-white font-medium shadow-[0_10px_24px_-10px_rgba(224,90,61,0.7)] transition-all duration-300 hover:bg-[#C94A2F] hover:-translate-y-[1px] disabled:opacity-60 disabled:translate-y-0"
                    >
                        {verifying ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Verifying
                            </>
                        ) : (
                            <>
                                <LogIn className="h-4 w-4" />
                                Sign in
                            </>
                        )}
                    </button>

                    <p className="mt-4 text-xs text-[#8a776f]">
                        Token is configured in <code>backend/.env</code> as{" "}
                        <code>ADMIN_TOKEN</code>.
                    </p>
                </motion.form>
            </div>
        );
    }

    return (
        <div className="mealur-bg mealur-grain relative min-h-screen">
            <Toaster position="top-center" theme="light" />
            <div className="relative z-10 mx-auto max-w-5xl px-6 md:px-10 py-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <a
                        href="/"
                        className="flex items-center gap-2"
                        data-testid="admin-brand-logo"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2C2421] text-white font-display font-bold text-lg">
                            M
                        </span>
                        <span className="font-display text-xl font-semibold tracking-tight text-[#2C2421]">
                            MEALUR
                        </span>
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E05A3D] bg-[#FFEFE3] px-2 py-1 rounded-full">
                            Admin
                        </span>
                    </a>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchList()}
                            disabled={loading}
                            className="inline-flex items-center gap-2 h-10 rounded-xl bg-white border border-[#EEDDCA] px-4 text-sm font-medium text-[#2C2421] hover:bg-[#FFF8F3] transition-colors disabled:opacity-60"
                            data-testid="admin-refresh-button"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </button>
                        <button
                            onClick={downloadCsv}
                            disabled={!data || data.count === 0}
                            data-testid="admin-download-csv-button"
                            className="inline-flex items-center gap-2 h-10 rounded-xl bg-[#E05A3D] px-4 text-sm font-medium text-white shadow-[0_10px_24px_-10px_rgba(224,90,61,0.7)] hover:bg-[#C94A2F] hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                            <Download className="h-4 w-4" />
                            Download CSV
                        </button>
                        <button
                            onClick={logout}
                            className="inline-flex items-center gap-2 h-10 rounded-xl bg-white border border-[#EEDDCA] px-3 text-sm font-medium text-[#6E5E58] hover:text-[#2C2421] transition-colors"
                            data-testid="admin-logout-button"
                            aria-label="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Stat card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div
                        className="rounded-2xl bg-white/85 backdrop-blur border border-[#EEDDCA] p-5"
                        data-testid="admin-total-card"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFEFE3]">
                                <Users className="h-5 w-5 text-[#E05A3D]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6E5E58]">
                                    Total subscribers
                                </p>
                                <p className="font-display text-3xl font-semibold text-[#2C2421] mt-1">
                                    {data ? data.count : "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscribers table */}
                <div
                    className="rounded-2xl bg-white/85 backdrop-blur border border-[#EEDDCA] overflow-hidden"
                    data-testid="admin-subscribers-card"
                >
                    <div className="px-5 py-4 border-b border-[#EEDDCA] flex items-center justify-between">
                        <h2 className="font-display text-lg font-semibold text-[#2C2421]">
                            Subscribers
                        </h2>
                        <span className="text-xs text-[#6E5E58]">
                            {data?.count ?? 0} total
                        </span>
                    </div>

                    {loading && !data && (
                        <div className="p-10 text-center text-[#6E5E58] flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading subscribers…
                        </div>
                    )}

                    {data && data.count === 0 && (
                        <div className="p-10 text-center text-[#6E5E58]">
                            No subscribers yet. Share your launch link!
                        </div>
                    )}

                    {data && data.count > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[#FFF8F3] text-[#6E5E58] text-[11px] uppercase tracking-[0.18em]">
                                    <tr>
                                        <th className="text-left font-bold px-5 py-3">
                                            Email
                                        </th>
                                        <th className="text-left font-bold px-5 py-3 hidden sm:table-cell">
                                            Source
                                        </th>
                                        <th className="text-left font-bold px-5 py-3">
                                            Joined
                                        </th>
                                    </tr>
                                </thead>
                                <tbody data-testid="admin-subscribers-tbody">
                                    {data.subscribers.map((s, i) => (
                                        <tr
                                            key={`${s.email}-${i}`}
                                            className="border-t border-[#EEDDCA] hover:bg-[#FFF8F3]/60 transition-colors"
                                        >
                                            <td className="px-5 py-3 font-medium text-[#2C2421]">
                                                {s.email}
                                            </td>
                                            <td className="px-5 py-3 text-[#6E5E58] hidden sm:table-cell">
                                                {s.source}
                                            </td>
                                            <td className="px-5 py-3 text-[#6E5E58]">
                                                {new Date(
                                                    s.created_at
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
