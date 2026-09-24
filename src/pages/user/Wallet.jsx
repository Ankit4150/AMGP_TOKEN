import React, { useMemo, useState } from "react";
import { Copy, Edit3, Eye, MoreHorizontal, Plus, RefreshCw, Search, ShieldCheck, Trash2, WalletCards, X } from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import { getUserWalletApi, getUserWalletByIdApi, createUserWalletApi, updateUserWalletApi, deleteUserWalletApi } from "../../services/user/walletApi";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { queryClient } from "../../lib/queryClient";

const shorten = (value="") => value.length > 26 ? `${value.slice(0, 12)}...${value.slice(-10)}` : value;
const labelize = (key) => key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

function Skeleton({ className="" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 dark:bg-[#16283f] ${className}`} />;
}

export default function Wallet() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editor, setEditor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const query = usePaginatedQuery({
    queryKey: ["user-wallet"],
    api: getUserWalletApi,
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payload = query.data?.data ?? query.data ?? {};
  const items = payload.items ?? [];
  const summary = payload.summary ?? {};
  const total = Number(payload.total ?? items.length);
  const totalPages = Math.max(1, Number(payload.totalPages ?? Math.ceil(total / limit)));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
    query.refetch();
  };

  const saveWallet = async (form) => {
    setBusy(true);
    try {
      if (editor?.id || editor?._id) await updateUserWalletApi(editor.id || editor._id, form);
      else await createUserWalletApi(form);
      setEditor(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to save wallet.");
    } finally { setBusy(false); }
  };

  const removeWallet = async (item) => {
    if (!window.confirm(`Remove ${item.label || "this wallet"}?`)) return;
    setBusy(true);
    try {
      await deleteUserWalletApi(item.id || item._id);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to remove wallet.");
    } finally { setBusy(false); }
  };

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      window.alert("Wallet address copied.");
    } catch { window.alert("Unable to copy address."); }
  };

  return (
    <UserLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">Wallet</h1>
        <p className="mt-1 text-sm text-[#3e5d83] dark:text-slate-400">
          Manage your wallet address, supported network and crypto balances.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceCard icon={WalletCards} label="USDT Balance" value={summary.usdtBalance || "0.00"} suffix="USDT" />
        <BalanceCard icon={ShieldCheck} label="Native Token Balance" value={summary.tokenBalance || "0"} suffix="TOKEN" />
        <BalanceCard icon={WalletCards} label="Token Price" value={summary.tokenPrice || "0.00"} suffix="USDT" />
        <BalanceCard icon={WalletCards} label="Estimated Token Value" value={summary.estimatedTokenValue || "0.00"} suffix="USDT" />
      </section>

      <section className="mt-4 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#112f55] dark:text-white">Wallet Address</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Network: {summary.network || "BNB Smart Chain / BEP-20"}</p>
          </div>
          <button onClick={() => setEditor({})} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
            <Plus size={15} /> Add Wallet
          </button>
        </div>

        {query.isPending ? (
          <div className="mt-4 grid gap-3"><Skeleton className="h-24"/><Skeleton className="h-24"/></div>
        ) : query.isError ? (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-5 text-center text-sm text-rose-600">
            {query.error?.message || "Unable to load wallet data."}
            <button onClick={refresh} className="ml-3 font-semibold underline">Retry</button>
          </div>
        ) : !items.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 dark:border-[#2b3c58]">
            No wallet records found.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {items.map(item => (
              <WalletRow key={item.id || item._id} item={item} onView={() => setSelected(item)} onEdit={() => setEditor({...item})} onDelete={() => removeWallet(item)} onCopy={() => copyAddress(item.address)} />
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-[#223250] sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] text-slate-400">{query.isFetching ? "Updating wallet data..." : `${total} wallet record${total === 1 ? "" : "s"}`}</span>
          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] text-slate-400">Rows</span>
            <Dropdown value={limit} onChange={v => { setLimit(Number(v)); setPage(1); }} icon={null} className="!h-8 !rounded-lg !px-2.5 !text-[11px]" options={[{value:10,label:"10"},{value:20,label:"20"},{value:50,label:"50"}]} />
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
      </section>

      {selected && <WalletDetails item={selected} onClose={() => setSelected(null)} onCopy={() => copyAddress(selected.address)} />}
      {editor && <WalletModal initial={editor} busy={busy} onClose={() => setEditor(null)} onSave={saveWallet} />}
    </UserLayout>
  );
}

function BalanceCard({ icon: Icon, label, value, suffix }) {
  return (
    <article className="rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Icon size={19}/></div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <strong className="text-xl font-bold text-[#112e52] dark:text-white">{value}</strong>
        <span className="text-[10px] font-semibold text-slate-400">{suffix}</span>
      </div>
    </article>
  );
}

function WalletRow({ item, onView, onEdit, onDelete, onCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-xl border border-slate-200 p-3 dark:border-[#263752] sm:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><WalletCards size={19}/></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-slate-800 dark:text-white">{item.label || "Wallet"}</h3>
              {item.isPrimary && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/10">PRIMARY</span>}
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-600 dark:bg-blue-500/10">{item.status}</span>
            </div>
            <p className="mt-1 break-all text-[11px] text-slate-500 dark:text-slate-400">{shorten(item.address)}</p>
            <p className="mt-1 text-[10px] text-slate-400">{item.network}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:justify-end">
          <button onClick={onCopy} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2b3c58] dark:text-slate-300 dark:hover:bg-white/5"><Copy size={13}/> Copy</button>
          <button onClick={onView} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#2b3c58] dark:text-slate-300 dark:hover:bg-white/5"><Eye size={13}/> View</button>
          <div className="relative">
            <button onClick={() => setOpen(v => !v)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><MoreHorizontal size={16}/></button>
            {open && <div className="absolute right-0 top-10 z-30 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-[#2b3c58] dark:bg-[#12223b]">
              <button onClick={() => {setOpen(false);onEdit();}} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"><Edit3 size={13}/> Edit</button>
              <button onClick={() => {setOpen(false);onDelete();}} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"><Trash2 size={13}/> Delete</button>
            </div>}
          </div>
        </div>
      </div>
    </article>
  );
}

function WalletDetails({ item, onClose, onCopy }) {
  return <ModalShell title="Wallet Details" onClose={onClose}>
    <div className="grid gap-3 sm:grid-cols-2">
      {["label","asset","network","status","createdAt","lastActivity"].map(key => (
        <div key={key} className="rounded-lg bg-slate-50 p-3 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">{labelize(key)}</span><strong className="mt-1 block text-xs text-slate-700 dark:text-slate-200">{item[key] || "-"}</strong></div>
      ))}
      <div className="sm:col-span-2 rounded-lg bg-slate-50 p-3 dark:bg-[#0d1a2e]"><span className="block text-[9px] uppercase text-slate-400">Wallet Address</span><div className="mt-1 flex items-start gap-2"><strong className="break-all text-xs font-medium text-slate-700 dark:text-slate-200">{item.address}</strong><button onClick={onCopy} className="shrink-0 text-blue-600"><Copy size={15}/></button></div></div>
    </div>
  </ModalShell>;
}

function WalletModal({ initial, busy, onClose, onSave }) {
  const [form, setForm] = useState({
    label: initial.label || "Primary Wallet",
    asset: initial.asset || "USDT + AMGP",
    network: initial.network || "BNB Smart Chain / BEP-20",
    address: initial.address || "",
    isPrimary: Boolean(initial.isPrimary),
  });
  const submit = e => { e.preventDefault(); if (!form.address.trim()) return window.alert("Wallet address is required."); onSave(form); };
  return <ModalShell title={initial.id ? "Edit Wallet" : "Add Wallet"} onClose={onClose}>
    <form onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Wallet Label"><input value={form.label} onChange={e=>setForm({...form,label:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 dark:border-[#2b3c58] dark:bg-[#0d1a2e] dark:text-white"/></Field>
        <Field label="Asset"><input value={form.asset} onChange={e=>setForm({...form,asset:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 dark:border-[#2b3c58] dark:bg-[#0d1a2e] dark:text-white"/></Field>
        <Field label="Network"><Dropdown value={form.network} onChange={value=>setForm({...form,network:value})} fullWidth icon={null} options={[{value:"BNB Smart Chain / BEP-20",label:"BNB Smart Chain / BEP-20"},{value:"BNB Smart Chain / BEP-20 (USDT)",label:"BNB Smart Chain / BEP-20 (USDT)"}]} placeholder="Select network" /></Field>
        <Field label="Primary Wallet"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs dark:border-[#2b3c58] dark:text-slate-200"><input type="checkbox" checked={form.isPrimary} onChange={e=>setForm({...form,isPrimary:e.target.checked})}/> Set as primary</label></Field>
        <Field label="Wallet Address" className="sm:col-span-2"><textarea required rows={3} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-[#2b3c58] dark:bg-[#0d1a2e] dark:text-white" placeholder="0x..." /></Field>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold dark:border-[#2b3c58] dark:text-slate-300">Cancel</button><button disabled={busy} className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Saving..." : "Save Wallet"}</button></div>
    </form>
  </ModalShell>;
}

function Field({label,children,className=""}) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>{children}</label>;
}
function ModalShell({title,onClose,children}) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-4">
    <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-[#101f38] sm:max-w-2xl sm:rounded-2xl">
      <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#112e52] dark:text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">Wallet information and network configuration.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={18}/></button></div>
      {children}
    </div>
  </div>;
}
