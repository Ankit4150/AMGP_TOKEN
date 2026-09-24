import React, { useMemo, useState } from "react";
import { useManualMutation, useManualQuery, useManualQueryClient } from "../../hooks/manualQuery";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Package,
  Search,
  ShieldCheck,
  X,
  Wallet,
} from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import ErrorState from "../../components/shared/ErrorState";
import Dropdown from "../../components/ui/Dropdown";
import { getUserInvestmentApi, getUserInvestmentByIdApi, createUserInvestmentApi, updateUserInvestmentApi, packagesUserInvestmentApi } from "../../services/user/investmentApi";
import { getUserWalletApi } from "../../services/user/walletApi";
import { useDebounce } from "../../hooks/useDebounce";

const LIMIT_OPTIONS = [10, 20, 50];
const initialForm = { packageId: "", amount: "" };

const money = (value) => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SkeletonCard() {
  return <div className="animate-pulse rounded-2xl border border-[#dce9f7] bg-white p-5 dark:border-[#223250] dark:bg-[#101f38]">
    <div className="h-5 w-32 rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-4 h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-2 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-6 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
  </div>;
}

function StatusBadge({ status }) {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    Completed: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    Pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    Processing: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
    Failed: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status] || styles.Pending}`}>{status}</span>;
}

export default function Investments() {
  const queryClient = useManualQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const walletQuery = useManualQuery({
    queryKey: ["user-wallet", "summary"],
    queryFn: ({ signal }) => getUserWalletApi({ page: 1, limit: 1 }, signal),
    staleTime: 30_000,
  });

  const packagesQuery = useManualQuery({
    queryKey: ["investment-packages"],
    queryFn: ({ signal }) => packagesUserInvestmentApi({ status: "Active" }, signal),
    staleTime: 30_000,
  });

  const investmentsQuery = useManualQuery({
    queryKey: ["user-investments", page, limit, debouncedSearch, status],
    queryFn: ({ signal }) => getUserInvestmentApi({ page, limit, search: debouncedSearch, ...(status !== "all" ? { status } : {}) }, signal),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });

  const createMutation = useManualMutation({
    mutationFn: ({ packageId, amount }) => createUserInvestmentApi({ packageId, amount: Number(amount) }),
    onSuccess: () => {
      setSelectedPackage(null);
      setForm(initialForm);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["user-investments"] });
      queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
    },
    onError: (err) => setError(err?.message || "Unable to activate investment."),
  });

  const walletBalance = Number(walletQuery.data?.data?.summary?.usdtBalance || walletQuery.data?.summary?.usdtBalance || 0);
  const packages = packagesQuery.data?.data?.items || packagesQuery.data?.items || [];
  const response = investmentsQuery.data?.data || investmentsQuery.data || {};
  const investments = response.items || [];
  const total = response.total || 0;
  const totalPages = response.totalPages || Math.max(1, Math.ceil(total / limit));

  const stats = useMemo(() => {
    const active = investments.filter((x) => String(x.status).toLowerCase() === "active").length;
    const invested = investments.reduce((sum, x) => sum + Number(String(x.amount || 0).replace(/[^0-9.-]/g, "")), 0);
    return [
      { label: "Available USDT", value: `${money(walletBalance)} USDT`, helper: "Wallet balance", tone: "blue", icon: "withdrawal" },
      { label: "Active Investments", value: active.toLocaleString(), helper: "Current page", tone: "green", icon: "activeUsers" },
      { label: "Page Invested", value: `${money(invested)} USDT`, helper: "Visible records", tone: "purple", icon: "investment" },
      { label: "Investment Records", value: total.toLocaleString(), helper: "Across your account", tone: "yellow", icon: "totalInvestments" },
    ];
  }, [investments, total, walletBalance]);

  const openInvestment = (pkg) => {
    setError("");
    setForm({ packageId: pkg.id, amount: String(pkg.min) });
    setSelectedPackage(pkg);
  };

  const amount = Number(form.amount || 0);
  const amountError = selectedPackage
    ? amount < Number(selectedPackage.min)
      ? `Minimum investment is ${money(selectedPackage.min)} USDT.`
      : amount > Number(selectedPackage.max)
        ? `Maximum investment is ${money(selectedPackage.max)} USDT.`
        : amount > walletBalance
          ? "Insufficient USDT balance in your wallet."
          : ""
    : "";

  const submit = (e) => {
    e.preventDefault();
    if (!selectedPackage || amountError || !amount) return;
    createMutation.mutate({ packageId: selectedPackage.id, amount });
  };

  return (
    <UserLayout>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">Investments</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#3e5d83] dark:text-[#90a5c4]">Choose an investment package, enter your USDT amount, and activate it from your available wallet balance.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#dce9f7] bg-white px-4 py-3 text-sm dark:border-[#223250] dark:bg-[#101f38]">
          <Wallet size={17} className="text-blue-500" />
          <span className="text-[#577699] dark:text-[#90a5c4]">Available</span>
          <strong className="text-[#102e54] dark:text-white">{money(walletBalance)} USDT</strong>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => <StatCard key={item.label} item={item} />)}
      </div>

      <section className="mb-7 rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#112e52] dark:text-white">Investment Packages</h2>
            <p className="text-xs text-[#64809f] dark:text-[#90a5c4]">Minimum, maximum, duration and ROI rules are configured by the platform.</p>
          </div>
          <span className="text-xs font-medium text-[#64809f] dark:text-[#90a5c4]">{packages.length} available packages</span>
        </div>

        {packagesQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((x) => <SkeletonCard key={x} />)}</div>
        ) : packagesQuery.isError ? (
          <ErrorState message="Unable to load investment packages." onRetry={() => packagesQuery.refetch()} />
        ) : packages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No active investment packages are available.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {packages.map((pkg) => (
              <article key={pkg.id} className="group flex min-h-[265px] flex-col rounded-2xl border border-[#dce9f7] bg-[#fbfdff] p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#223250] dark:bg-[#0d1a2e]">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Package size={21} /></div>
                  <StatusBadge status={pkg.status} />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#112e52] dark:text-white">{pkg.name}</h3>
                <p className="mt-1 min-h-[34px] text-xs leading-5 text-[#64809f] dark:text-[#90a5c4]">{pkg.description || "Investment package configured for eligible users."}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2.5 dark:bg-[#101f38]"><span className="block text-[#64809f]">Min</span><b className="text-[#112e52] dark:text-white">{money(pkg.min)} USDT</b></div>
                  <div className="rounded-lg bg-white p-2.5 dark:bg-[#101f38]"><span className="block text-[#64809f]">Max</span><b className="text-[#112e52] dark:text-white">{money(pkg.max)} USDT</b></div>
                  <div className="rounded-lg bg-white p-2.5 dark:bg-[#101f38]"><span className="block text-[#64809f]">Duration</span><b className="text-[#112e52] dark:text-white">{pkg.duration} days</b></div>
                  <div className="rounded-lg bg-white p-2.5 dark:bg-[#101f38]"><span className="block text-[#64809f]">ROI rule</span><b className="text-emerald-600 dark:text-emerald-400">{pkg.dailyRoi}% daily</b></div>
                </div>
                <button onClick={() => openInvestment(pkg)} className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700">Invest Now <ArrowRight size={15} /></button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="flex flex-col gap-4 border-b border-[#edf2f7] p-4 dark:border-[#223250] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-lg font-bold text-[#112e52] dark:text-white">My Investments</h2><p className="text-xs text-[#64809f] dark:text-[#90a5c4]">Track active and completed investment records.</p></div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search investments..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-white" /></div>
            <Dropdown value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{value:"all",label:"All Status"},{value:"Active",label:"Active"},{value:"Completed",label:"Completed"},{value:"Pending",label:"Pending"},{value:"Processing",label:"Processing"},{value:"Failed",label:"Failed"}]} placeholder="All Status" />
            <Dropdown value={limit} onChange={(value) => { setLimit(Number(value)); setPage(1); }} icon={null} options={LIMIT_OPTIONS.map((x) => ({value:x,label:`${x} / page`}))} placeholder="10 / page" />
          </div>
        </div>

        {investmentsQuery.isError ? <div className="p-6"><ErrorState message="Unable to load your investments." onRetry={() => investmentsQuery.refetch()} /></div> : investmentsQuery.isLoading ? (
          <div className="space-y-3 p-4 sm:hidden">{[1,2,3].map((x) => <SkeletonCard key={x} />)}</div>
        ) : investments.length === 0 ? (
          <div className="p-10 text-center"><CircleDollarSign className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-semibold text-[#112e52] dark:text-white">No investments found</h3><p className="mt-1 text-sm text-slate-500">Choose an available package above to activate your first investment.</p></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#f8faff] text-xs uppercase text-[#64809f] dark:bg-[#0d1a2e] dark:text-[#90a5c4]"><tr><th className="px-5 py-3">Investment</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">ROI</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3">Start date</th><th className="px-5 py-3">End date</th><th className="px-5 py-3">Status</th></tr></thead>
                <tbody>{investments.map((item) => <tr key={item.id} className="border-t border-slate-100 dark:border-[#223250]"><td className="px-5 py-4"><div className="font-semibold text-[#112e52] dark:text-white">{item.packageName || item.name}</div><div className="mt-0.5 text-xs text-slate-400">{item.id}</div></td><td className="px-5 py-4 font-semibold text-[#112e52] dark:text-white">{item.amount}</td><td className="px-5 py-4 text-emerald-600 dark:text-emerald-400">{item.dailyRoi || "-"}{item.dailyRoi ? "%" : ""}</td><td className="px-5 py-4">{item.duration ? `${item.duration} days` : "-"}</td><td className="px-5 py-4">{item.startDate || item.date || "-"}</td><td className="px-5 py-4">{item.endDate || "-"}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td></tr>)}</tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">{investments.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4 dark:border-[#223250]"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-[#112e52] dark:text-white">{item.packageName || item.name}</h3><p className="mt-0.5 text-[11px] text-slate-400">{item.id}</p></div><StatusBadge status={item.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><span className="text-slate-400">Amount</span><b className="mt-1 block text-sm text-[#112e52] dark:text-white">{item.amount}</b></div><div><span className="text-slate-400">Daily ROI</span><b className="mt-1 block text-sm text-emerald-600">{item.dailyRoi ? `${item.dailyRoi}%` : "-"}</b></div><div><span className="text-slate-400">Start</span><b className="mt-1 block text-[#112e52] dark:text-white">{item.startDate || item.date || "-"}</b></div><div><span className="text-slate-400">End</span><b className="mt-1 block text-[#112e52] dark:text-white">{item.endDate || "-"}</b></div></div></article>)}</div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </section>

      {selectedPackage && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5">
        <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-[#101f38]">
          <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-[#223250]"><div><h2 className="text-xl font-bold text-[#112e52] dark:text-white">Confirm Investment</h2><p className="mt-1 text-xs text-slate-500">{selectedPackage.name}</p></div><button onClick={() => !createMutation.isPending && setSelectedPackage(null)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></div>
          <form onSubmit={submit} className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Minimum", `${money(selectedPackage.min)}`],["Maximum", `${money(selectedPackage.max)}`],["Duration", `${selectedPackage.duration}d`],["ROI", `${selectedPackage.dailyRoi}%`]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f7faff] p-3 dark:bg-[#0d1a2e]"><span className="block text-[11px] text-slate-400">{label}</span><b className="mt-1 block text-sm text-[#112e52] dark:text-white">{value}</b></div>)}</div>
            <div><label className="mb-2 block text-sm font-semibold text-[#112e52] dark:text-white">Investment Amount (USDT)</label><div className="relative"><input autoFocus type="number" min={selectedPackage.min} max={selectedPackage.max} step="0.01" value={form.amount} onChange={(e) => { setForm((v) => ({ ...v, amount: e.target.value })); setError(""); }} className={`h-12 w-full rounded-xl border bg-white px-4 pr-16 text-base font-semibold outline-none dark:bg-[#0d1a2e] dark:text-white ${amountError ? "border-rose-400" : "border-slate-200 focus:border-blue-500 dark:border-[#223250]"}`} placeholder="0.00" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">USDT</span></div>{amountError && <p className="mt-1.5 text-xs font-medium text-rose-500">{amountError}</p>}</div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10"><div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300"><ShieldCheck size={17} /> Investment summary</div><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-500">Wallet balance</span><b>{money(walletBalance)} USDT</b></div><div className="flex justify-between"><span className="text-slate-500">Amount to invest</span><b>{money(amount)} USDT</b></div><div className="flex justify-between"><span className="text-slate-500">Remaining balance</span><b>{money(Math.max(0, walletBalance - amount))} USDT</b></div></div></div>
            {error && <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</div>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={createMutation.isPending} onClick={() => setSelectedPackage(null)} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 dark:border-[#223250] dark:text-slate-300">Cancel</button><button disabled={createMutation.isPending || Boolean(amountError) || !amount} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{createMutation.isPending ? <><Loader2 size={17} className="animate-spin" /> Activating...</> : <>Confirm Investment <ArrowRight size={16} /></>}</button></div>
          </form>
        </div>
      </div>}
    </UserLayout>
  );
}
