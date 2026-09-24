import React from "react";
import {
  CircleAlert,
  Clock3,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import ErrorState from "../../components/shared/ErrorState";
import { useStartKyc, useUserKyc } from "../../hooks/queries/useUserKyc";
import { formatDate } from "../../lib/format";

const card =
  "rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

// One entry per KYC status (plan Phase 4: KYC status + review status).
const STATUS = {
  not_started: {
    label: "Not verified",
    icon: ShieldAlert,
    title: "Your identity isn't verified yet",
    text: "Start verification to submit your identity details. You can track the result on this page.",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
    iconTone: "bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400",
  },
  pending: {
    label: "Under review",
    icon: Clock3,
    title: "Your verification is under review",
    text: "We're reviewing your details. Use Refresh to check for the latest status.",
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  approved: {
    label: "Verified",
    icon: ShieldCheck,
    title: "Your identity is verified",
    text: "Your identity verification is complete. No further action is needed.",
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    icon: ShieldX,
    title: "Your verification was rejected",
    text: "We couldn't verify your identity. You can start the verification again.",
    badge: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    iconTone: "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400",
  },
};

export default function Kyc() {
  const { data, isPending, isError, error, isFetching, refetch } = useUserKyc();
  const start = useStartKyc();

  const loadMessage = error?.response?.data?.message || error?.message || "Unable to load your KYC status.";
  const startMessage =
    start.error?.response?.data?.message || start.error?.message || "Unable to start verification.";

  return (
    <UserLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] dark:text-white sm:text-[29px]">
            KYC Verification
          </h1>
          <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">
            Complete and track your identity verification.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={`inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#dce5ef] bg-white px-3 text-xs font-semibold text-[#496783] shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-[#263752] dark:bg-[#101f38] dark:text-slate-300 sm:self-auto ${focusRing}`}
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {isPending && !isError && <KycSkeleton />}

      {isError && !data && (
        <ErrorState title="Couldn't load your KYC status" message={loadMessage} onRetry={() => refetch()} />
      )}

      {data && (
        <>
          {isError && (
            <p className="mb-3 text-xs text-amber-600" role="status">
              Couldn't refresh just now. Showing the last loaded status.
            </p>
          )}
          <StatusPanel
            kyc={data}
            starting={start.isPending}
            startError={start.isError ? startMessage : ""}
            onStart={() => start.mutate()}
          />
          <DetailsPanel kyc={data} />
        </>
      )}
    </UserLayout>
  );
}

function StatusPanel({ kyc, starting, startError, onStart }) {
  const config = STATUS[kyc.status];
  const Icon = config.icon;
  const canStart = kyc.status === "not_started" || kyc.status === "rejected";

  return (
    <section className={`${card} mb-5 p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${config.iconTone}`}>
          <Icon size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-lg font-bold text-[#112f55] dark:text-white">{config.title}</h2>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${config.badge}`}>{config.label}</span>
          </div>
          <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">{config.text}</p>
        </div>
        {canStart && (
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 ${focusRing}`}
          >
            {starting && <RefreshCw size={15} className="animate-spin" />}
            {starting ? "Starting…" : kyc.status === "rejected" ? "Verify again" : "Start verification"}
          </button>
        )}
      </div>
      {startError && (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {startError}
        </p>
      )}
    </section>
  );
}

// The five things the plan (Phase 4) says are stored for KYC.
function DetailsPanel({ kyc }) {
  const config = STATUS[kyc.status];
  const rows = [
    ["KYC status", <span key="s" className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.badge}`}>{config.label}</span>],
    ["Verification ID", kyc.verificationId || "—"],
    ["Verification date", formatDate(kyc.verificationDate) || "—"],
    ["Review status", kyc.reviewStatus || "—"],
  ];

  return (
    <section className={`${card} p-4 sm:p-5`}>
      <h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">Verification details</h2>

      <dl className="m-0 mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-[#e4ebf4] bg-[#fbfdff] p-3 dark:border-[#263752] dark:bg-[#0d1a2e]"
          >
            <dt className="text-[11px] font-medium text-[#68809d] dark:text-slate-400">{label}</dt>
            <dd className="m-0 mt-1.5 min-h-[24px] break-words text-sm font-bold text-[#163a62] dark:text-white">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-xl border border-[#e4ebf4] bg-[#fbfdff] p-3 dark:border-[#263752] dark:bg-[#0d1a2e]">
        <h3 className="m-0 text-[11px] font-medium text-[#68809d] dark:text-slate-400">Restrictions</h3>
        {kyc.restrictions.length === 0 ? (
          <p className="m-0 mt-1.5 text-sm font-semibold text-[#163a62] dark:text-white">
            No restrictions are applied to your account.
          </p>
        ) : (
          <ul className="m-0 mt-2 list-none space-y-2 p-0">
            {kyc.restrictions.map((item) => (
              <li key={item.label} className="flex items-start gap-2.5">
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold text-[#163a62] dark:text-white">{item.label}</p>
                  {item.description && (
                    <p className="m-0 mt-0.5 text-xs text-[#64809f] dark:text-[#90a5c4]">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function KycSkeleton() {
  const block = "animate-pulse rounded-xl border border-[#dce9f7] bg-slate-100 dark:border-[#223250] dark:bg-[#101f38]";
  return (
    <div aria-busy="true" aria-label="Loading KYC status">
      <div className={`mb-5 h-[104px] ${block}`} />
      <div className={`h-64 ${block}`} />
    </div>
  );
}
