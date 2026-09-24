import React, { useEffect, useMemo, useState } from "react";
import {
  Bell, Mail, Send, MessageSquare, CalendarDays, RefreshCw, Search, Eye, Trash2,
  RotateCcw, X, Copy, CheckCircle2, XCircle, Clock3, AlertTriangle, Plus, Download,
  ChevronRight, Radio, Settings2, ListChecks, Info,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/ui/StatCard";
import Dropdown from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { useManualQuery } from "../../hooks/manualQuery";
import { getNotificationApi, getNotificationByIdApi, createNotificationApi, updateNotificationApi, deleteNotificationApi } from "../../services/admin/notificationApi";
import { queryClient } from "../../lib/queryClient";

/* ---------------------------------------------------------------------- */
/* Static config — mirrors Phase 25 of the Final Development Plan:        */
/* 8 system events, 4 delivery channels (In-App, Email, Telegram, SMS).   */
/* ---------------------------------------------------------------------- */

const CHANNELS = [
  { key: "inApp", label: "In-App", icon: Bell, color: "text-sky-600 bg-sky-50" },
  { key: "email", label: "Email", icon: Mail, color: "text-violet-600 bg-violet-50" },
  { key: "telegram", label: "Telegram", icon: Send, color: "text-cyan-600 bg-cyan-50" },
  { key: "sms", label: "SMS", icon: MessageSquare, color: "text-amber-600 bg-amber-50" },
];
const channelMeta = (key) => CHANNELS.find((c) => c.key === key) || CHANNELS[0];

const CATEGORY_TONE = {
  Investment: "bg-sky-50 text-sky-600",
  ROI: "bg-emerald-50 text-emerald-600",
  Token: "bg-violet-50 text-violet-600",
  Buyback: "bg-amber-50 text-amber-600",
  Withdrawal: "bg-rose-50 text-rose-600",
};

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "Delivered", label: "Delivered" },
  { value: "Partially Delivered", label: "Partially Delivered" },
  { value: "Pending", label: "Pending" },
  { value: "Failed", label: "Failed" },
];
const channelOptions = [
  { value: "all", label: "All Channels" },
  ...CHANNELS.map((c) => ({ value: c.key, label: c.label })),
];
const dateOptions = [
  { value: "all", label: "All Dates" },
  { value: "Today", label: "Today" },
  { value: "Last 7 Days", label: "Last 7 Days" },
  { value: "Last 30 Days", label: "Last 30 Days" },
];

const composeDefaults = {
  eventKey: "withdrawal_requested",
  user: "All Users",
  email: "",
  reference: "",
  title: "",
  message: "",
  channels: ["inApp"],
};

