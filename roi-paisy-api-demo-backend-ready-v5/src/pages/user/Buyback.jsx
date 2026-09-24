import React, { useMemo, useState } from "react";
import { useManualMutation, useManualQuery, useManualQueryClient } from "../../hooks/manualQuery";
import {
  ArrowDownToLine,
  Check,
  CheckCircle2,
  Clock3,
  Coins,
  Copy,
  DollarSign,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import ErrorState from "../../components/shared/ErrorState";
import { getUserBuybackApi, getUserBuybackByIdApi, createUserBuybackApi } from "../../services/user/buybackApi";
import { getUserWalletApi } from "../../services/user/walletApi";
import { useDebounce } from "../../hooks/useDebounce";

const LIMIT_OPTIONS = [10, 20, 50];
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const money = (value, digits = 2) => Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const styles = {
    completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    processing: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
    failed: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[normalized] || styles.pending}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />{status || "Pending"}
  </span>;
}

function Skeleton() {
  return <div className="space-y-3 p-4 sm:p-5">
    {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-[#16283f]" />)}
  </div>;
}

export default function Buyback() {
  const queryClient = useManualQueryClient();
  const [amount, setAmount] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const walletQuery = useManualQuery({
    queryKey: ["user-wallet", "summary"],
    queryFn: ({ signal }) => getUserWalletApi({ page: 1, limit: 1 }, signal),
    staleTime: 30_000,
  });

  const historyQuery = useManualQuery({
    queryKey: ["user-buybacks", page, limit, debouncedSearch, status],
    queryFn: ({ signal }) => getUserBuybackApi({
      page,
      limit,
      search: debouncedSearch,
      ...(status !== "all" ? { status } : {}),
    }, signal),
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });

  const sellMutation = useManualMutation({
    mutationFn: (tokenAmount) => createUserBuybackApi({ tokenAmount }),
    onSuccess: () => {
      setAmount("");
      setConfirmOpen(false);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["user-buybacks"] });
      queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
    },
    onError: (err) => setError(err?.message || "Unable to complete the sell request."),
  });

  const summary = walletQuery.data?.data?.summary || walletQuery.data?.summary || {};
  const tokenBalance = Number(String(summary.tokenBalance ?? 0).replace(/,/g, ""));
  const usdtBalance = Number(String(summary.usdtBalance ?? 0).replace(/,/g, ""));
  const tokenPrice = Number(String(summary.tokenPrice ?? "0.48").replace(/[^0-9.]/g, "")) || 0.48;

  // Keep the platform buyback settings from the project specification/data source.
  const buybackPrice = 0.48;
  const feePercent = 2;
  const minimumSale = 100;
  const maximumSale = 1000;
  const sellAmount = Number(amount || 0);
  const grossUsdt = sellAmount * buybackPrice;
  const fee = grossUsdt * (feePercent / 100);
  const receiveUsdt = Math.max(0, grossUsdt - fee);

  const amountError = amount === ""
    ? ""
    : !Number.isFinite(sellAmount) || sellAmount <= 0
      ? "Enter a valid token amount."
      : sellAmount < minimumSale
        ? `Minimum sale is ${money(minimumSale, 0)} TOKEN.`
        : sellAmount > maximumSale
          ? `Maximum sale is ${money(maximumSale, 0)} TOKEN.`
          : sellAmount > tokenBalance
            ? "You cannot sell more than your available token balance."
            : "";

  const response = historyQuery.data?.data || historyQuery.data || {};
  const records = response.items || [];
  const total = response.total || 0;
  const totalPages = response.totalPages || Math.max(1, Math.ceil(total / limit));

  const canSell = sellAmount >= minimumSale && sellAmount <= maximumSale && sellAmount <= tokenBalance && !amountError;

  const stats = useMemo(() => [
    { label: "Token Balance", value: `${money(tokenBalance, 2)}`, suffix: "TOKEN", icon: Coins, tone: "orange" },
    { label: "Buyback Price", value: money(buybackPrice, 4), suffix: "USDT / TOKEN", icon: DollarSign, tone: "green" },
    { label: "Estimated USDT Value", value: money(tokenBalance * buybackPrice), suffix: "USDT", icon: ArrowDownToLine, tone: "blue" },
    { label: "Minimum Sell Limit", value: money(minimumSale, 0), suffix: "TOKEN", icon: ShieldCheck, tone: "purple" },
  ], [tokenBalance]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["user-buybacks"] });
    queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
  };

  const submitSell = () => {
    if (!canSell) {
      setError(amountError || "Please enter a valid amount.");
      return;
    }
    setError("");
    setConfirmOpen(true);
  };

  const confirmSell = () => sellMutation.mutate(sellAmount);

  return (
    <UserLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#112e52] dark:text-white sm:text-[29px]">Buyback / Sell Token</h1>
        <p className="mt-1 text-sm text-[#3e5d83] dark:text-slate-400">Convert your native tokens to USDT at the current platform buyback price.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, suffix, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-medium text-[#5f7694] dark:text-slate-400">{label}</p><p className="mt-2 text-xl font-bold text-[#112e52] dark:text-white sm:text-2xl">{value}</p><p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#8094ad] dark:text-slate-500">{suffix}</p></div>
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone === "orange" ? "bg-orange-50 text-orange-500" : tone === "green" ? "bg-emerald-50 text-emerald-600" : tone === "purple" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"}`}><Icon size={19} /></div>
          </div>
        </div>)}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Coins size={20} /></div>
            <div><h2 className="text-base font-bold text-[#112e52] dark:text-white">Sell Token</h2><p className="mt-1 text-xs text-[#68809d] dark:text-slate-400">Enter the amount of tokens you want to sell. USDT is credited after successful settlement.</p></div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-semibold text-[#314b6b] dark:text-slate-300">Sell Amount (TOKEN)</span>
              <div className={`flex h-12 items-center rounded-xl border bg-white px-3 transition dark:bg-[#0d1a2e] ${amountError ? "border-rose-400" : "border-[#d9e6f4] focus-within:border-blue-500"}`}>
                <input inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, "")); setError(""); }} placeholder="Enter amount" className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#24486f] outline-none dark:text-white" />
                <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#647c98]"><Coins size={15} className="text-orange-500" /> TOKEN</span>
              </div>
              <span className="mt-1.5 block text-[10px] text-[#8194ab]">Available: {money(tokenBalance, 2)} TOKEN</span>
              {amountError && <span className="mt-1 block text-[10px] font-medium text-rose-500">{amountError}</span>}
            </label>

            <div>
              <span className="mb-2 block text-xs font-semibold text-[#314b6b] dark:text-slate-300">You Will Receive (USDT)</span>
              <div className="flex h-12 items-center rounded-xl border border-[#d9e6f4] bg-slate-50 px-3 dark:border-[#2b3c58] dark:bg-[#0d1a2e]">
                <span className="min-w-0 flex-1 text-sm font-semibold text-[#24486f] dark:text-white">{money(receiveUsdt)}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#647c98]"><DollarSign size={15} className="text-emerald-500" /> USDT</span>
              </div>
              <span className="mt-1.5 block text-[10px] text-[#8194ab]">After {feePercent}% platform fee</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-[#f4f8fd] p-3 dark:bg-[#0d1a2e] sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3 dark:bg-[#12223b]"><p className="text-[10px] text-slate-500">Buyback Price</p><p className="mt-1 text-sm font-bold text-[#173b63] dark:text-white">{money(buybackPrice, 4)} USDT</p><p className="text-[9px] text-slate-400">per TOKEN</p></div>
            <div className="rounded-lg bg-white p-3 dark:bg-[#12223b]"><p className="text-[10px] text-slate-500">Estimated USDT</p><p className="mt-1 text-sm font-bold text-[#173b63] dark:text-white">{money(receiveUsdt)} USDT</p><p className="text-[9px] text-slate-400">after fee</p></div>
            <div className="rounded-lg bg-white p-3 dark:bg-[#12223b]"><p className="text-[10px] text-slate-500">Platform Fee</p><p className="mt-1 text-sm font-bold text-[#173b63] dark:text-white">{feePercent.toFixed(2)}%</p><p className="text-[9px] text-slate-400">{money(fee)} USDT</p></div>
          </div>

          {(error || sellMutation.isError) && <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error || sellMutation.error?.message}</div>}
          <button type="button" disabled={!canSell || sellMutation.isPending} onClick={submitSell} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {sellMutation.isPending ? <><RefreshCw size={16} className="animate-spin" /> Processing...</> : <><CheckCircle2 size={17} /> Confirm Sell</>}
          </button>
        </section>

        <aside className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="flex items-center gap-2"><Info size={19} className="text-blue-600" /><h2 className="text-base font-bold text-[#112e52] dark:text-white">Sell Information</h2></div>
          <div className="mt-5 space-y-4">
            {[
              ["Min Sell Limit", `${money(minimumSale, 0)} TOKEN`],
              ["Max Sell Limit", `${money(maximumSale, 0)} TOKEN`],
              ["Buyback Price", `${money(buybackPrice, 4)} USDT / TOKEN`],
              ["Platform Fee", `${feePercent.toFixed(2)}%`],
              ["Processing Time", "Instant - 5 Minutes"],
            ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 text-xs"><span className="text-[#68809d] dark:text-slate-400">{label}</span><strong className="text-right text-[#294968] dark:text-slate-200">{value}</strong></div>)}
          </div>
          <div className="mt-5 flex gap-2 rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Info size={16} className="mt-0.5 shrink-0" /><span>Tokens are settled first. The equivalent USDT becomes available in your platform balance only after the buyback request is successfully completed.</span></div>
        </aside>
      </div>

      <section className="mt-4 overflow-visible rounded-2xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="border-b border-slate-100 p-4 dark:border-[#223250] sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div><h2 className="text-base font-bold text-[#112e52] dark:text-white">Sell History</h2><p className="mt-1 text-xs text-[#68809d] dark:text-slate-400">Your token-to-USDT buyback requests.</p></div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-[#2b3c58] sm:w-[240px]"><Search size={15} className="shrink-0 text-slate-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search transaction ID..." className="min-w-0 flex-1 bg-transparent text-xs outline-none dark:text-slate-200" /></div>
              <Dropdown value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: "all", label: "All Status" }, ...STATUS_OPTIONS]} placeholder="All Status" />
              <Dropdown value={limit} onChange={(value) => { setLimit(Number(value)); setPage(1); }} options={LIMIT_OPTIONS.map((value) => ({ value, label: `${value} per page` }))} placeholder="10 per page" icon={null} />
              <button type="button" onClick={refresh} disabled={historyQuery.isFetching} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38]"><RefreshCw size={15} className={historyQuery.isFetching ? "animate-spin" : ""} /></button>
            </div>
          </div>
        </div>

        {historyQuery.isError && !historyQuery.data ? <ErrorState message={historyQuery.error?.message || "Unable to load buyback history."} onRetry={refresh} />
          : historyQuery.isPending ? <Skeleton />
          : !records.length ? <div className="p-10 text-center text-sm text-slate-400">No buyback records found.</div>
          : <>
            <div className="hidden overflow-visible lg:block">
              <table className="w-full border-collapse text-left text-xs">
                <thead><tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 dark:bg-[#0d1a2e]">{["ID", "Date & Time", "Token Amount", "USDT Received", "Rate", "Fee", "Status", "Action"].map((label) => <th key={label} className="px-4 py-3">{label.toUpperCase()}</th>)}</tr></thead>
                <tbody>{records.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-[#223250]">
                  <td className="px-4 py-3 font-semibold text-[#294968] dark:text-slate-200">{item.id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.tokenAmount}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{item.usdtValue}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.price}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.fee || "2.00%"}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3"><button type="button" onClick={() => setDetails(item)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-500/10">View</button></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="grid gap-2 p-3 lg:hidden">{records.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-[#263752]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#173b63] dark:text-white">{item.id}</p><p className="mt-1 text-[10px] text-slate-500">{item.date}</p></div><StatusBadge status={item.status} /></div><div className="mt-3 grid grid-cols-2 gap-2">{[["Token Amount", item.tokenAmount],["USDT Received", item.usdtValue],["Rate", item.price],["Fee", item.fee || "2.00%"]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-2 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">{label}</span><strong className="mt-1 block text-[11px] text-slate-700 dark:text-slate-200">{value}</strong></div>)}</div><button type="button" onClick={() => setDetails(item)} className="mt-3 h-9 w-full rounded-lg border border-blue-200 text-xs font-semibold text-blue-600 dark:border-blue-500/30">View Details</button></article>)}</div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </>}
      </section>

      {confirmOpen && <ConfirmModal amount={sellAmount} gross={grossUsdt} fee={fee} receive={receiveUsdt} busy={sellMutation.isPending} onCancel={() => setConfirmOpen(false)} onConfirm={confirmSell} />}
      {details && <DetailsModal item={details} onClose={() => setDetails(null)} />}
    </UserLayout>
  );
}

function ConfirmModal({ amount, gross, fee, receive, busy, onCancel, onConfirm }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-4">
    <div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-[#101f38] sm:max-w-md sm:rounded-2xl">
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-[#112e52] dark:text-white">Confirm Token Sale</h3><p className="mt-1 text-xs text-slate-500">Review the buyback calculation before submitting.</p></div><button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={17} /></button></div>
      <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-[#0d1a2e]">{[["Token amount", `${money(amount, 2)} TOKEN`],["Gross value", `${money(gross)} USDT`],["Platform fee", `-${money(fee)} USDT`],["You receive", `${money(receive)} USDT`]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 text-xs"><span className="text-slate-500">{label}</span><strong className={label === "You receive" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}>{value}</strong></div>)}</div>
      <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><Clock3 size={15} className="mt-0.5 shrink-0" />After confirmation, the token amount is locked/settled and the USDT credit is created only when the buyback succeeds.</div>
      <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={onCancel} disabled={busy} className="h-11 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300">Cancel</button><button type="button" onClick={onConfirm} disabled={busy} className="h-11 rounded-xl bg-blue-600 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Processing..." : "Confirm Sell"}</button></div>
    </div>
  </div>;
}

function DetailsModal({ item, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (!item?.txHash || item.txHash === "-") return; try { await navigator.clipboard.writeText(item.txHash); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {} };
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"><div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-[#101f38] sm:max-w-lg sm:rounded-2xl"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-[#112e52] dark:text-white">Buyback Details</h3><p className="mt-1 text-xs text-slate-500">{item.id}</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={17} /></button></div><div className="mt-5 space-y-3">{[["Status", <StatusBadge status={item.status} />],["Date & Time", item.date],["Token Amount", item.tokenAmount],["USDT Received", item.usdtValue],["Buyback Rate", `${item.price} USDT / TOKEN`],["Fee", item.fee || "2.00%"],["Wallet", item.wallet || "-"],["Transaction Hash", <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate font-mono">{item.txHash || "-"}{item.txHash && item.txHash !== "-" && <button type="button" onClick={copy} className="shrink-0 text-blue-600" title="Copy transaction hash">{copied ? <Check size={14} /> : <Copy size={14} />}</button>}</span>]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-xs last:border-0 dark:border-[#223250]"><span className="text-slate-500">{label}</span><strong className="text-right text-slate-700 dark:text-slate-200">{value}</strong></div>)}</div><button type="button" onClick={onClose} className="mt-5 h-10 w-full rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300">Close</button></div></div>;
}
