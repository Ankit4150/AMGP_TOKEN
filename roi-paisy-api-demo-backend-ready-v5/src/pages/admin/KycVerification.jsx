import React, { useEffect, useMemo, useState } from "react";
import { useManualQuery } from "../../hooks/manualQuery";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Filter,
  IdCard,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getKycApi, getKycByIdApi, createKycApi, updateKycApi, deleteKycApi } from "../../services/admin/kycApi";

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Verified",
  verified: "Verified",
  completed: "Verified",
  rejected: "Rejected",
  failed: "Rejected",
  processing: "Pending",
};

const normalizeStatus = (value) =>
  STATUS_LABELS[String(value || "").toLowerCase()] || String(value || "Pending");

const statusKey = (value) => {
  const v = String(value || "").toLowerCase();
  if (v === "approved" || v === "verified" || v === "completed") return "verified";
  if (v === "rejected" || v === "failed") return "rejected";
  return "pending";
};

const getPayload = (response) => response?.data ?? response ?? {};
const getItems = (payload) => payload?.items ?? payload?.records ?? payload?.users ?? [];
const getTotal = (payload, items) =>
  Number(
    payload?.total ??
      payload?.totalCount ??
      payload?.pagination?.total ??
      items.length
  );

const getTotalPages = (payload, total, limit) =>
  Math.max(
    1,
    Number(
      payload?.totalPages ??
        payload?.pagination?.totalPages ??
        Math.ceil(total / limit)
    )
  );

const getId = (item) => item?.id ?? item?._id ?? item?.kycId ?? item?.verificationId;

const getName = (item) =>
  item?.name ||
  item?.fullName ||
  [item?.firstName, item?.lastName].filter(Boolean).join(" ") ||
  item?.username ||
  "Unknown User";

const getEmail = (item) => item?.email || item?.user?.email || "—";

const getVerificationId = (item) =>
  item?.verificationId || item?.verificationID || item?.kycNumber || item?.id || "—";

const getSubmittedAt = (item) =>
  item?.submittedAt || item?.submittedOn || item?.verificationDate || item?.date || item?.createdAt || "—";