export default function Notifications() {
  const [tab, setTab] = useState("log"); // "log" | "templates"

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Bell size={21} />
          </span>
          <div>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] sm:text-[29px]">Notifications</h1>
            <p className="mt-1 text-sm text-[#3e5d83]">
              Investment, ROI, token payout, buyback and withdrawal alerts — In-App, Email, Telegram &amp; SMS.
            </p>
          </div>
        </div>

        <div className="flex w-full gap-1.5 rounded-xl border border-[#dce9f7] bg-white p-1.5 shadow-sm xl:w-auto">
          <TabButton active={tab === "log"} onClick={() => setTab("log")} icon={ListChecks} label="Notification Log" />
          <TabButton active={tab === "templates"} onClick={() => setTab("templates")} icon={Settings2} label="Channels & Templates" />
        </div>
      </div>

      {tab === "log" ? <NotificationLog /> : <ChannelTemplates />}
    </AdminLayout>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition xl:flex-none ${
        active ? "bg-blue-600 text-white shadow-sm" : "text-[#426287] hover:bg-slate-50"
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

/* ========================================================================
   TAB 1 — NOTIFICATION LOG
   ======================================================================== */

function NotificationLog() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [channel, setChannel] = useState("all");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);
  const [compose, setCompose] = useState(null);
  const [busy, setBusy] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data: response, isPending, isFetching, error, refetch } = usePaginatedQuery({
    queryKey: ["admin-notifications"],
    api: getNotificationApi,
    page,
    limit,
    search: debouncedSearch,
    status,
    extraParams: { eventType, channel, date },
  });

  const payload = useMemo(() => response?.data ?? response ?? {}, [response]);
  const items = payload?.items ?? [];
  const stats = payload?.stats ?? [];
  const events = payload?.events ?? [];
  const total = Number(payload?.total ?? items.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / limit)));

  useEffect(() => setPage(1), [debouncedSearch, status, eventType, channel, date, limit]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    refetch();
  };

  const resend = async (item) => {
    if (!window.confirm(`Resend notification ${item.id} to ${item.user}?`)) return;
    setBusy(true);
    try {
      await updateNotificationApi(item.id, { action: "resend" });
      setSelected((cur) => (cur?.id === item.id ? { ...cur, status: "Delivered" } : cur));
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to resend notification.");
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Delete notification ${item.id}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteNotificationApi(item.id);
      if (selected?.id === item.id) setSelected(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to delete notification.");
    } finally {
      setBusy(false);
    }
  };

  const sendBroadcast = async (form) => {
    setBusy(true);
    try {
      await createNotificationApi(form);
      setCompose(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to send notification.");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const headers = ["ID", "Date & Time", "Event", "User", "Channels", "Status", "Reference"];
    const rows = items.map((x) => [x.id, x.createdAt, x.title, x.user, (x.channels || []).join("|"), x.status, x.reference]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "notifications.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const eventTypeOptions = [
    { value: "all", label: "All Events" },
    ...(events.length ? events : []).map((e) => ({ value: e.key, label: e.label })),
  ];

  return (
    <>
      <section className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {(stats.length
          ? stats
          : [
              { label: "Total Notifications", value: "0", change: "—", tone: "blue", icon: "withdrawal" },
              { label: "Delivered", value: "0", change: "—", tone: "green", icon: "verified" },
              { label: "Failed", value: "0", change: "—", tone: "red", icon: "failed" },
              { label: "Pending / Partial", value: "0", change: "—", tone: "yellow", icon: "pending" },
              { label: "Multi-Channel Sends", value: "0", change: "—", tone: "purple", icon: "token" },
            ]
        ).map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <section className="mb-3 rounded-xl border border-[#dce9f7] bg-white p-3 shadow-sm">
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_150px_150px_140px_auto_auto]">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#d9e6f4] px-3 text-[#577699]">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, event, reference..."
              className="min-w-0 flex-1 bg-transparent text-xs text-[#24496f] outline-none placeholder:text-[#6681a2]"
            />
          </div>
          <Dropdown value={eventType} onChange={setEventType} fullWidth options={eventTypeOptions} />
          <Dropdown value={channel} onChange={setChannel} fullWidth options={channelOptions} />
          <Dropdown value={status} onChange={setStatus} fullWidth options={statusOptions} />
          <Dropdown value={date} onChange={setDate} fullWidth options={dateOptions} icon={CalendarDays} />
          <button
            onClick={() => { setSearch(""); setStatus("all"); setEventType("all"); setChannel("all"); setDate("all"); }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
          <button onClick={refresh} disabled={isFetching || busy} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50" title="Refresh">
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-[10px] text-[#68809d] sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} of {total} notifications</span>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50">
              <Download size={14} /> Export
            </button>
            <button onClick={() => setCompose({ ...composeDefaults })} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
              <Plus size={14} /> Send Broadcast
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm">
        {isPending ? (
          <Loading />
        ) : error && !response ? (
          <ErrorState error={error} retry={refresh} />
        ) : (
          <>
            {isFetching && (
              <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500">
                <RefreshCw size={12} className="animate-spin" /> Updating...
              </div>
            )}
            <div className="hidden overflow-hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="bg-[#f2f7fc] text-[10px] font-semibold text-[#426287]">
                    <th className="w-[10%] px-2 py-3">DATE & TIME</th>
                    <th className="w-[16%] px-2 py-3">EVENT</th>
                    <th className="w-[14%] px-2 py-3">USER</th>
                    <th className="w-[19%] px-2 py-3">MESSAGE</th>
                    <th className="w-[13%] px-2 py-3">CHANNELS</th>
                    <th className="w-[11%] px-2 py-3">STATUS</th>
                    <th className="w-[8%] px-2 py-3">REF</th>
                    <th className="w-[9%] px-2 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 text-[11px] text-[#274c76] last:border-0">
                      <td className="truncate px-2 py-3">{item.createdAt}</td>
                      <td className="truncate px-2 py-3"><EventCell item={item} /></td>
                      <td className="truncate px-2 py-3"><strong className="block truncate">{item.user}</strong><span className="block truncate text-[9px] text-slate-400">{item.email}</span></td>
                      <td className="truncate px-2 py-3 text-[#3e5d83]" title={item.message}>{item.message}</td>
                      <td className="px-2 py-3"><ChannelRow channels={item.channels} channelStatus={item.channelStatus} /></td>
                      <td className="px-2 py-3"><Status status={item.status} /></td>
                      <td className="truncate px-2 py-3 font-semibold text-[#173a65]">{item.reference}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <ActionButton label="View" onClick={() => setSelected(item)}><Eye size={15} /></ActionButton>
                          {item.status === "Failed" || item.status === "Partially Delivered" ? (
                            <ActionButton label="Resend" onClick={() => resend(item)}><RotateCcw size={15} /></ActionButton>
                          ) : null}
                          <ActionButton label="Delete" danger onClick={() => removeItem(item)}><Trash2 size={15} /></ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 p-3 lg:hidden">
              {items.map((item) => (
                <MobileNotification key={item.id} item={item} onView={setSelected} onResend={resend} onDelete={removeItem} />
              ))}
            </div>
            {!items.length && <div className="p-10 text-center text-sm text-slate-400">No notifications found.</div>}
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
            <div className="border-t border-slate-100 px-3 py-2 text-right text-[10px] text-slate-400">
              <label className="inline-flex items-center gap-2">
                Rows
                <Dropdown value={limit} onChange={(v) => setLimit(Number(v))} icon={null} className="!h-8 !rounded-lg !px-2.5 !text-[11px]" options={[{ value: 10, label: "10" }, { value: 20, label: "20" }, { value: 50, label: "50" }]} />
              </label>
            </div>
          </>
        )}
      </section>

      {selected && <DetailsDrawer item={selected} onClose={() => setSelected(null)} onResend={resend} busy={busy} />}
      {compose && <ComposeForm initial={compose} events={events} busy={busy} onClose={() => setCompose(null)} onSend={sendBroadcast} />}
    </>
  );
}

function EventCell({ item }) {
  const tone = CATEGORY_TONE[item.event?.category] || "bg-slate-100 text-slate-600";
  return (
    <div className="min-w-0">
      <strong className="block truncate text-[#173a65]">{item.title}</strong>
      {item.event?.category && (
        <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${tone}`}>{item.event.category}</span>
      )}
    </div>
  );
}

function ChannelRow({ channels = [], channelStatus = {} }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {CHANNELS.map((c) => {
        const used = channels.includes(c.key);
        const st = channelStatus?.[c.key]?.status;
        const failed = st === "Failed";
        const Icon = c.icon;
        return (
          <span
            key={c.key}
            title={`${c.label}: ${used ? st || "Sent" : "Not used"}`}
            className={`grid h-6 w-6 place-items-center rounded-md ${
              !used ? "bg-slate-50 text-slate-300" : failed ? "bg-rose-50 text-rose-500" : c.color
            }`}
          >
            <Icon size={12} />
          </span>
        );
      })}
    </div>
  );
}

function Status({ status }) {
  const s = String(status || "Pending");
  const good = s === "Delivered";
  const bad = s === "Failed";
  const partial = s === "Partially Delivered";
  const Icon = good ? CheckCircle2 : bad ? XCircle : partial ? AlertTriangle : Clock3;
  const tone = good ? "bg-emerald-50 text-emerald-600" : bad ? "bg-rose-50 text-rose-500" : partial ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${tone}`}>
      <Icon size={11} /> {s}
    </span>
  );
}

function ActionButton({ children, onClick, label, danger = false }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className={`grid h-8 w-8 place-items-center rounded-lg border bg-white ${danger ? "border-rose-100 text-rose-500 hover:bg-rose-50" : "border-slate-200 text-[#24486f] hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}

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
      <p className="text-sm text-rose-500">{error?.message || "Unable to load notifications."}</p>
      <button onClick={retry} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Try again</button>
    </div>
  );
}

function MobileNotification({ item, onView, onResend, onDelete }) {
  return (
    <article className="rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Bell size={18} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-xs text-slate-800">{item.title}</strong>
            <Status status={item.status} />
          </div>
          <p className="mt-1 truncate text-[10px] text-slate-500">{item.user} · {item.createdAt}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] text-slate-600">{item.message}</p>
      <div className="mt-2 flex items-center justify-between">
        <ChannelRow channels={item.channels} channelStatus={item.channelStatus} />
        <span className="text-[9px] font-semibold text-slate-400">{item.reference}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onView(item)} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"><Eye size={14} /> View</button>
        {(item.status === "Failed" || item.status === "Partially Delivered") && (
          <button onClick={() => onResend(item)} className="grid h-9 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700" aria-label="Resend"><RotateCcw size={14} /></button>
        )}
        <button onClick={() => onDelete(item)} className="grid h-9 w-10 place-items-center rounded-lg border border-rose-100 text-rose-500" aria-label="Delete"><Trash2 size={14} /></button>
      </div>
    </article>
  );
}

function DetailsDrawer({ item, onClose, onResend, busy }) {
  const copy = (v) => navigator.clipboard?.writeText(String(v || ""));
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/30" onMouseDown={onClose}>
      <aside onMouseDown={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-[440px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5">
          <div>
            <h2 className="text-lg font-bold text-[#112e52]">Notification Details</h2>
            <div className="mt-2"><Status status={item.status} /></div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-4 p-5">
          <DetailRow label="Notification ID" value={item.id} copy={copy} />
          <DetailRow label="Event" value={item.title} />
          {item.event?.category && <DetailRow label="Category" value={item.event.category} />}
          <DetailRow label="User" value={`${item.user} · ${item.email}`} />
          <DetailRow label="Reference" value={item.reference} copy={copy} />
          <DetailRow label="Triggered By" value={item.triggeredBy} />
          <DetailRow label="Sent At" value={item.createdAt} />
          <DetailRow label="Retry Count" value={item.retryCount} />

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 text-xs font-bold text-[#173a65]">Message</h3>
            <p className="text-[11px] leading-relaxed text-[#3e5d83]">{item.message}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-3 text-xs font-bold text-[#173a65]">Delivery by Channel</h3>
            <div className="space-y-2">
              {CHANNELS.map((c) => {
                const cs = item.channelStatus?.[c.key];
                const used = (item.channels || []).includes(c.key);
                const Icon = c.icon;
                return (
                  <div key={c.key} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0">
                    <span className="flex items-center gap-2 text-[11px] font-medium text-[#274c76]">
                      <span className={`grid h-7 w-7 place-items-center rounded-lg ${used ? c.color : "bg-slate-50 text-slate-300"}`}><Icon size={13} /></span>
                      {c.label}
                    </span>
                    <span className="text-right">
                      <Status status={cs?.status || "Not Sent"} />
                      {used && cs?.at && cs.at !== "-" && <span className="mt-1 block text-[9px] text-slate-400">{cs.at}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {(item.status === "Failed" || item.status === "Partially Delivered") && (
            <button disabled={busy} onClick={() => onResend(item)} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-semibold text-white disabled:opacity-50">
              <RotateCcw size={15} /> Resend Notification
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
function DetailRow({ label, value, copy }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-[10px] text-slate-500">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-right text-[11px] font-semibold text-[#173a65]">
        <span className="max-w-[250px] break-words">{value ?? "-"}</span>
        {copy && <button onClick={() => copy(value)} className="shrink-0 text-slate-400 hover:text-blue-600"><Copy size={13} /></button>}
      </span>
    </div>
  );
}

function ComposeForm({ initial, events, busy, onClose, onSend }) {
  const [form, setForm] = useState({ ...initial });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleChannel = (key) =>
    setForm((f) => ({ ...f, channels: f.channels.includes(key) ? f.channels.filter((c) => c !== key) : [...f.channels, key] }));

  const eventOpts = (events?.length ? events : []).map((e) => ({ value: e.key, label: e.label }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.message.trim()) { window.alert("Message is required."); return; }
    if (!form.channels.length) { window.alert("Select at least one delivery channel."); return; }
    onSend(form);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 p-3 sm:p-5" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#112e52]">Send Broadcast Notification</h2>
            <p className="mt-1 text-xs text-slate-500">Manually push an announcement outside the automated system events.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200"><X size={19} /></button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          <Field label="Related Event Type"><Dropdown value={form.eventKey} onChange={(v) => set("eventKey", v)} fullWidth icon={null} options={eventOpts.length ? eventOpts : [{ value: form.eventKey, label: form.eventKey }]} /></Field>
          <Field label="Recipient"><input value={form.user} onChange={(e) => set("user", e.target.value)} placeholder="All Users or a specific name" className="input" /></Field>
          <Field label="Email (optional)"><input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@example.com" className="input" /></Field>
          <Field label="Reference (optional)"><input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="INV-2044 / WDR-001 ..." className="input" /></Field>
          <Field label="Title" full><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Notification headline" className="input" /></Field>
          <Field label="Message" full><textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Write the notification message..." className="input min-h-28 resize-none" /></Field>
          <Field label="Delivery Channels" full>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => {
                const active = form.channels.includes(c.key);
                const Icon = c.icon;
                return (
                  <button key={c.key} type="button" onClick={() => toggleChannel(c.key)} className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <Icon size={14} /> {c.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white p-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600">Cancel</button>
          <button disabled={busy} type="submit" className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Sending..." : "Send Notification"}</button>
        </div>
      </form>
    </div>
  );
}
function Field({ label, children, full }) {
  return (
    <label className={`${full ? "sm:col-span-2" : ""} min-w-0`}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase text-[#426287]">{label}</span>
      {children}
    </label>
  );
}

/* ========================================================================
   TAB 2 — CHANNELS & TEMPLATES (Phase 25 event → channel configuration)
   ======================================================================== */

function ChannelTemplates() {
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data: response, isPending, error, refetch } = useManualQuery({
    queryKey: ["admin-notification-templates"],
    queryFn: ({ signal }) => getNotificationApi({ view: "templates" }, signal),
    staleTime: 30_000,
  });

  const payload = useMemo(() => response?.data ?? response ?? {}, [response]);
  const templates = payload?.items ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-notification-templates"] });
    refetch();
  };

  const toggleChannel = async (tpl, channelKey) => {
    setBusy(true);
    try {
      await updateNotificationApi(tpl.id, { channels: { [channelKey]: !tpl.channels[channelKey] }, updatedBy: "Operations Admin" });
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to update channel.");
    } finally {
      setBusy(false);
    }
  };

  const saveTemplate = async (tpl) => {
    setBusy(true);
    try {
      await updateNotificationApi(tpl.id, { subject: tpl.subject, body: tpl.body, updatedBy: "Operations Admin" });
      setEditor(null);
      refresh();
    } catch (e) {
      window.alert(e?.message || "Unable to save template.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="mb-4 flex items-start gap-3 rounded-xl border border-[#dce9f7] bg-blue-50/40 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs leading-relaxed text-[#274c76]">
          Every system event below is dispatched automatically by its module (ROI Engine, Token Payout, Buyback and Withdrawal services).
          Toggle a channel on or off to control where each event is delivered, and edit the message template used for that channel.
        </p>
      </section>

      {isPending ? (
        <Loading />
      ) : error && !response ? (
        <ErrorState error={error} retry={refresh} />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {templates.map((tpl) => (
            <TemplateCard key={tpl.id} tpl={tpl} busy={busy} onToggle={(ch) => toggleChannel(tpl, ch)} onEdit={() => setEditor(tpl)} />
          ))}
        </div>
      )}

      {editor && <TemplateEditor tpl={editor} busy={busy} onClose={() => setEditor(null)} onSave={saveTemplate} />}
    </>
  );
}

function TemplateCard({ tpl, busy, onToggle, onEdit }) {
  const tone = CATEGORY_TONE[tpl.category] || "bg-slate-100 text-slate-600";
  const activeCount = Object.values(tpl.channels || {}).filter(Boolean).length;
  return (
    <div className="min-w-0 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-sm font-bold text-[#112e52]">{tpl.label}</strong>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${tone}`}>{tpl.category}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#5c7599]">{tpl.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-50 px-2 py-1 text-[9px] font-semibold text-slate-500">{activeCount}/4 channels</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHANNELS.map((c) => {
          const on = Boolean(tpl.channels?.[c.key]);
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              disabled={busy}
              onClick={() => onToggle(c.key)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition disabled:opacity-50 ${
                on ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400 hover:bg-slate-50"
              }`}
            >
              <Icon size={12} /> {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[9px] text-slate-400">Updated {tpl.updatedAt} · {tpl.updatedBy}</span>
        <button onClick={onEdit} className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline">
          Edit template <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function TemplateEditor({ tpl, busy, onClose, onSave }) {
  const [form, setForm] = useState({ ...tpl });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 p-3 sm:p-5" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Radio size={17} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-[#112e52]">{form.label}</h2>
              <p className="mt-1 text-xs text-slate-500">Edit the notification subject and message body for this event.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200"><X size={19} /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          <Field label="Email Subject"><input value={form.subject || ""} onChange={(e) => set("subject", e.target.value)} className="input" /></Field>
          <Field label="Message Body"><textarea value={form.body || ""} onChange={(e) => set("body", e.target.value)} className="input min-h-32 resize-none" /></Field>
          {!!(form.variables || []).length && (
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase text-[#426287]">Available Variables</span>
              <div className="flex flex-wrap gap-1.5">
                {form.variables.map((v) => (
                  <code key={v} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-[#274c76]">{`{{${v}}}`}</code>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white p-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600">Cancel</button>
          <button disabled={busy} onClick={() => onSave(form)} className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Saving..." : "Save Template"}</button>
        </div>
      </div>
    </div>
  );
}
