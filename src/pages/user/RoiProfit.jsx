import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Coins, DollarSign, RefreshCw, Search, TrendingUp, X } from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import ErrorState from "../../components/shared/ErrorState";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { queryClient } from "../../lib/queryClient";
import { formatPercent, formatPrice, formatTokenAmount, formatUsdt, toNumber } from "../../lib/format";
import { getUserRoiApi, getUserRoiByIdApi } from "../../services/user/roiApi";

const statusOptions = [
  { value: "Completed", label: "Completed" },
  { value: "Reconciled", label: "Reconciled" },
  { value: "Processing", label: "Processing" },
  { value: "Failed", label: "Failed" },
];

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-medium text-[#68809d] dark:text-slate-400">{label}</p>
          <p className="mt-2 truncate text-xl font-bold text-[#112e52] dark:text-white sm:text-2xl">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          <Icon size={19} />
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    Reconciled: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    Processing: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    Failed: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] || "bg-slate-100 text-slate-600"}`}>{status || "-"}</span>;
}

function Skeletons() {
  return <div className="space-y-3 p-3 sm:p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-[#16283f]" />)}</div>;
}

export default function RoiProfit() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);

  const query = usePaginatedQuery({
    queryKey: ["user-roi"],
    api: getUserRoiApi,
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payload = query.data?.data ?? query.data ?? {};
  const items = payload.items ?? [];
  const total = Number(payload.total ?? items.length);
  const totalPages = Math.max(1, Number(payload.totalPages ?? Math.ceil(total / limit)));
  const summary = payload.summary ?? {};

  useEffect(() => setPage(1), [debouncedSearch, status, limit]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const stats = useMemo(() => [
    { icon: TrendingUp, label: "Today's ROI", value: formatPercent(summary.roiPercent ?? 0), hint: "Latest released rate" },
    { icon: DollarSign, label: "Today's USDT Profit", value: formatUsdt(summary.usdtProfit ?? 0), hint: "Calculated from eligible investment" },
    { icon: Coins, label: "Token Price", value: formatPrice(summary.tokenPrice ?? 0), hint: "Price snapshot used for payout" },
    { icon: Coins, label: "Today's Token Payout", value: formatTokenAmount(summary.tokenPayout ?? 0, "AMGP"), hint: "Native token credited" },
  ], [summary]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["user-roi"] });
    query.refetch();
  };

  const openDetails = async (item) => {
    setSelected({ ...item, loading: true });
    try {
      const response = await getUserRoiByIdApi(item.id);
      setSelected(response?.data ?? response);
    } catch (error) {
      setSelected({ ...item, detailError: error?.message || "Unable to load payout details." });
    }
  };

  return (
    <UserLayout>
      <div className="mb-5">
        <h1 className="m-0 text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">ROI / Profit</h1>
        <p className="mt-1 text-sm text-[#3e5d83] dark:text-slate-400">Track your released daily ROI, USDT profit, token price snapshot and Native Token payout.</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {query.isPending
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[116px] animate-pulse rounded-2xl bg-slate-100 dark:bg-[#16283f]" />)
          : stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="border-b border-slate-100 p-3 dark:border-[#223250] sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">ROI History</h2>
              <p className="mt-1 text-xs text-[#68809d] dark:text-slate-400">Historical token price snapshots remain unchanged after release.</p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-[#2b3c58] sm:w-[250px]">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none dark:text-slate-200" placeholder="Search ROI ID or date..." />
              </div>
              <Dropdown value={status} onChange={setStatus} placeholder="All Status" options={[{ value: "all", label: "All Status" }, ...statusOptions]} />
              <button type="button" onClick={refresh} disabled={query.isFetching} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38]">
                <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {query.isError && !query.data ? <ErrorState error={query.error} onRetry={refresh} /> : query.isPending ? <Skeletons /> : !items.length ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto text-slate-300" size={30} />
            <p className="mt-3 text-sm font-semibold text-slate-500">No ROI records found</p>
            <p className="mt-1 text-xs text-slate-400">Released ROI payouts will appear here.</p>
          </div>
        ) : <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-left text-xs">
              <thead><tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 dark:bg-[#0d1a2e]">
                <th className="px-4 py-3">DATE</th><th className="px-4 py-3">ROI</th><th className="px-4 py-3">USDT PROFIT</th><th className="px-4 py-3">TOKEN PRICE</th><th className="px-4 py-3">TOKEN PAYOUT</th><th className="px-4 py-3">STATUS</th><th className="px-4 py-3 text-right">DETAILS</th>
              </tr></thead>
              <tbody>{items.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-[#223250]">
                <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200"><div>{item.date}</div><span className="text-[10px] text-slate-400">{item.id}</span></td>
                <td className="px-4 py-4 font-semibold text-blue-600 dark:text-blue-300">{formatPercent(item.roiPercent)}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatUsdt(item.usdtProfit)}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatPrice(item.tokenPrice)}</td>
                <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{formatTokenAmount(item.tokenPayout, "AMGP")}</td>
                <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-4 text-right"><button onClick={() => openDetails(item)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2b3c58] dark:text-slate-300 dark:hover:bg-white/5">View <ChevronRight size={13} /></button></td>
              </tr>)}</tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 lg:hidden">
            {items.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-[#263752]">
              <div className="flex items-start justify-between gap-3">
                <div><p className="m-0 text-xs font-semibold text-slate-800 dark:text-white">{item.id}</p><p className="mt-1 text-[10px] text-slate-400">{item.date}</p></div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Info label="ROI" value={formatPercent(item.roiPercent)} /><Info label="USDT Profit" value={formatUsdt(item.usdtProfit)} /><Info label="Token Price" value={formatPrice(item.tokenPrice)} /><Info label="Token Payout" value={formatTokenAmount(item.tokenPayout, "AMGP")} />
              </div>
              <button onClick={() => openDetails(item)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-[11px] font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300">View payout details <ChevronRight size={13} /></button>
            </article>)}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400 dark:border-[#223250]"><span>Rows</span><Dropdown value={limit} onChange={(v) => setLimit(Number(v))} icon={null} className="!h-8 !rounded-lg !px-2.5 !text-[11px]" options={[{ value: 10, label: "10" }, { value: 20, label: "20" }, { value: 50, label: "50" }]} /></div>
        </>}
      </section>

      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
    </UserLayout>
  );
}

function Info({ label, value }) {
  return <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">{label}</span><strong className="mt-1 block truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{value}</strong></div>;
}

function DetailModal({ item, onClose }) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5" onMouseDown={onClose}>
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#2b3c58] dark:bg-[#101f38]" onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-[#223250]"><div><h3 className="m-0 text-base font-bold text-[#112e52] dark:text-white">ROI Payout Details</h3><p className="mt-1 text-[11px] text-slate-400">{item.id}</p></div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={15} /></button></div>
      <div className="grid grid-cols-2 gap-3 p-4"><Info label="Date" value={item.date} /><Info label="Status" value={item.status} /><Info label="ROI" value={formatPercent(item.roiPercent)} /><Info label="Eligible Users" value={item.totalUsers ?? "-"} /><Info label="USDT Profit" value={formatUsdt(item.usdtProfit)} /><Info label="Token Price Snapshot" value={formatPrice(item.tokenPrice)} /><Info label="Token Payout" value={formatTokenAmount(item.tokenPayout, "AMGP")} /><Info label="Conversion" value={`${formatUsdt(item.usdtProfit)} ÷ ${formatPrice(item.tokenPrice)}`} /></div>
      <div className="mx-4 mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">This record is generated by the platform's daily ROI release process. Historical token price snapshots are retained for accounting and are not editable from the user panel.</div>
      {item.detailError && <p className="px-4 pb-4 text-xs text-rose-500">{item.detailError}</p>}
    </div>
  </div>;
}
