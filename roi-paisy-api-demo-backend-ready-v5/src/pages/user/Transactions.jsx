import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Coins, Eye, RefreshCw, Search, WalletCards, X } from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import Dropdown from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { queryClient } from "../../lib/queryClient";
import { getUserTransactionApi, getUserTransactionByIdApi, createUserTransactionApi, updateUserTransactionApi } from "../../services/user/transactionApi";

const typeOptions = [
  { value: "deposit", label: "Deposit" },
  { value: "investment", label: "Investment" },
  { value: "roi", label: "ROI / Profit" },
  { value: "token_payout", label: "Token Payout" },
  { value: "buyback", label: "Buyback / Sale" },
  { value: "usdt_credit", label: "USDT Credit" },
  { value: "withdrawal", label: "Withdrawal" },
];
const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

function payloadOf(response) { return response?.data ?? response ?? {}; }
function money(value) { return String(value ?? "-"); }
function typeLabel(type) { return typeOptions.find(x => x.value === type)?.label || type || "Transaction"; }
function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (s === "failed" || s === "rejected") return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
  if (s === "processing") return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
}
function TypeIcon({ type }) {
  const Icon = type === "deposit" ? ArrowDownToLine : type === "withdrawal" ? ArrowUpRight : type === "investment" ? WalletCards : Coins;
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Icon size={17} /></span>;
}

export default function Transactions() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);

  const { data: response, isPending, isFetching, isError, error, refetch } = usePaginatedQuery({
    queryKey: ["user-transactions"],
    api: getUserTransactionApi,
    page,
    limit,
    search: debouncedSearch,
    status,
    extraParams: { type },
  });

  const payload = useMemo(() => payloadOf(response), [response]);
  const items = payload.items || [];
  const total = Number(payload.total || 0);
  const totalPages = Math.max(1, Number(payload.totalPages || Math.ceil(total / limit) || 1));

  useEffect(() => setPage(1), [debouncedSearch, type, status, limit]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["user-transactions"] });
    refetch();
  };

  return (
    <UserLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">Transaction History</h1>
        <p className="mt-1 text-sm text-[#3e5d83] dark:text-slate-400">Track deposits, investments, ROI, token payouts, buybacks, credits and withdrawals.</p>
      </div>

      <section className="overflow-visible rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="border-b border-slate-100 p-3 dark:border-[#223250] sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#112f55] dark:text-white">All Transactions</h2>
              <p className="mt-1 text-xs text-[#68809d] dark:text-slate-400">Financial records are read-only from the user panel.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 sm:w-[250px] dark:border-[#2b3c58]">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transaction ID..." className="min-w-0 flex-1 bg-transparent text-xs outline-none dark:text-slate-200" />
              </div>
              <Dropdown value={type} onChange={setType} placeholder="All Types" options={[{ value: "all", label: "All Types" }, ...typeOptions]} />
              <Dropdown value={status} onChange={setStatus} placeholder="All Status" options={[{ value: "all", label: "All Status" }, ...statusOptions]} />
              <button type="button" onClick={refresh} disabled={isFetching} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38]"><RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /></button>
            </div>
          </div>
        </div>

        {isError && !response ? (
          <div className="p-10 text-center"><p className="text-sm text-rose-500">{error?.message || "Unable to load transactions."}</p><button onClick={refresh} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-[#2b3c58]">Try again</button></div>
        ) : isPending ? (
          <div className="space-y-2 p-3 sm:p-4">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-[#16283f]" />)}</div>
        ) : !items.length ? (
          <div className="p-12 text-center text-sm text-slate-400">No transactions found.</div>
        ) : <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[940px] border-collapse text-left text-xs">
              <thead><tr className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-500 dark:bg-[#0d1a2e]">
                <th className="px-4 py-3">Transaction</th><th className="px-4 py-3">Date / Time</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
              </tr></thead>
              <tbody>{items.map(item => <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-[#223250]">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><TypeIcon type={item.type} /><div><p className="font-semibold text-slate-800 dark:text-white">{typeLabel(item.type)}</p><p className="mt-0.5 text-[10px] text-slate-400">{item.id}</p></div></div></td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{money(item.amount)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.rate || "—"}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass(item.status)}`}>{item.status}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => setSelected(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2b3c58] dark:text-slate-300 dark:hover:bg-white/5"><Eye size={14} /> View</button></td>
              </tr>)}</tbody>
            </table>
          </div>

          <div className="grid gap-2 p-3 lg:hidden">{items.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-[#263752]">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><TypeIcon type={item.type} /><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800 dark:text-white">{typeLabel(item.type)}</p><p className="mt-0.5 text-[10px] text-slate-400">{item.id}</p></div></div><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${statusClass(item.status)}`}>{item.status}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Info label="Date" value={item.date} /><Info label="Amount" value={item.amount} /><Info label="Currency" value={item.currency} /><Info label="Rate" value={item.rate || "—"} /></div>
            <button onClick={() => setSelected(item)} className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300"><Eye size={14} /> View Details</button>
          </article>)}</div>

          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400 dark:border-[#223250]"><span>Rows</span><Dropdown value={limit} onChange={v => setLimit(Number(v))} icon={null} className="!h-8 !min-w-[70px] !rounded-lg !px-2.5 !text-[11px]" options={[{ value: 10, label: "10" }, { value: 20, label: "20" }, { value: 50, label: "50" }]} /></div>
        </>}
      </section>

      {selected && <TransactionModal item={selected} onClose={() => setSelected(null)} />}
    </UserLayout>
  );
}

function Info({ label, value }) { return <div className="min-w-0 rounded-lg bg-slate-50 p-2 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">{label}</span><strong className="mt-1 block truncate text-[10px] font-medium text-slate-700 dark:text-slate-200">{value || "—"}</strong></div>; }

function TransactionModal({ item, onClose }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-4" onMouseDown={onClose}>
    <div onMouseDown={e => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-[#101f38] sm:max-w-lg sm:rounded-2xl">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#112e52] dark:text-white">Transaction Details</h2><p className="mt-1 text-xs text-slate-500">{item.id}</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={18} /></button></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><Info label="Type" value={typeLabel(item.type)} /><Info label="Status" value={item.status} /><Info label="Date / Time" value={item.date} /><Info label="Amount" value={item.amount} /><Info label="Currency" value={item.currency} /><Info label="Rate" value={item.rate || "—"} /><Info label="Transaction ID" value={item.id} /><Info label="Blockchain Hash" value={item.txHash || "Not applicable"} /></div>
      {item.txHash && item.txHash !== "-" && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs dark:bg-[#0d1a2e]"><p className="font-semibold text-slate-700 dark:text-slate-200">Blockchain Hash</p><p className="mt-1 break-all text-[10px] text-slate-500">{item.txHash}</p></div>}
      <button onClick={onClose} className="mt-5 h-10 w-full rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700">Close</button>
    </div>
  </div>;
}
