import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollText, Search, RefreshCw, CalendarDays, Download, Eye, X, Copy,
  CheckCircle2, XCircle, AlertTriangle, Clock3, Globe, Monitor,
  ArrowRight, ShieldCheck, Fingerprint,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/ui/StatCard";
import Dropdown from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getAuditLogApi, getAuditLogByIdApi, createAuditLogApi, updateAuditLogApi, deleteAuditLogApi } from "../../services/admin/auditLogApi";
import { AUDIT_MODULES, AUDIT_ROLES } from "../../mock/data/auditLogs";

/* ---------------------------------------------------------------------- */
/* Static config — mirrors Phase 23 (Audit Log) of the Final Development  */
/* Plan: every critical admin/financial action must be traceable — who    */
/* did it, what module it touched, what changed, and when.                */
/* ---------------------------------------------------------------------- */

const moduleMeta = (key) => AUDIT_MODULES.find((m) => m.key === key) || { label: key, tone: "bg-slate-100 text-slate-600" };
const roleMeta = (key) => AUDIT_ROLES.find((r) => r.key === key) || { label: key, tone: "bg-slate-100 text-slate-600" };

const moduleOptions = [{ value: "all", label: "All Modules" }, ...AUDIT_MODULES.map((m) => ({ value: m.key, label: m.label }))];
const roleOptions = [{ value: "all", label: "All Roles" }, ...AUDIT_ROLES.map((r) => ({ value: r.key, label: r.label }))];
const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "Success", label: "Success" },
  { value: "Failed", label: "Failed" },
  { value: "Flagged", label: "Flagged" },
];
const dateOptions = [
  { value: "all", label: "All Dates" },
  { value: "Today", label: "Today" },
  { value: "Last 7 Days", label: "Last 7 Days" },
  { value: "Last 30 Days", label: "Last 30 Days" },
];

