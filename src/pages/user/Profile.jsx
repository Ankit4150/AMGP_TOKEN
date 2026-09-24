import React, { useEffect, useMemo, useState } from "react";
import { useManualMutation, useManualQuery, useManualQueryClient } from "../../hooks/manualQuery";
import { CheckCircle2, ChevronDown, Edit3, Globe2, KeyRound, Mail, MapPin, Phone, Save, ShieldCheck, UserRound, X } from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import Dropdown from "../../components/ui/Dropdown";
import { getProfileApi, updateProfileApi } from "../../services/user/profileApi";

const countries=["United States","India","United Kingdom","UAE","Singapore","Malaysia","Germany","Australia"];
const timezones=["Asia/Kolkata","Asia/Kuala_Lumpur","UTC","Europe/London","America/New_York"];
const languages=["English","Hindi","Malay"];

function initials(profile){
  return `${profile?.firstName?.[0]||""}${profile?.lastName?.[0]||""}`.toUpperCase() || "U";
}

function Field({label,icon:Icon,children,help}){
  return <label className="block">
    <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#60738d] dark:text-slate-300">{Icon&&<Icon size={14}/>} {label}</span>
    {children}
    {help&&<span className="mt-1 block text-[11px] text-[#8a9ab0]">{help}</span>}
  </label>;
}

const inputClass="h-11 w-full rounded-xl border border-[#dfe7f1] bg-white px-3.5 text-sm font-medium text-[#20364f] outline-none transition placeholder:text-[#9aa9ba] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-[#2b3c58] dark:bg-[#101f38] dark:text-slate-100";

