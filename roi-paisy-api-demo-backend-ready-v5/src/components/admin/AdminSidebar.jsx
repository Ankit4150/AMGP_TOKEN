import React, { useLayoutEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Coins,
  FileText,
  Gift,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Users,
  WalletCards,
  ArrowDownToLine,
  History,
  RefreshCcw,
  ScrollText,
  X,
} from "lucide-react";
import { hasPermission, useAuthStore } from "../../store/authStore";
import Logo from "../ui/Logo";
const items = [
  ["Dashboard", "/admin/dashboard", "dashboard", LayoutDashboard],
  ["User Management", "/admin/user-management", "users", Users],
  ["KYC Verification", "/admin/kyc-verification", "kyc", ShieldCheck],
  ["Token Management", "/admin/token-management", "tokens", Coins],
  ["Buyback", "/admin/buyback", "buyback", Gift],
  ["Wallets", "/admin/wallets", "wallets", WalletCards],
  ["Investment Management", "/admin/investments", "investments", BarChart3],
  ["ROI Management", "/admin/roi", "roi", RefreshCcw],
  [
    "Withdrawal Management",
    "/admin/withdrawals",
    "withdrawals",
    ArrowDownToLine,
  ],
  ["Transactions", "/admin/transactions", "transactions", History],
  ["Reconciliation", "/admin/reconciliation", "reconciliation", RefreshCcw],
  ["Audit Logs", "/admin/audit-logs", "auditLogs", ScrollText],
  ["Notifications", "/admin/notifications", "notifications", Bell],
  ["Reports", "/admin/reports", "reports", FileText],
  ["Access Control", "/admin/access-control", "accessControl", KeyRound],
  ["Settings", "/admin/settings", "settings", Settings],
];
// Each page mounts its own <AdminLayout>, so this sidebar fully unmounts/remounts on every
// navigation. A module-level variable (not React state) survives that remount and lets us
// restore the exact scroll offset before the browser paints, so the list no longer jumps.
let savedScrollTop = 0;
export default function AdminSidebar({ open, onClose }) {
  const role = useAuthStore((s) => s.user?.role);
  const navRef = useRef(null);
  useLayoutEffect(() => {
    if (navRef.current) navRef.current.scrollTop = savedScrollTop;
  }, []);
  const handleScroll = (e) => {
    savedScrollTop = e.currentTarget.scrollTop;
  };
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[284px] flex-col bg-gradient-to-b from-[#061f3a] to-[#072949] p-3 text-white shadow-xl transition-transform lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[62px] items-center gap-3 px-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Logo size={40} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-semibold">AMGP Token</div>
            <div className="truncate text-[10px] font-semibold tracking-wider text-amber-400">
              ADMIN PANEL
            </div>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden">
            <X size={20} />
          </button>
        </div>
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items
            .filter(([, , p]) => hasPermission(role, p))
            .map(([label, to, p, Icon]) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition ${isActive ? "bg-blue-500 text-white shadow-md" : "text-slate-100 hover:bg-white/10"}`
                }
              >
                <Icon size={20} />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
        </nav>
        <div className="mt-3 rounded-xl border border-blue-300/20 bg-blue-400/10 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500">
              <Coins size={20} />
            </div>
            <div>
              <span className="block text-xs text-blue-100">Native Token</span>
              <b className="text-sm">AMGP</b>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <strong>$0.50</strong>
            <em className="not-italic font-semibold text-emerald-400">
              +2.40%
            </em>
          </div>
        </div>
      </aside>
    </>
  );
}
