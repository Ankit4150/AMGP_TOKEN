import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight, ArrowUpRight, CheckCircle2, Clock3, Coins, ExternalLink,
  RefreshCw, ShieldAlert, TrendingUp, Users, WalletCards, XCircle,
  ArrowDownToLine, Gift, Settings2, Landmark, Activity
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/ui/StatCard";
import { getDashboardApi, getDashboardByIdApi, createDashboardApi, updateDashboardApi, deleteDashboardApi } from "../../services/admin/dashboardApi";
import { adminStats as fallbackStats, dashboardOperational as fallbackOperational, transactions as fallbackTransactions } from "../../data/mockData";

const statOrder = [
  "Total Users", "Active Users", "Total Investments", "Total USDT Invested", "Daily ROI",
  "Total Token Distributed", "Token Treasury Balance", "Buyback Volume",
  "Withdrawal Volume", "Pending Transactions", "Failed Transactions",
];

const toneByLabel = {
  "Total Users": ["users", "blue"], "Active Users": ["activeUsers", "green"],
  "Total Investments": ["totalInvestments", "blue"], "Total USDT Invested": ["investment", "cyan"], "Daily ROI": ["roi", "purple"],
  "Total Token Distributed": ["token", "purple"], "Token Treasury Balance": ["treasury", "cyan"],
  "Buyback Volume": ["buyback", "green"], "Withdrawal Volume": ["withdrawal", "orange"],
  "Pending Transactions": ["pending", "yellow"], "Failed Transactions": ["failed", "red"],
};

function normalizeStats(stats) {
  const incoming = Array.isArray(stats) ? stats : [];
  const byLabel = new Map(incoming.map((item) => [item.label, item]));
  return statOrder.map((label) => {
    const item = byLabel.get(label) || fallbackStats.find((row) => row.label === label);
    const [icon, tone] = toneByLabel[label];
    return { ...(item || {}), label, icon: item?.icon || icon, tone: item?.tone || tone, change: item?.change ?? "—", direction: item?.direction || "up" };
  });
}

function statusClasses(status) {
  const value = String(status || "").toLowerCase();
  if (["completed", "approved", "success", "released"].includes(value)) return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
  if (["failed", "rejected", "cancelled"].includes(value)) return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400";
  if (["processing", "pending"].includes(value)) return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300";
}

