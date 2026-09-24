import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getBuybackApi, getBuybackByIdApi, createBuybackApi, updateBuybackApi, deleteBuybackApi } from "../../services/admin/buybackManagementApi";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  Info,
  Pencil,
  RefreshCw,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  buybackPrice: "0.48 USDT",
  minimumSale: "100 TOKEN",
  maximumSale: "1,000 TOKEN",
  fee: "2%",
  effectiveTime: "08 Sep 2025, 10:00",
  status: "Active",
};

const DEFAULT_SUMMARY = {
  buybackPrice: "0.48 USDT",
  totalVolume: "80,000 TOKEN",
  totalValue: "38,400 USDT",
};

function getPayload(response) {
  return response?.data ?? response ?? {};
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    approved: "bg-blue-50 text-blue-700 border-blue-100",
    processing: "bg-indigo-50 text-indigo-700 border-indigo-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    failed: "bg-rose-50 text-rose-700 border-rose-100",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const classes = map[normalized] || "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "-"}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <div className="rounded-2xl border border-[#dce8f6] bg-white p-5 shadow-[0_8px_24px_rgba(33,86,138,0.04)]">
      <div className="flex items-start gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="m-0 text-xs font-medium text-[#6d82a0]">{label}</p>
          <p className="m-0 mt-1 text-[22px] font-bold tracking-tight text-[#163763]">{value}</p>
          <p className="m-0 mt-1 text-[11px] text-[#8194ad]">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17355b]/25 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#d9e6f4] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#edf2f7] px-5 py-4">
          <div>
            <p className="m-0 text-sm font-bold text-[#183a67]">Buyback Details</p>
            <p className="m-0 mt-1 text-[11px] text-[#8294ac]">{item.id || "Transaction"}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe8f4] text-[#6280a4] hover:bg-[#f7f9fd]">
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {[
            ["Date & Time", item.date],
            ["User", item.user],
            ["Wallet", item.wallet],
            ["Type", item.type],
            ["Token Amount", item.tokenAmount],
            ["USDT Value", item.usdtValue],
            ["Buyback Price", `${item.price} USDT`],
            ["Transaction Hash", item.txHash],
            ["Status", item.status],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e5edf6] bg-[#fbfcfe] p-3">
              <span className="block text-[10px] uppercase tracking-wide text-[#91a2b8]">{label}</span>
              <div className="mt-1 text-xs font-semibold text-[#284c76]">
                {label === "Status" ? <StatusBadge status={value} /> : String(value || "-")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditSettingsModal({ settings, onClose, onSave, saving }) {
  const [form, setForm] = useState(settings);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17355b]/25 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#d9e6f4] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#edf2f7] px-5 py-4">
          <div>
            <p className="m-0 text-sm font-bold text-[#183a67]">Edit Buyback Settings</p>
            <p className="m-0 mt-1 text-[11px] text-[#8294ac]">Update the commercial buyback configuration.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe8f4] text-[#6280a4]">
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {[
            ["buybackPrice", "Buyback Price"],
            ["minimumSale", "Minimum Sale"],
            ["maximumSale", "Maximum Sale"],
            ["fee", "Fee"],
            ["effectiveTime", "Effective Time"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#68809f]">{label}</span>
              <input
                value={form[key] || ""}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                className="h-10 w-full rounded-lg border border-[#dfe8f4] bg-white px-3 text-xs text-[#254a77] outline-none focus:border-[#6b7cff]"
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#68809f]">Status</span>
            <Dropdown
              value={form.status || "Active"}
              onChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
              icon={null}
              fullWidth
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </label>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#edf2f7] p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#dfe8f4] px-4 text-xs font-semibold text-[#5f7695]">Cancel</button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3478f6] px-4 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving && <RefreshCw size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuybackManagement() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const { data: response, isPending, isFetching, refetch } = usePaginatedQuery({
    queryKey: ["admin-buybacks"],
    api: getBuybackApi,
    page,
    limit: 5,
    search: debouncedSearch,
    status,
    extraParams: type !== "all" ? { type } : {},
  });

  const payload = useMemo(() => getPayload(response), [response]);
  const items = useMemo(() => payload?.items ?? [], [payload]);
  const total = Number(payload?.total ?? items.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / 5)));
  const summary = payload?.summary ?? DEFAULT_SUMMARY;
  const remoteSettings = payload?.settings ?? DEFAULT_SETTINGS;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, type]);

  useEffect(() => {
    if (payload?.settings) setSettings(payload.settings);
    else setSettings(remoteSettings);
  }, [payload, remoteSettings]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const saveSettings = async (nextSettings) => {
    setSavingSettings(true);
    try {
      await updateBuybackApi("settings", nextSettings);
      setSettings(nextSettings);
      setEditingSettings(false);
      await refetch();
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => window.history.back()} className="mt-1 grid h-9 w-9 place-items-center rounded-lg text-[#547399] hover:bg-white">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="m-0 text-2xl font-bold text-[#102f56] sm:text-[29px]">Buyback Management</h1>
              <p className="mt-1 text-sm text-[#5f7898]">Manage buyback settings, track buyback transactions and monitor token purchases.</p>
            </div>
          </div>
          <div className="rounded-lg border border-[#dfe8f4] bg-white px-3 py-2 text-xs text-[#55708f]">08 Sep 2025 · 14:32</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard icon={CircleDollarSign} label="Buyback Price" value={summary.buybackPrice} helper="Current buyback price per token" tone="bg-[#ecebff] text-[#5542e8]" />
          <StatCard icon={Wallet} label="Total Buyback Volume" value={summary.totalVolume} helper="Total tokens purchased for buyback" tone="bg-[#dcf8ea] text-[#10a56f]" />
          <StatCard icon={CircleDollarSign} label="Total Buyback Value" value={summary.totalValue} helper="Total USDT value settled" tone="bg-[#e8f0ff] text-[#2e67e8]" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
          <section className="rounded-2xl border border-[#dce8f6] bg-white p-5 shadow-[0_8px_24px_rgba(33,86,138,0.04)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf2f7] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef2ff] text-[#5a48e8]"><Wallet size={18} /></div>
                <div>
                  <h2 className="m-0 text-sm font-bold text-[#16375f]">Buyback Settings</h2>
                  <p className="m-0 mt-1 text-[11px] text-[#8395ad]">Commercial rules used for internal token buyback.</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditingSettings(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dce6f3] px-3 text-xs font-semibold text-[#4f6f95] hover:bg-[#f7f9fd]"><Pencil size={14} /> Edit Settings</button>
            </div>
            <div className="grid gap-3 pt-5 sm:grid-cols-2">
              {[
                ["Buyback Price", settings.buybackPrice],
                ["Fee", settings.fee],
                ["Minimum Sale", settings.minimumSale],
                ["Effective Time", settings.effectiveTime],
                ["Maximum Sale", settings.maximumSale],
                ["Status", settings.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#e6eef6] bg-[#fbfcfe] p-3">
                  <span className="block text-[10px] uppercase tracking-wide text-[#8da0b8]">{label}</span>
                  <div className="mt-1 text-xs font-semibold text-[#244970]">{label === "Status" ? <StatusBadge status={value} /> : value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#dce8f6] bg-white p-5 shadow-[0_8px_24px_rgba(33,86,138,0.04)]">
            <div className="rounded-xl bg-[#f1f5ff] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#5a48e8]"><Info size={17} /></div>
                <div>
                  <p className="m-0 text-sm font-bold text-[#23486f]">Buyback Overview</p>
                  <p className="m-0 mt-2 text-xs leading-5 text-[#5d7899]">The platform uses buyback rules to purchase Native Tokens and settle the user in USDT.</p>
                </div>
              </div>
            </div>
            <div className="pt-5">
              <p className="m-0 text-sm font-bold text-[#173a66]">Buyback Flow</p>
              <div className="mt-3 space-y-3">
                {[
                  ["1", "Check available funds"],
                  ["2", "Approve / process request"],
                  ["3", "Settle USDT to user balance"],
                  ["4", "Update token and transaction records"],
                ].map(([step, text]) => (
                  <div key={step} className="flex items-center gap-3 text-xs text-[#5d7593]">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#edf3ff] text-[#3568e8] font-bold">{step}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#dce8f6] bg-white shadow-[0_8px_24px_rgba(33,86,138,0.04)]">
          <div className="border-b border-[#edf2f7] p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff] text-[#2f68ea]"><Clock3 size={18} /></div>
                  <div>
                    <h2 className="m-0 text-sm font-bold text-[#173a66]">Buyback Transactions</h2>
                    <p className="m-0 mt-1 text-[11px] text-[#8294ac]">Review buyback requests, settlement values and transaction status.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 lg:flex-row">
                <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#dfe8f4] px-3 lg:w-[280px]">
                  <Search size={15} className="shrink-0 text-[#99aabd]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 text-xs text-[#294c74] outline-none placeholder:text-[#a3b0c0]" placeholder="Search by hash, token amount or wallet..." />
                </div>
                <Dropdown
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "processing", label: "Processing" },
                    { value: "completed", label: "Completed" },
                    { value: "failed", label: "Failed" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                />
                <Dropdown
                  value={type}
                  onChange={setType}
                  options={[
                    { value: "all", label: "All Types" },
                    { value: "Buyback", label: "Buyback" },
                  ]}
                />
                <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe8f4] bg-white px-3 text-xs font-semibold text-[#567394] disabled:opacity-50">
                  <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {isPending ? (
            <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : !items.length ? (
            <div className="p-12 text-center text-sm text-[#8ba0b8]">No buyback records found.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[1100px] w-full text-left text-[11px]">
                  <thead className="bg-[#f8faff] text-[9px] font-bold uppercase tracking-wide text-[#7f93ac]">
                    <tr>
                      {['Date & Time', 'Type', 'Token Amount', 'USDT Value', 'Price (USDT)', 'Tx Hash', 'Status', 'Action'].map((head) => <th key={head} className="whitespace-nowrap px-4 py-3">{head}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id || index} className="border-t border-[#edf2f7] text-[#3f5f82]">
                        <td className="whitespace-nowrap px-4 py-3">{item.date || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-[#31567f]">{item.type || 'Buyback'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.tokenAmount || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.usdtValue || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.price || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-600">{item.txHash || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button type="button" onClick={() => setSelectedItem(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce7f3] text-[#5b7798] hover:bg-[#f1f5ff] hover:text-[#315fe0]" title="View full details"><Eye size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {items.map((item, index) => (
                  <article key={item.id || index} className="rounded-xl border border-[#e2ebf5] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-xs font-bold text-[#26486f]">{item.user || item.id || 'Buyback'}</p>
                        <p className="m-0 mt-1 truncate text-[10px] text-[#899cb4]">{item.date || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <button type="button" onClick={() => setSelectedItem(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce7f3] text-[#5b7798]"><Eye size={15} /></button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ["Token Amount", item.tokenAmount],
                        ["USDT Value", item.usdtValue],
                        ["Price", item.price ? `${item.price} USDT` : '-'],
                        ["Tx Hash", item.txHash],
                      ].map(([label, value]) => <div key={label} className="rounded-lg bg-[#f8faff] p-2.5"><span className="block text-[9px] uppercase text-[#8ca0b7]">{label}</span><strong className="mt-1 block break-all text-[10px] font-semibold text-[#365a82]">{value || '-'}</strong></div>)}
                    </div>
                  </article>
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} total={total} limit={5} onPageChange={setPage} />
            </>
          )}
        </section>
      </div>

      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {editingSettings && <EditSettingsModal settings={settings} onClose={() => setEditingSettings(false)} onSave={saveSettings} saving={savingSettings} />}
    </AdminLayout>
  );
}
