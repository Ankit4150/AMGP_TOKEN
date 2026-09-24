import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Check, CheckCircle2, Copy, Download, Eye, FileText,
  Pencil, Plus, RefreshCw, Search, ShieldCheck, X, XCircle, Ban
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/ui/StatCard";
import Dropdown from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getWithdrawalManagementApi, getWithdrawalManagementByIdApi, createWithdrawalManagementApi, updateWithdrawalManagementApi, deleteWithdrawalManagementApi } from "../../services/admin/withdrawalManagementApi";
import { queryClient } from "../../lib/queryClient";

const emptyForm = {
  user: "", email: "", wallet: "User Wallet", network: "BEP-20", currency: "USDT",
  amount: "", tokenPrice: "0.50", value: "", status: "Pending", address: "",
  txHash: "", confirmations: "0", blockNumber: "-", remarks: ""
};

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];
const networkOptions = [
  { value: "all", label: "All Networks" },
  { value: "BEP-20", label: "BEP-20" },
  { value: "TRC-20", label: "TRC-20" },
];
const currencyOptions = [
  { value: "all", label: "All Currencies" },
  { value: "USDT", label: "USDT" },
  { value: "BNB", label: "BNB" },
];
const walletOptions = [
  { value: "User Wallet", label: "User Wallet" },
  { value: "Token Treasury", label: "Token Treasury" },
  { value: "Operational / Marketing", label: "Operational / Marketing" },
];
const dateOptions = [
  { value: "all", label: "All Dates" },
  { value: "Today", label: "Today" },
  { value: "Last 7 Days", label: "Last 7 Days" },
  { value: "Last 30 Days", label: "Last 30 Days" },
];