const quickActions = [
  ["Set Daily ROI", "/admin/roi", TrendingUp],
  ["Review KYC", "/admin/kyc-verification", ShieldAlert],
  ["Manage Tokens", "/admin/token-management", Coins],
  ["Review Buybacks", "/admin/buyback", Gift],
  ["Review Withdrawals", "/admin/withdrawals", ArrowDownToLine],
  ["Open Transactions", "/admin/transactions", Activity],
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (signal) => {
    try {
      setRefreshing(true);
      const response = await getDashboardApi({}, signal);
      const payload = response?.data ?? response ?? {};
      setData({
        stats: normalizeStats(payload?.stats),
        transactions: payload?.transactions || fallbackTransactions,
        operational: { ...fallbackOperational, ...(payload?.operational || {}) },
        treasury: payload?.treasury || { tokenBalance: "980,000 AMGP", buybackReserve: "125,000 USDT", liquidity: "420,000 AMGP / 210,000 USDT" },
      });
      setError("");
    } catch (requestError) {
      if (requestError?.name === "AbortError" || requestError?.code === "ERR_CANCELED") return;
      setError(requestError?.message || "Live dashboard data unavailable. Showing demo data.");
      setData({ stats: fallbackStats, transactions: fallbackTransactions, operational: fallbackOperational, treasury: { tokenBalance: "980,000 AMGP", buybackReserve: "125,000 USDT", liquidity: "420,000 AMGP / 210,000 USDT" } });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  const transactionRows = useMemo(() => (data?.transactions || []).slice(0, 6), [data]);

  if (!data) {
    return <AdminLayout><DashboardHeader refreshing={false} onRefresh={() => {}} /><DashboardSkeleton /></AdminLayout>;
  }

  return (
    <AdminLayout>
      <DashboardHeader refreshing={refreshing} error={error} onRefresh={() => loadDashboard()} />

      <section className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((item) => <StatCard key={item.label} item={item} />)}
      </section>

      <section className="mb-5 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-blue-600">Platform overview</p>
              <h2 className="mt-1 text-lg font-bold text-[#112f55] dark:text-white">Investment activity</h2>
              <p className="mt-1 text-xs text-[#64809f] dark:text-[#90a5c4]">Current investment volume across the platform.</p>
            </div>
            <button type="button" onClick={() => navigate("/admin/investments")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">View investments <ExternalLink size={14} /></button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricHighlight label="Total investments" value="1,426" helper="Active + completed" />
            <MetricHighlight label="USDT invested" value="$456,320" helper="Across all investments" />
            <MetricHighlight label="Active users" value="2,140" helper="84% of registered users" />
          </div>
          <div className="mt-5 rounded-xl border border-[#e4ebf4] bg-[#fbfdff] p-4 dark:border-[#263752] dark:bg-[#0d1a2e]">
            <div className="mb-3 flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-[#426287] dark:text-[#90a5c4]">7-day investment activity</span><span className="text-[10px] text-[#64809f] dark:text-slate-400">USDT volume</span></div>
            <div className="flex h-28 items-end gap-2 sm:gap-4">
              {[42,58,51,74,63,88,78].map((height, index) => <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"><div className="w-full max-w-[42px] rounded-t-md bg-blue-500/80 transition-all hover:bg-blue-600" style={{height:`${height}%`}} title={`${height * 1000} USDT`} /><span className="text-[9px] text-[#748aa4] dark:text-slate-400">D{index + 1}</span></div>)}
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="m-0 text-[11px] font-bold uppercase tracking-wider text-blue-600">Platform health</p><h2 className="mt-1 text-lg font-bold text-[#112f55] dark:text-white">Operational status</h2></div><Activity size={20} className="text-emerald-500" /></div>
          <div className="mt-5 space-y-4">
            <HealthRow label="User accounts" value="Healthy" />
            <HealthRow label="Investment engine" value="Operational" />
            <HealthRow label="ROI engine" value="Ready" />
            <HealthRow label="Token treasury" value="Funded" />
            <HealthRow label="Withdrawal queue" value={`${fallbackOperational.pendingWithdrawals} pending`} warning />
          </div>
        </div>
      </section>

      <section className="mb-5 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="min-w-0 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-blue-600">Daily operations</p>
              <h2 className="mt-1 text-lg font-bold text-[#112f55] dark:text-white">ROI release center</h2>
              <p className="mt-1 text-xs text-[#64809f] dark:text-[#90a5c4]">Admin declares ROI → previews calculations → approves and releases token payouts.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">4:00 PM Malaysia Time</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <OperationItem label="Daily ROI" value={data.operational.dailyRoi} icon={TrendingUp} />
            <OperationItem label="Eligible Users" value={data.operational.eligibleUsers} icon={Users} />
            <OperationItem label="Estimated Token Payout" value={data.operational.estimatedTokenPayout} icon={Coins} />
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#dce9f7] bg-[#f7faff] p-4 dark:border-[#223250] dark:bg-[#0d1a2e] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={19} /></div>
              <div><p className="m-0 text-xs font-semibold text-[#112f55] dark:text-white">Current status</p><p className="m-0 mt-1 text-[11px] text-[#64809f] dark:text-[#90a5c4]">{data.operational.roiStatus}</p></div>
            </div>
            <button type="button" onClick={() => navigate("/admin/roi")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">Review & Release ROI <ExternalLink size={14} /></button>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="m-0 text-[11px] font-bold uppercase tracking-wider text-blue-600">Admin attention</p><h2 className="mt-1 text-lg font-bold text-[#112f55] dark:text-white">Pending work</h2></div>
            <ShieldAlert size={20} className="text-blue-500" />
          </div>
          <div className="mt-4 space-y-2.5">
            <AttentionRow icon={Clock3} label="Pending transactions" value={data.operational.pendingTransactions} onClick={() => navigate("/admin/transactions")} />
            <AttentionRow icon={XCircle} label="Failed transactions" value={data.operational.failedTransactions} tone="red" onClick={() => navigate("/admin/transactions")} />
            <AttentionRow icon={WalletCards} label="Pending withdrawals" value={data.operational.pendingWithdrawals} onClick={() => navigate("/admin/withdrawals")} />
            <AttentionRow icon={Gift} label="Buybacks awaiting review" value={data.operational.pendingBuybacks} tone="purple" onClick={() => navigate("/admin/buyback")} />
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">Quick actions</h2><p className="mt-1 text-xs text-[#64809f] dark:text-[#90a5c4]">Direct access to the daily operational modules.</p></div>
          <Settings2 size={18} className="text-slate-400" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {quickActions.map(([label, path, Icon]) => (
            <button key={path} type="button" onClick={() => navigate(path)} className="flex min-h-[76px] flex-col items-start justify-between rounded-xl border border-[#e4ebf4] bg-[#fbfdff] p-3 text-left transition hover:border-blue-200 hover:bg-blue-50 dark:border-[#263752] dark:bg-[#0d1a2e] dark:hover:bg-blue-500/10">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Icon size={17} /></span>
              <span className="mt-3 text-[11px] font-semibold text-[#31567f] dark:text-slate-200">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3">
        <TreasuryCard title="Token Treasury" icon={Coins} value={data.treasury.tokenBalance} label="Available reward treasury" />
        <TreasuryCard title="Buyback Reserve" icon={Gift} value={data.treasury.buybackReserve} label="Configured buyback reserve" />
        <TreasuryCard title="Liquidity" icon={Landmark} value={data.treasury.liquidity} label="Current liquidity allocation" />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-slate-100 px-4 dark:border-[#223250] sm:px-5">
          <div><h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">Recent Transactions</h2><p className="mt-1 text-[11px] text-[#64809f] dark:text-[#90a5c4]">Latest platform financial and blockchain activity.</p></div>
          <button type="button" onClick={() => navigate("/admin/transactions")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">View all <ExternalLink size={14} /></button>
        </div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] border-collapse">
            <thead><tr className="bg-[#f2f7fc] text-left text-[10px] font-bold uppercase tracking-wide text-[#426287] dark:bg-[#0d1a2e] dark:text-[#90a5c4]"><th className="px-4 py-3">User</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date / Time</th></tr></thead>
            <tbody>{transactionRows.map((row, index) => <tr key={`${row.user}-${row.date}-${index}`} className="border-b border-slate-100 text-xs text-[#28507f] last:border-0 dark:border-[#223250] dark:text-[#dce7f6]"><td className="px-4 py-3.5 font-semibold">{row.user}</td><td className="px-4 py-3.5">{row.type}</td><td className="px-4 py-3.5 font-semibold">{row.amount}</td><td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${statusClasses(row.status)}`}>{row.status}</span></td><td className="px-4 py-3.5">{row.date}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="grid gap-2 p-3 lg:hidden">{transactionRows.map((row, index) => <article key={`${row.user}-${row.date}-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-[#263752]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-xs text-slate-800 dark:text-white">{row.user}</strong><span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">{row.type} · {row.date}</span></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${statusClasses(row.status)}`}>{row.status}</span></div><div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 dark:bg-[#0d1a2e] dark:text-slate-200">{row.amount}</div></article>)}</div>
      </section>
    </AdminLayout>
  );
}

function DashboardHeader({ refreshing, error, onRefresh }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="m-0 text-[11px] font-bold uppercase tracking-wider text-blue-600">Platform administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#112e52] dark:text-white sm:text-[29px]">Admin Dashboard</h1><p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">Monitor users, investments, ROI, token treasury, buybacks and withdrawals from one place.</p></div>
    <div className="flex items-center gap-2">{error && <span className="max-w-[320px] text-[10px] text-amber-600">{error}</span>}<button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dce5ef] bg-white px-3 text-xs font-semibold text-[#496783] shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-[#263752] dark:bg-[#101f38] dark:text-slate-300"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button></div>
  </div>;
}

function OperationItem({ label, value, icon: Icon }) {
  return <div className="rounded-xl border border-[#e4ebf4] bg-[#fbfdff] p-4 dark:border-[#263752] dark:bg-[#0d1a2e]"><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-medium text-[#68809d] dark:text-slate-400">{label}</span><Icon size={17} className="text-blue-500" /></div><strong className="mt-2 block text-xl font-bold text-[#163a62] dark:text-white">{value}</strong></div>;
}
function AttentionRow({ icon: Icon, label, value, onClick, tone = "amber" }) {
  const iconClass = tone === "red" ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" : tone === "purple" ? "bg-violet-50 text-violet-500 dark:bg-violet-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10";
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-[#e8eef5] bg-white p-3 text-left hover:bg-slate-50 dark:border-[#263752] dark:bg-[#0d1a2e] dark:hover:bg-white/5"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconClass}`}><Icon size={17} /></span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#31567f] dark:text-slate-200">{label}</span><strong className="text-sm text-[#173a65] dark:text-white">{value}</strong><ExternalLink size={13} className="shrink-0 text-slate-400" /></button>;
}
function TreasuryCard({ title, icon: Icon, value, label }) {
  return <div className="rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Icon size={19} /></span><div><h3 className="m-0 text-sm font-bold text-[#173a65] dark:text-white">{title}</h3><p className="m-0 mt-1 text-[10px] text-[#748aa4] dark:text-slate-400">{label}</p></div></div><p className="m-0 mt-4 break-words text-lg font-bold text-[#112e52] dark:text-white">{value}</p></div>;
}
function MetricHighlight({ label, value, helper }) {
  return <div className="rounded-xl border border-[#e4ebf4] bg-[#fbfdff] p-3.5 dark:border-[#263752] dark:bg-[#0d1a2e]"><span className="block text-[10px] font-semibold uppercase tracking-wide text-[#748aa4] dark:text-slate-400">{label}</span><strong className="mt-1.5 block text-lg font-bold text-[#173a65] dark:text-white">{value}</strong><span className="mt-1 block text-[10px] text-[#64809f] dark:text-slate-400">{helper}</span></div>;
}
function HealthRow({ label, value, warning = false }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-[#426287] dark:text-slate-300">{label}</span><span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold ${warning ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${warning ? "bg-amber-500" : "bg-emerald-500"}`} />{value}</span></div>;
}
function DashboardSkeleton() {
  return <div className="space-y-5"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl border border-[#dce9f7] bg-slate-100 dark:border-[#223250] dark:bg-[#16283f]" />)}</div><div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-[#16283f]" /><div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-[#16283f]" /></div></div>;
}