const defaultStats = [
  { label: "Total Actions Logged", value: "0", change: "—", tone: "blue", icon: "withdrawal" },
  { label: "Financial / Critical", value: "0", change: "—", tone: "purple", icon: "token" },
  { label: "Failed Actions", value: "0", change: "—", tone: "red", icon: "failed" },
  { label: "Flagged for Review", value: "0", change: "—", tone: "yellow", icon: "pending" },
  { label: "Actions Today", value: "0", change: "—", tone: "green", icon: "verified" },
];

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data: response, isPending, isFetching, isError, error, refetch } = usePaginatedQuery({
    queryKey: ["admin-audit-logs"],
    api: getAuditLogApi,
    page,
    limit,
    search: debouncedSearch,
    status,
    extraParams: { module, role, date },
  });

  const payload = useMemo(() => response?.data ?? response ?? {}, [response]);
  const items = payload?.items ?? [];
  const stats = payload?.stats?.length ? payload.stats : defaultStats;
  const total = Number(payload?.total ?? items.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / limit)));

  useEffect(() => setPage(1), [debouncedSearch, module, role, status, date, limit]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const resetFilters = () => {
    setSearch(""); setModule("all"); setRole("all"); setStatus("all"); setDate("all");
  };

  const exportCsv = () => {
    const headers = ["ID", "Date & Time", "Admin", "Role", "Action", "Module", "Target", "Before", "After", "Amount", "Status", "Severity", "IP Address", "Reference"];
    const rows = items.map((x) => [
      x.id, x.createdAt, x.admin, roleMeta(x.role).label, x.action, moduleMeta(x.module).label,
      x.target, x.before, x.after, x.amount, x.status, x.severity, x.ipAddress, x.reference,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <ScrollText size={21} />
        </span>
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] sm:text-[29px]">Audit Logs</h1>
          <p className="mt-1 text-sm text-[#3e5d83]">
            Every critical administrative and financial action — who did it, what changed, and when.
          </p>
        </div>
      </div>

      <section className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <section className="mb-3 rounded-xl border border-[#dce9f7] bg-white p-3 shadow-sm">
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_150px_160px_130px_140px_auto_auto]">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#d9e6f4] px-3 text-[#577699]">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admin, action, target, reference..."
              className="min-w-0 flex-1 bg-transparent text-xs text-[#24496f] outline-none placeholder:text-[#6681a2]"
            />
          </div>
          <Dropdown value={module} onChange={setModule} fullWidth options={moduleOptions} />
          <Dropdown value={role} onChange={setRole} fullWidth options={roleOptions} />
          <Dropdown value={status} onChange={setStatus} fullWidth options={statusOptions} />
          <Dropdown value={date} onChange={setDate} fullWidth options={dateOptions} icon={CalendarDays} />
          <button
            onClick={resetFilters}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-[10px] text-[#68809d] sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} of {total} logged actions</span>
          <button onClick={exportCsv} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm">
        {isPending ? (
          <Loading />
        ) : isError && !response ? (
          <ErrorState error={error} retry={refetch} />
        ) : (
          <>
            {isFetching && !isPending && (
              <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500">
                <RefreshCw size={12} className="animate-spin" /> Updating...
              </div>
            )}

            {/* Desktop table */}
            <div className="hidden overflow-hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="bg-[#f2f7fc] text-[10px] font-semibold text-[#426287]">
                    <th className="w-[12%] px-2 py-3">DATE &amp; TIME</th>
                    <th className="w-[15%] px-2 py-3">ADMIN</th>
                    <th className="w-[18%] px-2 py-3">ACTION</th>
                    <th className="w-[17%] px-2 py-3">TARGET</th>
                    <th className="w-[18%] px-2 py-3">BEFORE → AFTER</th>
                    <th className="w-[10%] px-2 py-3">STATUS</th>
                    <th className="w-[10%] px-2 py-3">VIEW</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 text-[11px] text-[#274c76] last:border-0">
                      <td className="truncate px-2 py-3">{item.createdAt}</td>
                      <td className="truncate px-2 py-3">
                        <strong className="block truncate text-[#173a65]">{item.admin}</strong>
                        <RoleBadge role={item.role} />
                      </td>
                      <td className="truncate px-2 py-3">
                        <strong className="block truncate">{item.action}</strong>
                        <ModuleBadge module={item.module} />
                      </td>
                      <td className="truncate px-2 py-3 text-[#3e5d83]" title={item.target}>{item.target}</td>
                      <td className="truncate px-2 py-3 text-[#3e5d83]" title={`${item.before} → ${item.after}`}>
                        <span className="truncate">{item.before}</span>
                        <ArrowRight size={11} className="mx-1 inline shrink-0 text-slate-400" />
                        <span className="truncate font-semibold text-[#173a65]">{item.after}</span>
                      </td>
                      <td className="px-2 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-2 py-3">
                        <ActionButton label="View details" onClick={() => setSelected(item)}>
                          <Eye size={15} />
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className="grid gap-2 p-3 lg:hidden">
              {items.map((item) => (
                <MobileLog key={item.id} item={item} onView={setSelected} />
              ))}
            </div>

            {!items.length && <div className="p-10 text-center text-sm text-slate-400">No audit log entries found.</div>}

            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
            <div className="border-t border-slate-100 px-3 py-2 text-right text-[10px] text-slate-400">
              <label className="inline-flex items-center gap-2">
                Rows
                <Dropdown
                  value={limit}
                  onChange={(v) => setLimit(Number(v))}
                  icon={null}
                  className="!h-8 !rounded-lg !px-2.5 !text-[11px]"
                  options={[{ value: 10, label: "10" }, { value: 20, label: "20" }, { value: 50, label: "50" }]}
                />
              </label>
            </div>
          </>
        )}
      </section>

      {selected && <DetailsDrawer item={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}

/* ------------------------------- badges -------------------------------- */

function ModuleBadge({ module }) {
  const meta = moduleMeta(module);
  return (
    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

function RoleBadge({ role }) {
  const meta = roleMeta(role);
  return (
    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "Success");
  const good = s === "Success";
  const bad = s === "Failed";
  const flagged = s === "Flagged";
  const Icon = good ? CheckCircle2 : bad ? XCircle : flagged ? AlertTriangle : Clock3;
  const tone = good
    ? "bg-emerald-50 text-emerald-600"
    : bad
    ? "bg-rose-50 text-rose-500"
    : flagged
    ? "bg-amber-50 text-amber-600"
    : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${tone}`}>
      <Icon size={11} /> {s}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const tone =
    severity === "Critical" ? "bg-rose-50 text-rose-600"
    : severity === "Financial" ? "bg-amber-50 text-amber-700"
    : severity === "Security" ? "bg-indigo-50 text-indigo-600"
    : "bg-slate-100 text-slate-500";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${tone}`}>{severity}</span>;
}

/* ------------------------------- states -------------------------------- */

function Loading() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
function ErrorState({ error, retry }) {
  return (
    <div className="p-10 text-center">
      <p className="text-sm text-rose-500">{error?.message || "Unable to load audit logs."}</p>
      <button onClick={retry} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Try again</button>
    </div>
  );
}

function ActionButton({ children, onClick, label }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-[#24486f] hover:bg-slate-50">
      {children}
    </button>
  );
}

/* ------------------------------- mobile card ---------------------------- */

function MobileLog({ item, onView }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Fingerprint size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-xs text-slate-800">{item.action}</strong>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 truncate text-[10px] text-slate-500">{item.admin} · {item.createdAt}</p>
        </div>
        <button onClick={() => onView(item)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white">
          <Eye size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg bg-slate-50 p-2">
          <span className="block truncate text-[9px] uppercase text-slate-400">Module</span>
          <div className="mt-1"><ModuleBadge module={item.module} /></div>
        </div>
        <div className="min-w-0 rounded-lg bg-slate-50 p-2">
          <span className="block truncate text-[9px] uppercase text-slate-400">Role</span>
          <div className="mt-1"><RoleBadge role={item.role} /></div>
        </div>
        <div className="col-span-2 min-w-0 rounded-lg bg-slate-50 p-2">
          <span className="block truncate text-[9px] uppercase text-slate-400">Target</span>
          <strong className="mt-1 block truncate text-[10px] font-medium text-slate-700">{item.target}</strong>
        </div>
        <div className="col-span-2 min-w-0 rounded-lg bg-slate-50 p-2">
          <span className="block truncate text-[9px] uppercase text-slate-400">Before → After</span>
          <strong className="mt-1 block truncate text-[10px] font-medium text-slate-700">{item.before} → {item.after}</strong>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------ details drawer --------------------------- */

function DetailRow({ label, value, copy }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 text-xs last:border-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-right font-medium text-[#24486f]">
        <span className="truncate">{value || "—"}</span>
        {copy && value && (
          <button onClick={() => copy(value)} className="shrink-0 text-slate-300 hover:text-blue-500">
            <Copy size={12} />
          </button>
        )}
      </span>
    </div>
  );
}

function DetailsDrawer({ item, onClose }) {
  const copy = (value) => {
    navigator.clipboard?.writeText(String(value)).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/35" onMouseDown={onClose}>
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-white shadow-2xl sm:max-w-[460px]"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <ScrollText size={17} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-[#112e52]">{item.action}</h2>
                <span className="text-[10px] text-slate-400">{item.id}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <ModuleBadge module={item.module} />
              <SeverityBadge severity={item.severity} />
              <StatusBadge status={item.status} />
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <p className="rounded-lg bg-[#f8faff] p-3 text-xs leading-relaxed text-[#3e5d83]">{item.description}</p>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#173a65]">
              <ShieldCheck size={14} /> Actor
            </h3>
            <DetailRow label="Admin" value={item.admin} />
            <DetailRow label="Admin ID" value={item.adminId} copy={copy} />
            <DetailRow label="Role" value={roleMeta(item.role).label} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 text-xs font-bold text-[#173a65]">What Changed</h3>
            <DetailRow label="Target" value={item.target} />
            <DetailRow label="Before" value={item.before} />
            <DetailRow label="After" value={item.after} />
            <DetailRow label="Amount" value={item.amount} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#173a65]">
              <Globe size={14} /> Session
            </h3>
            <DetailRow label="Date & Time" value={item.createdAt} />
            <DetailRow label="IP Address" value={item.ipAddress} copy={copy} />
            <DetailRow label="Device" value={item.device} />
            <DetailRow label="Reference" value={item.reference} copy={copy} />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500">
            <Monitor size={14} className="mt-0.5 shrink-0" />
            Audit log entries are immutable and cannot be edited or deleted, ensuring every administrative and financial
            action stays fully traceable for compliance and reconciliation review.
          </div>
        </div>
      </aside>
    </div>
  );
}