export default function Profile(){
  const queryClient=useManualQueryClient();
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({});
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const query=useManualQuery({
    queryKey:["user-profile"],
    queryFn:({signal})=>getProfileApi(signal),
  });

  const profile=query.data?.data || query.data || {};
  useEffect(()=>{ if(profile?.id) setForm({firstName:profile.firstName||"",lastName:profile.lastName||"",phone:profile.phone||"",country:profile.country||"",timezone:profile.timezone||"",language:profile.language||""}); },[profile?.id]);

  const mutation=useManualMutation({
    mutationFn:(payload)=>updateProfileApi(payload),
    onSuccess:(response)=>{ queryClient.setQueryData(["user-profile"],response); setEditing(false); setMessage("Profile updated successfully."); setError(""); setTimeout(()=>setMessage(""),3000); },
    onError:(err)=>setError(err?.message||"Unable to update profile."),
  });

  const stats=useMemo(()=>[
    ["Account Status",profile.accountStatus||"Active","Active"],
    ["KYC Status",profile.kycStatus||"Pending",profile.kycStatus||"Pending"],
    ["2FA",profile.twoFA||"Disabled",profile.twoFA||"Disabled"],
  ],[profile]);

  const startEdit=()=>{setError("");setMessage("");setEditing(true);};
  const cancelEdit=()=>{setEditing(false);setError("");setForm({firstName:profile.firstName||"",lastName:profile.lastName||"",phone:profile.phone||"",country:profile.country||"",timezone:profile.timezone||"",language:profile.language||""});};
  const save=()=>{
    if(!form.firstName?.trim() || !form.lastName?.trim()) return setError("First name and last name are required.");
    if(!form.phone?.trim()) return setError("Phone number is required.");
    mutation.mutate(form);
  };

  if(query.isLoading) return <UserLayout><div className="animate-pulse space-y-5"><div className="h-8 w-40 rounded bg-slate-200"/><div className="h-40 rounded-2xl bg-white"/><div className="h-80 rounded-2xl bg-white"/></div></UserLayout>;
  if(query.isError) return <UserLayout><div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600">Unable to load your profile. <button className="font-semibold underline" onClick={()=>query.refetch()}>Retry</button></div></UserLayout>;

  return <UserLayout>
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="text-2xl font-bold text-[#112e52] dark:text-white sm:text-[29px]">My Profile</h1><p className="mt-1 text-sm text-[#3e5d83] dark:text-slate-400">Manage your personal information and account details.</p></div>
      {!editing ? <button onClick={startEdit} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"><Edit3 size={16}/> Edit Profile</button> : <div className="flex gap-2"><button onClick={cancelEdit} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dce5f0] bg-white px-4 text-sm font-semibold text-[#405671]"><X size={16}/> Cancel</button><button disabled={mutation.isPending} onClick={save} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white disabled:opacity-60"><Save size={16}/> {mutation.isPending?"Saving...":"Save Changes"}</button></div>}
    </div>

    {message&&<div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 size={17}/>{message}</div>}
    {error&&<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

    <section className="overflow-hidden rounded-2xl border border-[#dce7f3] bg-white shadow-sm dark:border-[#233852] dark:bg-[#0d1c32]">
      <div className="bg-gradient-to-r from-[#072746] to-[#0b4d86] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white/20 bg-white/10 text-2xl font-bold backdrop-blur">{initials(profile)}</div><div><h2 className="text-xl font-bold">{profile.name}</h2><p className="mt-1 text-sm text-blue-100">{profile.email}</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">{profile.accountStatus}</span><span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100">{profile.plan}</span></div></div></div>
          <div className="text-left sm:text-right"><p className="text-xs text-blue-200">Member since</p><p className="mt-1 font-semibold">{profile.memberSince}</p><p className="mt-3 text-xs text-blue-200">Last login</p><p className="mt-1 text-sm font-medium">{profile.lastLogin}</p></div>
        </div>
      </div>
      <div className="grid gap-3 border-t border-[#e7edf5] p-4 sm:grid-cols-3 sm:p-5 dark:border-[#233852]">
        {stats.map(([label,value,display])=><div key={label} className="flex items-center justify-between rounded-xl bg-[#f7faff] px-4 py-3 dark:bg-[#12223b]"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#8394aa]">{label}</p><p className="mt-1 text-sm font-bold text-[#18334f] dark:text-white">{display}</p></div><CheckCircle2 size={18} className="text-emerald-500"/></div>)}
      </div>
    </section>

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
      <section className="rounded-2xl border border-[#dce7f3] bg-white p-5 shadow-sm dark:border-[#233852] dark:bg-[#0d1c32] sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-bold text-[#18334f] dark:text-white">Personal Information</h3><p className="mt-1 text-xs text-[#8292a8]">Only editable fields can be changed from your account.</p></div><UserRound size={20} className="text-blue-500"/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name"><input disabled={!editing} className={inputClass} value={form.firstName||""} onChange={e=>setForm({...form,firstName:e.target.value})}/></Field>
          <Field label="Last Name"><input disabled={!editing} className={inputClass} value={form.lastName||""} onChange={e=>setForm({...form,lastName:e.target.value})}/></Field>
          <Field label="Email" icon={Mail} help="Email is protected and cannot be changed here."><input disabled className={`${inputClass} cursor-not-allowed bg-slate-50`} value={profile.email||""}/></Field>
          <Field label="Phone" icon={Phone}><input disabled={!editing} className={inputClass} value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/></Field>
          <Field label="Country" icon={MapPin}><Dropdown value={form.country} onChange={v=>setForm({...form,country:v})} options={countries.map(x=>({value:x,label:x}))} disabled={!editing} fullWidth/></Field>
          <Field label="Timezone" icon={Globe2}><Dropdown value={form.timezone} onChange={v=>setForm({...form,timezone:v})} options={timezones.map(x=>({value:x,label:x}))} disabled={!editing} fullWidth/></Field>
          <Field label="Language"><Dropdown value={form.language} onChange={v=>setForm({...form,language:v})} options={languages.map(x=>({value:x,label:x}))} disabled={!editing} fullWidth/></Field>
        </div>
      </section>

      <div className="space-y-5">
        <section className="rounded-2xl border border-[#dce7f3] bg-white p-5 shadow-sm dark:border-[#233852] dark:bg-[#0d1c32]">
          <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10"><ShieldCheck size={20}/></div><div><h3 className="font-bold text-[#18334f] dark:text-white">Verification</h3><p className="text-xs text-[#8292a8]">Account verification status</p></div></div>
          <div className="space-y-3"><div className="flex items-center justify-between rounded-xl bg-[#f7faff] p-3 dark:bg-[#12223b]"><span className="text-sm text-[#536b85] dark:text-slate-300">Email</span><span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 size={14}/> Verified</span></div><div className="flex items-center justify-between rounded-xl bg-[#f7faff] p-3 dark:bg-[#12223b]"><span className="text-sm text-[#536b85] dark:text-slate-300">Phone</span><span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 size={14}/> Verified</span></div><div className="flex items-center justify-between rounded-xl bg-[#f7faff] p-3 dark:bg-[#12223b]"><span className="text-sm text-[#536b85] dark:text-slate-300">KYC</span><span className="text-xs font-bold text-emerald-600">{profile.kycStatus}</span></div></div>
        </section>
        <section className="rounded-2xl border border-[#dce7f3] bg-white p-5 shadow-sm dark:border-[#233852] dark:bg-[#0d1c32]"><div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10"><KeyRound size={20}/></div><div><h3 className="font-bold text-[#18334f] dark:text-white">Account & Wallet</h3><p className="text-xs text-[#8292a8]">Read-only account information</p></div></div><div className="space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-[#7b8da4]">User ID</span><b className="text-[#29435e] dark:text-slate-100">{profile.id}</b></div><div className="flex justify-between gap-3"><span className="text-[#7b8da4]">Network</span><b className="text-[#29435e] dark:text-slate-100">{profile.network}</b></div><div><span className="text-[#7b8da4]">Primary wallet</span><p className="mt-1 break-all rounded-lg bg-[#f7faff] p-2 text-xs font-semibold text-[#29435e] dark:bg-[#12223b] dark:text-slate-200">{profile.walletAddress}</p></div><div className="flex justify-between gap-3"><span className="text-[#7b8da4]">USDT Balance</span><b className="text-[#18334f] dark:text-white">{profile.usdtBalance} USDT</b></div><div className="flex justify-between gap-3"><span className="text-[#7b8da4]">AMGP Balance</span><b className="text-[#18334f] dark:text-white">{profile.tokenBalance}</b></div></div></section>
      </div>
    </div>
  </UserLayout>;
}