export default function WithdrawalManagement() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [network, setNetwork] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data: response, isPending, isFetching, error, refetch } = usePaginatedQuery({
    queryKey: ["admin-withdrawals"],
    api: getWithdrawalManagementApi,
    page,
    limit,
    search: debouncedSearch,
    status,
    extraParams: { network, currency, date },
  });

  const payload = useMemo(() => response?.data ?? response ?? {}, [response]);
  const items = payload?.items ?? [];
  const stats = payload?.stats ?? [];
  const total = Number(payload?.total ?? items.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / limit)));

  useEffect(() => setPage(1), [debouncedSearch, status, network, currency, date, limit]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    refetch();
  };

  const saveWithdrawal = async (form) => {
    setBusy(true);
    try {
      const value = form.value || form.amount || "0";
      const payloadData = { ...form, value };
      if (editor?.id) await updateWithdrawalManagementApi(editor.id, payloadData);
      else await createWithdrawalManagementApi(payloadData);
      setEditor(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to save withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  const deleteWithdrawal = async (item) => {
    if (!window.confirm(`Delete withdrawal ${item.id}?`)) return;
    setBusy(true);
    try {
      await deleteWithdrawalManagementApi(item.id);
      if (selected?.id === item.id) setSelected(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to delete withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  const setWithdrawalStatus = async (item, nextStatus) => {
    if (!window.confirm(`${nextStatus} withdrawal ${item.id}?`)) return;
    setBusy(true);
    try {
      await updateWithdrawalManagementApi(item.id, {
        status: nextStatus,
        processedAt: ["Approved", "Completed", "Rejected", "Cancelled"].includes(nextStatus)
          ? new Date().toLocaleString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" })
          : item.processedAt
      });
      setSelected((current) => current?.id === item.id ? { ...current, status: nextStatus } : current);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to update withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const headers = ["ID","Transaction ID","User","Network","Currency","Amount","Status","Wallet Address","TX Hash","Requested At"];
    const rows = items.map(x => [x.id,x.txId,x.user,x.network,x.currency,x.amount,x.status,x.address,x.txHash,x.requestedAt]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "withdrawals.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck size={21}/></span>
            <div>
              <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] sm:text-[29px]">Withdrawal Management</h1>
              <p className="mt-1 text-sm text-[#3e5d83]">Monitor, review and manage all user withdrawal requests.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Dropdown value={date} onChange={setDate} options={dateOptions} icon={CalendarDays} className="!h-10" />
          <button onClick={() => setEditor({ ...emptyForm })} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus size={17}/> Add Withdrawal
          </button>
        </div>
      </div>

      <section className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(stats.length ? stats : [
          {label:"Total Withdrawals",value:"0",change:"—",tone:"blue",icon:"withdrawal"},
          {label:"Pending",value:"0",change:"—",tone:"yellow",icon:"pending"},
          {label:"Approved",value:"0",change:"—",tone:"green",icon:"verified"},
          {label:"Rejected",value:"0",change:"—",tone:"red",icon:"failed"},
          {label:"Total Amount",value:"0.00 USDT",change:"—",tone:"purple",icon:"investment"},
        ]).map(item => <StatCard key={item.label} item={item}/>)}
      </section>

      <section className="mb-3 rounded-xl border border-[#dce9f7] bg-white p-3 shadow-sm">
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_160px_160px_160px_auto_auto]">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#d9e6f4] px-3 text-[#577699]">
            <Search size={17}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search user, transaction ID, wallet address..." className="min-w-0 flex-1 bg-transparent text-xs text-[#24496f] outline-none placeholder:text-[#6681a2]"/>
          </div>
          <Dropdown value={status} onChange={setStatus} fullWidth options={statusOptions}/>
          <Dropdown value={network} onChange={setNetwork} fullWidth options={networkOptions}/>
          <Dropdown value={currency} onChange={setCurrency} fullWidth options={currencyOptions}/>
          <button onClick={() => {setSearch("");setStatus("all");setNetwork("all");setCurrency("all");setDate("all");}} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">Reset</button>
          <button onClick={refresh} disabled={isFetching || busy} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50" title="Refresh">
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""}/>
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-[10px] text-[#68809d] sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {total ? (page-1)*limit+1 : 0}–{Math.min(page*limit,total)} of {total} withdrawals</span>
          <button onClick={exportCsv} className="flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 sm:self-auto"><Download size={15}/> Export</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm">
        {isPending ? <Loading/> : error && !response ? <ErrorState error={error} retry={refresh}/> : (
          <>
            {isFetching && <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500"><RefreshCw size={12} className="animate-spin"/> Updating...</div>}
            <div className="hidden overflow-hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead><tr className="bg-[#f2f7fc] text-[10px] font-semibold text-[#426287]">
                  <th className="w-[9%] px-2 py-3">DATE & TIME</th>
                  <th className="w-[10%] px-2 py-3">TX ID</th>
                  <th className="w-[15%] px-2 py-3">USER</th>
                  <th className="w-[12%] px-2 py-3">NETWORK</th>
                  <th className="w-[10%] px-2 py-3">CURRENCY</th>
                  <th className="w-[11%] px-2 py-3">AMOUNT</th>
                  <th className="w-[10%] px-2 py-3">STATUS</th>
                  <th className="w-[13%] px-2 py-3">ADDRESS</th>
                  <th className="w-[10%] px-2 py-3">ACTIONS</th>
                </tr></thead>
                <tbody>{items.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 text-[11px] text-[#274c76] last:border-0">
                    <td className="truncate px-2 py-3">{item.requestedAt}</td>
                    <td className="truncate px-2 py-3 font-semibold text-[#173a65]">{item.txId}</td>
                    <td className="truncate px-2 py-3"><strong className="block truncate">{item.user}</strong><span className="block truncate text-[9px] text-slate-400">{item.email}</span></td>
                    <td className="px-2 py-3"><NetworkBadge value={item.network}/></td>
                    <td className="truncate px-2 py-3">{item.currency}</td>
                    <td className="truncate px-2 py-3 font-semibold">{item.amount} {item.currency}</td>
                    <td className="px-2 py-3"><Status status={item.status}/></td>
                    <td className="truncate px-2 py-3" title={item.address}>{item.address}</td>
                    <td className="px-2 py-3"><div className="flex items-center gap-1">
                      <ActionButton label="View" onClick={()=>setSelected(item)}><Eye size={15}/></ActionButton>
                      <ActionButton label="Edit" onClick={()=>setEditor({...item})}><Pencil size={15}/></ActionButton>
                      <ActionButton label="Delete" danger onClick={()=>deleteWithdrawal(item)}><XCircle size={15}/></ActionButton>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="grid gap-2 p-3 lg:hidden">
              {items.map(item => <MobileWithdrawal key={item.id} item={item} onView={setSelected} onEdit={setEditor} onDelete={deleteWithdrawal}/>)}
            </div>
            {!items.length && <div className="p-10 text-center text-sm text-slate-400">No withdrawals found.</div>}
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage}/>
            <div className="border-t border-slate-100 px-3 py-2 text-right text-[10px] text-slate-400">
              <label className="inline-flex items-center gap-2">Rows <Dropdown value={limit} onChange={v=>setLimit(Number(v))} icon={null} className="!h-8 !rounded-lg !px-2.5 !text-[11px]" options={[{value:10,label:"10"},{value:20,label:"20"},{value:50,label:"50"}]}/></label>
            </div>
          </>
        )}
      </section>

      {selected && <DetailsDrawer item={selected} onClose={()=>setSelected(null)} onStatus={setWithdrawalStatus} busy={busy}/>}
      {editor && <WithdrawalForm initial={editor} busy={busy} onClose={()=>setEditor(null)} onSave={saveWithdrawal}/>}
    </AdminLayout>
  );
}

function Loading(){return <div className="space-y-2 p-4">{Array.from({length:7}).map((_,i)=><div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100"/>)}</div>}
function ErrorState({error,retry}){return <div className="p-10 text-center"><p className="text-sm text-rose-500">{error?.message||"Unable to load withdrawals."}</p><button onClick={retry} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Try again</button></div>}
function Status({status}){const s=String(status||"Pending");const n=s.toLowerCase();const good=["approved","completed"].includes(n),bad=["rejected","cancelled","failed"].includes(n);return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${good?"bg-emerald-50 text-emerald-600":bad?"bg-rose-50 text-rose-500":"bg-amber-50 text-amber-600"}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{s}</span>}
function NetworkBadge({value}){return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${value==="TRC-20"?"bg-rose-50 text-rose-500":"bg-amber-50 text-amber-600"}`}>{value}</span>}
function ActionButton({children,onClick,label,danger=false}){return <button onClick={onClick} title={label} aria-label={label} className={`grid h-8 w-8 place-items-center rounded-lg border bg-white ${danger?"border-rose-100 text-rose-500 hover:bg-rose-50":"border-slate-200 text-[#24486f] hover:bg-slate-50"}`}>{children}</button>}
function MobileWithdrawal({item,onView,onEdit,onDelete}){return <article className="rounded-xl border border-slate-200 p-3 shadow-sm"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Download size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-xs text-slate-800">{item.user}</strong><Status status={item.status}/></div><p className="mt-1 truncate text-[10px] text-slate-500">{item.txId} · {item.requestedAt}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><Info label="Amount" value={`${item.amount} ${item.currency}`}/><Info label="Network" value={item.network}/><Info label="Address" value={item.address}/><Info label="Wallet" value={item.wallet}/></div><div className="mt-3 flex gap-2"><button onClick={()=>onView(item)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"><Eye size={14}/> View</button><button onClick={()=>onEdit({...item})} className="grid h-9 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700" aria-label="Edit"><Pencil size={14}/></button><button onClick={()=>onDelete(item)} className="grid h-9 w-10 place-items-center rounded-lg border border-rose-100 text-rose-500" aria-label="Delete"><XCircle size={14}/></button></div></article>}
function Info({label,value}){return <div className="min-w-0 rounded-lg bg-slate-50 p-2"><span className="block text-[9px] uppercase text-slate-400">{label}</span><strong className="mt-1 block truncate text-[10px] font-medium text-slate-700">{value||"-"}</strong></div>}

function DetailsDrawer({item,onClose,onStatus,busy}){
  const copy=(v)=>navigator.clipboard?.writeText(String(v||""));
  return <div className="fixed inset-0 z-[80] bg-slate-900/30" onMouseDown={onClose}>
    <aside onMouseDown={e=>e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-[430px] overflow-y-auto bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5"><div><h2 className="text-lg font-bold text-[#112e52]">Withdrawal Details</h2><div className="mt-2"><Status status={item.status}/></div></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600"><X size={20}/></button></div>
      <div className="space-y-4 p-5">
        <DetailRow label="Transaction ID" value={item.txId} copy={copy}/><DetailRow label="Withdrawal ID" value={item.id}/><DetailRow label="User" value={`${item.user} · ${item.email}`}/><DetailRow label="Wallet Address" value={item.address} copy={copy}/><DetailRow label="Network" value={item.network}/><DetailRow label="Currency" value={item.currency}/><DetailRow label="Amount" value={`${item.amount} ${item.currency}`}/><DetailRow label="Token Price Snapshot" value={`${item.tokenPrice} USDT`}/><DetailRow label="Value (USDT)" value={`${item.value} USDT`}/><DetailRow label="Requested At" value={item.requestedAt}/><DetailRow label="Processed At" value={item.processedAt || "-"}/>
        <div className="rounded-xl border border-slate-200 p-4"><h3 className="mb-3 text-xs font-bold text-[#173a65]">Blockchain Details</h3><DetailRow label="TX Hash" value={item.txHash} copy={copy}/><DetailRow label="Confirmations" value={item.confirmations}/><DetailRow label="Block Number" value={item.blockNumber}/></div>
        <div className="rounded-xl border border-slate-200 p-4"><h3 className="mb-3 text-xs font-bold text-[#173a65]">Processing Information</h3><DetailRow label="Wallet" value={item.wallet}/><DetailRow label="Remarks" value={item.remarks || "-"}/></div>
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3">
          <button disabled={busy || ["Completed","Rejected","Cancelled"].includes(item.status)} onClick={()=>onStatus(item,"Approved")} className="flex h-10 items-center justify-center gap-1 rounded-lg bg-emerald-500 text-xs font-semibold text-white disabled:opacity-40"><CheckCircle2 size={15}/> Approve</button>
          <button disabled={busy || ["Completed","Rejected","Cancelled"].includes(item.status)} onClick={()=>onStatus(item,"Rejected")} className="flex h-10 items-center justify-center gap-1 rounded-lg border border-rose-300 text-xs font-semibold text-rose-600 disabled:opacity-40"><XCircle size={15}/> Reject</button>
          <button disabled={busy || ["Completed","Rejected","Cancelled"].includes(item.status)} onClick={()=>onStatus(item,"Cancelled")} className="flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 disabled:opacity-40"><Ban size={15}/> Cancel</button>
        </div>
      </div>
    </aside>
  </div>
}
function DetailRow({label,value,copy}){return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"><span className="shrink-0 text-[10px] text-slate-500">{label}</span><span className="flex min-w-0 items-center gap-1 text-right text-[11px] font-semibold text-[#173a65]"><span className="max-w-[230px] break-words">{value||"-"}</span>{copy&&<button onClick={()=>copy(value)} className="shrink-0 text-slate-400 hover:text-blue-600"><Copy size={13}/></button>}</span></div>}

function WithdrawalForm({initial,busy,onClose,onSave}){
  const [form,setForm]=useState({...emptyForm,...initial});
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));
  const submit=e=>{e.preventDefault(); if(!form.user || !form.amount){window.alert("User and Amount are required.");return;} onSave(form)};
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 p-3 sm:p-5" onMouseDown={onClose}>
    <form onSubmit={submit} onMouseDown={e=>e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-bold text-[#112e52]">{initial.id?"Edit Withdrawal":"Add Withdrawal"}</h2><p className="mt-1 text-xs text-slate-500">Manage the admin withdrawal record.</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200"><X size={19}/></button></div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
        <Field label="User / Counterparty"><input value={form.user} onChange={e=>set("user",e.target.value)} placeholder="User name" className="input"/></Field>
        <Field label="Email"><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="user@example.com" className="input"/></Field>
        <Field label="Wallet"><Dropdown value={form.wallet} onChange={v=>set("wallet",v)} fullWidth icon={null} options={walletOptions}/></Field>
        <Field label="Network"><Dropdown value={form.network} onChange={v=>set("network",v)} fullWidth icon={null} options={networkOptions.slice(1)}/></Field>
        <Field label="Currency"><Dropdown value={form.currency} onChange={v=>set("currency",v)} fullWidth icon={null} options={currencyOptions.slice(1)}/></Field>
        <Field label="Amount"><input value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="1,240.00" className="input"/></Field>
        <Field label="Token Price Snapshot"><input value={form.tokenPrice} onChange={e=>set("tokenPrice",e.target.value)} placeholder="0.50" className="input"/></Field>
        <Field label="Value (USDT)"><input value={form.value} onChange={e=>set("value",e.target.value)} placeholder="620.00" className="input"/></Field>
        <Field label="Status"><Dropdown value={form.status} onChange={v=>set("status",v)} fullWidth icon={null} options={statusOptions.slice(1)}/></Field>
        <Field label="Wallet Address"><input value={form.address} onChange={e=>set("address",e.target.value)} placeholder="0x... / T..." className="input"/></Field>
        <Field label="TX Hash"><input value={form.txHash} onChange={e=>set("txHash",e.target.value)} placeholder="0x..." className="input"/></Field>
        <Field label="Block Number"><input value={form.blockNumber} onChange={e=>set("blockNumber",e.target.value)} placeholder="-" className="input"/></Field>
        <Field label="Confirmations"><input type="number" min="0" value={form.confirmations} onChange={e=>set("confirmations",e.target.value)} className="input"/></Field>
        <Field label="Remarks" full><textarea value={form.remarks} onChange={e=>set("remarks",e.target.value)} placeholder="Processing notes..." className="input min-h-24 resize-none"/></Field>
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white p-4"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600">Cancel</button><button disabled={busy} type="submit" className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-50">{busy?"Saving...":initial.id?"Save Changes":"Create Withdrawal"}</button></div>
    </form>
  </div>
}
function Field({label,children,full}){return <label className={`${full?"sm:col-span-2":""} min-w-0`}><span className="mb-1.5 block text-[10px] font-semibold uppercase text-[#426287]">{label}</span>{children}</label>}
