import React, { useLayoutEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  Coins,
  FileText,
  Gift,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  WalletCards,
  ArrowDownToLine,
  History,
  Landmark,
  Menu,
  X,
} from "lucide-react";
import Logo from "../ui/Logo";
const items = [
  ["Dashboard", "/user/dashboard", LayoutDashboard],
  ["Profile", "/user/profile", UserRound],
  ["KYC Verification", "/user/kyc", ShieldCheck],
  ["Wallet", "/user/wallet", WalletCards],
  ["USDT Deposit", "/user/deposit", Landmark],
  ["Investments", "/user/investments", Coins],
  ["ROI / Profit", "/user/roi", History],
  ["My Tokens", "/user/tokens", Coins],
  ["Transactions", "/user/transactions", History],
  ["Buyback / Sell Tokens", "/user/buyback", Gift],
  ["Withdrawal", "/user/withdrawal", ArrowDownToLine],
  ["Notifications", "/user/notifications", Bell],
  ["Reports", "/user/reports", FileText],
  ["Security Settings", "/user/security", LockKeyhole],
];
// Each page mounts its own <UserLayout>, so this sidebar fully unmounts/remounts on every
// navigation. A module-level variable (not React state) survives that remount and lets us
// restore the exact scroll offset before the browser paints, so the list no longer jumps.
let savedScrollTop = 0;
export default function UserSidebar({ open, onClose }) {
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
        className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[284px] flex-col bg-gradient-to-b from-[#061f3a] to-[#072949] p-3 text-white shadow-xl transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[62px] items-center gap-3 px-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Logo size={40} />
          </div>
          <div>
            <div className="text-[18px] font-semibold">AMGP Token</div>
            <div className="text-[10px] font-semibold tracking-wider text-cyan-300">
              USER PANEL
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
          {items.map(([label, to, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium ${isActive ? "bg-blue-500 text-white" : "text-slate-100 hover:bg-white/10"}`
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
              <b>AMGP</b>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-sm">
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
