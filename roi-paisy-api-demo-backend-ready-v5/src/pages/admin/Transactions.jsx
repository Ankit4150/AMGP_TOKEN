import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown,
  CircleAlert, Copy, Download, Eye, FileText, Filter, Plus, RefreshCw,
  Search, Trash2, X, Pencil, WalletCards
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import Dropdown from "../../components/ui/Dropdown";
import { getTransactionApi, getTransactionByIdApi, createTransactionApi, updateTransactionApi, deleteTransactionApi } from "../../services/admin/transactionApi";
import { useDebounce } from "../../hooks/useDebounce";

const TYPES = ["Deposit","Investment","ROI Payout","Token Transfer","Buyback","Withdrawal","Liquidity"];
const WALLETS = ["Token Treasury","Reward Distribution","Liquidity","Buyback","Operational / Marketing","User Wallet"];
const STATUSES = ["Pending","Processing","Completed","Failed","Rejected"];

const emptyForm = {
  type:"Deposit", subtype:"USDT Deposit", user:"", wallet:"Token Treasury",
  direction:"In", amount:"", value:"", tokenPrice:"0.50 USDT", counterparty:"",
  status:"Pending", blockchain:"BSC (BNB Smart Chain)", txHash:"", blockNumber:"-",
  confirmations:0, reconciliation:"Pending"
};

