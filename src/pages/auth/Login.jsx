import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  UserRound,
  LockKeyhole,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Logo from "../../components/ui/Logo";
import ThemeToggle from "../../components/ui/ThemeToggle";

const DEMO_ADMIN_ACCOUNTS = [
  {
    role: "Super Admin",
    email: "superadmin@example.com",
    password: "admin123",
    description: "Full platform access",
  },
  {
    role: "Operations Admin",
    email: "operations@example.com",
    password: "admin123",
    description: "Investment + ROI operations",
  },
  {
    role: "Finance Admin",
    email: "finance@example.com",
    password: "admin123",
    description: "Buyback + withdrawals + reconciliation",
  },
  {
    role: "Compliance Admin",
    email: "compliance@example.com",
    password: "admin123",
    description: "KYC + compliance",
  },
  {
    role: "Support Admin",
    email: "support@example.com",
    password: "admin123",
    description: "User support",
  },
];

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState(
    loc.pathname === "/admin-login"
      ? "superadmin@example.com"
      : "user@example.com",
  );
  const [password, setPassword] = useState(
    loc.pathname === "/admin-login" ? "admin123" : "user123",
  );
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(loc.pathname === "/admin-login");

  const fillAccount = (account) => {
    setAdmin(true);
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    if (loc.pathname !== "/admin-login") nav("/admin-login", { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (!r.success) {
      setError(r.error);
      return;
    }
    const role = r.user.role;
    if (admin && role === "user") {
      useAuthStore.getState().logout();
      setError("This account is not an admin account.");
      return;
    }
    if (!admin && role !== "user") {
      useAuthStore.getState().logout();
      setError("Admin accounts must use Admin Sign In.");
      return;
    }
    nav(role === "user" ? "/user/dashboard" : "/admin/dashboard", {
      replace: true,
    });
  };
  const chooseAdmin = () => {
    setAdmin(true);
    setEmail("superadmin@example.com");
    setPassword("admin123");
    nav("/admin-login", { replace: true });
  };
  const chooseUser = () => {
    setAdmin(false);
    setEmail("user@example.com");
    setPassword("user123");
    nav("/login", { replace: true });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-[#f5f9fe] via-white to-[#edf6ff] p-4 dark:bg-[#070f1e] dark:bg-none">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-sky-100/70 blur-2xl dark:bg-cyan-500/10" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-100/60 blur-2xl dark:bg-blue-500/10" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-[500px] py-4">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold text-[#112f54] dark:text-slate-50">
            AMGP Token
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Native Token · ROI · Buyback
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur sm:p-7 dark:border-white/10 dark:bg-[#0c1a30]/95 dark:shadow-black/40">
          <div className="mb-4 flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl ${admin ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-500"}`}
            >
              {admin ? <ShieldCheck /> : <UserRound />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#112f54] dark:text-slate-50">
                {admin ? "Admin Sign In" : "Sign In"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {admin
                  ? "Role-based access is enforced for every admin route."
                  : "Access your investment and token dashboard."}
              </p>
            </div>
          </div>
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-[11px] ${admin ? "border-violet-100 bg-violet-50 text-violet-700" : "border-sky-100 bg-sky-50 text-sky-700"}`}
          >
            {admin
              ? "Choose a demo admin below to test each role's module access."
              : "You will be redirected according to your account role."}
          </div>
          {error && (
            <div className="mb-4 flex gap-2 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs text-rose-600">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Email
              </span>
              <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 focus-within:bg-white dark:border-white/10 dark:bg-[#0a1830]">
                <UserRound size={16} className="text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-100"
                  type="email"
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Password
              </span>
              <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 focus-within:bg-white dark:border-white/10 dark:bg-[#0a1830]">
                <LockKeyhole size={16} className="text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-100"
                  type={show ? "text" : "password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="text-slate-400"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <button
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/15 disabled:opacity-60 dark:from-cyan-500 dark:to-blue-500"
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight size={16} />
            </button>
          </form>
          {admin && (
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
              <div className="mb-2 flex items-center justify-between">
                <p className="m-0 text-xs font-bold text-slate-700 dark:text-slate-200">
                  Demo Admin Accounts
                </p>
                <span className="text-[9px] text-slate-400">
                  For local/demo testing only
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEMO_ADMIN_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillAccount(account)}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-[#0a1830] dark:hover:bg-[#102342]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-100">
                        {account.role}
                      </span>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <p className="m-0 mt-1 truncate text-[9px] text-slate-500 dark:text-slate-400">
                      {account.email}
                    </p>
                    <p className="m-0 mt-1 text-[9px] text-slate-400">
                      Password:{" "}
                      <strong className="text-slate-500 dark:text-slate-300">
                        {account.password}
                      </strong>
                    </p>
                    <p className="m-0 mt-1 text-[9px] text-slate-400">
                      {account.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 flex justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            {admin ? (
              <>
                Not an admin?{" "}
                <button
                  onClick={chooseUser}
                  className="font-semibold text-blue-600"
                >
                  User Sign In
                </button>
              </>
            ) : (
              <>
                Are you admin?{" "}
                <button
                  onClick={chooseAdmin}
                  className="font-semibold text-blue-600"
                >
                  Admin Sign In
                </button>
              </>
            )}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 dark:border-white/10">
            <strong className="text-slate-500">Demo user:</strong>{" "}
            user@example.com / user123
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
          Demo credentials are only for this local mock environment. Use secure
          hashed credentials and server-side RBAC in production.
        </p>
      </div>
    </div>
  );
}
