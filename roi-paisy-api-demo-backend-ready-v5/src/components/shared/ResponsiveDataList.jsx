import React, { useEffect, useMemo, useState } from "react";
import { Edit3, MoreHorizontal, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import Pagination from "../ui/Pagination";
import Dropdown from "../ui/Dropdown";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { queryClient } from "../../lib/queryClient";

function getPayload(response) { return response?.data ?? response ?? {}; }
function getItems(payload) { return payload?.items ?? payload?.users ?? payload?.transactions ?? []; }
function getTotal(payload, items) { return Number(payload?.total ?? payload?.totalCount ?? payload?.totalUsers ?? payload?.pagination?.total ?? items.length); }
function getTotalPages(payload, total, limit) { return Math.max(1, Number(payload?.totalPages ?? payload?.pagination?.totalPages ?? Math.ceil(total / limit))); }

function formatLabel(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
function editableKeys(item) {
  return Object.keys(item || {}).filter((key) => !["id","_id","password","__v","createdAt","updatedAt","txHash"].includes(key)).slice(0, 12);
}

export default function ResponsiveDataList({ title, description, api, createApi, updateApi, deleteApi, endpoint, filters = [], initialLimit = 10, enableCrud = true }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [actionOpen, setActionOpen] = useState(null);
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data: response, isPending, isFetching, isError, error, refetch } = usePaginatedQuery({
    queryKey: ["responsive-data-list", endpoint || title], api, page, limit, search: debouncedSearch, status,
  });
  const payload = useMemo(() => getPayload(response), [response]);
  const items = useMemo(() => getItems(payload), [payload]);
  const total = useMemo(() => getTotal(payload, items), [payload, items]);
  const totalPages = useMemo(() => getTotalPages(payload, total, limit), [payload, total, limit]);
  const columns = useMemo(() => editableKeys(items[0]).slice(0, 7), [items]);

  useEffect(() => setPage(1), [debouncedSearch, status, limit]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => {
    const close = () => setActionOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["responsive-data-list", endpoint || title] });
    refetch();
  };

  const save = async (form) => {
    setBusy(true);
    try {
      if (editor?.id || editor?._id) {
        if (typeof updateApi !== "function") throw new Error("Update API is not configured.");
        await updateApi(editor.id || editor._id, form);
      } else {
        if (typeof createApi !== "function") throw new Error("Create API is not configured.");
        await createApi(form);
      }
      setEditor(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to save record.");
    } finally { setBusy(false); }
  };

  const remove = async (item) => {
    const id = item.id || item._id;
    if (!id || !window.confirm(`Delete ${id}?`)) return;
    setBusy(true);
    try {
      if (typeof deleteApi !== "function") throw new Error("Delete API is not configured.");
      await deleteApi(id);
      setActionOpen(null);
      refresh();
    }
    catch (e) { window.alert(e?.message || "Unable to delete record."); }
    finally { setBusy(false); }
  };

  return <>
    <section className="min-w-0 overflow-visible rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
      <div className="border-b border-slate-100 p-3 dark:border-[#223250] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0"><h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">{title}</h2><p className="mt-1 text-xs text-[#68809d] dark:text-slate-400">{description}</p></div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-[#2b3c58] sm:w-[260px]"><Search size={16} className="shrink-0 text-slate-400" /><input value={search} onChange={(e)=>setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none dark:text-slate-200" placeholder="Search..." /></div>
            {filters.map((filter) => <Dropdown key={filter.key} value={filter.key === "status" ? status : "all"} onChange={(val)=>filter.key === "status" && setStatus(val)} placeholder={filter.label} options={[{value:"all",label:filter.label},...(filter.options||[])]} />)}
            <button type="button" onClick={refresh} disabled={isFetching || busy} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38]"><RefreshCw size={15} className={isFetching ? "animate-spin" : ""}/></button>
            {enableCrud && <button type="button" onClick={()=>setEditor({})} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={15}/> Add</button>}
          </div>
        </div>
      </div>

      {isError && !response ? <div className="p-10 text-center"><p className="text-sm text-rose-500">{error?.message || "Unable to load data."}</p><button onClick={refresh} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Try again</button></div>
      : isPending ? <div className="space-y-2 p-3 sm:p-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-[#16283f]"/>)}</div>
      : !items.length ? <div className="p-10 text-center text-sm text-slate-400">No records found.</div>
      : <>
        <div className="hidden overflow-visible lg:block">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 dark:bg-[#0d1a2e]">{columns.map(c=><th key={c} className="max-w-[180px] px-3 py-3">{formatLabel(c).toUpperCase()}</th>)}<th className="w-20 px-3 py-3">ACTION</th></tr></thead>
            <tbody>{items.map((item,index)=><tr key={item.id||item._id||index} className="border-b border-slate-100 last:border-0 dark:border-[#223250]">
              {columns.map(c=><td key={c} className="max-w-[180px] truncate px-3 py-3 text-slate-600 dark:text-slate-300">{typeof item[c]==="object"?JSON.stringify(item[c]):String(item[c]??"-")}</td>)}
              <td className="relative px-3 py-3"><ActionMenu open={actionOpen===index} onToggle={(e)=>{e.stopPropagation();setActionOpen(actionOpen===index?null:index)}} onEdit={()=>{setEditor({...item});setActionOpen(null)}} onDelete={()=>remove(item)} disabled={busy} /></td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="grid gap-2 p-3 lg:hidden">{items.map((item,index)=><article key={item.id||item._id||index} className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-[#263752]">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="m-0 truncate text-xs font-semibold text-slate-800 dark:text-white">{String(item.name||item.title||item.id||item._id||`Record ${index+1}`)}</p><p className="m-0 mt-1 truncate text-[10px] text-slate-500">{String(item.email||item.status||"")}</p></div><ActionMenu open={actionOpen===`m-${index}`} onToggle={(e)=>{e.stopPropagation();setActionOpen(actionOpen===`m-${index}`?null:`m-${index}`)}} onEdit={()=>{setEditor({...item});setActionOpen(null)}} onDelete={()=>remove(item)} disabled={busy}/></div>
          <div className="mt-3 grid grid-cols-2 gap-2">{columns.slice(0,6).map(c=><div key={c} className="min-w-0 rounded-lg bg-slate-50 p-2 dark:bg-[#0d1a2e]"><span className="block truncate text-[9px] uppercase text-slate-400">{formatLabel(c)}</span><strong className="mt-1 block truncate text-[10px] font-medium text-slate-700 dark:text-slate-200">{typeof item[c]==="object"?JSON.stringify(item[c]):String(item[c]??"-")}</strong></div>)}</div>
        </article>)}</div>
        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage}/>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400 dark:border-[#223250]"><span>Rows</span><Dropdown value={limit} onChange={(v)=>setLimit(Number(v))} icon={null} className="!h-8 !rounded-lg !px-2.5 !text-[11px]" options={[{value:10,label:"10"},{value:20,label:"20"},{value:50,label:"50"}]}/></div>
      </>}
    </section>
    {editor && <CrudModal initial={editor} columns={editableKeys(editor)} busy={busy} onClose={()=>setEditor(null)} onSave={save}/>}
  </>;
}

function ActionMenu({open,onToggle,onEdit,onDelete,disabled}) {
  return <div className="relative flex justify-end"><button type="button" onClick={onToggle} disabled={disabled} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38]"><MoreHorizontal size={17}/></button>{open&&<div onClick={(e)=>e.stopPropagation()} className="absolute right-0 top-10 z-50 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-[#2b3c58] dark:bg-[#12223b]"><button type="button" onClick={onEdit} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"><Edit3 size={14}/> Edit</button><button type="button" onClick={onDelete} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"><Trash2 size={14}/> Delete</button></div>}</div>;
}

function CrudModal({initial,columns,busy,onClose,onSave}) {
  const [form,setForm]=useState(()=>columns.reduce((acc,key)=>({...acc,[key]:initial?.[key] ?? ""}),{}));
  const submit=(e)=>{e.preventDefault();onSave(form)};
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-4" onMouseDown={onClose}>
    <form onSubmit={submit} onMouseDown={(e)=>e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-[#101f38] sm:max-w-2xl sm:rounded-2xl">
      <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#112e52] dark:text-white">{initial?.id||initial?._id ? "Edit Record" : "Add Record"}</h2><p className="mt-1 text-xs text-slate-500">Update the fields below and save the record.</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={18}/></button></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{columns.map((key)=>{const value=form[key];const multiline=String(value||"").length>80;return <label key={key} className={multiline?"sm:col-span-2":""}><span className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">{formatLabel(key)}</span>{multiline?<textarea value={value} onChange={(e)=>setForm({...form,[key]:e.target.value})} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-[#2b3c58] dark:bg-[#0d1a2e] dark:text-white"/>:<input value={value} onChange={(e)=>setForm({...form,[key]:e.target.value})} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 dark:border-[#2b3c58] dark:bg-[#0d1a2e] dark:text-white"/>}</label>})}</div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300">Cancel</button><button disabled={busy} className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-50">{busy?"Saving...":"Save Record"}</button></div>
    </form>
  </div>;
}
