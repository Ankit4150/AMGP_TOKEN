import React, { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  ExternalLink,
  Gift,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { useManualQuery } from "../../hooks/manualQuery";
import UserLayout from "../../components/user/UserLayout";
import Dropdown from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { getUserNotificationApi, getUserNotificationByIdApi, markReadUserNotificationApi, markAllReadUserNotificationApi } from "../../services/user/notificationApi";
import { queryClient } from "../../lib/queryClient";

const EVENTS = [
  { value: "all", label: "All Types" },
  { value: "investment_activated", label: "Investment Activated" },
  { value: "roi_credited", label: "Daily ROI Credited" },
  { value: "token_payout", label: "Token Payout" },
  { value: "buyback_initiated", label: "Buyback Initiated" },
  { value: "buyback_completed", label: "Buyback Completed" },
  { value: "withdrawal_requested", label: "Withdrawal Requested" },
  { value: "withdrawal_completed", label: "Withdrawal Completed" },
  { value: "withdrawal_failed", label: "Withdrawal Failed" },
];

const READ_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const eventMeta = {
  investment_activated: { icon: TrendingUp, iconClass: "bg-emerald-500 text-white", chip: "Investment" },
  roi_credited: { icon: CircleDollarSign, iconClass: "bg-violet-500 text-white", chip: "ROI / Profit" },
  token_payout: { icon: Coins, iconClass: "bg-[#111827] text-[#f7bd35]", chip: "Token Payout" },
  buyback_initiated: { icon: ShoppingCart, iconClass: "bg-blue-500 text-white", chip: "Buyback" },
  buyback_completed: { icon: CheckCheck, iconClass: "bg-cyan-500 text-white", chip: "Buyback" },
  withdrawal_requested: { icon: WalletCards, iconClass: "bg-orange-500 text-white", chip: "Withdrawal" },
  withdrawal_completed: { icon: Check, iconClass: "bg-emerald-500 text-white", chip: "Withdrawal" },
  withdrawal_failed: { icon: ShieldAlert, iconClass: "bg-rose-500 text-white", chip: "Withdrawal" },
};

function getPayload(response) {
  return response?.data ?? response ?? {};
}

function timeLabel(value) {
  const raw = String(value || "");
  return raw.replace(",", " ·");
}

function StatCard({ icon: Icon, label, value, hint, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  };
  return (
    <div className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon size={21} /></div>
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-medium text-[#68809d] dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#112e52] dark:text-white">{value}</p>
          <p className="mt-0.5 text-[10px] text-[#8aa0ba] dark:text-slate-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function NotificationIcon({ eventKey }) {
  const meta = eventMeta[eventKey] || { icon: Info, iconClass: "bg-slate-500 text-white" };
  const Icon = meta.icon;
  return <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${meta.iconClass}`}><Icon size={18} /></div>;
}

function StatusChip({ item }) {
  if (item.eventKey === "withdrawal_failed") return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">Action Required</span>;
  if (item.eventKey === "withdrawal_requested" || item.eventKey === "buyback_initiated") return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">Processing</span>;
  return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">Completed</span>;
}

function NotificationDetail({ item, onClose, onMarkRead }) {
  if (!item) return null;
  const meta = eventMeta[item.eventKey] || {};
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-[#101f38] sm:max-w-xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <NotificationIcon eventKey={item.eventKey} />
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600">{meta.chip || "Notification"}</p>
              <h2 className="mt-1 text-lg font-bold text-[#112e52] dark:text-white">{item.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-[#2b3c58]"><X size={17} /></button>
        </div>
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-[#365a82] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">{item.message}</div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Detail label="Date & Time" value={timeLabel(item.createdAt)} />
          <Detail label="Reference" value={item.reference || "-"} />
          <Detail label="Event" value={meta.chip || item.eventKey} />
          <Detail label="Status" value={<StatusChip item={item} />} />
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {!item.read && <button onClick={() => onMarkRead(item)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"><Check size={15} /> Mark as read</button>}
          <button onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 dark:border-[#2b3c58] dark:text-slate-300">Close</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#0d1a2e]"><span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</span><strong className="mt-1 block text-xs text-slate-700 dark:text-slate-200">{value}</strong></div>;
}

export default function Notifications() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [eventType, setEventType] = useState("all");
  const [readStatus, setReadStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const query = useManualQuery({
    queryKey: ["user-notifications", { page, limit, search: debouncedSearch, eventType, readStatus }],
    queryFn: ({ signal }) => getUserNotificationApi({ page, limit, search: debouncedSearch, eventType, readStatus }, signal),
    placeholderData: (previous) => previous,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const payload = useMemo(() => getPayload(query.data), [query.data]);
  const items = payload.items || [];
  const total = Number(payload.total || 0);
  const totalPages = Math.max(1, Number(payload.totalPages || Math.ceil(total / limit) || 1));
  const stats = payload.stats || { total: total, unread: 0, today: 0, important: 0 };
  const eventCounts = payload.eventCounts || {};

  React.useEffect(() => setPage(1), [debouncedSearch, eventType, readStatus, limit]);
  React.useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["user-notifications"] });

  const markRead = async (item) => {
    if (!item?.id || item.read) return;
    setBusyId(item.id);
    try {
      await markReadUserNotificationApi(item.id);
      if (selected?.id === item.id) setSelected((current) => current ? { ...current, read: true } : current);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (!stats.unread) return;
    setMarkingAll(true);
    try {
      await markAllReadUserNotificationApi();
      refresh();
    } finally {
      setMarkingAll(false);
    }
  };

  const headerSubtitle = "Stay updated with your investment, ROI, AMGP token, buyback and withdrawal activity.";

  return (
    <UserLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Bell size={22} /></div><div><h1 className="text-2xl font-bold tracking-tight text-[#112e52] sm:text-[30px] dark:text-white">Notifications</h1><p className="mt-1 text-sm text-[#3e5d83] dark:text-slate-400">{headerSubtitle}</p></div></div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={markAllRead} disabled={!stats.unread || markingAll} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dce9f7] bg-white px-3 text-xs font-semibold text-[#294c74] disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38] dark:text-slate-200"><CheckCheck size={15} />{markingAll ? "Updating..." : "Mark all as read"}</button>
            <button type="button" onClick={refresh} className="grid h-10 w-10 place-items-center rounded-xl border border-[#dce9f7] bg-white text-slate-500 dark:border-[#2b3c58] dark:bg-[#101f38]" title="Refresh"><RefreshCw size={16} className={query.isFetching ? "animate-spin" : ""} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Bell} label="Total Notifications" value={stats.total ?? total} hint="All time" tone="blue" />
          <StatCard icon={CheckCheck} label="Unread" value={stats.unread ?? 0} hint="Needs your attention" tone="green" />
          <StatCard icon={Clock3} label="Today" value={stats.today ?? 0} hint="New notifications" tone="purple" />
          <StatCard icon={ShieldAlert} label="Important" value={stats.important ?? 0} hint="Failed or action required" tone="amber" />
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0 overflow-visible rounded-2xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
            <div className="border-b border-slate-100 p-3 dark:border-[#223250] sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="text-base font-bold text-[#112e52] dark:text-white">All Notifications</h2><p className="mt-1 text-[11px] text-[#68809d] dark:text-slate-400">All 8 notification events defined in the project plan are supported.</p></div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Dropdown value={eventType} onChange={setEventType} options={EVENTS} placeholder="All Types" />
                  <Dropdown value={readStatus} onChange={setReadStatus} options={READ_FILTERS} placeholder="All Status" />
                </div>
              </div>
              <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-[#2b3c58]">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none dark:text-slate-200" placeholder="Search notifications..." />
                {search && <button onClick={() => setSearch("")} className="text-slate-400"><X size={15} /></button>}
              </div>
            </div>

            {query.isError && !query.data ? (
              <div className="p-12 text-center"><p className="text-sm text-rose-500">Unable to load notifications.</p><button onClick={() => query.refetch()} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-[#2b3c58]">Try again</button></div>
            ) : query.isPending ? (
              <div className="space-y-1 p-3 sm:p-4">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-[86px] animate-pulse rounded-xl bg-slate-100 dark:bg-[#16283f]" />)}</div>
            ) : !items.length ? (
              <div className="p-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-[#0d1a2e]"><Bell size={21} /></div><p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">No notifications found</p><p className="mt-1 text-xs text-slate-400">Try changing the search or filters.</p></div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-[#223250]">
                  {items.map((item) => {
                    const unread = !item.read;
                    return (
                      <button key={item.id} type="button" onClick={() => { setSelected(item); if (unread) markRead(item); }} className={`group flex w-full min-w-0 items-start gap-3 p-3 text-left transition hover:bg-[#f7faff] dark:hover:bg-white/[0.03] sm:p-4 ${unread ? "bg-blue-50/45 dark:bg-blue-500/[0.035]" : ""}`}>
                        <div className="relative pt-0.5"><NotificationIcon eventKey={item.eventKey} />{unread && <span className="absolute -left-1 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600 dark:border-[#101f38]" />}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3"><div className="min-w-0"><h3 className={`truncate text-sm ${unread ? "font-bold" : "font-semibold"} text-[#16375f] dark:text-slate-100`}>{item.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5c7798] dark:text-slate-400">{item.message}</p></div><StatusChip item={item} /></div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#8aa0ba] dark:text-slate-500"><span>{timeLabel(item.createdAt)}</span><span>•</span><span>{eventMeta[item.eventKey]?.chip || "System"}</span>{item.reference && <><span>•</span><span>{item.reference}</span></>}</div>
                        </div>
                        <ChevronRight size={17} className="mt-2 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                      </button>
                    );
                  })}
                </div>
                <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400 dark:border-[#223250]"><span>Showing {Math.min((page - 1) * limit + 1, total || 0)} to {Math.min(page * limit, total)} of {total} notifications</span><Dropdown value={limit} onChange={(v) => setLimit(Number(v))} icon={null} className="!h-8 !min-w-[72px] !rounded-lg !px-2.5 !text-[11px]" options={[{ value: 10, label: "10" }, { value: 20, label: "20" }, { value: 50, label: "50" }]} /> </div>
              </>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
              <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#112e52] dark:text-white">Notification Types</h3><span className="text-[10px] text-slate-400">{total}</span></div>
              <div className="mt-3 space-y-1.5">
                {EVENTS.slice(1).map((event) => <button key={event.value} onClick={() => setEventType(event.value)} className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5"><span className="flex min-w-0 items-center gap-2.5"><NotificationIcon eventKey={event.value} /><span className="truncate text-xs font-medium text-[#345577] dark:text-slate-200">{event.label}</span></span><span className="text-[10px] font-semibold text-[#64809f] dark:text-slate-500">{eventCounts[event.value] ?? 0}</span></button>)}
              </div>
            </section>
            <section className="rounded-2xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
              <h3 className="text-sm font-bold text-[#112e52] dark:text-white">Quick Actions</h3>
              <div className="mt-3 space-y-2">
                <QuickAction to="/user/wallet" icon={WalletCards} label="View Wallet" />
                <QuickAction to="/user/investments" icon={TrendingUp} label="Go to Investment" />
                <QuickAction to="/user/buyback" icon={Gift} label="Buyback / Sell Token" />
                <QuickAction to="/user/withdrawal" icon={CircleDollarSign} label="Withdraw Funds" />
              </div>
            </section>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-[#edf5ff] to-white p-4 dark:border-blue-500/20 dark:from-blue-500/10 dark:to-[#101f38]">
              <div className="flex items-center gap-3"><img src="/amgp-logo.png" alt="AMGP Token" className="h-12 w-12 object-contain" /><div><p className="text-sm font-bold text-blue-700 dark:text-blue-300">AMGP Token</p><p className="mt-1 text-[10px] leading-4 text-[#6681a2] dark:text-slate-400">Your account activity and AMGP token updates stay in one place.</p></div></div>
            </div>
          </aside>
        </div>
      </div>
      <NotificationDetail item={selected} onClose={() => setSelected(null)} onMarkRead={markRead} />
      {busyId && <span className="sr-only">Updating notification</span>}
    </UserLayout>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return <a href={to} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-xs font-medium text-[#456789] hover:border-blue-200 hover:bg-blue-50/50 dark:border-[#223250] dark:text-slate-300 dark:hover:bg-white/5"><span className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Icon size={15} /></span>{label}</span><ExternalLink size={14} className="text-slate-300" /></a>;
}
