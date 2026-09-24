import React, { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Crown,
  Eye,
  Gem,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/ui/StatCard";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getInvestmentApi, getInvestmentByIdApi, createInvestmentApi, updateInvestmentApi, deleteInvestmentApi } from "../../services/admin/investmentManagementApi";
import {
  investmentPackageStats as fallbackStats,
  investmentPackages as fallbackPackages,
} from "../../mock/data/investmentPackages";

const ICONS = {
  diamond: { Icon: Gem, className: "bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400" },
  layers: { Icon: Layers, className: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  crown: { Icon: Crown, className: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  star: { Icon: Star, className: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" },
  trophy: { Icon: Trophy, className: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
};

const ICON_ORDER = ["diamond", "layers", "crown", "star", "trophy"];

const EMPTY_FORM = {
  id: null,
  name: "",
  subtitle: "",
  description: "",
  min: "",
  max: "",
  duration: "",
  dailyRoi: "",
  startDate: "",
  endDate: "",
  status: "Active",
  icon: "diamond",
  payoutFrequency: "Daily",
  compounding: "Simple",
  earlyWithdrawalPenalty: "",
  referralBonus: "",
};

function currency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `$${number.toLocaleString("en-US")}`;
}

function totalRoiOf(pkg) {
  const duration = Number(pkg.duration) || 0;
  const dailyRoi = Number(pkg.dailyRoi) || 0;
  return (duration * dailyRoi).toFixed(2);
}

function StatusBadge({ status }) {
  const isActive = String(status || "").toLowerCase() === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function PackageIcon({ icon, size = "h-10 w-10" }) {
  const meta = ICONS[icon] || ICONS.diamond;
  const { Icon, className } = meta;
  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-full ${className}`}>
      <Icon size={18} />
    </span>
  );
}

function PackageModal({ mode, initial, onClose, onSave }) {
  const [tab, setTab] = useState("details");
  const [form, setForm] = useState(EMPTY_FORM);
  const readOnly = mode === "view";

  useEffect(() => {
    setTab("details");
    setForm(
      initial
        ? {
            id: initial.id,
            name: initial.name || "",
            subtitle: initial.subtitle || "",
            description: initial.description || "",
            min: initial.min ?? "",
            max: initial.max ?? "",
            duration: initial.duration ?? "",
            dailyRoi: initial.dailyRoi ?? "",
            startDate: initial.startDate || "",
            endDate: initial.endDate || "",
            status: initial.status || "Active",
            icon: initial.icon || "diamond",
            payoutFrequency: initial.payoutFrequency || "Daily",
            compounding: initial.compounding || "Simple",
            earlyWithdrawalPenalty: initial.earlyWithdrawalPenalty ?? "",
            referralBonus: initial.referralBonus ?? "",
          }
        : EMPTY_FORM
    );
  }, [initial]);

  const totalRoi = (Number(form.duration) || 0) * (Number(form.dailyRoi) || 0);
  const canSave = form.name.trim() && Number(form.min) > 0 && Number(form.max) >= Number(form.min) && Number(form.duration) > 0 && Number(form.dailyRoi) >= 0 && form.startDate && form.endDate && form.endDate >= form.startDate;

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...form,
      min: Number(form.min),
      max: Number(form.max),
      duration: Number(form.duration),
      dailyRoi: Number(form.dailyRoi),
      earlyWithdrawalPenalty: Number(form.earlyWithdrawalPenalty) || 0,
      referralBonus: Number(form.referralBonus) || 0,
      totalRoi: totalRoi.toFixed(2),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-[1px] sm:items-stretch sm:justify-end">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-[#0d1a2e] sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-[#223250]">
          <h2 className="m-0 text-lg font-bold text-[#112e52] dark:text-white">
            {mode === "view" ? "Package Details" : mode === "edit" ? "Edit Investment Package" : "Add / Edit Investment Package"}
          </h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-100 p-2 dark:border-[#223250]">
          {[
            ["details", "Package Details"],
            ["roi", "ROI Settings"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                tab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:text-[#90a5c4] dark:hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "details" ? (
            <div className="space-y-4">
              <Field label="Package Name" required>
                <input
                  disabled={readOnly}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="e.g. Silver Plan"
                  className="input"
                />
              </Field>

              <Field label="Subtitle">
                <input
                  disabled={readOnly}
                  value={form.subtitle}
                  onChange={update("subtitle")}
                  placeholder="e.g. Most Popular"
                  className="input"
                />
              </Field>

              <Field label="Description">
                <textarea
                  disabled={readOnly}
                  value={form.description}
                  onChange={update("description")}
                  placeholder="Enter package description..."
                  rows={3}
                  className="input resize-none"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Min Investment (USDT)" required>
                  <input
                    disabled={readOnly}
                    type="number"
                    value={form.min}
                    onChange={update("min")}
                    placeholder="e.g. 100"
                    className="input"
                  />
                </Field>
                <Field label="Max Investment (USDT)" required>
                  <input
                    disabled={readOnly}
                    type="number"
                    value={form.max}
                    onChange={update("max")}
                    placeholder="e.g. 10000"
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date" required>
                  <input
                    disabled={readOnly}
                    type="date"
                    value={form.startDate}
                    onChange={update("startDate")}
                    className="input"
                  />
                </Field>
                <Field label="End Date" required>
                  <input
                    disabled={readOnly}
                    type="date"
                    value={form.endDate}
                    onChange={update("endDate")}
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (Days)" required>
                  <input
                    disabled={readOnly}
                    type="number"
                    value={form.duration}
                    onChange={update("duration")}
                    placeholder="e.g. 30"
                    className="input"
                  />
                </Field>
                <Field label="Daily ROI (%)" required>
                  <input
                    disabled={readOnly}
                    type="number"
                    step="0.01"
                    value={form.dailyRoi}
                    onChange={update("dailyRoi")}
                    placeholder="e.g. 0.30"
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Status">
                <Dropdown
                  disabled={readOnly}
                  value={form.status}
                  onChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
                  icon={null}
                  fullWidth
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </Field>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[#254a77] dark:text-[#90a5c4]">Package Icon</span>
                <div className="flex flex-wrap gap-2">
                  {ICON_ORDER.map((key) => {
                    const meta = ICONS[key];
                    const Icon = meta.Icon;
                    const selected = form.icon === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        disabled={readOnly}
                        onClick={() => setForm((prev) => ({ ...prev, icon: key }))}
                        className={`grid h-12 w-12 place-items-center rounded-xl border-2 transition ${
                          selected
                            ? "border-blue-500 " + meta.className
                            : "border-transparent bg-slate-50 text-slate-400 dark:bg-white/5"
                        }`}
                        aria-label={key}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#dce9f7] bg-[#f7faff] p-4 dark:border-[#223250] dark:bg-[#0d1a2e]">
                <span className="block text-xs font-medium text-[#254a77] dark:text-[#90a5c4]">
                  Total ROI (auto-calculated)
                </span>
                <strong className="mt-1 block text-2xl font-bold text-[#102e54] dark:text-white">
                  {totalRoi.toFixed(2)}%
                </strong>
                <span className="text-[11px] text-[#68809d]">Duration × Daily ROI</span>
              </div>

              <Field label="Payout Frequency">
                <Dropdown
                  disabled={readOnly}
                  value={form.payoutFrequency}
                  onChange={(val) => setForm((prev) => ({ ...prev, payoutFrequency: val }))}
                  icon={null}
                  fullWidth
                  options={[
                    { value: "Daily", label: "Daily" },
                    { value: "Weekly", label: "Weekly" },
                    { value: "Monthly", label: "Monthly" },
                  ]}
                />
              </Field>

              <Field label="Return Type">
                <div className="flex gap-2">
                  {["Simple", "Compound"].map((option) => (
                    <button
                      type="button"
                      key={option}
                      disabled={readOnly}
                      onClick={() => setForm((prev) => ({ ...prev, compounding: option }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        form.compounding === option
                          ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10"
                          : "border-slate-200 text-slate-500 dark:border-[#223250] dark:text-[#90a5c4]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Early Withdrawal Penalty (%)">
                  <input
                    disabled={readOnly}
                    type="number"
                    value={form.earlyWithdrawalPenalty}
                    onChange={update("earlyWithdrawalPenalty")}
                    placeholder="e.g. 10"
                    className="input"
                  />
                </Field>
                <Field label="Referral Bonus (%)">
                  <input
                    disabled={readOnly}
                    type="number"
                    value={form.referralBonus}
                    onChange={update("referralBonus")}
                    placeholder="e.g. 2"
                    className="input"
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 p-4 dark:border-[#223250]">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#223250] dark:text-[#90a5c4] dark:hover:bg-white/5"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="h-11 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Package
            </button>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 42px;
          border-radius: 0.5rem;
          border: 1px solid #d9e6f4;
          background: #fff;
          padding: 0 0.75rem;
          font-size: 12.5px;
          color: #24496f;
          outline: none;
        }
        .input:disabled { opacity: 0.7; cursor: not-allowed; }
        textarea.input { height: auto; padding: 0.6rem 0.75rem; }
        .dark .input { background: #101f38; border-color: #223250; color: #dce9f7; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#254a77] dark:text-[#90a5c4]">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function InvestmentManagement() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit' | 'view', pkg }
  const [editedMap, setEditedMap] = useState({});
  const [addedPackages, setAddedPackages] = useState([]);
  const [deletedIds, setDeletedIds] = useState(() => new Set());

  const debouncedSearch = useDebounce(search, 400);

  const {
    data: response,
    isPending,
    isFetching,
    error,
    refetch,
  } = usePaginatedQuery({
    queryKey: ["admin-investment-management"],
    api: getInvestmentApi,
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payload = useMemo(() => response?.data ?? response ?? {}, [response]);
  const fetchedPackages = payload?.items ?? fallbackPackages;

  const packages = useMemo(() => {
    const base = fetchedPackages
      .filter((pkg) => !deletedIds.has(pkg.id))
      .map((pkg) => (editedMap[pkg.id] ? { ...pkg, ...editedMap[pkg.id] } : pkg));
    const extra = addedPackages.filter((pkg) => !deletedIds.has(pkg.id));
    return [...base, ...extra];
  }, [fetchedPackages, editedMap, addedPackages, deletedIds]);

  const stats = useMemo(() => {
    const source = payload?.stats ?? fallbackStats;
    return source.map((item) => {
      if (item.icon === "packages") return { ...item, value: String(packages.length) };
      if (item.icon === "activeUsers") {
        return { ...item, value: String(packages.filter((pkg) => pkg.status === "Active").length) };
      }
      return item;
    });
  }, [payload, packages]);

  const total = Number(payload?.total ?? packages.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / limit)));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, limit]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  const handleSave = async (form) => {
    if (form.id) {
      setEditedMap((prev) => ({ ...prev, [form.id]: form }));
      try {
        await updateInvestmentApi(form.id, form);
      } catch (_) {
        // demo backend: local state already reflects the change
      }
    } else {
      const created = { ...form, id: `PKG-${Date.now()}` };
      setAddedPackages((prev) => [created, ...prev]);
      try {
        await createInvestmentApi(form);
      } catch (_) {
        // demo backend: local state already reflects the change
      }
    }
    setModal(null);
  };

  const handleDelete = async (pkg) => {
    setDeletedIds((prev) => new Set(prev).add(pkg.id));
    setMenuOpenId(null);
    try {
      await deleteInvestmentApi(pkg.id);
    } catch (_) {
      // demo backend: local state already reflects the change
    }
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Coins size={20} />
          </span>
          <div>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] dark:text-white sm:text-[29px]">
              Investment Packages
            </h1>
            <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">
              Create and manage investment plans with different ROI rates and durations.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModal({ mode: "add", pkg: null })}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
        >
          <Plus size={18} />
          Add New Package
        </button>
      </div>

      <section className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <section className="mb-3 grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-[#dce9f7] bg-white p-3 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_120px]">
        <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#d9e6f4] px-3 text-[#577699] dark:border-[#223250]">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search packages by name..."
            className="min-w-0 flex-1 bg-transparent text-xs text-[#24496f] outline-none placeholder:text-[#6681a2] dark:text-[#dce9f7]"
          />
        </div>

        <Dropdown
          value={status}
          onChange={setStatus}
          fullWidth
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />

        <button
          onClick={handleReset}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#d9e6f4] bg-white text-xs font-semibold text-[#2d5077] hover:bg-slate-50 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce9f7]"
        >
          <RefreshCw size={15} />
          Reset
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        {isPending && !packages.length ? (
          <div className="space-y-2 p-3 sm:p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-[#16283f]" />
            ))}
          </div>
        ) : error && !response && !packages.length ? (
          <div className="p-10 text-center">
            <p className="text-sm text-rose-500">{error.message || "Unable to load investment packages."}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-[#223250] dark:text-[#90a5c4]"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {isFetching && (
              <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500 dark:border-[#223250] dark:text-[#90a5c4]">
                <RefreshCw size={12} className="animate-spin" />
                Loading...
              </div>
            )}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="bg-[#f2f7fc] text-left text-[10px] font-semibold text-[#426287] dark:bg-[#0d1a2e] dark:text-[#90a5c4]">
                    <th className="w-10 px-3 py-3">#</th>
                    <th className="px-3 py-3">PACKAGE NAME</th>
                    <th className="px-3 py-3">MIN - MAX INVESTMENT</th>
                    <th className="px-3 py-3">DURATION</th>
                    <th className="px-3 py-3">START - END</th>
                    <th className="px-3 py-3">DAILY ROI</th>
                    <th className="px-3 py-3">TOTAL ROI</th>
                    <th className="px-3 py-3">STATUS</th>
                    <th className="w-28 px-3 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, index) => (
                    <tr
                      key={pkg.id}
                      className="border-b border-slate-100 text-[12px] text-[#274c76] last:border-0 dark:border-[#1b2c46] dark:text-[#dce9f7]"
                    >
                      <td className="px-3 py-3">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <PackageIcon icon={pkg.icon} />
                          <div className="min-w-0">
                            <p className="m-0 truncate font-semibold">{pkg.name}</p>
                            <p className="m-0 truncate text-[10px] text-[#7189a8]">{pkg.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {currency(pkg.min)} - {currency(pkg.max)}
                      </td>
                      <td className="px-3 py-3">{pkg.duration} Days</td>
                      <td className="px-3 py-3 text-[11px]">{pkg.startDate || "-"} → {pkg.endDate || "-"}</td>
                      <td className="px-3 py-3">{Number(pkg.dailyRoi).toFixed(2)}%</td>
                      <td className="px-3 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {totalRoiOf(pkg)}%
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={pkg.status} />
                      </td>
                      <td className="relative px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setModal({ mode: "edit", pkg })}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-[#24486f] hover:bg-slate-50 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce9f7]"
                            aria-label={`Edit ${pkg.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setModal({ mode: "view", pkg })}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-[#24486f] hover:bg-slate-50 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce9f7]"
                            aria-label={`View ${pkg.name}`}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === pkg.id ? null : pkg.id)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-[#24486f] hover:bg-slate-50 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce9f7]"
                            aria-label={`More actions for ${pkg.name}`}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        {menuOpenId === pkg.id && (
                          <div className="absolute right-3 top-12 z-10 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-[#223250] dark:bg-[#101f38]">
                            <button
                              onClick={() => handleDelete(pkg)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            >
                              <Trash2 size={13} />
                              Delete Package
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 p-3 lg:hidden">
              {packages.map((pkg) => (
                <article
                  key={pkg.id}
                  className="min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm dark:border-[#223250]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <PackageIcon icon={pkg.icon} />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-semibold text-slate-800 dark:text-white">{pkg.name}</p>
                      <p className="m-0 truncate text-[11px] text-slate-500 dark:text-[#90a5c4]">{pkg.subtitle}</p>
                    </div>
                    <StatusBadge status={pkg.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">Min - Max</span>
                      <strong className="mt-1 block truncate text-slate-700 dark:text-[#dce9f7]">
                        {currency(pkg.min)} - {currency(pkg.max)}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">Duration</span>
                      <strong className="mt-1 block text-slate-700 dark:text-[#dce9f7]">{pkg.duration} Days</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">Start - End</span>
                      <strong className="mt-1 block truncate text-slate-700 dark:text-[#dce9f7]">{pkg.startDate || "-"} → {pkg.endDate || "-"}</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">Daily ROI</span>
                      <strong className="mt-1 block text-slate-700 dark:text-[#dce9f7]">
                        {Number(pkg.dailyRoi).toFixed(2)}%
                      </strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">Total ROI</span>
                      <strong className="mt-1 block text-emerald-600 dark:text-emerald-400">
                        {totalRoiOf(pkg)}%
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setModal({ mode: "edit", pkg })}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#24486f] dark:border-[#223250] dark:text-[#dce9f7]"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => setModal({ mode: "view", pkg })}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#24486f] dark:border-[#223250] dark:text-[#dce9f7]"
                    >
                      <Eye size={13} />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-rose-500 dark:border-[#223250]"
                      aria-label={`Delete ${pkg.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {!packages.length && (
              <div className="p-10 text-center text-sm text-slate-400">No packages found.</div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />

            <div className="border-t border-slate-100 px-3 py-2 text-right text-[10px] text-slate-400 dark:border-[#223250]">
              <label className="flex items-center gap-1.5">
                Rows
                <Dropdown
                  value={limit}
                  onChange={(val) => setLimit(Number(val))}
                  icon={null}
                  className="!h-8 !rounded-lg !px-2.5 !text-[11px]"
                  options={[
                    { value: 10, label: "10" },
                    { value: 20, label: "20" },
                    { value: 50, label: "50" },
                  ]}
                />
              </label>
            </div>
          </>
        )}
      </section>

      {modal && (
        <PackageModal
          mode={modal.mode}
          initial={modal.pkg}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
}
