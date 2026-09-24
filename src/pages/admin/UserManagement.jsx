import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, RefreshCw, Plus, Eye, Pencil, Trash2, X, Copy,
  Download, CheckCircle2, Ban, ShieldOff, ShieldCheck, Wallet, Coins, ExternalLink,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/ui/StatCard";
import Dropdown from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getAdminUserApi, getAdminUserByIdApi, createAdminUserApi, updateAdminUserApi, deleteAdminUserApi } from "../../services/admin/userManagementApi";
import { queryClient } from "../../lib/queryClient";
import {
  PLAN_OPTIONS, KYC_OPTIONS, ACCOUNT_OPTIONS, COUNTRY_OPTIONS,
} from "../../mock/data/userDirectory";

const emptyForm = {
  name: "", email: "", phone: "", country: "United States",
  kyc: "Not Submitted", account: "Active", plan: "Starter Plan",
  walletAddress: "", network: "BEP-20",
  usdtBalance: "0.00", tokenBalance: "0", totalInvested: "0.00",
  totalRoiPaid: "0.00", totalWithdrawn: "0.00", totalBuybacks: "0.00",
  twoFA: "Disabled", notes: "",
};

const statusFilterOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "blocked", label: "Blocked" },
];
const kycFilterOptions = [
  { value: "all", label: "All KYC Status" },
  ...KYC_OPTIONS.map((k) => ({ value: k.toLowerCase(), label: k })),
];
const planFilterOptions = [
  { value: "all", label: "All Plans" },
  ...PLAN_OPTIONS.map((p) => ({ value: p, label: p })),
];
const accountOptions = ACCOUNT_OPTIONS.map((a) => ({ value: a, label: a }));
const kycOptions = KYC_OPTIONS.map((k) => ({ value: k, label: k }));
const planOptions = PLAN_OPTIONS.map((p) => ({ value: p, label: p }));
const countryOptions = COUNTRY_OPTIONS.map((c) => ({ value: c, label: c }));
const networkOptions = [
  { value: "BEP-20", label: "BEP-20" },
  { value: "TRC-20", label: "TRC-20" },
];
const twoFAOptions = [
  { value: "Enabled", label: "Enabled" },
  { value: "Disabled", label: "Disabled" },
];

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kyc, setKyc] = useState("all");
  const [plan, setPlan] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const {
    data: response,
    isPending,
    isFetching,
    error,
    refetch,
  } = usePaginatedQuery({
    queryKey: ["admin-user-management"],
    api: getAdminUserApi,
    page,
    limit,
    search: debouncedSearch,
    status,
    extraParams: { kyc, plan },
  });

  const payload = useMemo(() => response?.data ?? response ?? {}, [response]);
  const users = payload?.users ?? [];
  const stats = payload?.stats ?? [];
  const total = Number(payload?.total ?? users.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / limit)));

  useEffect(() => setPage(1), [debouncedSearch, status, kyc, plan, limit]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => setSelectedIds([]), [page, debouncedSearch, status, kyc, plan]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-user-management"] });
    refetch();
  };

  const resetFilters = () => {
    setSearch(""); setStatus("all"); setKyc("all"); setPlan("all");
  };

  const saveUser = async (form) => {
    setBusy(true);
    try {
      if (editor?.id) await updateAdminUserApi(editor.id, form);
      else await createAdminUserApi(form);
      setEditor(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to save user.");
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user ${user.name} (${user.id})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteAdminUserApi(user.id);
      if (selected?.id === user.id) setSelected(null);
      setSelectedIds((ids) => ids.filter((id) => id !== user.id));
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to delete user.");
    } finally {
      setBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected user(s)? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteAdminUserApi(id)));
      setSelectedIds([]);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to delete selected users.");
    } finally {
      setBusy(false);
    }
  };

  const setAccountStatus = async (user, nextStatus) => {
    if (!window.confirm(`${nextStatus} account for ${user.name}?`)) return;
    setBusy(true);
    try {
      await updateAdminUserApi(user.id, { account: nextStatus });
      setSelected((current) => (current?.id === user.id ? { ...current, account: nextStatus } : current));
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to update account status.");
    } finally {
      setBusy(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectedIds((ids) => (ids.length === users.length ? [] : users.map((u) => u.id)));
  };
  const toggleSelect = (id) => {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const exportCsv = () => {
    const headers = ["User ID", "Name", "Email", "Phone", "Country", "KYC", "Account", "Plan", "USDT Balance", "Token Balance", "Join Date"];
    const rows = users.map((u) => [u.id, u.name, u.email, u.phone, u.country, u.kyc, u.account, u.plan, u.usdtBalance, u.tokenBalance, u.date]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "users.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
            <Users size={21} />
          </span>
          <div>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] sm:text-[29px]">
              User Management
            </h1>
            <p className="mt-1 text-sm text-[#3e5d83]">
              Manage, verify and monitor all platform users.
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditor({ ...emptyForm })}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={17} /> Add User
        </button>
      </div>

      <section className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {(stats.length ? stats : [
          { label: "Total Users", value: "0", change: "—", tone: "blue", icon: "users" },
          { label: "Active Users", value: "0", change: "—", tone: "green", icon: "activeUsers" },
          { label: "Verified KYC", value: "0", change: "—", tone: "cyan", icon: "verified" },
          { label: "Pending KYC", value: "0", change: "—", tone: "purple", icon: "pending" },
          { label: "Suspended / Blocked", value: "0", change: "—", tone: "red", icon: "failed" },
        ]).map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <section className="mb-3 rounded-xl border border-[#dce9f7] bg-white p-3 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_170px_150px_auto_auto]">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#d9e6f4] px-3 text-[#577699] dark:border-[#223250]">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, user ID or wallet address..."
              className="min-w-0 flex-1 bg-transparent text-xs text-[#24496f] outline-none placeholder:text-[#6681a2] dark:text-[#dbe7f7]"
            />
          </div>
          <Dropdown value={status} onChange={setStatus} fullWidth options={statusFilterOptions} />
          <Dropdown value={kyc} onChange={setKyc} fullWidth options={kycFilterOptions} />
          <Dropdown value={plan} onChange={setPlan} fullWidth options={planFilterOptions} />
          <button
            onClick={resetFilters}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-[#223250] dark:bg-transparent dark:text-[#c7d5ea]"
          >
            Reset
          </button>
          <button
            onClick={refresh}
            disabled={isFetching || busy}
            title="Refresh"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 dark:border-[#223250] dark:bg-transparent"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2 text-[10px] text-[#68809d] sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} of {total} users</span>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={bulkDelete}
                disabled={busy}
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete {selectedIds.length} selected
              </button>
            )}
            <button
              onClick={exportCsv}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              <Download size={15} /> Export
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        {isPending ? (
          <Loading />
        ) : error && !response ? (
          <ErrorState error={error} retry={refresh} />
        ) : (
          <>
            {isFetching && (
              <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500 dark:border-[#223250]">
                <RefreshCw size={12} className="animate-spin" /> Updating...
              </div>
            )}

            <div className="hidden overflow-hidden lg:block">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-[#f2f7fc] text-left text-[10px] font-semibold text-[#426287] dark:bg-[#0d1c33] dark:text-[#8fa3c2]">
                    <th className="w-8 px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(users.length) && selectedIds.length === users.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-[9%] px-2 py-3">USER ID</th>
                    <th className="w-[16%] px-2 py-3">NAME</th>
                    <th className="w-[17%] px-2 py-3">EMAIL</th>
                    <th className="w-[10%] px-2 py-3">PHONE</th>
                    <th className="w-[10%] px-2 py-3">KYC STATUS</th>
                    <th className="w-[10%] px-2 py-3">ACCOUNT</th>
                    <th className="w-[10%] px-2 py-3">PLAN</th>
                    <th className="w-[8%] px-2 py-3">JOIN DATE</th>
                    <th className="w-[10%] px-2 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 text-[11px] text-[#274c76] last:border-0 dark:border-[#1a2c47] dark:text-[#c7d5ea]">
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="truncate px-2 py-3">{user.id}</td>
                      <td className="px-2 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar user={user} />
                          <span className="truncate">{user.name}</span>
                        </div>
                      </td>
                      <td className="truncate px-2 py-3">{user.email}</td>
                      <td className="truncate px-2 py-3">{user.phone}</td>
                      <td className="px-2 py-3"><Status status={user.kyc} /></td>
                      <td className="px-2 py-3"><Status status={user.account} /></td>
                      <td className="truncate px-2 py-3">{user.plan}</td>
                      <td className="truncate px-2 py-3">{user.date}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <ActionButton label="View" onClick={() => setSelected(user)}><Eye size={15} /></ActionButton>
                          <ActionButton label="Edit" onClick={() => setEditor({ ...emptyForm, ...user })}><Pencil size={15} /></ActionButton>
                          <ActionButton label="Delete" danger onClick={() => deleteUser(user)}><Trash2 size={15} /></ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 p-3 lg:hidden">
              {users.map((user) => (
                <MobileUser
                  key={user.id}
                  user={user}
                  selected={selectedIds.includes(user.id)}
                  onToggleSelect={() => toggleSelect(user.id)}
                  onView={setSelected}
                  onEdit={(u) => setEditor({ ...emptyForm, ...u })}
                  onDelete={deleteUser}
                />
              ))}
            </div>

            {!users.length && (
              <div className="p-10 text-center text-sm text-slate-400">No users found.</div>
            )}

            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />

            <div className="border-t border-slate-100 px-3 py-2 text-right text-[10px] text-slate-400 dark:border-[#1a2c47]">
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

      {selected && (
        <DetailsDrawer
          user={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onEdit={(u) => { setSelected(null); setEditor({ ...emptyForm, ...u }); }}
          onStatus={setAccountStatus}
        />
      )}
      {editor && (
        <UserForm
          initial={editor}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={saveUser}
        />
      )}
    </AdminLayout>
  );
}

function Loading() {
  return (
    <div className="space-y-2 p-3 sm:p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-[#16273f]" />
      ))}
    </div>
  );
}
function ErrorState({ error, retry }) {
  return (
    <div className="p-10 text-center">
      <p className="text-sm text-rose-500">{error?.message || "Unable to load users."}</p>
      <button onClick={retry} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
        Try again
      </button>
    </div>
  );
}

const AVATAR_TONE = {
  blue: "bg-blue-500", purple: "bg-violet-600", orange: "bg-orange-500",
  teal: "bg-teal-500", pink: "bg-pink-500", violet: "bg-violet-500",
};
function Avatar({ user, size = "h-8 w-8" }) {
  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ${AVATAR_TONE[user.avatar] || "bg-violet-500"}`}>
      {user.initials}
    </span>
  );
}

function Status({ status }) {
  const value = String(status || "");
  const normalized = value.toLowerCase();
  const good = ["verified", "active", "completed"].includes(normalized);
  const bad = ["rejected", "blocked", "suspended"].includes(normalized);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${
      good ? "bg-emerald-50 text-emerald-600" : bad ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-600"
    }`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

function ActionButton({ children, onClick, label, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg border bg-white dark:bg-transparent ${
        danger ? "border-rose-100 text-rose-500 hover:bg-rose-50" : "border-slate-200 text-[#24486f] hover:bg-slate-50 dark:border-[#223250] dark:text-[#c7d5ea]"
      }`}
    >
      {children}
    </button>
  );
}

function MobileUser({ user, selected, onToggleSelect, onView, onEdit, onDelete }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm dark:border-[#223250]">
      <div className="flex min-w-0 items-start gap-3">
        <input type="checkbox" className="mt-2 shrink-0" checked={selected} onChange={onToggleSelect} />
        <Avatar user={user} size="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-xs font-semibold text-slate-800 dark:text-white">{user.name}</p>
          <p className="m-0 truncate text-[10px] text-slate-500 dark:text-[#8fa3c2]">{user.email}</p>
          <p className="m-0 text-[9px] text-slate-400">{user.id}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#0d1c33]">
          <span className="block text-slate-400">KYC</span>
          <Status status={user.kyc} />
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#0d1c33]">
          <span className="block text-slate-400">Account</span>
          <Status status={user.account} />
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#0d1c33]">
          <span className="block text-slate-400">Plan</span>
          <strong className="mt-1 block truncate text-slate-700 dark:text-[#dbe7f7]">{user.plan}</strong>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#0d1c33]">
          <span className="block text-slate-400">Joined</span>
          <strong className="mt-1 block truncate text-slate-700 dark:text-[#dbe7f7]">{user.date}</strong>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onView(user)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 dark:border-[#223250] dark:text-[#c7d5ea]">
          <Eye size={14} /> View
        </button>
        <button onClick={() => onEdit(user)} aria-label="Edit" className="grid h-9 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 dark:border-[#223250] dark:text-[#c7d5ea]">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(user)} aria-label="Delete" className="grid h-9 w-10 place-items-center rounded-lg border border-rose-100 text-rose-500">
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}

function DetailRow({ label, value, copy }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0 dark:border-[#1a2c47]">
      <span className="shrink-0 text-[10px] text-slate-500 dark:text-[#8fa3c2]">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-right text-[11px] font-semibold text-[#173a65] dark:text-[#dbe7f7]">
        <span className="max-w-[230px] break-words">{value || "-"}</span>
        {copy && (
          <button onClick={() => copy(value)} className="shrink-0 text-slate-400 hover:text-blue-600">
            <Copy size={13} />
          </button>
        )}
      </span>
    </div>
  );
}

function DetailsDrawer({ user, onClose, onEdit, onStatus, busy }) {
  const navigate = useNavigate();
  const copy = (v) => navigator.clipboard?.writeText(String(v || ""));
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/30" onMouseDown={onClose}>
      <aside onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-[440px] overflow-y-auto bg-white shadow-2xl dark:bg-[#0d1c33]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5 dark:border-[#1a2c47] dark:bg-[#0d1c33]">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="h-11 w-11" />
            <div>
              <h2 className="text-base font-bold text-[#112e52] dark:text-white">{user.name}</h2>
              <p className="text-[11px] text-slate-500 dark:text-[#8fa3c2]">{user.id}</p>
              <div className="mt-1.5 flex gap-1.5">
                <Status status={user.kyc} />
                <Status status={user.account} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 dark:border-[#223250]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-[#1a2c47]">
            <h3 className="mb-3 text-xs font-bold text-[#173a65] dark:text-[#dbe7f7]">Contact Information</h3>
            <DetailRow label="Email" value={user.email} copy={copy} />
            <DetailRow label="Phone" value={user.phone} />
            <DetailRow label="Country" value={user.country} />
            <DetailRow label="Joined" value={user.date} />
            <DetailRow label="Last Login" value={user.lastLogin} />
            <DetailRow label="2FA" value={user.twoFA} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-[#1a2c47]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#173a65] dark:text-[#dbe7f7]">
              <ShieldCheck size={14} /> KYC & Plan
            </h3>
            <DetailRow label="KYC Status" value={user.kyc} />
            <DetailRow label="Verification ID" value={user.kycVerificationId} />
            <DetailRow label="Plan" value={user.plan} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-[#1a2c47]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#173a65] dark:text-[#dbe7f7]">
              <Wallet size={14} /> Wallet
            </h3>
            <DetailRow label="Wallet Address" value={user.walletAddress} copy={copy} />
            <DetailRow label="Network" value={user.network} />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-[#1a2c47]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#173a65] dark:text-[#dbe7f7]">
              <Coins size={14} /> Balances & Activity
            </h3>
            <DetailRow label="USDT Balance" value={`${user.usdtBalance} USDT`} />
            <DetailRow label="Token Balance" value={`${user.tokenBalance} AMGP`} />
            <DetailRow label="Total Invested" value={`${user.totalInvested} USDT`} />
            <DetailRow label="Total ROI Paid" value={`${user.totalRoiPaid} USDT`} />
            <DetailRow label="Total Withdrawn" value={`${user.totalWithdrawn} USDT`} />
            <DetailRow label="Total Buybacks" value={`${user.totalBuybacks} USDT`} />
          </div>

          {user.notes && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-[#1a2c47]">
              <h3 className="mb-2 text-xs font-bold text-[#173a65] dark:text-[#dbe7f7]">Notes</h3>
              <p className="text-[11px] text-slate-600 dark:text-[#c7d5ea]">{user.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
            <button
              disabled={busy || user.account === "Active"}
              onClick={() => onStatus(user, "Active")}
              className="flex h-10 items-center justify-center gap-1 rounded-lg bg-emerald-500 text-xs font-semibold text-white disabled:opacity-40"
            >
              <CheckCircle2 size={15} /> Activate
            </button>
            <button
              disabled={busy || user.account === "Suspended"}
              onClick={() => onStatus(user, "Suspended")}
              className="flex h-10 items-center justify-center gap-1 rounded-lg border border-amber-300 text-xs font-semibold text-amber-600 disabled:opacity-40"
            >
              <ShieldOff size={15} /> Suspend
            </button>
            <button
              disabled={busy || user.account === "Blocked"}
              onClick={() => onStatus(user, "Blocked")}
              className="flex h-10 items-center justify-center gap-1 rounded-lg border border-rose-300 text-xs font-semibold text-rose-600 disabled:opacity-40"
            >
              <Ban size={15} /> Block
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-[#1a2c47]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-[#173a65] dark:text-[#dbe7f7]">Related User Records</h3>
              <span className="text-[9px] text-slate-400">Admin shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["KYC", "/admin/kyc-verification", ShieldCheck],
                ["Investments", "/admin/investments", Wallet],
                ["ROI", "/admin/roi", Coins],
                ["Buybacks", "/admin/buyback", Coins],
                ["Withdrawals", "/admin/withdrawals", ExternalLink],
              ].map(([label, path, Icon]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className="flex h-9 items-center justify-between rounded-lg border border-slate-200 px-3 text-[10px] font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-[#223250] dark:text-[#c7d5ea] dark:hover:bg-blue-500/10"
                >
                  <span>{label}</span><Icon size={13} />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onEdit(user)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 dark:border-[#223250] dark:text-[#c7d5ea]"
          >
            <Pencil size={15} /> Edit User
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`${full ? "sm:col-span-2" : ""} min-w-0`}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase text-[#426287] dark:text-[#8fa3c2]">{label}</span>
      {children}
    </label>
  );
}

function UserForm({ initial, busy, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyForm, ...initial });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      window.alert("Name and Email are required.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 p-3 sm:p-5" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0d1c33]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1a2c47]">
          <div>
            <h2 className="text-lg font-bold text-[#112e52] dark:text-white">{initial.id ? "Edit User" : "Add User"}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8fa3c2]">
              {initial.id ? `Editing ${initial.id}` : "Create a new platform user."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 dark:border-[#223250]">
            <X size={19} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          <Field label="Full Name"><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Smith" className="input" /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@example.com" className="input" /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 234 567 8901" className="input" /></Field>
          <Field label="Country"><Dropdown value={form.country} onChange={(v) => set("country", v)} fullWidth icon={null} options={countryOptions} /></Field>

          <Field label="KYC Status"><Dropdown value={form.kyc} onChange={(v) => set("kyc", v)} fullWidth icon={null} options={kycOptions} /></Field>
          <Field label="Account Status"><Dropdown value={form.account} onChange={(v) => set("account", v)} fullWidth icon={null} options={accountOptions} /></Field>
          <Field label="Plan"><Dropdown value={form.plan} onChange={(v) => set("plan", v)} fullWidth icon={null} options={planOptions} /></Field>
          <Field label="2FA"><Dropdown value={form.twoFA} onChange={(v) => set("twoFA", v)} fullWidth icon={null} options={twoFAOptions} /></Field>

          <Field label="Wallet Address"><input value={form.walletAddress} onChange={(e) => set("walletAddress", e.target.value)} placeholder="0x..." className="input" /></Field>
          <Field label="Network"><Dropdown value={form.network} onChange={(v) => set("network", v)} fullWidth icon={null} options={networkOptions} /></Field>

          <Field label="USDT Balance"><input value={form.usdtBalance} onChange={(e) => set("usdtBalance", e.target.value)} placeholder="0.00" className="input" /></Field>
          <Field label="Token Balance (AMGP)"><input value={form.tokenBalance} onChange={(e) => set("tokenBalance", e.target.value)} placeholder="0" className="input" /></Field>
          <Field label="Total Invested (USDT)"><input value={form.totalInvested} onChange={(e) => set("totalInvested", e.target.value)} placeholder="0.00" className="input" /></Field>
          <Field label="Total ROI Paid (USDT)"><input value={form.totalRoiPaid} onChange={(e) => set("totalRoiPaid", e.target.value)} placeholder="0.00" className="input" /></Field>
          <Field label="Total Withdrawn (USDT)"><input value={form.totalWithdrawn} onChange={(e) => set("totalWithdrawn", e.target.value)} placeholder="0.00" className="input" /></Field>
          <Field label="Total Buybacks (USDT)"><input value={form.totalBuybacks} onChange={(e) => set("totalBuybacks", e.target.value)} placeholder="0.00" className="input" /></Field>

          <Field label="Notes" full>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal admin notes..." className="input min-h-24 resize-none" />
          </Field>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white p-4 dark:border-[#1a2c47] dark:bg-[#0d1c33]">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 dark:border-[#223250] dark:text-[#c7d5ea]">
            Cancel
          </button>
          <button disabled={busy} type="submit" className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-50">
            {busy ? "Saving..." : initial.id ? "Save Changes" : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