function formatDate(value) {
  if (!value || value === "—") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name) {
  return String(name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }) {
  const key = statusKey(status);
  const styles = {
    verified: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    rejected: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${styles[key]}`}>
      {normalizeStatus(status)}
    </span>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
    yellow: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    red: "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400",
  };
  return (
    <div className="flex min-w-0 items-center rounded-xl border border-[#dce9f7] bg-white px-4 py-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="ml-3 min-w-0">
        <p className="m-0 text-[11px] font-medium text-[#68809d] dark:text-[#90a5c4]">{label}</p>
        <strong className="mt-1 block text-xl font-bold text-[#102e54] dark:text-white">{value}</strong>
      </div>
    </div>
  );
}

function DetailValue({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-[10px] font-medium text-[#68809d] dark:text-[#90a5c4]">{label}</p>
      <p className="m-0 mt-1 truncate text-xs font-semibold text-[#24486f] dark:text-slate-100">{value || "—"}</p>
    </div>
  );
}

function DocumentCard({ title, image, verified, onView }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-[#223250]">
      <p className="m-0 truncate text-[10px] font-bold text-[#23456e] dark:text-slate-200">{title}</p>
      <div className="mt-2 flex h-[78px] items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-[#0c1a2e]">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <IdCard size={30} className="text-slate-300 dark:text-slate-600" />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge status={verified ? "verified" : "pending"} />
      </div>
      <button
        type="button"
        onClick={onView}
        className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#cfe0f3] bg-white text-[10px] font-semibold text-[#24528a] hover:bg-slate-50 dark:border-[#2a4263] dark:bg-[#101f38] dark:text-blue-300"
      >
        <Eye size={13} /> View Document
      </button>
    </div>
  );
}

function DetailPanel({ item, isLoading, onClose, onAction, actionLoading }) {
  const payload = getPayload(item);
  const user = payload?.user || payload?.profile || payload;
  const docs = payload?.documents || payload?.kycDocuments || {};
  const currentStatus = statusKey(payload?.status || user?.kycStatus);

  const firstImage =
    docs?.governmentId?.url ||
    docs?.governmentId?.image ||
    docs?.id?.url ||
    docs?.idDocument ||
    payload?.governmentIdUrl ||
    payload?.idDocumentUrl;

  const selfieImage =
    docs?.selfie?.url ||
    docs?.selfie?.image ||
    docs?.selfieWithId ||
    payload?.selfieUrl;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[475px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-[#223250] dark:bg-[#101f38] sm:w-[475px]">
      <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-[#223250]">
        <div>
          <h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">KYC Details</h2>
          <p className="m-0 mt-1 text-[10px] text-[#68809d] dark:text-[#90a5c4]">Review submitted verification information</p>
        </div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 p-5">
          <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-slate-100 p-5 dark:border-[#223250]">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-500 dark:bg-blue-500/10 dark:text-blue-300">
                {initials(getName(user))}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="m-0 truncate text-base font-bold text-[#112f55] dark:text-white">{getName(user)}</h3>
                <p className="m-0 mt-1 truncate text-xs text-[#68809d] dark:text-[#90a5c4]">{getEmail(user)}</p>
              </div>
              <StatusBadge status={payload?.status || user?.kycStatus} />
            </div>
          </div>

          <div className="space-y-5 p-5">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="m-0 text-sm font-bold text-[#112f55] dark:text-white">User Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-slate-200 p-4 dark:border-[#223250]">
                <DetailValue label="Full Name" value={getName(user)} />
                <DetailValue label="Country" value={user?.country || user?.address?.country || payload?.country} />
                <DetailValue label="Email" value={getEmail(user)} />
                <DetailValue label="Address" value={
                  typeof user?.address === "object"
                    ? [user.address.line1, user.address.city, user.address.state, user.address.postalCode, user.address.country].filter(Boolean).join(", ")
                    : user?.address
                } />
                <DetailValue label="Phone" value={user?.phone || user?.mobile} />
                <DetailValue label="Joined On" value={formatDate(user?.joinedAt || user?.createdAt)} />
                <DetailValue label="Date of Birth" value={user?.dateOfBirth || user?.dob} />
              </div>
            </section>

            <section>
              <h4 className="m-0 mb-3 text-sm font-bold text-[#112f55] dark:text-white">KYC Verification Details</h4>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-500/5">
                <div className="grid grid-cols-2 gap-4">
                  <DetailValue label="Status" value={normalizeStatus(payload?.status || user?.kycStatus)} />
                  <DetailValue label="Verification ID" value={getVerificationId(payload)} />
                  <DetailValue label="Verified On" value={formatDate(payload?.verifiedAt || payload?.verificationDate)} />
                  <DetailValue label="Review Status" value={payload?.reviewStatus || (currentStatus === "verified" ? "Approved" : normalizeStatus(payload?.status))} />
                </div>
              </div>
            </section>

            <section>
              <h4 className="m-0 mb-3 text-sm font-bold text-[#112f55] dark:text-white">Document Verification</h4>
              <div className="grid grid-cols-2 gap-3">
                <DocumentCard
                  title={`Government ID${payload?.idType ? ` (${payload.idType})` : ""}`}
                  image={firstImage}
                  verified={Boolean(firstImage) ? currentStatus === "verified" : currentStatus === "verified"}
                  onView={() => firstImage && window.open(firstImage, "_blank", "noopener,noreferrer")}
                />
                <DocumentCard
                  title="Selfie with ID"
                  image={selfieImage}
                  verified={Boolean(selfieImage) ? currentStatus === "verified" : currentStatus === "verified"}
                  onView={() => selfieImage && window.open(selfieImage, "_blank", "noopener,noreferrer")}
                />
              </div>
            </section>

            <section>
              <h4 className="m-0 mb-3 text-sm font-bold text-[#112f55] dark:text-white">Restrictions</h4>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-[#0c1a2e]">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <p className="m-0 text-xs font-semibold text-[#23456e] dark:text-slate-200">
                    {payload?.restrictions?.length ? `${payload.restrictions.length} restriction(s) applied` : "No restrictions applied"}
                  </p>
                  <p className="m-0 mt-1 text-[10px] text-[#68809d] dark:text-[#90a5c4]">
                    {payload?.restrictions?.length ? payload.restrictions.join(", ") : "User can use all platform features."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white p-5 dark:border-[#223250] dark:bg-[#101f38]">
          <button
            type="button"
            disabled={actionLoading || currentStatus === "rejected"}
            onClick={() => onAction("rejected")}
            className="h-11 flex-1 rounded-lg border border-rose-300 bg-white text-sm font-semibold text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-[#101f38]"
          >
            {actionLoading ? "Updating..." : "Reject"}
          </button>
          <button
            type="button"
            disabled={actionLoading || currentStatus === "verified"}
            onClick={() => onAction("approved")}
            className="h-11 flex-1 rounded-lg bg-blue-500 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading ? "Updating..." : "Approve"}
          </button>
        </div>
      )}
    </aside>
  );
}

export default function KycVerification() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 450);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 10;

  const listQuery = usePaginatedQuery({
    queryKey: ["admin-kyc"],
    api: getKycApi,
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payload = useMemo(() => getPayload(listQuery.data), [listQuery.data]);
  const items = useMemo(() => getItems(payload), [payload]);
  const total = useMemo(() => getTotal(payload, items), [payload, items]);
  const totalPages = useMemo(() => getTotalPages(payload, total, limit), [payload, total]);
  const selectedQuery = useManualQuery({
    queryKey: ["admin-kyc-detail", selectedId],
    queryFn: ({ signal }) => getKycByIdApi(selectedId, signal),
    enabled: Boolean(selectedId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const stats = payload?.stats || payload?.summary || {};
  const statValues = {
    total: stats.total ?? stats.totalUsers ?? payload?.totalUsers ?? total ?? 0,
    verified: stats.verified ?? stats.approved ?? 0,
    pending: stats.pending ?? 0,
    rejected: stats.rejected ?? 0,
  };

  const handleAction = async (nextStatus) => {
    if (!selectedId || actionLoading) return;
    setActionLoading(true);
    try {
      await updateKycApi(selectedId, { status: nextStatus });
      await Promise.all([selectedQuery.refetch(), listQuery.refetch()]);
    } catch (error) {
      window.alert(error?.response?.data?.message || error?.message || "Unable to update KYC status.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">KYC Management</h1>
        <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">Verify and manage user KYC status</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={UserRound} label="Total Users" value={statValues.total.toLocaleString()} tone="blue" />
        <Stat icon={CheckCircle2} label="Verified" value={Number(statValues.verified).toLocaleString()} tone="green" />
        <Stat icon={Clock3} label="Pending" value={Number(statValues.pending).toLocaleString()} tone="yellow" />
        <Stat icon={XCircle} label="Rejected" value={Number(statValues.rejected).toLocaleString()} tone="red" />
      </div>

      <section className="mt-4 min-w-0 overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="border-b border-slate-100 p-3 dark:border-[#223250] sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {[
                ["all", "All"],
                ["pending", "Pending"],
                ["approved", "Verified"],
                ["rejected", "Rejected"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    status === value
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="ml-auto hidden items-center gap-2 text-[10px] text-slate-400 sm:flex">
                <FileCheck2 size={14} /> KYC Verification
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:justify-end">
              <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-[#2a4263] sm:max-w-[330px]">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="Search by user, email, or ID..."
                />
                {search !== debouncedSearch && <RefreshCw size={13} className="animate-spin text-blue-400" />}
              </div>
              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-500 dark:border-[#2a4263] dark:text-slate-300"
              >
                <Filter size={15} /> Filter
              </button>
              <button
                type="button"
                onClick={() => listQuery.refetch()}
                disabled={listQuery.isFetching}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-50 dark:border-[#2a4263]"
                aria-label="Refresh KYC"
              >
                <RefreshCw size={15} className={listQuery.isFetching ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {listQuery.isPending ? (
          <div className="p-4">
            <div className="hidden space-y-2 lg:block">
              {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-[62px] animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}
            </div>
            <div className="space-y-3 lg:hidden">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}
            </div>
          </div>
        ) : listQuery.isError ? (
          <div className="p-10 text-center">
            <AlertCircle className="mx-auto text-rose-400" size={28} />
            <p className="mt-2 text-sm font-semibold text-rose-500">{listQuery.error?.response?.data?.message || listQuery.error?.message || "Unable to load KYC records."}</p>
            <button onClick={() => listQuery.refetch()} className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-[#2a4263] dark:text-slate-200">Try again</button>
          </div>
        ) : !items.length ? (
          <div className="p-12 text-center">
            <ShieldCheck className="mx-auto text-slate-300" size={34} />
            <p className="mt-2 text-sm font-semibold text-slate-500">No KYC records found.</p>
          </div>
        ) : (
          <>
            <div className="relative hidden overflow-x-auto lg:block">
              {listQuery.isFetching && (
                <div className="absolute right-4 top-3 z-10 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm dark:bg-[#101f38] dark:text-slate-300">
                  <RefreshCw size={12} className="animate-spin" /> Loading...
                </div>
              )}
              <table className="w-full min-w-[780px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 dark:bg-[#0c1a2e] dark:text-slate-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">KYC Status</th>
                    <th className="px-4 py-3">Verification ID</th>
                    <th className="px-4 py-3">Submitted On</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const id = getId(item);
                    return (
                      <tr key={id || index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-[#223250] dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-4 text-xs text-slate-500">{(page - 1) * limit + index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-500 dark:bg-blue-500/10 dark:text-blue-300">{initials(getName(item))}</div>
                            <span className="max-w-[145px] truncate text-xs font-semibold text-[#24486f] dark:text-slate-100">{getName(item)}</span>
                          </div>
                        </td>
                        <td className="max-w-[170px] truncate px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{getEmail(item)}</td>
                        <td className="px-4 py-4"><StatusBadge status={item.status || item.kycStatus} /></td>
                        <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{getVerificationId(item)}</td>
                        <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(getSubmittedAt(item))}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedId(id)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-4 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:bg-[#101f38] dark:text-blue-300"
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              {items.map((item, index) => {
                const id = getId(item);
                return (
                  <article key={id || index} className="rounded-xl border border-slate-200 p-3 dark:border-[#223250]">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-500 dark:bg-blue-500/10 dark:text-blue-300">{initials(getName(item))}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-bold text-[#24486f] dark:text-white">{getName(item)}</p>
                            <p className="m-0 mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{getEmail(item)}</p>
                          </div>
                          <StatusBadge status={item.status || item.kycStatus} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#0c1a2e]"><span className="block text-[9px] uppercase text-slate-400">Verification ID</span><strong className="mt-1 block truncate text-[10px] text-slate-700 dark:text-slate-200">{getVerificationId(item)}</strong></div>
                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#0c1a2e]"><span className="block text-[9px] uppercase text-slate-400">Submitted</span><strong className="mt-1 block truncate text-[10px] text-slate-700 dark:text-slate-200">{formatDate(getSubmittedAt(item))}</strong></div>
                        </div>
                        <button type="button" onClick={() => setSelectedId(id)} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 text-xs font-semibold text-blue-600 dark:border-blue-900 dark:text-blue-300"><Eye size={14} /> View KYC</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </section>

      {selectedId && (
        <>
          <button type="button" aria-label="Close KYC details" onClick={() => setSelectedId(null)} className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]" />
          <DetailPanel
            item={selectedQuery.data}
            isLoading={selectedQuery.isPending || selectedQuery.isFetching}
            onClose={() => setSelectedId(null)}
            onAction={handleAction}
            actionLoading={actionLoading}
          />
        </>
      )}
    </AdminLayout>
  );
}
