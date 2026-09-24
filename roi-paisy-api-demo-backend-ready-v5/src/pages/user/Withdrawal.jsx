import React, { useEffect, useMemo, useState } from "react";
import UserLayout from "../../components/user/UserLayout";
import Dropdown from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { queryClient } from "../../lib/queryClient";
import { getUserWithdrawalApi, getUserWithdrawalByIdApi, createUserWithdrawalApi } from "../../services/user/withdrawalApi";
import { getUserWalletApi } from "../../services/user/walletApi";
import { ArrowDownToLine, Check, ChevronRight, Clock3, Copy, Eye, FileText, Info, RefreshCw, Search, ShieldCheck, X, WalletCards } from "lucide-react";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

const methodOptions = [
  { value: "bank", label: "Bank Transfer" },
  { value: "card", label: "Card-linked Payout" },
  { value: "provider", label: "Supported Payout Provider" },
];

const NETWORK = "BNB Smart Chain / BEP-20";
const MIN_WITHDRAWAL = 50;
const MAX_WITHDRAWAL = 10000;
const FEE_PERCENT = 1;

export default function Withdrawal() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [balance, setBalance] = useState("0.00");
  const [form, setForm] = useState({ amount: "", method: "bank", accountName: "", accountNumber: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);

  const query = usePaginatedQuery({
    queryKey: ["user-withdrawals"],
    api: getUserWithdrawalApi,
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  useEffect(() => setPage(1), [debouncedSearch, status, limit]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getUserWalletApi({ page: 1, limit: 1 }, controller.signal)
      .then((response) => {
        if (!active) return;
        const data = response?.data ?? response ?? {};
        const summary = data?.summary ?? {};
        setBalance(String(summary.usdtBalance ?? "0.00"));
      })
      .catch((error) => { if (error?.name !== "AbortError") setBalance("0.00"); });
    return () => { active = false; controller.abort(); };
  }, [query.data]);

  const payload = query.data?.data ?? query.data ?? {};
  const items = payload.items ?? [];
  const total = Number(payload.total ?? items.length);
  const totalPages = Math.max(1, Number(payload.totalPages ?? Math.ceil(total / limit)));
  const numericBalance = Number(String(balance).replace(/,/g, "")) || 0;
  const numericAmount = Number(form.amount) || 0;
  const fee = numericAmount * (FEE_PERCENT / 100);
  const received = Math.max(0, numericAmount - fee);
  const canSubmit = numericAmount >= MIN_WITHDRAWAL && numericAmount <= MAX_WITHDRAWAL && numericAmount <= numericBalance && Boolean(form.accountName.trim()) && Boolean(form.accountNumber.trim());

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["user-withdrawals"] });
    query.refetch();
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (!canSubmit) {
      setMessage({ type: "error", text: `Enter an amount between ${MIN_WITHDRAWAL.toLocaleString()} and ${MAX_WITHDRAWAL.toLocaleString()} USDT, within your available balance, and complete the payout details.` });
      return;
    }
    setBusy(true);
    try {
      const response = await createUserWithdrawalApi({
        amount: numericAmount.toFixed(2),
        currency: "USDT",
        network: NETWORK,
        method: form.method,
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        note: form.note.trim(),
        fee: fee.toFixed(2),
        received: received.toFixed(2),
        status: "Pending",
      });
      const created = response?.data ?? response ?? {};
      setMessage({ type: "success", text: `Withdrawal ${created.id || "request"} submitted successfully and is pending review.` });
      setForm({ amount: "", method: "bank", accountName: "", accountNumber: "", note: "" });
      refresh();
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Unable to submit withdrawal." });
    } finally { setBusy(false); }
  };

  return (
    <UserLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">USDT Withdrawal</h1>
          <p className="mt-1 text-sm text-[#3e5d83] dark:text-slate-400">Request a USDT payout and track its processing status.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#dce9f7] bg-white px-3 py-2 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
          <WalletCards size={17} className="text-blue-600" />
          <span className="text-[11px] text-slate-500">Available USDT</span>
          <strong className="text-sm text-[#112e52] dark:text-white">{numericBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
      </div>

      {message && <div className={`mb-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-xs ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}><Info size={15} className="mt-0.5 shrink-0"/><span>{message.text}</span><button className="ml-auto" onClick={() => setMessage(null)}><X size={14}/></button></div>}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.7fr)]">
        <form onSubmit={submit} className="rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><ArrowDownToLine size={19}/></div>
            <div><h2 className="text-base font-bold text-[#112e52] dark:text-white">Request Withdrawal</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Withdraw available USDT through a supported payout method.</p></div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Withdrawal Amount (USDT)" hint={`Available: ${numericBalance.toLocaleString()} USDT`}>
              <div className="relative"><input inputMode="decimal" min={MIN_WITHDRAWAL} max={Math.min(MAX_WITHDRAWAL, numericBalance)} step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="input pr-16" placeholder="0.00"/><span className="absolute right-3 top-3 text-xs font-bold text-slate-400">USDT</span></div>
            </Field>
            <Field label="Withdrawal Method"><Dropdown value={form.method} onChange={value=>setForm({...form,method:value})} fullWidth icon={null} options={methodOptions}/></Field>
            <Field label="Account Holder Name"><input value={form.accountName} onChange={e=>setForm({...form,accountName:e.target.value})} className="input" placeholder="Enter account holder name"/></Field>
            <Field label={form.method === "bank" ? "Bank Account / Payout ID" : "Payout Account / ID"}><input value={form.accountNumber} onChange={e=>setForm({...form,accountNumber:e.target.value})} className="input" placeholder="Enter payout account details"/></Field>
            <Field label="Network"><Dropdown value={NETWORK} disabled fullWidth icon={null} options={[{value:NETWORK,label:NETWORK}]}/></Field>
            <Field label="Note (Optional)"><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className="input" placeholder="Optional note"/></Field>
          </div>

          <div className="mt-5 grid gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-500/20 dark:bg-blue-500/5 sm:grid-cols-3">
            <Summary label="Withdrawal" value={`${numericAmount.toFixed(2)} USDT`}/>
            <Summary label={`Fee (${FEE_PERCENT}%)`} value={`${fee.toFixed(2)} USDT`}/>
            <Summary label="Estimated Received" value={`${received.toFixed(2)} USDT`} highlight/>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={()=>setForm({amount:"",method:"bank",accountName:"",accountNumber:"",note:""})} className="h-11 rounded-lg border border-slate-200 px-5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2b3c58] dark:text-slate-300 dark:hover:bg-white/5">Reset</button>
            <button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <RefreshCw size={15} className="animate-spin"/> : <Check size={15}/>} {busy ? "Submitting..." : "Confirm Withdrawal"}</button>
          </div>
        </form>

        <aside className="rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
          <div className="flex items-start gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><ShieldCheck size={18}/></div><div><h2 className="text-sm font-bold text-[#112e52] dark:text-white">Withdrawal Information</h2><p className="mt-1 text-[11px] text-slate-500">Review these limits before submitting.</p></div></div>
          <div className="mt-5 space-y-3">
            <InfoRow label="Minimum Withdrawal" value={`${MIN_WITHDRAWAL.toLocaleString()} USDT`}/>
            <InfoRow label="Maximum Withdrawal" value={`${MAX_WITHDRAWAL.toLocaleString()} USDT / request`}/>
            <InfoRow label="Network" value="BNB Smart Chain / BEP-20"/>
            <InfoRow label="Platform Fee" value={`${FEE_PERCENT.toFixed(2)}%`}/>
            <InfoRow label="Processing" value="Subject to platform/provider review"/>
          </div>
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-200"><Info size={14} className="mb-1"/><p>Actual payout availability depends on the selected payment provider, supported country, KYC/AML requirements and provider response.</p></div>
        </aside>
      </section>

      <section className="mt-5 overflow-visible rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="border-b border-slate-100 p-3 dark:border-[#223250] sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div><h2 className="text-base font-bold text-[#112f55] dark:text-white">Withdrawal History</h2><p className="mt-1 text-xs text-slate-500">Track requests, processing and completed payouts.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-[#2b3c58] sm:w-[250px]"><Search size={16} className="shrink-0 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none dark:text-slate-200" placeholder="Search transaction ID..."/></div>
              <Dropdown value={status} onChange={setStatus} options={statusOptions} placeholder="All Status" />
              <button type="button" onClick={refresh} disabled={query.isFetching} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38]"><RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""}/></button>
            </div>
          </div>
        </div>

        {query.isError && !query.data ? <div className="p-10 text-center"><p className="text-sm text-rose-500">{query.error?.message || "Unable to load withdrawals."}</p><button onClick={refresh} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Try again</button></div>
        : query.isPending ? <div className="space-y-2 p-3 sm:p-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-[#16283f]"/>)}</div>
        : !items.length ? <div className="p-10 text-center text-sm text-slate-400">No withdrawal records found.</div>
        : <>
          <div className="hidden overflow-visible lg:block"><table className="w-full border-collapse text-left text-xs"><thead><tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 dark:bg-[#0d1a2e]"><th className="px-4 py-3">ID</th><th className="px-3 py-3">DATE & TIME</th><th className="px-3 py-3">AMOUNT</th><th className="px-3 py-3">FEE</th><th className="px-3 py-3">RECEIVED</th><th className="px-3 py-3">METHOD</th><th className="px-3 py-3">STATUS</th><th className="px-3 py-3 text-right">ACTION</th></tr></thead><tbody>{items.map(item=><tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-[#223250]"><td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{item.id}</td><td className="px-3 py-3 text-slate-500">{item.requestedAt || item.date || "-"}</td><td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{item.amount} USDT</td><td className="px-3 py-3 text-slate-500">{item.fee ? `${item.fee} USDT` : "-"}</td><td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{item.received ? `${item.received} USDT` : `${item.amount} USDT`}</td><td className="px-3 py-3 capitalize text-slate-500">{methodLabel(item.method)}</td><td className="px-3 py-3"><StatusBadge status={item.status}/></td><td className="px-3 py-3 text-right"><button onClick={()=>setSelected(item)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"><Eye size={13}/> View</button></td></tr>)}</tbody></table></div>
          <div className="grid gap-2 p-3 lg:hidden">{items.map(item=><article key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-[#263752]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-800 dark:text-white">{item.id}</p><p className="mt-1 text-[10px] text-slate-400">{item.requestedAt || item.date || "-"}</p></div><StatusBadge status={item.status}/></div><div className="mt-3 grid grid-cols-2 gap-2"><Mini label="Amount" value={`${item.amount} USDT`}/><Mini label="Received" value={`${item.received || item.amount} USDT`}/><Mini label="Method" value={methodLabel(item.method)}/><Mini label="Network" value={item.network || NETWORK}/></div><button onClick={()=>setSelected(item)} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 text-[10px] font-semibold text-blue-600">View Details <ChevronRight size={13}/></button></article>)}</div>
          <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2 dark:border-[#223250] sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] text-slate-400">{query.isFetching ? "Updating withdrawal data..." : `Showing ${items.length} of ${total} records`}</span><div className="flex items-center justify-end gap-2"><span className="text-[10px] text-slate-400">Rows</span><Dropdown value={limit} onChange={v=>setLimit(Number(v))} icon={null} className="!h-8 !min-w-[74px] !rounded-lg !px-2.5 !text-[11px]" options={[{value:10,label:"10"},{value:20,label:"20"},{value:50,label:"50"}]}/></div></div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage}/>
        </>}
      </section>

      {selected && <WithdrawalDetails item={selected} onClose={()=>setSelected(null)}/>} 
    </UserLayout>
  );
}

function Field({label,hint,children}) { return <label className="block"><span className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300"><span>{label}</span>{hint && <span className="text-[9px] font-normal text-slate-400">{hint}</span>}</span>{children}</label>; }
function Summary({label,value,highlight}) { return <div className="rounded-lg bg-white/70 p-2.5 dark:bg-[#101f38]/70"><span className="block text-[9px] uppercase tracking-wide text-slate-400">{label}</span><strong className={`mt-1 block text-sm ${highlight ? "text-emerald-600" : "text-slate-700 dark:text-slate-200"}`}>{value}</strong></div>; }
function InfoRow({label,value}) { return <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-[#223250]"><span className="text-[11px] text-slate-500">{label}</span><strong className="text-right text-[11px] text-slate-700 dark:text-slate-200">{value}</strong></div>; }
function Mini({label,value}) { return <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">{label}</span><strong className="mt-1 block truncate text-[10px] font-medium text-slate-700 dark:text-slate-200">{value}</strong></div>; }
function methodLabel(value) { return methodOptions.find(x=>x.value===value)?.label || value || "-"; }
function StatusBadge({status}) { const key=String(status||"").toLowerCase(); const cls=key==="completed"?"bg-emerald-50 text-emerald-600":key==="failed"||key==="rejected"?"bg-rose-50 text-rose-600":key==="processing"||key==="approved"?"bg-blue-50 text-blue-600":"bg-amber-50 text-amber-600"; return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{status || "Pending"}</span>; }
function WithdrawalDetails({item,onClose}) { const copy=async(text)=>{try{await navigator.clipboard.writeText(String(text));}catch{}}; return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"><div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-[#101f38] sm:max-w-2xl sm:rounded-2xl"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#112e52] dark:text-white">Withdrawal Details</h2><p className="mt-1 text-xs text-slate-500">Request and settlement information.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={18}/></button></div><div className="grid gap-3 sm:grid-cols-2">{[["Request ID",item.id],["Transaction ID",item.txId],["Date & Time",item.requestedAt||item.date],["Status",item.status],["Amount",`${item.amount} USDT`],["Fee",item.fee ? `${item.fee} USDT` : "-"],["Estimated Received",item.received ? `${item.received} USDT` : `${item.amount} USDT`],["Method",methodLabel(item.method)],["Network",item.network||NETWORK],["Processed At",item.processedAt||"-"]].map(([label,value])=><div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">{label}</span><strong className="mt-1 block text-xs text-slate-700 dark:text-slate-200">{value || "-"}</strong></div>)}</div><div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">Payout Account</span><div className="mt-1 flex items-center gap-2"><strong className="break-all text-xs font-medium text-slate-700 dark:text-slate-200">{item.accountNumber || item.address || "-"}</strong>{(item.accountNumber||item.address)&&<button onClick={()=>copy(item.accountNumber||item.address)} className="shrink-0 text-blue-600"><Copy size={15}/></button>}</div></div>{item.remarks && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-200"><FileText size={14} className="mb-1"/><p>{item.remarks}</p></div>}<div className="mt-5 flex justify-end"><button onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-5 text-xs font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300">Close</button></div></div></div>; }