function getItems(response) {
  const payload = response?.data ?? response ?? {};
  return payload?.items ?? payload?.transactions ?? [];
}
function getMeta(response, items, limit) {
  const payload = response?.data ?? response ?? {};
  const total = Number(payload?.total ?? payload?.pagination?.total ?? items.length);
  const pages = Number(payload?.totalPages ?? payload?.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit)));
  return { total, pages };
}
function statusClass(status) {
  const s=String(status||"").toLowerCase();
  if(s==="completed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if(s==="pending" || s==="processing") return "bg-amber-50 text-amber-700 border-amber-100";
  if(s==="failed" || s==="rejected") return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-slate-50 text-slate-600 border-slate-200";
}
function typeIcon(type) {
  const s=String(type||"").toLowerCase();
  if(s.includes("deposit") || s.includes("investment")) return <ArrowDownLeft size={15}/>;
  if(s.includes("withdraw") || s.includes("payout") || s.includes("buyback")) return <ArrowUpRight size={15}/>;
  return <WalletCards size={15}/>;
}

export default function Transactions() {
  const [items,setItems]=useState([]);
  const [page,setPage]=useState(1);
  const [limit]=useState(10);
  const [search,setSearch]=useState("");
  const debouncedSearch=useDebounce(search,400);
  const [type,setType]=useState("all");
  const [wallet,setWallet]=useState("all");
  const [status,setStatus]=useState("all");
  const [date,setDate]=useState("all");
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");
  const [total,setTotal]=useState(0);
  const [totalPages,setTotalPages]=useState(1);
  const [selected,setSelected]=useState(null);
  const [formOpen,setFormOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(null);
  const [copied,setCopied]=useState(false);

  const load=async(signal)=>{
    setError("");
    setLoading(true);
    try {
      const res=await getTransactionApi({
        page,limit,
        ...(debouncedSearch?{search:debouncedSearch}:{}),
        ...(type!=="all"?{type}:{}),
        ...(wallet!=="all"?{wallet}:{}),
        ...(status!=="all"?{status}:{}),
        ...(date!=="all"?{date}:{})
      },signal);
      const rows=getItems(res);
      const meta=getMeta(res,rows,limit);
      setItems(rows); setTotal(meta.total); setTotalPages(meta.pages);
    } catch(e) {
      if(e?.name!=="AbortError") setError(e?.message||"Unable to load transactions.");
    } finally {
      if(!signal?.aborted) setLoading(false);
    }
  };

  useEffect(()=>{
    const controller=new AbortController();
    load(controller.signal);
    return ()=>controller.abort();
  },[page,limit,debouncedSearch,type,wallet,status,date]);

  useEffect(()=>{ setPage(1); },[debouncedSearch,type,wallet,status,date]);

  const refresh=async()=>{
    setRefreshing(true);
    try { await load(new AbortController().signal); } finally { setRefreshing(false); }
  };

  const stats=useMemo(()=>{
    const all=items;
    const completed=all.filter(x=>String(x.status).toLowerCase()==="completed").length;
    const failed=all.filter(x=>["failed","rejected"].includes(String(x.status).toLowerCase())).length;
    const token=all.reduce((sum,x)=>{
      const n=parseFloat(String(x.amount||"").replace(/,/g,""));
      return /ntk/i.test(String(x.amount)) ? sum+(Number.isFinite(n)?n:0) : sum;
    },0);
    const usdt=all.reduce((sum,x)=>{
      const n=parseFloat(String(x.value||"").replace(/,/g,""));
      return sum+(Number.isFinite(n)?n:0);
    },0);
    return {completed,failed,token,usdt};
  },[items]);

  const openCreate=()=>{setEditing(null);setForm({...emptyForm});setFormOpen(true);};
  const openEdit=(tx)=>{
    setEditing(tx);
    setForm({
      type:tx.type||"Deposit", subtype:tx.subtype||"", user:tx.user||"",
      wallet:tx.wallet||"Token Treasury", direction:tx.direction||"Out",
      amount:tx.amount||"", value:tx.value||"", tokenPrice:tx.tokenPrice||"0.50 USDT",
      counterparty:tx.counterparty||"", status:tx.status||"Pending",
      blockchain:tx.blockchain||"BSC (BNB Smart Chain)", txHash:tx.txHash||"",
      blockNumber:tx.blockNumber||"-", confirmations:tx.confirmations||0,
      reconciliation:tx.reconciliation||"Pending"
    });
    setFormOpen(true);
  };

  const save=async(e)=>{
    e.preventDefault(); setSaving(true);
    try {
      const payload={...form,confirmations:Number(form.confirmations)||0};
      const res=editing
        ? await updateTransactionApi(editing.id,payload)
        : await createTransactionApi(payload);
      const saved=res?.data?.data||res?.data||res;
      if(saved?.id){
        setItems(prev=>editing?prev.map(x=>x.id===saved.id?saved:x):[saved,...prev].slice(0,limit));
        if(selected?.id===saved.id) setSelected(saved);
      } else {
        await load(new AbortController().signal);
      }
      setFormOpen(false);
    } catch(e) {
      setError(e?.message||"Unable to save transaction.");
    } finally { setSaving(false); }
  };

  const remove=async(tx)=>{
    setDeleting(tx.id);
    try {
      await deleteTransactionApi(tx.id);
      setItems(prev=>prev.filter(x=>x.id!==tx.id));
      setTotal(v=>Math.max(0,v-1));
      if(selected?.id===tx.id) setSelected(null);
    } catch(e) {
      setError(e?.message||"Unable to delete transaction.");
    } finally { setDeleting(null); }
  };

  const copyHash=async()=>{
    if(!selected?.txHash || selected.txHash==="-") return;
    try { await navigator.clipboard.writeText(selected.txHash); setCopied(true); setTimeout(()=>setCopied(false),1200); } catch {}
  };

  const exportCsv=()=>{
    const headers=["Transaction ID","Date & Time","Type","User","Wallet","Direction","Amount","Value (USDT)","Counterparty","Status","Blockchain","TX Hash"];
    const rows=items.map(x=>[x.id,x.createdAt,x.type,x.user,x.wallet,x.direction,x.amount,x.value,x.counterparty,x.status,x.blockchain,x.txHash]);
    const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="transactions.csv";a.click();URL.revokeObjectURL(a.href);
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#112e52] sm:text-[29px]">Transactions</h1>
          <p className="mt-1 text-sm text-[#3e5d83]">Monitor and manage all platform transactions.</p>
        </div>
        <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Plus size={17}/> Add Transaction
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Total Transactions",total,FileText],
          ["Token Amount",`${stats.token.toLocaleString()} AMGP`,WalletCards],
          ["USDT Value",`${stats.usdt.toLocaleString(undefined,{maximumFractionDigits:2})} USDT`,ArrowUpRight],
          ["Completed / Failed",`${stats.completed} / ${stats.failed}`,CheckCircle2]
        ].map(([label,value,Icon])=>(
          <div key={label} className="rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-[#68809d]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600"><Icon size={16}/></span>{label}</div>
            <strong className="mt-3 block text-xl text-[#112e52]">{value}</strong>
          </div>
        ))}
      </div>

      <section className="relative min-w-0 overflow-visible rounded-xl border border-[#dce9f7] bg-white shadow-sm">
        <div className="border-b border-slate-100 p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
              <div className="flex h-10 min-w-0 flex-1 basis-[260px] items-center gap-2 rounded-lg border border-slate-200 px-3">
                <Search size={16} className="shrink-0 text-slate-400"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 text-xs outline-none" placeholder="Search by transaction ID, wallet, address, hash or user..."/>
              </div>
              <Filter size={18} className="hidden text-slate-400 lg:block lg:mt-3"/>
              <Select value={type} onChange={setType} label="Transaction Type" options={["all",...TYPES]}/>
              <Select value={wallet} onChange={setWallet} label="Wallet" options={["all",...WALLETS]}/>
              <Select value={status} onChange={setStatus} label="Status" options={["all",...STATUSES]}/>
              <Select value={date} onChange={setDate} label="Date" options={["all","Today","Last 7 Days","Last 30 Days"]}/>
              <button onClick={()=>{setSearch("");setType("all");setWallet("all");setStatus("all");setDate("all");}} className="h-10 shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">Reset</button>
              <button onClick={refresh} disabled={refreshing} title="Refresh" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-50"><RefreshCw size={15} className={refreshing?"animate-spin":""}/></button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Showing {items.length ? ((page-1)*limit+1) : 0}–{Math.min(page*limit,total)} of {total} transactions</span>
              <button onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"><Download size={14}/> Export</button>
            </div>
          </div>
        </div>

        {error && <div className="mx-3 mt-3 flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-600 sm:mx-4"><span>{error}</span><button onClick={()=>setError("")}><X size={15}/></button></div>}

        {loading ? (
          <div className="space-y-2 p-4">{Array.from({length:7}).map((_,i)=><div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100"/>)}</div>
        ) : !items.length ? (
          <div className="p-12 text-center"><FileText className="mx-auto text-slate-300" size={34}/><p className="mt-3 text-sm font-semibold text-slate-500">No transactions found</p><p className="mt-1 text-xs text-slate-400">Try changing the filters or add a transaction.</p></div>
        ) : (
          <>
            <div className="hidden xl:block w-full overflow-hidden">
              <table className="transaction-table w-full table-fixed border-collapse text-left text-[11px]">
                <colgroup>
                  <col className="w-[11%]"/><col className="w-[10%]"/><col className="w-[15%]"/><col className="w-[14%]"/>
                  <col className="w-[9%]"/><col className="w-[10%]"/><col className="w-[10%]"/><col className="w-[9%]"/><col className="w-[12%]"/>
                </colgroup>
                <thead><tr className="bg-slate-50 text-[10px] font-semibold text-slate-500">
                  {['DATE & TIME','TRANSACTION ID','TYPE','WALLET','DIRECTION','AMOUNT','VALUE (USDT)','STATUS','ACTION'].map(h=><th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>)}
                </tr></thead>
                <tbody>
                  {items.map(tx=><tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="truncate whitespace-nowrap px-3 py-3 text-slate-500" title={tx.createdAt}>{tx.createdAt}</td>
                    <td className="truncate px-3 py-3 font-semibold text-[#24486f]" title={tx.id}>{tx.id}</td>
                    <td className="min-w-0 px-3 py-3"><div className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">{typeIcon(tx.type)}</span><span className="min-w-0"><b className="block truncate text-[#24486f]" title={tx.type}>{tx.type}</b><small className="block truncate text-[10px] text-slate-400" title={tx.subtype}>{tx.subtype}</small></span></div></td>
                    <td className="min-w-0 px-3 py-3"><span className="block truncate text-slate-600" title={tx.wallet}>{tx.wallet}</span><small className="block truncate text-[10px] text-slate-400">{tx.walletType}</small></td>
                    <td className="px-3 py-3"><span className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${tx.direction==='In'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-600'}`}>{tx.direction==='In'?<ArrowDownLeft size={12}/>:<ArrowUpRight size={12}/>} {tx.direction}</span></td>
                    <td className="truncate whitespace-nowrap px-3 py-3 font-semibold text-[#24486f]" title={tx.amount}>{tx.amount}</td>
                    <td className="truncate whitespace-nowrap px-3 py-3 text-slate-600" title={tx.value}>{tx.value}</td>
                    <td className="px-3 py-3"><span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(tx.status)}`}>{tx.status}</span></td>
                    <td className="px-3 py-3"><div className="flex items-center gap-1"><button onClick={()=>setSelected(tx)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600" title="View"><Eye size={15}/></button><button onClick={()=>openEdit(tx)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Edit"><Pencil size={14}/></button><button onClick={()=>remove(tx)} disabled={deleting===tx.id} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 disabled:opacity-50" title="Delete"><Trash2 size={14}/></button></div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 xl:hidden">
              {items.map(tx=><article key={tx.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={()=>setSelected(tx)} className="flex min-w-0 items-center gap-2 text-left"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">{typeIcon(tx.type)}</span><span className="min-w-0"><b className="block truncate text-xs text-[#24486f]">{tx.type}</b><span className="block truncate text-[10px] text-slate-400">{tx.id} · {tx.createdAt}</span></span></button>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClass(tx.status)}`}>{tx.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Info label="Wallet" value={tx.wallet}/><Info label="Direction" value={tx.direction}/><Info label="Amount" value={tx.amount}/><Info label="Value" value={tx.value}/><Info label="Counterparty" value={tx.counterparty}/><Info label="TX Hash" value={tx.txHash}/>
                </div>
                <div className="mt-3 flex gap-2"><button onClick={()=>setSelected(tx)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"><Eye size={14}/> View</button><button onClick={()=>openEdit(tx)} className="grid h-9 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600"><Pencil size={14}/></button><button onClick={()=>remove(tx)} className="grid h-9 w-10 place-items-center rounded-lg border border-rose-100 text-rose-500"><Trash2 size={14}/></button></div>
              </article>)}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-3 sm:px-4">
              <span className="text-[10px] text-slate-400">10 rows per page</span>
              <div className="flex items-center gap-1">
                <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40">‹</button>
                {Array.from({length:Math.min(5,totalPages)},(_,i)=>i+1).map(n=><button key={n} onClick={()=>setPage(n)} className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-semibold ${page===n?"border-blue-600 bg-blue-600 text-white":"border-slate-200 text-slate-600"}`}>{n}</button>)}
                <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40">›</button>
              </div>
            </div>
          </>
        )}
      </section>

      {selected && <TransactionDrawer tx={selected} onClose={()=>setSelected(null)} onEdit={()=>{openEdit(selected);}} onCopy={copyHash} copied={copied}/>}
      {formOpen && <TransactionForm form={form} setForm={setForm} editing={editing} saving={saving} onClose={()=>setFormOpen(false)} onSave={save}/>}
    </AdminLayout>
  );
}

function Select({value,onChange,label,options}) {
  const dropdownOptions=options.map(x=>({value:x,label:x==="all"?`All ${label}`:x}));
  return <div className="min-w-0 flex-1 xl:max-w-[180px]"><Dropdown value={value} onChange={onChange} options={dropdownOptions} placeholder={`All ${label}`} icon={Filter} fullWidth className="h-10 rounded-lg px-3 font-medium"/></div>
}
function Info({label,value}){return <div className="min-w-0 rounded-lg bg-slate-50 p-2"><span className="block truncate text-[9px] uppercase text-slate-400">{label}</span><strong className="mt-1 block truncate text-[10px] font-medium text-slate-700">{value||"-"}</strong></div>}

function TransactionDrawer({tx,onClose,onEdit,onCopy,copied}) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <aside className="h-full w-full max-w-[430px] overflow-y-auto bg-white shadow-2xl" onMouseDown={e=>e.stopPropagation()}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-4">
        <div><h2 className="text-base font-bold text-[#112e52]">Transaction Details</h2><p className="mt-0.5 text-[10px] text-slate-400">{tx.id}</p></div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"><X size={17}/></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">{typeIcon(tx.type)}</span><div><div className="font-bold text-[#24486f]">{tx.type}</div><div className="text-xs text-slate-400">{tx.subtype}</div></div><span className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(tx.status)}`}>{tx.status}</span></div>
        <div className="grid grid-cols-2 gap-2">{[["Transaction ID",tx.id],["User",tx.user],["Wallet",tx.wallet],["Wallet Type",tx.walletType],["Amount",tx.amount],["Value (USDT)",tx.value],["Token Price",tx.tokenPrice],["Counterparty",tx.counterparty],["Direction",tx.direction],["Blockchain",tx.blockchain],["Block Number",tx.blockNumber],["Confirmations",tx.confirmations],["Created At",tx.createdAt],["Completed At",tx.completedAt]].map(([k,v])=><Info key={k} label={k} value={v}/>)}</div>
        <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><b className="text-xs text-[#112e52]">TX Hash</b><button onClick={onCopy} className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600">{copied?"Copied":"Copy"}<Copy size={12}/></button></div><p className="mt-2 break-all text-[11px] text-slate-500">{tx.txHash||"-"}</p></div>
        <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><b className="text-xs text-[#112e52]">Reconciliation</b><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${tx.reconciliation==="Reconciled"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{tx.reconciliation||"Pending"}</span></div><div className="mt-3 grid grid-cols-2 gap-2"><Info label="Expected Amount" value={tx.amount}/><Info label="Internal Balance" value={tx.amount}/><Info label="Actual Blockchain" value={tx.status==="Completed"?tx.amount:"Pending"}/><Info label="Difference" value={tx.status==="Completed"?"0":"-"} /></div></div>
        <div className="flex gap-2"><button onClick={onEdit} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-semibold text-white"><Pencil size={14}/> Edit</button><button onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600">Close</button></div>
      </div>
    </aside>
  </div>
}

function TransactionForm({form,setForm,editing,saving,onClose,onSave}) {
  const field=(key,value)=>setForm(f=>({...f,[key]:value}));
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-3 sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <form onSubmit={onSave} onMouseDown={e=>e.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-4 sm:p-5"><div><h2 className="text-lg font-bold text-[#112e52]">{editing?"Edit Transaction":"Add Transaction"}</h2><p className="mt-1 text-xs text-slate-400">Manage the admin transaction record.</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"><X size={17}/></button></div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <Field label="Transaction Type"><Dropdown value={form.type} onChange={v=>field("type",v)} options={TYPES.map(x=>({value:x,label:x}))} icon={null} fullWidth /></Field>
        <Field label="Subtype"><input value={form.subtype} onChange={e=>field("subtype",e.target.value)} placeholder="e.g. Token Reward"/></Field>
        <Field label="User / Counterparty User"><input value={form.user} onChange={e=>field("user",e.target.value)} placeholder="User name"/></Field>
        <Field label="Wallet"><Dropdown value={form.wallet} onChange={v=>field("wallet",v)} options={WALLETS.map(x=>({value:x,label:x}))} icon={null} fullWidth /></Field>
        <Field label="Direction"><Dropdown value={form.direction} onChange={v=>field("direction",v)} options={[{value:"In",label:"In"},{value:"Out",label:"Out"}]} icon={null} fullWidth /></Field>
        <Field label="Amount"><input value={form.amount} onChange={e=>field("amount",e.target.value)} placeholder="1,240 AMGP"/></Field>
        <Field label="Value (USDT)"><input value={form.value} onChange={e=>field("value",e.target.value)} placeholder="620.00 USDT"/></Field>
        <Field label="Token Price Snapshot"><input value={form.tokenPrice} onChange={e=>field("tokenPrice",e.target.value)} placeholder="0.50 USDT"/></Field>
        <Field label="Counterparty"><input value={form.counterparty} onChange={e=>field("counterparty",e.target.value)} placeholder="Batch / wallet / provider"/></Field>
        <Field label="Status"><Dropdown value={form.status} onChange={v=>field("status",v)} options={STATUSES.map(x=>({value:x,label:x}))} icon={null} fullWidth /></Field>
        <Field label="Blockchain"><input value={form.blockchain} onChange={e=>field("blockchain",e.target.value)}/></Field>
        <Field label="TX Hash"><input value={form.txHash} onChange={e=>field("txHash",e.target.value)} placeholder="0x..."/></Field>
        <Field label="Block Number"><input value={form.blockNumber} onChange={e=>field("blockNumber",e.target.value)}/></Field>
        <Field label="Confirmations"><input type="number" min="0" value={form.confirmations} onChange={e=>field("confirmations",e.target.value)}/></Field>
        <Field label="Reconciliation"><Dropdown value={form.reconciliation} onChange={v=>field("reconciliation",v)} options={["Pending","Reconciled","Mismatch"].map(x=>({value:x,label:x}))} icon={null} fullWidth /></Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 p-4 sm:p-5"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600">Cancel</button><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-60">{saving&&<RefreshCw size={13} className="animate-spin"/>}{editing?"Save Changes":"Create Transaction"}</button></div>
    </form>
  </div>
}
function Field({label,children}){return <label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>{React.cloneElement(children,{className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 "+(children.props.className||"")})}</label>}
