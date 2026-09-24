import {adminStats,transactions,userDashboardStats} from "../data/mockData";import {userDirectory,computeUserStats} from "./data/userDirectory";import {login as mockLogin,me as mockMe,logout as mockLogout} from "./mockAuth";import {kyc, kycStats, getKycById} from "./data/kyc";import {investments} from "./data/investments";import {investmentPackages,investmentPackageStats} from "./data/investmentPackages";import {roi} from "./data/roi";import {tokens, tokenSummary, tokenOverview, tokenPrice, tokenWallets, tokenBuyback, tokenLiquidity} from "./data/tokens";import {buybacks, buybackSummary, buybackSettings} from "./data/buybacks";import {withdrawals} from "./data/withdrawals";import {wallets, walletSummary, treasuryWallets} from "./data/wallets";import {notifications, notificationTemplates, NOTIFICATION_EVENTS} from "./data/notifications";import {auditLogs, AUDIT_MODULES, AUDIT_ROLES} from "./data/auditLogs";import {deposits} from "./data/deposits";import {reports} from "./data/reports";import {reconciliation} from "./data/reconciliation";import {settings} from "./data/settings";import {profile} from "./data/profile";import {securityState, securitySessions, securityActivity} from "./data/security";import {adminTeam,accessAuditLog} from "./data/accessControl";import {adminTransactions} from "./data/adminTransactions";import {userDashboard} from "./data/dashboard";import {userWallets, userWalletSummary} from "./data/userWallet";import {userKycRecord} from "./data/userKyc";const map={"/admin/dashboard":{stats:adminStats,transactions},"/user/dashboard":userDashboard,"/admin/kyc":{items:kyc},"/admin/investments":{items:investmentPackages,stats:investmentPackageStats},"/admin/roi":{items:roi},"/admin/tokens":{items:tokens,summary:tokenSummary,token:tokenOverview,price:tokenPrice,wallets:tokenWallets,buyback:tokenBuyback,liquidity:tokenLiquidity},"/admin/buybacks":{items:buybacks,summary:buybackSummary,settings:buybackSettings},"/admin/withdrawals":{items:withdrawals},"/admin/transactions":{items:adminTransactions},"/admin/wallets":{items:wallets,summary:walletSummary,treasuryWallets},"/admin/notifications":{items:notifications},"/admin/audit-logs":{items:auditLogs},"/admin/reports":{items:reports},"/admin/reconciliation":{items:reconciliation},"/admin/settings":{items:settings},"/admin/access-control":{users:adminTeam,auditLog:accessAuditLog},"/user/deposits":{items:deposits},"/user/investments":{items:investments},"/user/roi":{items:roi},"/user/tokens":{items:tokens},"/user/buybacks":{items:buybacks},"/user/withdrawals":{items:withdrawals},"/user/transactions":{items:transactions},"/user/wallet":{items:userWallets,summary:userWalletSummary},"/user/notifications":{items:notifications},"/user/profile":{items:profile},"/user/security":{settings:securityState,sessions:securitySessions,activity:securityActivity},"/user/kyc":{items:kyc}};const clone=x=>JSON.parse(JSON.stringify(x));const delay=ms=>new Promise(r=>setTimeout(r,ms));
const transactionStore = adminTransactions.map(clone);
const investmentStore = investments.map(clone);
const userKycStore = clone(userKycRecord);
const userProfileStore = clone(profile);
const userSecurityState = clone(securityState);
const userSecuritySessions = clone(securitySessions);
const userSecurityActivity = clone(securityActivity);
let userKycSeq = 0;
const userStore = userDirectory.map(clone);
let userSeq = userStore.length;
function userPayload(items, params = {}) {
  const q = String(params.search || "").trim().toLowerCase();
  let list = [...items];
  if (q) list = list.filter(x => JSON.stringify(x).toLowerCase().includes(q));
  if (params.status && params.status !== "all") list = list.filter(x => String(x.account).toLowerCase() === String(params.status).toLowerCase());
  if (params.kyc && params.kyc !== "all") list = list.filter(x => String(x.kyc).toLowerCase() === String(params.kyc).toLowerCase());
  if (params.plan && params.plan !== "all") list = list.filter(x => String(x.plan) === String(params.plan));
  if (params.country && params.country !== "all") list = list.filter(x => String(x.country) === String(params.country));
  const total = list.length;
  const limit = Math.max(1, Number(params.limit) || 10);
  const page = Math.max(1, Number(params.page) || 1);
  return { users: list.slice((page - 1) * limit, page * limit), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
const auditLogStore = auditLogs.map(clone);
function auditLogPayload(items, params = {}) {
  const q = String(params.search || "").trim().toLowerCase();
  let list = [...items];
  if (q) list = list.filter(x => JSON.stringify(x).toLowerCase().includes(q));
  if (params.module && params.module !== "all") list = list.filter(x => String(x.module) === String(params.module));
  if (params.role && params.role !== "all") list = list.filter(x => String(x.role) === String(params.role));
  if (params.status && params.status !== "all") list = list.filter(x => String(x.status).toLowerCase() === String(params.status).toLowerCase());
  if (params.date && params.date !== "all") {
    const stamps = list.map(x => Date.parse(String(x.createdAt || "").replace(" MYT", "").replace(",", ""))).filter(Number.isFinite);
    const now = stamps.length ? Math.max(...stamps) : Date.now();
    const days = params.date === "Today" ? 1 : params.date === "Last 7 Days" ? 7 : 30;
    list = list.filter(x => {
      const stamp = Date.parse(String(x.createdAt || "").replace(" MYT", "").replace(",", ""));
      return Number.isNaN(stamp) ? true : (now - stamp) <= days * 24 * 60 * 60 * 1000;
    });
  }
  const total = list.length;
  const limit = Math.max(1, Number(params.limit) || 10);
  const page = Math.max(1, Number(params.page) || 1);
  return { items: list.slice((page - 1) * limit, page * limit), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
function auditLogStats(items) {
  const total = items.length;
  const critical = items.filter(x => ["Critical", "Financial"].includes(x.severity)).length;
  const failed = items.filter(x => x.status === "Failed").length;
  const flagged = items.filter(x => x.status === "Flagged").length;
  const todayKey = items.length ? String(items[0].createdAt || "").slice(0, 11) : "";
  const today = todayKey ? items.filter(x => String(x.createdAt || "").startsWith(todayKey)).length : 0;
  return [
    { label: "Total Actions Logged", value: total.toLocaleString(), change: "—", tone: "blue", icon: "withdrawal" },
    { label: "Financial / Critical", value: critical.toLocaleString(), change: `${total ? ((critical / total) * 100).toFixed(1) : "0.0"}%`, tone: "purple", icon: "token" },
    { label: "Failed Actions", value: failed.toLocaleString(), change: `${total ? ((failed / total) * 100).toFixed(1) : "0.0"}%`, tone: "red", direction: "down", icon: "failed" },
    { label: "Flagged for Review", value: flagged.toLocaleString(), change: "—", tone: "yellow", icon: "pending" },
    { label: "Actions Today", value: today.toLocaleString(), change: "—", tone: "green", direction: "up", icon: "verified" },
  ];
}
const withdrawalStore = withdrawals.map(clone);
const userWithdrawalStore = withdrawals.slice(0, 6).map((x, i) => ({ ...clone(x), user: "Current User", email: "current.user@example.com", id: `UWDR-${String(i + 1).padStart(3, "0")}`, method: i % 2 ? "card" : "bank", accountName: "Current User", accountNumber: i % 2 ? "Card-linked payout •••• 4821" : "Bank account •••• 2190", fee: ["6.20", "20.00", "80.00", "50.00", "10.00", "100.00"][i] || "0.00", received: ["613.80", "1,980.00", "7,920.00", "4,950.00", "990.00", "9,900.00"][i] || x.amount }));
const notificationStore = notifications.map(clone);
const notificationTemplateStore = notificationTemplates.map(clone);
const userNotificationStore = notifications.slice(0, 24).map((item, index) => ({
  ...clone(item),
  id: `USER-${String(index + 1).padStart(4, "0")}`,
  user: "John Smith",
  email: "user@example.com",
  read: index > 2,
}));
function eventMeta(eventKey){ return NOTIFICATION_EVENTS.find(e=>e.key===eventKey) || {}; }
function notificationPayload(items, params = {}) {
  const q = String(params.search || "").trim().toLowerCase();
  let list = [...items];
  if (q) list = list.filter(x => JSON.stringify(x).toLowerCase().includes(q));
  if (params.status && params.status !== "all") list = list.filter(x => String(x.status).toLowerCase() === String(params.status).toLowerCase());
  if (params.eventType && params.eventType !== "all") list = list.filter(x => x.eventKey === params.eventType);
  if (params.channel && params.channel !== "all") list = list.filter(x => (x.channels||[]).includes(params.channel));
  if (params.date && params.date !== "all") {
    const stamps = list.map(x => Date.parse(String(x.createdAt||"").replace(",", ""))).filter(Number.isFinite);
    const now = stamps.length ? Math.max(...stamps) : Date.now();
    const days = params.date === "Today" ? 1 : params.date === "Last 7 Days" ? 7 : 30;
    list = list.filter(x => {
      const stamp = Date.parse(String(x.createdAt||"").replace(",", ""));
      return Number.isNaN(stamp) ? true : (now - stamp) <= days*24*60*60*1000;
    });
  }
  list = [...list].sort((a,b) => (Date.parse(String(b.createdAt||"").replace(",", ""))||0) - (Date.parse(String(a.createdAt||"").replace(",", ""))||0));
  const total = list.length;
  const limit = Math.max(1, Number(params.limit) || 10);
  const page = Math.max(1, Number(params.page) || 1);
  return { items: list.slice((page-1)*limit, page*limit), total, page, limit, totalPages: Math.max(1, Math.ceil(total/limit)) };
}
function userNotificationPayload(items, params = {}) {
  const q = String(params.search || "").trim().toLowerCase();
  let list = [...items];
  if (q) list = list.filter(x => JSON.stringify(x).toLowerCase().includes(q));
  if (params.eventType && params.eventType !== "all") list = list.filter(x => x.eventKey === params.eventType);
  if (params.readStatus && params.readStatus !== "all") {
    const wantUnread = params.readStatus === "unread";
    list = list.filter(x => wantUnread ? !x.read : !!x.read);
  }
  list.sort((a, b) => (Date.parse(String(b.createdAt || "").replace(",", "")) || 0) - (Date.parse(String(a.createdAt || "").replace(",", "")) || 0));
  const total = list.length;
  const limit = Math.max(1, Number(params.limit) || 10);
  const page = Math.max(1, Number(params.page) || 1);
  const todayKey = list[0]?.createdAt ? String(list[0].createdAt).slice(0, 11) : "";
  const today = todayKey ? list.filter(x => String(x.createdAt || "").startsWith(todayKey)).length : 0;
  const unread = list.filter(x => !x.read).length;
  const important = list.filter(x => ["withdrawal_failed", "withdrawal_requested", "buyback_initiated"].includes(x.eventKey)).length;
  const eventCounts = list.reduce((acc, item) => { acc[item.eventKey] = (acc[item.eventKey] || 0) + 1; return acc; }, {});
  return {
    items: list.slice((page - 1) * limit, page * limit),
    total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)),
    stats: { total: items.length, unread: items.filter(x => !x.read).length, today, important },
    eventCounts,
  };
}

function notificationStats(items) {
  const total = items.length;
  const delivered = items.filter(x => x.status === "Delivered").length;
  const failed = items.filter(x => x.status === "Failed").length;
  const pending = items.filter(x => x.status === "Pending").length;
  const partial = items.filter(x => x.status === "Partially Delivered").length;
  const multiChannel = items.filter(x => (x.channels||[]).length > 1).length;
  return [
    {label:"Total Notifications",value:total.toLocaleString(),change:"—",tone:"blue",icon:"withdrawal"},
    {label:"Delivered",value:delivered.toLocaleString(),change:`${total ? ((delivered/total)*100).toFixed(1) : "0.0"}%`,tone:"green",direction:"up",icon:"verified"},
    {label:"Failed",value:failed.toLocaleString(),change:`${total ? ((failed/total)*100).toFixed(1) : "0.0"}%`,tone:"red",direction:"down",icon:"failed"},
    {label:"Pending / Partial",value:(pending+partial).toLocaleString(),change:"—",tone:"yellow",icon:"pending"},
    {label:"Multi-Channel Sends",value:multiChannel.toLocaleString(),change:`${total ? ((multiChannel/total)*100).toFixed(1) : "0.0"}%`,tone:"purple",icon:"token"},
  ];
}
function withdrawalPayload(items, params = {}) {
  const q = String(params.search || "").trim().toLowerCase();
  let list = [...items];
  if (q) list = list.filter(x => JSON.stringify(x).toLowerCase().includes(q));
  if (params.status && params.status !== "all") list = list.filter(x => String(x.status).toLowerCase() === String(params.status).toLowerCase());
  if (params.network && params.network !== "all") list = list.filter(x => String(x.network).toLowerCase() === String(params.network).toLowerCase());
  if (params.currency && params.currency !== "all") list = list.filter(x => String(x.currency).toLowerCase() === String(params.currency).toLowerCase());
  const total = list.length;
  const limit = Math.max(1, Number(params.limit) || 10);
  const page = Math.max(1, Number(params.page) || 1);
  return { items:list.slice((page-1)*limit, page*limit), total, page, limit, totalPages:Math.max(1, Math.ceil(total/limit)) };
}
function withdrawalStats(items) {
  const total = items.length;
  const pending = items.filter(x => ["pending","processing"].includes(String(x.status).toLowerCase())).length;
  const approved = items.filter(x => ["approved","completed"].includes(String(x.status).toLowerCase())).length;
  const rejected = items.filter(x => String(x.status).toLowerCase() === "rejected").length;
  const amount = items.reduce((sum,x) => sum + Number(String(x.value || x.amount || "0").replace(/,/g,"").replace(/[^0-9.]/g,"")) || 0, 0);
  return [
    {label:"Total Withdrawals",value:total.toLocaleString(),change:"12.5%",tone:"blue",direction:"up",icon:"withdrawal"},
    {label:"Pending",value:pending.toLocaleString(),change:`${total ? ((pending/total)*100).toFixed(1) : "0.0"}%`,tone:"yellow",direction:"up",icon:"pending"},
    {label:"Approved",value:approved.toLocaleString(),change:`${total ? ((approved/total)*100).toFixed(1) : "0.0"}%`,tone:"green",direction:"up",icon:"verified"},
    {label:"Rejected",value:rejected.toLocaleString(),change:`${total ? ((rejected/total)*100).toFixed(1) : "0.0"}%`,tone:"red",direction:"down",icon:"failed"},
    {label:"Total Amount",value:`${amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USDT`,change:"8.7%",tone:"purple",direction:"up",icon:"investment"},
  ];
}
function transactionPayload(items, params = {}) {
  const q=String(params.search||"").trim().toLowerCase();
  let list=[...items];
  if(q) list=list.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
  if(params.status && params.status!=="all") list=list.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
  if(params.type && params.type!=="all") list=list.filter(x=>String(x.type).toLowerCase()===String(params.type).toLowerCase());
  if(params.wallet && params.wallet!=="all") list=list.filter(x=>x.wallet===params.wallet);
  if(params.date && params.date!=="all"){
    const stamps=list.map(x=>Date.parse(String(x.createdAt||""))).filter(Number.isFinite);
    const now=stamps.length ? Math.max(...stamps) : Date.now();
    const days=params.date==="Today"?1:params.date==="Last 7 Days"?7:30;
    list=list.filter(x=>{
      const stamp=Date.parse(String(x.createdAt||""));
      return Number.isNaN(stamp) ? true : (now-stamp) <= days*24*60*60*1000;
    });
  }
  const total=list.length; const limit=Math.max(1,Number(params.limit)||10); const page=Math.max(1,Number(params.page)||1);
  return {items:list.slice((page-1)*limit,page*limit),total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))};
}
const cleanUrlSafe=(url)=>String(url||"").replace(/\/$/,"").split("?")[0];
export async function mockRequest({method="get",url,data,params={},signal}){
  if(signal?.aborted)throw new DOMException("Request aborted","AbortError");
  await delay(140);
  if(signal?.aborted)throw new DOMException("Request aborted","AbortError");

  const m=method.toLowerCase();
  if(url==="/auth/login"&&m==="post")return mockLogin(data?.email,data?.password);
  if(url==="/auth/me"&&m==="get")return mockMe();
  if(url==="/auth/logout"&&m==="post")return mockLogout();
  if(cleanUrlSafe(url)==="/admin/users" || /^\/admin\/users\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/admin\/users\/([^/]+)$/); const rawId=match?.[1]; const id=rawId?decodeURIComponent(rawId):undefined;
    if(m==="get" && id){ const item=userStore.find(x=>x.id===id); if(!item) throw Object.assign(new Error("User not found"),{status:404}); return {success:true,data:clone(item)}; }
    if(m==="get"){ const payload=userPayload(userStore,params); return {success:true,data:{...payload,stats:computeUserStats(userStore)}}; }
    if(m==="post"){
      userSeq+=1;
      const initials=String(data?.name||"New User").trim().split(/\s+/).map(p=>p[0]).slice(0,2).join("").toUpperCase()||"NA";
      const avatars=["blue","purple","orange","teal","pink","violet"];
      const item={
        id:data?.id||`#USR${String(userSeq).padStart(4,"0")}`,
        initials,
        name:data?.name||"New User",
        email:data?.email||"user@example.com",
        phone:data?.phone||"-",
        country:data?.country||"United States",
        kyc:data?.kyc||"Not Submitted",
        kycVerificationId:data?.kycVerificationId||"-",
        account:data?.account||"Active",
        plan:data?.plan||"Starter Plan",
        role:"User",
        walletAddress:data?.walletAddress||"-",
        network:data?.network||"BEP-20",
        usdtBalance:data?.usdtBalance||"0.00",
        tokenBalance:data?.tokenBalance||"0",
        totalInvested:data?.totalInvested||"0.00",
        totalRoiPaid:data?.totalRoiPaid||"0.00",
        totalWithdrawn:data?.totalWithdrawn||"0.00",
        totalBuybacks:data?.totalBuybacks||"0.00",
        twoFA:data?.twoFA||"Disabled",
        date:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),
        lastLogin:"-",
        avatar:avatars[userStore.length%avatars.length],
        notes:data?.notes||"",
      };
      userStore.unshift(item); return {success:true,data:clone(item)};
    }
    if((m==="patch"||m==="put")&&id){
      const idx=userStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("User not found"),{status:404});
      const next={...userStore[idx],...(data||{})};
      if(data?.name && data.name!==userStore[idx].name){
        next.initials=String(data.name).trim().split(/\s+/).map(p=>p[0]).slice(0,2).join("").toUpperCase()||next.initials;
      }
      userStore[idx]=next; return {success:true,data:clone(userStore[idx])};
    }
    if(m==="delete"&&id){
      const idx=userStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("User not found"),{status:404});
      const [removed]=userStore.splice(idx,1); return {success:true,data:clone(removed)};
    }
  }

  if(cleanUrlSafe(url)==="/admin/withdrawals" || /^\/admin\/withdrawals\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/admin\/withdrawals\/([^/]+)$/); const id=match?.[1];
    if(m==="get" && id){ const item=withdrawalStore.find(x=>x.id===id); if(!item) throw Object.assign(new Error("Withdrawal not found"),{status:404}); return {success:true,data:clone(item)}; }
    if(m==="get") { const payload=withdrawalPayload(withdrawalStore,params); return {success:true,data:{...payload,stats:withdrawalStats(withdrawalStore)}}; }
    if(m==="post"){
      const item={id:data?.id||`WDR-${String(Date.now()).slice(-6)}`,txId:data?.txId||`TX-${String(Date.now()).slice(-6)}`,user:data?.user||"New User",email:data?.email||"user@example.com",wallet:data?.wallet||"User Wallet",network:data?.network||"BEP-20",currency:data?.currency||"USDT",amount:data?.amount||"0.00",tokenPrice:data?.tokenPrice||"0.50",value:data?.value||data?.amount||"0.00",status:data?.status||"Pending",address:data?.address||"-",txHash:data?.txHash||"-",confirmations:Number(data?.confirmations)||0,blockNumber:data?.blockNumber||"-",requestedAt:data?.requestedAt||new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}),processedAt:data?.processedAt||"-",remarks:data?.remarks||""};
      withdrawalStore.unshift(item); return {success:true,data:clone(item)};
    }
    if((m==="patch"||m==="put")&&id){ const idx=withdrawalStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("Withdrawal not found"),{status:404}); withdrawalStore[idx]={...withdrawalStore[idx],...(data||{})}; return {success:true,data:clone(withdrawalStore[idx])}; }
    if(m==="delete"&&id){ const idx=withdrawalStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("Withdrawal not found"),{status:404}); const [removed]=withdrawalStore.splice(idx,1); return {success:true,data:clone(removed)}; }
  }


  if(cleanUrlSafe(url)==="/user/reports" || /^\/user\/reports\/[^/]+$/.test(cleanUrlSafe(url))){
    const reportRows = [
      ...investmentStore.map(x=>({id:x.id,type:"investment",title:x.packageName||x.name||"Investment",amount:String(x.amountValue ?? x.amount ?? "0").replace(/[^0-9.]/g,""),currency:"USDT",status:x.status||"Active",date:x.date||x.startDate||"-",description:`Investment ${x.packageName||x.name||"package"}`})),
      ...deposits.map(x=>({id:x.id,type:"deposit",title:"USDT Deposit",amount:String(x.amount||"0").replace(/[^0-9.]/g,""),currency:"USDT",status:x.status,date:x.date,description:`${x.network} deposit`})),
      ...roi.map(x=>({id:x.id,type:"roi",title:"Daily ROI Credited",amount:String(x.usdtProfit||"0").replace(/[^0-9.]/g,""),currency:"USDT",status:x.status,date:x.date,description:`${x.roiPercent} ROI • ${x.tokenPayout} AMGP`})),
      ...tokens.map(x=>({id:x.id,type:"token_payout",title:"Token Payout",amount:String(x.tokenQuantity||"0").replace(/[^0-9.]/g,""),currency:"AMGP",status:x.status,date:x.date,description:`${x.usdtProfit} USDT at ${x.tokenPrice} USDT/AMGP`})),
      ...buybacks.map(x=>({id:x.id,type:"buyback",title:"Buyback / Sell Token",amount:String(x.usdtValue||"0").replace(/[^0-9.]/g,""),currency:"USDT",status:x.status,date:x.date,description:`${x.tokenAmount} at ${x.price} USDT`})),
      ...withdrawals.map(x=>({id:x.id,type:"withdrawal",title:"USDT Withdrawal",amount:String(x.value||x.amount||"0").replace(/[^0-9.]/g,""),currency:x.currency||"USDT",status:x.status,date:x.requestedAt||"-",description:x.method||x.remarks||"Withdrawal request"})),
    ].sort((a,b)=>(Date.parse(String(b.date))||0)-(Date.parse(String(a.date))||0));
    if(m==="get" && /\/user\/reports\/[^/]+$/.test(cleanUrlSafe(url))){
      const id=decodeURIComponent(cleanUrlSafe(url).split("/").pop());
      const item=reportRows.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Report record not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m!=="get") throw Object.assign(new Error("User reports are read-only."),{status:405});
    let items=[...reportRows];
    const q=String(params.search||"").trim().toLowerCase();
    if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
    if(params.type && params.type!=="all") items=items.filter(x=>x.type===String(params.type));
    if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
    if(params.date && params.date!=="all"){
      const stamps=items.map(x=>Date.parse(String(x.date||""))).filter(Number.isFinite);
      const now=stamps.length?Math.max(...stamps):Date.now();
      const days=params.date==="today"?1:Number(params.date)||30;
      items=items.filter(x=>{const stamp=Date.parse(String(x.date||""));return Number.isNaN(stamp)?true:(now-stamp)<=days*86400000;});
    }
    const totalAll=items.length;
    const amountOf=x=>Number(x.amount)||0;
    const invested=items.filter(x=>x.type==="investment").reduce((a,x)=>a+amountOf(x),0);
    const roiUsdt=items.filter(x=>x.type==="roi").reduce((a,x)=>a+amountOf(x),0);
    const withdrawn=items.filter(x=>x.type==="withdrawal" && !["failed","rejected"].includes(String(x.status).toLowerCase())).reduce((a,x)=>a+amountOf(x),0);
    const deposit=items.filter(x=>x.type==="deposit" && !["failed","rejected"].includes(String(x.status).toLowerCase())).reduce((a,x)=>a+amountOf(x),0);
    const buyback=items.filter(x=>x.type==="buyback" && !["failed","rejected"].includes(String(x.status).toLowerCase())).reduce((a,x)=>a+amountOf(x),0);
    const counts={}; items.forEach(x=>{counts[x.type]=(counts[x.type]||0)+1;});
    const breakdown=["investment","deposit","roi","token_payout","buyback","withdrawal"].map(type=>({type,count:counts[type]||0,percent:totalAll?Math.round(((counts[type]||0)/totalAll)*100):0})).filter(x=>x.count);
    const stamps=items.map(x=>Date.parse(String(x.date||""))).filter(Number.isFinite).sort((a,b)=>a-b);
    const range=stamps.length?`${new Date(stamps[0]).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})} – ${new Date(stamps[stamps.length-1]).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}`:"No dated activity";
    const limit=Math.max(1,Number(params.limit)||10),page=Math.max(1,Number(params.page)||1);
    return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),total:totalAll,page,limit,totalPages:Math.max(1,Math.ceil(totalAll/limit)),stats:{total:totalAll,invested,roiUsdt,withdrawn,deposit,buyback,breakdown,range}}};
  }

  if(cleanUrlSafe(url)==="/user/notifications" || /^\/user\/notifications\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/notifications\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    if(m==="get" && id){
      const item=userNotificationStore.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Notification not found"),{status:404});
      return {success:true,data:clone({...item,event:eventMeta(item.eventKey)})};
    }
    if(m==="get"){
      return {success:true,data:clone(userNotificationPayload(userNotificationStore,params))};
    }
    if((m==="patch" || m==="put") && !id && data?.action==="mark_all_read"){
      userNotificationStore.forEach(item => { item.read=true; item.readAt=new Date().toISOString(); });
      return {success:true,data:{updated:userNotificationStore.length}};
    }
    if((m==="patch" || m==="put") && id){
      const idx=userNotificationStore.findIndex(x=>x.id===id);
      if(idx<0) throw Object.assign(new Error("Notification not found"),{status:404});
      if(data?.action==="mark_read") userNotificationStore[idx]={...userNotificationStore[idx],read:true,readAt:new Date().toISOString()};
      else userNotificationStore[idx]={...userNotificationStore[idx],...(data||{})};
      return {success:true,data:clone(userNotificationStore[idx])};
    }
    if(m!=="get" && m!=="patch" && m!=="put") throw Object.assign(new Error("User notifications are read-only."),{status:405});
  }

  if(cleanUrlSafe(url)==="/admin/notifications" || /^\/admin\/notifications\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/admin\/notifications\/([^/]+)$/); const id=match?.[1];
    if(m==="get" && id){
      if(id.startsWith("TPL-")){ const item=notificationTemplateStore.find(x=>x.id===id); if(!item) throw Object.assign(new Error("Template not found"),{status:404}); return {success:true,data:clone({...item, event:eventMeta(item.eventKey)})}; }
      const item=notificationStore.find(x=>x.id===id); if(!item) throw Object.assign(new Error("Notification not found"),{status:404}); return {success:true,data:clone({...item, event:eventMeta(item.eventKey)})};
    }
    if(m==="get" && params.view==="templates"){
      const items=notificationTemplateStore.map(t=>({...t, ...eventMeta(t.eventKey)}));
      return {success:true,data:{items:clone(items), events:clone(NOTIFICATION_EVENTS)}};
    }
    if(m==="get"){
      const payload=notificationPayload(notificationStore,params);
      return {success:true,data:{...payload, stats:notificationStats(notificationStore), events:clone(NOTIFICATION_EVENTS)}};
    }
    if(m==="post"){
      const meta=eventMeta(data?.eventKey)||{};
      const channels=Array.isArray(data?.channels)?data.channels:["inApp"];
      const now=new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});
      const channelStatus={};["inApp","email","telegram","sms"].forEach(c=>{channelStatus[c]=channels.includes(c)?{status:"Delivered",at:now}:{status:"Not Sent",at:"-"};});
      const item={id:`NTF-${String(Date.now()).slice(-6)}`,eventKey:data?.eventKey||"withdrawal_requested",user:data?.user||"All Users",email:data?.email||"-",phone:data?.phone||"-",telegramHandle:data?.telegramHandle||"-",reference:data?.reference||"MANUAL",triggeredBy:data?.triggeredBy||"Admin",retryCount:0,createdAt:now,title:data?.title||meta.label||"Notification",message:data?.message||"",channels,status:"Delivered",channelStatus};
      notificationStore.unshift(item); return {success:true,data:clone(item)};
    }
    if((m==="patch"||m==="put")&&id){
      if(id.startsWith("TPL-")){
        const idx=notificationTemplateStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("Template not found"),{status:404});
        const current=notificationTemplateStore[idx];
        const nextChannels=data?.channels?{...current.channels,...data.channels}:current.channels;
        notificationTemplateStore[idx]={...current,...(data||{}),channels:nextChannels,updatedAt:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}),updatedBy:data?.updatedBy||current.updatedBy};
        return {success:true,data:clone({...notificationTemplateStore[idx], ...eventMeta(notificationTemplateStore[idx].eventKey)})};
      }
      const idx=notificationStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("Notification not found"),{status:404});
      if(data?.action==="resend"){
        const now=new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});
        const current=notificationStore[idx];
        const channelStatus={...current.channelStatus};
        (current.channels||[]).forEach(c=>{channelStatus[c]={status:"Delivered",at:now};});
        notificationStore[idx]={...current,status:"Delivered",retryCount:(current.retryCount||0)+1,channelStatus};
        return {success:true,data:clone(notificationStore[idx])};
      }
      notificationStore[idx]={...notificationStore[idx],...(data||{})};
      return {success:true,data:clone(notificationStore[idx])};
    }
    if(m==="delete"&&id){
      if(id.startsWith("TPL-")) throw Object.assign(new Error("Templates cannot be deleted"),{status:400});
      const idx=notificationStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("Notification not found"),{status:404});
      const [removed]=notificationStore.splice(idx,1); return {success:true,data:clone(removed)};
    }
  }

  if(cleanUrlSafe(url)==="/admin/transactions" || /^\/admin\/transactions\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/admin\/transactions\/([^/]+)$/); const id=match?.[1];
    if(m==="get" && id){ const item=transactionStore.find(x=>x.id===id); if(!item) throw Object.assign(new Error("Transaction not found"),{status:404}); return {success:true,data:clone(item)}; }
    if(m==="get") return {success:true,data:transactionPayload(transactionStore,params)};
    if(m==="post"){ const item={id:data?.id||`TX-${String(Date.now()).slice(-6)}`,type:data?.type||"Transfer",subtype:data?.subtype||"Manual transaction",user:data?.user||"Platform Admin",wallet:data?.wallet||"Token Treasury",walletType:data?.walletType||"Hot Wallet",direction:data?.direction||"Out",amount:data?.amount||"0 AMGP",value:data?.value||"0.00 USDT",tokenPrice:data?.tokenPrice||"0.50 USDT",counterparty:data?.counterparty||"Internal",status:data?.status||"Pending",blockchain:data?.blockchain||"BSC (BNB Smart Chain)",txHash:data?.txHash||"-",blockNumber:data?.blockNumber||"-",confirmations:Number(data?.confirmations)||0,createdAt:data?.createdAt||new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),completedAt:data?.completedAt||"-",reconciliation:data?.reconciliation||"Pending"}; transactionStore.unshift(item); return {success:true,data:clone(item)}; }
    if((m==="patch"||m==="put")&&id){ const idx=transactionStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("Transaction not found"),{status:404}); transactionStore[idx]={...transactionStore[idx],...(data||{})}; return {success:true,data:clone(transactionStore[idx])}; }
    if(m==="delete"&&id){ const idx=transactionStore.findIndex(x=>x.id===id); if(idx<0) throw Object.assign(new Error("Transaction not found"),{status:404}); const [removed]=transactionStore.splice(idx,1); return {success:true,data:clone(removed)}; }
  }

  if(cleanUrlSafe(url)==="/admin/audit-logs" || /^\/admin\/audit-logs\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/admin\/audit-logs\/([^/]+)$/); const id=match?.[1];
    if(m==="get" && id){ const item=auditLogStore.find(x=>x.id===id); if(!item) throw Object.assign(new Error("Audit log entry not found"),{status:404}); return {success:true,data:clone(item)}; }
    if(m==="get" && params.meta==="filters"){ return {success:true,data:{modules:clone(AUDIT_MODULES),roles:clone(AUDIT_ROLES)}}; }
    if(m==="get"){ const payload=auditLogPayload(auditLogStore,params); return {success:true,data:{...payload, stats:auditLogStats(auditLogStore), modules:clone(AUDIT_MODULES), roles:clone(AUDIT_ROLES)}}; }
    // Audit log entries are immutable — write attempts are rejected rather than silently accepted.
    if(m==="post"||m==="patch"||m==="put"||m==="delete") throw Object.assign(new Error("Audit log entries cannot be modified."),{status:405});
  }

  if(cleanUrlSafe(url)==="/user/security/settings") {
    if(m==="get") return {success:true,data:clone(userSecurityState)};
    if(m==="patch") { Object.assign(userSecurityState, data||{}); return {success:true,data:clone(userSecurityState)}; }
    throw Object.assign(new Error("Security settings only support read/update."),{status:405});
  }

  if(cleanUrlSafe(url)==="/user/security/password") {
    if(m!=="post") throw Object.assign(new Error("Password endpoint only supports POST."),{status:405});
    if(!data?.currentPassword || !data?.newPassword) throw Object.assign(new Error("Current and new passwords are required."),{status:400});
    if(String(data.newPassword).length<8) throw Object.assign(new Error("New password must contain at least 8 characters."),{status:400});
    userSecurityState.lastPasswordChange="Just now";
    userSecurityActivity.unshift({id:`SEC-ACT-${Date.now()}`,action:"Password changed",device:"Current device",location:"Current location",date:"Just now",status:"Success"});
    return {success:true,data:{message:"Password changed successfully."}};
  }

  if(cleanUrlSafe(url)==="/user/security/sessions" || /^\/user\/security\/sessions\/[^/]+$/.test(cleanUrlSafe(url))) {
    const match=cleanUrlSafe(url).match(/^\/user\/security\/sessions\/([^/]+)$/); const id=match?.[1];
    if(m==="get") return {success:true,data:{items:clone(userSecuritySessions)}};
    if(m==="delete" && id) { const idx=userSecuritySessions.findIndex(x=>x.id===decodeURIComponent(id)); if(idx<0) throw Object.assign(new Error("Session not found."),{status:404}); if(userSecuritySessions[idx].current) throw Object.assign(new Error("The current session cannot be revoked."),{status:400}); const [removed]=userSecuritySessions.splice(idx,1); userSecurityActivity.unshift({id:`SEC-ACT-${Date.now()}`,action:"Session revoked",device:removed.device,location:removed.location,date:"Just now",status:"Success"}); return {success:true,data:clone(removed)}; }
    throw Object.assign(new Error("Unsupported session operation."),{status:405});
  }

  if(cleanUrlSafe(url)==="/user/security/activity") {
    if(m!=="get") throw Object.assign(new Error("Security activity is read-only."),{status:405});
    let items=[...userSecurityActivity]; const q=String(params.search||"").trim().toLowerCase(); if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q)); if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
    const total=items.length, limit=Math.max(1,Number(params.limit)||10), page=Math.max(1,Number(params.page)||1); return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))}};
  }

  if(cleanUrlSafe(url)==="/user/transactions" || /^\/user\/transactions\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/transactions\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    const history=[
      ...deposits.map(x=>({id:x.id,type:"deposit",date:x.date,amount:x.amount,currency:"USDT",rate:"1 USDT",status:x.status,txHash:x.txHash,description:"USDT deposit",source:"Blockchain"})),
      ...investments.map(x=>({id:x.id,type:"investment",date:x.date,amount:x.amount,currency:"USDT",rate:"—",status:x.status,txHash:"-",description:x.packageName||x.name||"Investment package",source:"Investment"})),
      ...roi.map(x=>({id:`${x.id}-USER`,type:"roi",date:x.date,amount:x.usdtProfit,currency:"USDT",rate:x.tokenPrice,status:x.status,txHash:"-",description:`Daily ROI ${x.roiPercent} → ${x.tokenPayout}`,source:"ROI Engine"})),
      ...buybacks.map(x=>({id:x.id,type:"buyback",date:x.createdAt||x.date||"18 Sep 2026",amount:x.usdtAmount||x.amount||"30 USDT",currency:"USDT",rate:x.buybackPrice?`${x.buybackPrice} USDT / TOKEN`:"0.50 USDT / TOKEN",status:x.status,txHash:x.txHash||"-",description:"Native token sold through platform buyback",source:"Buyback"})),
      ...withdrawals.map(x=>({id:x.id,type:"withdrawal",date:x.createdAt||x.date||"18 Sep 2026",amount:x.amount,currency:"USDT",rate:"—",status:x.status,txHash:x.txHash||"-",description:x.method||"USDT withdrawal",source:"Payout Provider"})),
    ].sort((a,b)=>(Date.parse(String(b.date))||0)-(Date.parse(String(a.date))||0));
    if(m==="get" && id){ const item=history.find(x=>x.id===id); if(!item) throw Object.assign(new Error("Transaction not found"),{status:404}); return {success:true,data:clone(item)}; }
    if(m!=="get") throw Object.assign(new Error("User transaction history is read-only."),{status:405});
    let items=[...history];
    const q=String(params.search||"").trim().toLowerCase();
    if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
    if(params.type && params.type!=="all") items=items.filter(x=>String(x.type).toLowerCase()===String(params.type).toLowerCase());
    if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
    const total=items.length, limit=Math.max(1,Number(params.limit)||10), page=Math.max(1,Number(params.page)||1);
    return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))}};
  }

  if(cleanUrlSafe(url)==="/user/investment-packages"){
    if(m!=="get") throw Object.assign(new Error("Investment packages are managed by the platform."),{status:405});
    let items=investmentPackages.filter(x=>String(x.status).toLowerCase()==="active");
    if(params.search) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(String(params.search).toLowerCase()));
    return {success:true,data:{items:clone(items),total:items.length}};
  }

  if(cleanUrlSafe(url)==="/user/investments" || /^\/user\/investments\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/investments\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    if(m==="get" && id){
      const item=investmentStore.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Investment not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m==="get"){
      let items=[...investmentStore];
      const q=String(params.search||"").trim().toLowerCase();
      if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
      if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
      const total=items.length, limit=Math.max(1,Number(params.limit)||10), page=Math.max(1,Number(params.page)||1);
      return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))}};
    }
    if(m==="post"){
      const packageId=String(data?.packageId||"");
      const pkg=investmentPackages.find(x=>x.id===packageId && String(x.status).toLowerCase()==="active");
      if(!pkg) throw Object.assign(new Error("Selected investment package is unavailable."),{status:400});
      const amount=Number(data?.amount);
      if(!Number.isFinite(amount)) throw Object.assign(new Error("Investment amount is required."),{status:400});
      if(amount < Number(pkg.min) || amount > Number(pkg.max)) throw Object.assign(new Error(`Investment must be between ${pkg.min} and ${pkg.max} USDT.`),{status:400});
      const available=Number(userWalletSummary.usdtBalance||0);
      if(amount>available) throw Object.assign(new Error("Insufficient USDT balance in your wallet."),{status:400});
      userWalletSummary.usdtBalance=(available-amount).toFixed(2);
      const now=new Date();
      const end=new Date(now.getTime()+Number(pkg.duration)*86400000);
      const item={
        id:`INV-${String(Date.now()).slice(-7)}`,
        packageId:pkg.id,
        packageName:pkg.name,
        status:"Active",
        amount:`${amount.toFixed(2)} USDT`,
        amountValue:amount,
        dailyRoi:Number(pkg.dailyRoi),
        duration:Number(pkg.duration),
        startDate:now.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),
        endDate:end.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),
        date:now.toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),
      };
      investmentStore.unshift(item);
      return {success:true,data:clone(item)};
    }
    if((m==="patch"||m==="put")&&id){
      const idx=investmentStore.findIndex(x=>x.id===id);
      if(idx<0) throw Object.assign(new Error("Investment not found"),{status:404});
      investmentStore[idx]={...investmentStore[idx],...(data||{})};
      return {success:true,data:clone(investmentStore[idx])};
    }
    if(m==="delete"&&id){
      const idx=investmentStore.findIndex(x=>x.id===id);
      if(idx<0) throw Object.assign(new Error("Investment not found"),{status:404});
      const [removed]=investmentStore.splice(idx,1);
      return {success:true,data:clone(removed)};
    }
  }

  if(cleanUrlSafe(url)==="/user/roi" || /^\/user\/roi\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/roi\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    const history=roi.map((item,index)=>({
      ...item,
      // User-facing history is read-only. The mock keeps the platform's released
      // snapshot fields so the production API can later scope them to req.user.id.
      userPayoutId:`UP-${item.id}`,
      conversion:`${item.usdtProfit} ÷ ${item.tokenPrice}`,
    }));
    if(m==="get" && id){
      const item=history.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("ROI payout not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m==="get"){
      let items=[...history];
      const q=String(params.search||"").trim().toLowerCase();
      if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
      if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
      const latest=items[0] || history[0];
      const summary=latest ? {
        roiPercent:latest.roiPercent,
        usdtProfit:latest.usdtProfit,
        tokenPrice:latest.tokenPrice,
        tokenPayout:latest.tokenPayout,
        date:latest.date,
        status:latest.status,
      } : {roiPercent:0,usdtProfit:0,tokenPrice:0,tokenPayout:0,date:"",status:"-"};
      const total=items.length;
      const limit=Math.max(1,Number(params.limit)||10);
      const page=Math.max(1,Number(params.page)||1);
      return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),summary,total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))}};
    }
    if(m==="post"||m==="patch"||m==="put"||m==="delete"){
      throw Object.assign(new Error("ROI payout history is read-only for users."),{status:405});
    }
  }

  if(cleanUrlSafe(url)==="/user/buybacks" || /^\/user\/buybacks\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/buybacks\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    const buybackStore=buybacks;
    if(m==="get" && id){
      const item=buybackStore.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Buyback request not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m==="get"){
      let items=[...buybackStore];
      const q=String(params.search||"").trim().toLowerCase();
      if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
      if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
      const total=items.length, limit=Math.max(1,Number(params.limit)||10), page=Math.max(1,Number(params.page)||1);
      return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))}};
    }
    if(m==="post"){
      const tokenAmount=Number(data?.tokenAmount);
      if(!Number.isFinite(tokenAmount) || tokenAmount<=0) throw Object.assign(new Error("Token amount is required."),{status:400});
      const minimum=100, maximum=1000, price=0.48, feePercent=2;
      const available=Number(String(userWalletSummary.tokenBalance||0).replace(/,/g,""));
      if(tokenAmount<minimum || tokenAmount>maximum) throw Object.assign(new Error(`Buyback amount must be between ${minimum} and ${maximum} TOKEN.`),{status:400});
      if(tokenAmount>available) throw Object.assign(new Error("Insufficient token balance."),{status:400});
      const gross=tokenAmount*price;
      const fee=gross*(feePercent/100);
      const net=gross-fee;
      userWalletSummary.tokenBalance=(available-tokenAmount).toFixed(2);
      userWalletSummary.usdtBalance=(Number(userWalletSummary.usdtBalance||0)+net).toFixed(2);
      const now=new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
      const item={id:`BUY-${String(Date.now()).slice(-6)}`,date:now,type:"Buyback",tokenAmount:`${tokenAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} TOKEN`,usdtValue:`${net.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USDT`,price:price.toFixed(2),fee:`${feePercent.toFixed(2)}%`,txHash:"-",status:"Completed",wallet:userWallets.find(x=>x.isPrimary)?.address||"-",user:"Current User"};
      buybackStore.unshift(item);
      return {success:true,data:clone(item)};
    }
    if(m==="patch"||m==="put"||m==="delete") throw Object.assign(new Error("Buyback history cannot be modified by users."),{status:405});
  }

  if(cleanUrlSafe(url)==="/user/withdrawals" || /^\/user\/withdrawals\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/withdrawals\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    if(m==="get" && id){
      const item=userWithdrawalStore.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Withdrawal request not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m==="get"){
      let items=[...userWithdrawalStore];
      const q=String(params.search||"").trim().toLowerCase();
      if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
      if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
      const total=items.length, limit=Math.max(1,Number(params.limit)||10), page=Math.max(1,Number(params.page)||1);
      return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))}};
    }
    if(m==="post"){
      const amount=Number(data?.amount);
      const balance=Number(String(userWalletSummary.usdtBalance||0).replace(/,/g,""));
      const min=50, max=10000;
      if(!Number.isFinite(amount) || amount<min || amount>max) throw Object.assign(new Error(`Withdrawal amount must be between ${min} and ${max} USDT.`),{status:400});
      if(amount>balance) throw Object.assign(new Error("Insufficient available USDT balance."),{status:400});
      const accountName=String(data?.accountName||"").trim();
      const accountNumber=String(data?.accountNumber||"").trim();
      if(!accountName || !accountNumber) throw Object.assign(new Error("Payout account details are required."),{status:400});
      const fee=Number(data?.fee ?? (amount*0.01));
      const received=Number(data?.received ?? (amount-fee));
      userWalletSummary.usdtBalance=(balance-amount).toFixed(2);
      const now=new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});
      const item={id:`UWDR-${String(Date.now()).slice(-6)}`,txId:`TX-${String(Date.now()).slice(-6)}`,user:"Current User",email:"current.user@example.com",wallet:"Primary Wallet",network:data?.network||"BNB Smart Chain / BEP-20",currency:"USDT",amount:amount.toFixed(2),fee:fee.toFixed(2),received:received.toFixed(2),method:data?.method||"bank",accountName,accountNumber,status:"Pending",address:userWallets.find(x=>x.isPrimary)?.address||"-",txHash:"-",confirmations:0,blockNumber:"-",requestedAt:now,processedAt:"-",remarks:"Withdrawal request submitted and awaiting review."};
      userWithdrawalStore.unshift(item);
      return {success:true,data:clone(item)};
    }
    if(m==="patch"||m==="put"||m==="delete") throw Object.assign(new Error("Withdrawal history is managed by the platform and cannot be modified by users."),{status:405});
  }

  if(cleanUrlSafe(url)==="/user/wallet" || /^\/user\/wallet\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/wallet\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    if(m==="get" && id){
      const item=userWallets.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Wallet not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m==="get"){
      let items=[...userWallets];
      const q=String(params.search||"").trim().toLowerCase();
      if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
      if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
      const total=items.length;
      const limit=Math.max(1,Number(params.limit)||10);
      const page=Math.max(1,Number(params.page)||1);
      return {success:true,data:{
        items:clone(items.slice((page-1)*limit,page*limit)),
        summary:clone(userWalletSummary),
        total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))
      }};
    }
    if(m==="post"){
      const address=String(data?.address||"").trim();
      if(!address) throw Object.assign(new Error("Wallet address is required."),{status:400});
      const item={
        id:data?.id||`WAL-${String(Date.now()).slice(-6)}`,
        label:data?.label||"Wallet",
        asset:data?.asset||"USDT + AMGP",
        network:data?.network||"BNB Smart Chain / BEP-20",
        address,
        status:"Active",
        isPrimary:Boolean(data?.isPrimary),
        createdAt:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}),
        lastActivity:"-",
      };
      if(item.isPrimary) userWallets.forEach(x=>x.isPrimary=false);
      userWallets.unshift(item);
      return {success:true,data:clone(item)};
    }
    if((m==="patch"||m==="put")&&id){
      const idx=userWallets.findIndex(x=>x.id===id);
      if(idx<0) throw Object.assign(new Error("Wallet not found"),{status:404});
      const next={...userWallets[idx],...(data||{})};
      if(next.isPrimary) userWallets.forEach((x,i)=>{if(i!==idx)x.isPrimary=false;});
      userWallets[idx]=next;
      return {success:true,data:clone(next)};
    }
    if(m==="delete"&&id){
      const idx=userWallets.findIndex(x=>x.id===id);
      if(idx<0) throw Object.assign(new Error("Wallet not found"),{status:404});
      if(userWallets[idx].isPrimary) throw Object.assign(new Error("Primary wallet cannot be deleted."),{status:400});
      const [removed]=userWallets.splice(idx,1);
      return {success:true,data:clone(removed)};
    }
  }

  if(cleanUrlSafe(url)==="/user/deposits" || /^\/user\/deposits\/[^/]+$/.test(cleanUrlSafe(url))){
    const match=cleanUrlSafe(url).match(/^\/user\/deposits\/([^/]+)$/);
    const id=match?.[1] ? decodeURIComponent(match[1]) : undefined;
    if(m==="get" && id){
      const item=deposits.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Deposit not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m==="get"){
      let items=[...deposits];
      const q=String(params.search||"").trim().toLowerCase();
      if(q) items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));
      if(params.status && params.status!=="all") items=items.filter(x=>String(x.status).toLowerCase()===String(params.status).toLowerCase());
      const total=items.length;
      const limit=Math.max(1,Number(params.limit)||10);
      const page=Math.max(1,Number(params.page)||1);
      return {success:true,data:{items:clone(items.slice((page-1)*limit,page*limit)),total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))}};
    }
    if(m==="post"){
      const txHash=String(data?.txHash||"").trim();
      if(!txHash) throw Object.assign(new Error("Transaction hash is required."),{status:400});
      const duplicate=deposits.find(x=>String(x.txHash||"").toLowerCase()===txHash.toLowerCase());
      if(duplicate) return {success:true,data:clone(duplicate)};
      const item={id:`DEP-${String(Date.now()).slice(-6)}`,txHash,network:data?.network||"BEP-20",amount:data?.amount||"Pending on-chain verification",status:"Processing",confirmations:0,date:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})};
      deposits.unshift(item);
      return {success:true,data:clone(item)};
    }
    if(m==="patch" || m==="put"){
      const idx=deposits.findIndex(x=>x.id===id);
      if(idx<0) throw Object.assign(new Error("Deposit not found"),{status:404});
      deposits[idx]={...deposits[idx],...(data||{})};
      return {success:true,data:clone(deposits[idx])};
    }
  }

  if(cleanUrlSafe(url)==="/user/profile") {
    if(m==="get") return {success:true,data:clone(userProfileStore)};
    if(m==="patch" || m==="put") {
      const allowed=["firstName","lastName","phone","country","timezone","language"];
      allowed.forEach((key)=>{ if(data && data[key] !== undefined) userProfileStore[key]=String(data[key]).trim(); });
      userProfileStore.name=`${userProfileStore.firstName} ${userProfileStore.lastName}`.trim();
      return {success:true,data:clone(userProfileStore)};
    }
  }

  if(cleanUrlSafe(url)==="/user/kyc"){
    if(m==="get") return {success:true,data:clone(userKycStore)};
    if(m==="post"){
      // "Start verification". A real backend creates a session with the KYC provider and
      // returns its `verificationUrl`; demo mode just moves the record to pending review.
      if(userKycStore.status==="approved") throw Object.assign(new Error("Your identity is already verified."),{status:409});
      if(userKycStore.status==="pending") throw Object.assign(new Error("Your verification is already under review."),{status:409});
      userKycSeq+=1;
      Object.assign(userKycStore,{status:"pending",verificationId:`KYC${900000+userKycSeq}`,verificationDate:null,reviewStatus:"Pending Review"});
      return {success:true,data:clone(userKycStore)};
    }
  }

  const cleanUrl=url.replace(/\/$/,"");
  const buybackMatch=cleanUrl.match(/^\/admin\/buybacks\/([^/]+)$/);
  if(buybackMatch){
    const id=decodeURIComponent(buybackMatch[1]);
    if(m==="get") {
      const item=buybacks.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Buyback record not found"),{status:404});
      return {success:true,data:clone(item)};
    }
    if(m==="patch"||m==="put") {
      if(id==="settings") {
        Object.assign(buybackSettings, data||{});
        return {success:true,data:clone(buybackSettings)};
      }
      const item=buybacks.find(x=>x.id===id);
      if(!item) throw Object.assign(new Error("Buyback record not found"),{status:404});
      Object.assign(item,data||{});
      return {success:true,data:clone(item)};
    }
  }
  if(cleanUrl==="/admin/buybacks" && m==="post") {
    const item={id:data?.id||`BUY-${String(buybacks.length+1).padStart(3,"0")}`,date:data?.date||new Date().toLocaleString("en-GB"),type:"Buyback",tokenAmount:data?.tokenAmount||"0 TOKEN",usdtValue:data?.usdtValue||"0 USDT",price:data?.price||buybackSettings.buybackPrice.replace(/[^0-9.]/g,""),txHash:data?.txHash||"-",status:data?.status||"Pending",wallet:data?.wallet||"-",user:data?.user||"-"};
    buybacks.unshift(item);
    return {success:true,data:clone(item)};
  }

  const kycMatch=cleanUrl.match(/^\/admin\/kyc\/([^/]+)$/);

  if(kycMatch && m==="get"){
    const record=getKycById(kycMatch[1]);
    if(!record)throw Object.assign(new Error("KYC record not found"),{status:404});
    return {success:true,data:clone(record)};
  }

  if(kycMatch && (m==="patch" || m==="put")){
    const record=getKycById(kycMatch[1]);
    if(!record)throw Object.assign(new Error("KYC record not found"),{status:404});
    if(data?.status)record.status=data.status;
    record.reviewStatus=data?.status==="approved"?"Approved":data?.status==="rejected"?"Rejected":"Pending Review";
    record.verificationDate=data?.status==="approved"?new Date().toISOString():record.verificationDate;
    return {success:true,data:clone(record)};
  }

  const base=cleanUrl.split("?")[0];
  const raw=map[base]||{items:[]};
  if(m!=="get")return{success:true,data:{id:`DEMO-${Date.now()}`,...(data||{})}};

  const q=String(params.search||"").trim().toLowerCase();
  let items=raw.users||raw.items||raw.transactions||[];
  if(q)items=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));

  if(params.status&&params.status!=="all"){
    const wanted=String(params.status).toLowerCase();
    items=items.filter(x=>{
      const current=String(x.status||x.account||"").toLowerCase();
      if(wanted==="verified")return ["approved","verified","completed"].includes(current);
      if(wanted==="rejected")return ["rejected","failed"].includes(current);
      return current===wanted;
    });
  }

  if(params.wallet&&params.wallet!=="all"){
    items=items.filter(x=>x.wallet===params.wallet);
  }

  const isKyc=base==="/admin/kyc";
  const hasFilter=Boolean(q)||(params.status&&params.status!=="all")||(params.wallet&&params.wallet!=="all");
  const total=isKyc&&!hasFilter?kycStats.total:items.length;
  const limit=Math.max(1,Number(params.limit)||10);
  const page=Math.max(1,Number(params.page)||1);
  const totalPages=Math.max(1,Math.ceil(total/limit));
  let pageItems=items.slice((page-1)*limit,page*limit);

  if(isKyc&&!hasFilter){
    pageItems=Array.from({length:Math.min(limit,Math.max(0,total-(page-1)*limit))},(_,i)=>kyc[((page-1)*limit+i)%kyc.length]);
  }

  const out={...clone(raw)};
  if(isKyc)out.stats=clone(kycStats);
  if(raw.users)out.users=clone(pageItems);
  else if(raw.transactions)out.transactions=clone(pageItems);
  else if(raw.items)out.items=clone(pageItems);

  out.total=total;
  out.page=page;
  out.limit=limit;
  out.totalPages=totalPages;
  return{success:true,data:out};
}
