import React, { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Clock3, Copy, ExternalLink,
  Info, Loader2, RefreshCw, Search, ShieldCheck, WalletCards, X, Zap
} from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import { getDepositApi, getDepositByIdApi, createDepositApi, updateDepositApi } from "../../services/user/depositApi";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { useDebounce } from "../../hooks/useDebounce";
import { queryClient } from "../../lib/queryClient";

const NETWORKS = [
  { value: "BEP-20", label: "BNB Smart Chain (BEP-20)", fee: "Low network fee", address: "0x12a3f7b6c9d84e11a2f5c6b8d9e0f1a2b3c4d9f8c" },
];

const shorten = (value = "") => value.length > 30 ? `${value.slice(0, 14)}...${value.slice(-12)}` : value;

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 dark:bg-[#16283f] ${className}`} />;
}

export default function Deposit() {
  const [network, setNetwork] = useState(NETWORKS[0].value);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tracking, setTracking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  const query = usePaginatedQuery({
    queryKey: ["user-deposits"],
    api: getDepositApi,
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payload = query.data?.data ?? query.data ?? {};
  const items = payload.items ?? [];
  const total = Number(payload.total ?? items.length);
  const totalPages = Math.max(1, Number(payload.totalPages ?? Math.ceil(total / limit)));
  const activeNetwork = useMemo(() => NETWORKS.find(x => x.value === network) || NETWORKS[0], [network]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["user-deposits"] });
    query.refetch();
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(activeNetwork.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.alert("Unable to copy the deposit address.");
    }
  };

  return (
    <UserLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">USDT Deposit</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#3e5d83] dark:text-slate-400">
            Deposit supported USDT to your platform wallet. The system will monitor the blockchain and credit your balance after the required confirmations.
          </p>
        </div>
        <button onClick={refresh} disabled={query.isFetching} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-[#2b3c58] dark:bg-[#101f38] dark:text-slate-200">
          <RefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
        <div className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><WalletCards size={19}/></div>
                <div>
                  <h2 className="text-base font-bold text-[#112f55] dark:text-white">Deposit USDT</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Choose the network before sending funds.</p>
                </div>
              </div>
            </div>
            <div className="relative min-w-0 sm:w-[290px]">
              <Dropdown value={network} onChange={setNetwork} fullWidth icon={null} options={NETWORKS.map((item) => ({ value: item.value, label: item.label }))} placeholder="Select network" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-500/5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 shrink-0 text-blue-600" size={17}/>
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Send only USDT on {activeNetwork.value}</p>
                <p className="mt-1 text-[11px] leading-5 text-blue-700/80 dark:text-blue-200/70">Sending another asset or using another network can result in permanent loss of funds.</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Your deposit address</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-[11px] text-slate-700 dark:border-[#2b3c58] dark:bg-[#0d1a2e] dark:text-slate-300 sm:text-xs">{activeNetwork.address}</div>
              <button onClick={copyAddress} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"><Copy size={14}/> {copied ? "Copied" : "Copy Address"}</button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={ShieldCheck} title="Network" value="BEP-20" />
            <InfoCard icon={Zap} title="Network fee" value={activeNetwork.fee} />
            <InfoCard icon={Clock3} title="Confirmation" value="Required" />
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-500/5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={17}/><div><p className="text-xs font-bold text-amber-900 dark:text-amber-200">Already sent USDT?</p><p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-200/70">Track the transaction below. Your balance is credited only after blockchain confirmation.</p></div></div>
            <button onClick={() => setTracking(true)} className="h-9 shrink-0 rounded-lg border border-amber-300 bg-white px-3 text-[11px] font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-[#12223b] dark:text-amber-200">Track Deposit</button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-6">
          <h2 className="text-base font-bold text-[#112f55] dark:text-white">Deposit steps</h2>
          <div className="mt-5 space-y-5">
            <Step number="1" title="Select network" text="Choose the supported network that matches your sending wallet." />
            <Step number="2" title="Copy address" text="Copy the deposit address shown on this page." />
            <Step number="3" title="Send USDT" text="Send USDT from your external wallet or exchange." />
            <Step number="4" title="Blockchain confirmation" text="The platform monitors the transaction and waits for required confirmations." />
            <Step number="5" title="Balance credited" text="After confirmation, the USDT deposit is recorded and reflected in your balance." />
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-[#0d1a2e]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><CheckCircle2 size={15} className="text-emerald-500"/> Duplicate-credit protection</div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Each blockchain transaction should be credited only once. The backend must use transaction identifiers and idempotent balance updates.</p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="border-b border-slate-100 p-4 dark:border-[#223250] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-base font-bold text-[#112f55] dark:text-white">Deposit history</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Track pending, processing, completed and failed USDT deposits.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-64"><Search size={14} className="absolute left-3 top-3.5 text-slate-400"/><input value={search} onChange={e => {setSearch(e.target.value);setPage(1)}} placeholder="Search transaction / hash" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500 dark:border-[#2b3c58] dark:bg-[#12223b] dark:text-white"/></div>
              <Dropdown value={status} onChange={v => {setStatus(v);setPage(1)}} icon={null} className="!h-10 !rounded-lg !text-xs" options={[{value:"all",label:"All Status"},{value:"Pending",label:"Pending"},{value:"Processing",label:"Processing"},{value:"Completed",label:"Completed"},{value:"Failed",label:"Failed"}]} />
            </div>
          </div>
        </div>

        {query.isPending ? <div className="space-y-3 p-4"><Skeleton className="h-20"/><Skeleton className="h-20"/><Skeleton className="h-20"/></div> : query.isError ? <div className="p-8 text-center text-sm text-rose-600">{query.error?.message || "Unable to load deposit history."}<button onClick={refresh} className="ml-2 font-semibold underline">Retry</button></div> : !items.length ? <div className="p-10 text-center text-sm text-slate-400">No deposit records found.</div> : <div className="divide-y divide-slate-100 dark:divide-[#223250]">{items.map(item => <DepositRow key={item.id || item._id} item={item} onView={() => setSelected(item)} />)}</div>}

        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 dark:border-[#223250] sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] text-slate-400">{query.isFetching ? "Updating deposits..." : `${total} deposit record${total === 1 ? "" : "s"}`}</span>
          <div className="flex items-center justify-end gap-2"><span className="text-[10px] text-slate-400">Rows</span><Dropdown value={limit} onChange={v => {setLimit(Number(v));setPage(1)}} icon={null} className="!h-8 !rounded-lg !px-2.5 !text-[11px]" options={[{value:10,label:"10"},{value:20,label:"20"},{value:50,label:"50"}]}/></div>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage}/>
      </section>

      {tracking && <TrackDepositModal onClose={() => setTracking(false)} onSubmit={() => {setTracking(false);refresh()}} />}
      {selected && <DepositDetails item={selected} onClose={() => setSelected(null)} />}
    </UserLayout>
  );
}

function InfoCard({icon: Icon,title,value}) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-[#263752] dark:bg-[#0d1a2e]"><div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400"><Icon size={13}/>{title}</div><p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">{value}</p></div>; }
function Step({number,title,text}) { return <div className="flex gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{number}</div><div><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{text}</p></div></div>; }
function statusClass(status="") { const s=status.toLowerCase(); if(s==="completed") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"; if(s==="failed") return "bg-rose-50 text-rose-600 dark:bg-rose-500/10"; if(s==="processing") return "bg-blue-50 text-blue-600 dark:bg-blue-500/10"; return "bg-amber-50 text-amber-600 dark:bg-amber-500/10"; }
function DepositRow({item,onView}) { return <article className="p-4 sm:px-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold text-slate-800 dark:text-white">{item.id || "Deposit"}</p><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(item.status)}`}>{item.status}</span></div><p className="mt-1 break-all text-[11px] text-slate-500 dark:text-slate-400">{item.txHash && item.txHash !== "-" ? item.txHash : "Transaction hash pending"}</p><p className="mt-1 text-[10px] text-slate-400">{item.network || "BEP-20"} · {item.date || item.createdAt || "-"}</p></div><div className="flex items-center justify-between gap-4 lg:justify-end"><div className="text-left lg:text-right"><p className="text-sm font-bold text-[#112e52] dark:text-white">{item.amount || "0 USDT"}</p><p className="text-[10px] text-slate-400">{item.confirmations ?? 0} confirmations</p></div><button onClick={onView} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2b3c58] dark:text-slate-300 dark:hover:bg-white/5">View</button></div></div></article>; }
function Modal({title,children,onClose}) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#2b3c58] dark:bg-[#101f38] sm:p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58] dark:text-slate-300"><X size={17}/></button></div>{children}</div></div>; }
function TrackDepositModal({onClose,onSubmit}) { const [hash,setHash]=useState(""); const [busy,setBusy]=useState(false); const submit=async e=>{e.preventDefault();if(!hash.trim())return;setBusy(true);try{await createDepositApi({txHash:hash.trim(),network:"BEP-20",status:"Processing"});onSubmit()}catch(err){window.alert(err?.message||"Unable to track this transaction.")}finally{setBusy(false)}}; return <Modal title="Track a USDT deposit" onClose={onClose}><form onSubmit={submit} className="mt-5"><label className="text-xs font-bold text-slate-700 dark:text-slate-200">Transaction hash</label><input autoFocus value={hash} onChange={e=>setHash(e.target.value)} placeholder="Paste the blockchain transaction hash" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 dark:border-[#2b3c58] dark:bg-[#12223b] dark:text-white"/><p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">This does not manually credit your balance. The backend should verify the transaction on-chain before crediting USDT.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300">Cancel</button><button disabled={busy || !hash.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50">{busy&&<Loader2 size={14} className="animate-spin"/>}Track Deposit</button></div></form></Modal>; }
function DepositDetails({item,onClose}) { return <Modal title="Deposit details" onClose={onClose}><div className="mt-5 space-y-3">{[["Deposit ID",item.id],["Amount",item.amount || "-"],["Network",item.network || "BEP-20"],["Status",item.status || "-"],["Confirmations",item.confirmations ?? 0],["Transaction hash",item.txHash || "-"],["Date",item.date || item.createdAt || "-"]].map(([label,value])=><div key={label} className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-[#263752] dark:bg-[#0d1a2e]"><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span><span className="break-all text-xs font-semibold text-slate-700 dark:text-slate-200">{value}</span></div>)}{item.txHash && item.txHash !== "-" && <a href={`https://bscscan.com/tx/${item.txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">View on BscScan <ExternalLink size={13}/></a>}</div></Modal>; }
