import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  KeyRound,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import Dropdown from "../../components/ui/Dropdown";
import { getAccessControlApi, createAccessControlApi, updateAccessControlApi, deleteAccessControlApi } from "../../services/admin/accessControlApi";
import { adminTeam as fallbackTeam, accessAuditLog as fallbackAuditLog } from "../../mock/data/accessControl";
import {
  ACCESS_CONTROL_ROLES,
  PERMISSION_LABELS,
  ROLE_META,
  moduleCountForRole,
  permissionsForRole,
} from "../../data/roleMeta";

const ROLE_ACTIONS = {
  superAdmin: ["View every module", "Manage admin team", "Change role access", "Approve sensitive operations", "Manage wallet controls"],
  financeAdmin: ["View finance modules", "Manage buybacks", "Manage withdrawals", "Run reconciliation", "View reports"],
  operationsAdmin: ["Manage investments", "Set daily ROI", "Preview ROI", "Approve / release ROI", "View transactions"],
  complianceAdmin: ["Review KYC", "Manage compliance records", "Review audit logs", "View users", "View reports"],
  supportAdmin: ["View users", "Support user requests", "View notifications"],
};

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.supportAdmin;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

function StatusPill({ status }) {
  const isOnline = String(status).toLowerCase() === "online";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${isOnline ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}

const avatarTones = { blue: "bg-blue-500", purple: "bg-violet-600", orange: "bg-orange-500", teal: "bg-teal-500", pink: "bg-pink-500" };

function AdminAvatar({ member }) {
  return <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ${avatarTones[member.avatar] || "bg-violet-500"}`}>{member.initials}</span>;
}

function AdminFormModal({ title, initial, onClose, onSave, saving }) {
  const [form, setForm] = useState(initial || { name: "", email: "", role: "supportAdmin", status: "Offline" });
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17355b]/25 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#d9e6f4] bg-white shadow-2xl dark:border-[#223250] dark:bg-[#101f38]">
        <div className="flex items-center justify-between border-b border-[#edf2f7] px-5 py-4 dark:border-[#1b2c46]">
          <div>
            <p className="m-0 text-sm font-bold text-[#183a67] dark:text-white">{title}</p>
            <p className="m-0 mt-1 text-[11px] text-[#8294ac] dark:text-[#7d93b3]">Assign one of the platform roles. Access is enforced by route permissions.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe8f4] text-[#6280a4] hover:bg-[#f7f9fd] dark:border-[#223250] dark:text-[#90a5c4]"><X size={16} /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#68809f]">Full Name</span><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Priya Sharma" className="h-10 w-full rounded-lg border border-[#dfe8f4] bg-white px-3 text-xs text-[#254a77] outline-none focus:border-[#6b7cff] dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce7f6]" /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#68809f]">Email</span><input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="name@nextoken.io" className="h-10 w-full rounded-lg border border-[#dfe8f4] bg-white px-3 text-xs text-[#254a77] outline-none focus:border-[#6b7cff] dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce7f6]" /></label>
          <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#68809f]">Role</span><Dropdown value={form.role} onChange={(val) => setForm((p) => ({ ...p, role: val }))} icon={null} fullWidth options={ACCESS_CONTROL_ROLES.map((role) => ({ value: role, label: ROLE_META[role].label }))} /></label>
          <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#68809f]">Status</span><Dropdown value={form.status} onChange={(val) => setForm((p) => ({ ...p, status: val }))} icon={null} fullWidth options={[{ value: "Online", label: "Online" }, { value: "Offline", label: "Offline" }]} /></label>
          <div className="rounded-xl border border-[#e5edf6] bg-[#fbfcfe] p-3 sm:col-span-2 dark:border-[#1b2c46] dark:bg-[#0d1a2e]">
            <span className="block text-[10px] uppercase tracking-wide text-[#91a2b8]">Modules this role can access</span>
            <div className="mt-2 flex flex-wrap gap-1.5">{permissionsForRole(form.role).map((key) => <span key={key} className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-[#3e5d83] shadow-sm dark:bg-[#101f38] dark:text-[#90a5c4]">{PERMISSION_LABELS[key] || key}</span>)}</div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#edf2f7] p-4 sm:flex-row sm:justify-end dark:border-[#1b2c46]">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#dfe8f4] px-4 text-xs font-semibold text-[#5f7695]">Cancel</button>
          <button type="button" disabled={saving || !form.name.trim() || !form.email.trim()} onClick={() => onSave(form)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3478f6] px-4 text-xs font-semibold text-white disabled:opacity-50">{saving && <RefreshCw size={14} className="animate-spin" />}Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AccessControl() {
  const [team, setTeam] = useState(fallbackTeam);
  const [auditLog, setAuditLog] = useState(fallbackAuditLog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const permissionRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await getAccessControlApi({}, controller.signal);
        const payload = response?.data ?? response;
        if (payload?.users?.length) setTeam(payload.users);
        if (payload?.auditLog?.length) setAuditLog(payload.auditLog);
        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") return;
        setError("Live access-control data unavailable. Showing demo data.");
      } finally { setLoading(false); }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedRole) return undefined;
    const closeOnOutside = (event) => {
      if (permissionRef.current && !permissionRef.current.contains(event.target)) setSelectedRole(null);
    };
    const closeOnEscape = (event) => event.key === "Escape" && setSelectedRole(null);
    document.addEventListener("click", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("click", closeOnOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [selectedRole]);

  const roleCounts = useMemo(() => Object.fromEntries(ACCESS_CONTROL_ROLES.map((role) => [role, team.filter((member) => member.role === role).length])), [team]);

  const handleRoleClick = (role) => setSelectedRole((current) => current === role ? null : role);

  const handleAdd = async (form) => {
    setSaving(true);
    try { await createAccessControlApi(form); } catch {}
    const initials = form.name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
    setTeam((prev) => [...prev, { id: `ADM-${Date.now()}`, name: form.name.trim(), email: form.email.trim(), role: form.role, status: form.status, lastActive: "Just now", initials: initials || "AD", avatar: ["blue", "purple", "orange", "teal", "pink"][prev.length % 5] }]);
    setSaving(false); setAddOpen(false);
  };

  const handleEditSave = async (form) => {
    setSaving(true);
    try { await updateAccessControlApi(editMember.id, form); } catch {}
    setTeam((prev) => prev.map((member) => member.id === editMember.id ? { ...member, ...form } : member));
    setSaving(false); setEditMember(null);
  };

  const handleRemove = async (member) => {
    if (member.role === "superAdmin") return;
    if (!window.confirm(`Remove ${member.name} from the admin team?`)) return;
    try { await deleteAccessControlApi(member.id); } catch {}
    setTeam((prev) => prev.filter((item) => item.id !== member.id));
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2"><h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] sm:text-[29px] dark:text-white">Role-Based Access Control</h1>{error && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600">Demo data</span>}</div><p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">Manage admin team members, module access and sensitive actions.</p></div>
        <button type="button" onClick={() => setAddOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={16} />Add Admin</button>
      </div>

      <section className="mb-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {ACCESS_CONTROL_ROLES.map((role) => { const meta = ROLE_META[role]; const isSelected = selectedRole === role; return <button key={role} type="button" aria-expanded={isSelected} onClick={() => handleRoleClick(role)} className={`min-w-0 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[#101f38] ${isSelected ? `border-transparent ring-2 ring-inset ${meta.ring}` : "border-[#dce9f7] dark:border-[#223250]"}`}><div className="flex items-start justify-between gap-2"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>{meta.label}</span><span className="text-[10px] text-[#8ca0b7]">{isSelected ? "Close" : "View"}</span></div><div className="mt-2 text-xs text-[#64809f] dark:text-[#90a5c4]">{moduleCountForRole(role)} modules</div><div className="mt-0.5 text-[10px] text-[#93a8c2]">{roleCounts[role] || 0} admin{roleCounts[role] === 1 ? "" : "s"}</div></button>; })}
      </section>

      {selectedRole && <section ref={permissionRef} className="mb-4 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex items-center gap-2"><RoleBadge role={selectedRole} /><span className="text-sm font-semibold text-[#112f55] dark:text-white">Module permissions</span></div><span className="text-[11px] text-[#7d93b3] sm:ml-auto">{ROLE_META[selectedRole].description}</span><button type="button" onClick={() => setSelectedRole(null)} className="grid h-8 w-8 self-end place-items-center rounded-lg border border-slate-200 text-slate-500 sm:self-auto"><X size={15} /></button></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{permissionsForRole(selectedRole).map((key) => <div key={key} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><Check size={14} /><span className="truncate">{PERMISSION_LABELS[key] || key}</span></div>)}</div>
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-[#1b2c46]"><p className="m-0 text-[10px] font-bold uppercase tracking-wide text-[#8ca0b7]">Sensitive / role actions</p><div className="mt-2 flex flex-wrap gap-2">{ROLE_ACTIONS[selectedRole].map((action) => <span key={action} className="rounded-lg border border-[#dce9f7] bg-[#f8faff] px-3 py-2 text-[10px] font-semibold text-[#456789] dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#9bb0ca]">✓ {action}</span>)}</div></div>
        <p className="mt-3 text-[10px] text-[#8ca0b7]">Click the same role again, click anywhere outside this panel, or press Escape to close.</p>
      </section>}

      <section className="mb-4 overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <div className="flex items-center justify-between border-b border-[#edf2f7] px-4 py-3 dark:border-[#1b2c46]"><h2 className="m-0 text-sm font-bold text-[#112f55] dark:text-white">Admin Team ({team.length})</h2>{loading && <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><RefreshCw size={12} className="animate-spin" />Loading...</span>}</div>
        <div className="hidden overflow-x-auto lg:block"><table className="w-full table-fixed border-collapse"><thead><tr className="bg-[#f2f7fc] text-left text-[10px] font-semibold text-[#426287]"><th className="w-[24%] px-3 py-3">MEMBER</th><th className="w-[26%] px-3 py-3">EMAIL</th><th className="w-[16%] px-3 py-3">ROLE</th><th className="w-[13%] px-3 py-3">STATUS</th><th className="w-[13%] px-3 py-3">LAST ACTIVE</th><th className="w-[8%] px-3 py-3">ACTIONS</th></tr></thead><tbody>{team.map((member) => <tr key={member.id} className="border-b border-slate-100 text-[11px] text-[#274c76] last:border-0"><td className="px-3 py-3"><div className="flex min-w-0 items-center gap-2"><AdminAvatar member={member} /><span className="truncate font-semibold">{member.name}</span></div></td><td className="truncate px-3 py-3 text-[#5f7695]">{member.email}</td><td className="px-3 py-3"><RoleBadge role={member.role} /></td><td className="px-3 py-3"><StatusPill status={member.status} /></td><td className="truncate px-3 py-3 text-[#5f7695]">{member.lastActive}</td><td className="px-3 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => setEditMember(member)} className="text-[11px] font-semibold text-blue-600 hover:underline">Edit</button>{member.role !== "superAdmin" && <button type="button" onClick={() => handleRemove(member)} className="text-[11px] font-semibold text-rose-500 hover:underline">Remove</button>}</div></td></tr>)}</tbody></table></div>
        <div className="grid gap-2 p-3 lg:hidden">{team.map((member) => <article key={member.id} className="min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm dark:border-[#1b2c46]"><div className="flex min-w-0 items-center gap-3"><AdminAvatar member={member} /><div className="min-w-0 flex-1"><p className="m-0 truncate text-xs font-semibold text-slate-800 dark:text-white">{member.name}</p><p className="m-0 truncate text-[10px] text-slate-500">{member.email}</p></div><button aria-label={`Actions for ${member.name}`} onClick={() => setEditMember(member)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-[#223250] dark:bg-[#0d1a2e]"><MoreHorizontal size={18} /></button></div><div className="mt-3 flex flex-wrap items-center gap-2"><RoleBadge role={member.role} /><StatusPill status={member.status} /><span className="text-[10px] text-slate-400">{member.lastActive}</span></div><div className="mt-3 flex gap-3 border-t border-slate-100 pt-2 dark:border-[#1b2c46]"><button onClick={() => setEditMember(member)} className="text-[11px] font-semibold text-blue-600">Edit</button>{member.role !== "superAdmin" && <button onClick={() => handleRemove(member)} className="text-[11px] font-semibold text-rose-500">Remove</button>}</div></article>)}</div>
      </section>

      <section className="rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-blue-600" /><h2 className="m-0 text-sm font-bold text-[#112f55] dark:text-white">Access Audit Trail</h2></div><div className="space-y-2">{auditLog.map((entry) => <div key={entry.id} className="grid gap-1 rounded-lg bg-[#f8faff] p-3 text-[10px] sm:grid-cols-[1fr_1fr_auto] sm:items-center dark:bg-[#0d1a2e]"><div><strong className="text-[#294d75] dark:text-white">{entry.actor}</strong><span className="mx-1 text-slate-400">→</span><span className="text-[#587492]">{entry.action}</span></div><div className="text-[#7d93ad]">Target: {entry.target}</div><time className="text-[#91a2b8] sm:text-right">{entry.date}</time></div>)}</div></section>

      {addOpen && <AdminFormModal title="Add Admin" onClose={() => setAddOpen(false)} onSave={handleAdd} saving={saving} />}
      {editMember && <AdminFormModal title={`Edit ${editMember.name}`} initial={editMember} onClose={() => setEditMember(null)} onSave={handleEditSave} saving={saving} />}
    </AdminLayout>
  );
}
