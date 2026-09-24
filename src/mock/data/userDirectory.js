// User Management directory data — Phase 4 (User Registration & KYC) and
// Phase 20 (Admin Panel → User Management) of the platform plan.
// Generated deterministically so the demo dataset is stable across reloads.

const FIRST_NAMES = [
  "John","Alice","Mike","Sarah","Robert","Laura","David","Emily","James","Karen",
  "Rahul","Priya","Amit","Sneha","Vikash","Pooja","Rohit","Neha","Karan","Meera",
  "Arjun","Divya","Suresh","Anjali","Vikram","Kavya","Manoj","Ritu","Sanjay","Isha",
  "Wei","Mei","Hiro","Yuki","Chen","Liang","Aisha","Omar","Fatima","Hassan",
  "Carlos","Maria","Luis","Sofia","Anna","Peter","Grace","Daniel","Olivia","Noah",
];
const LAST_NAMES = [
  "Smith","Brown","Peterson","Wilson","King","Taylor","White","Thomas","Harris","Lee",
  "Sharma","Singh","Kumar","Patel","Yadav","Verma","Mehta","Rani","Gupta","Shah",
  "Reddy","Nair","Joshi","Rao","Iyer","Malhotra","Chopra","Kapoor","Bansal","Bhatt",
  "Chen","Wang","Tanaka","Yamamoto","Li","Zhang","Khan","Ali","Ahmed","Hussain",
  "Garcia","Lopez","Fernandez","Rossi","Muller","Novak","Andersen","Dubois","Silva","Costa",
];
const COUNTRIES = [
  "United States","India","United Kingdom","UAE","Singapore","Malaysia","Philippines",
  "Nigeria","South Africa","Canada","Australia","Germany","Brazil","Indonesia","Vietnam",
];
const PLANS = ["Starter Plan","Basic Plan","Premium Plan","VIP Plan"];
const KYC_STATUSES = ["Verified","Pending","Rejected","Not Submitted"];
// Weighted so most users land on Verified/Pending, mirroring a real platform mix.
const KYC_WEIGHTED = ["Verified","Verified","Verified","Pending","Pending","Rejected","Not Submitted"];
const ACCOUNT_STATUSES = ["Active","Active","Active","Active","Suspended","Blocked"]; // weighted toward Active
const AVATAR_COLORS = ["blue","purple","orange","teal","pink","violet"];

function pad(num, len = 4) {
  return String(num).padStart(len, "0");
}

function hexWallet(seed) {
  const chars = "0123456789abcdef";
  let out = "0x";
  let n = seed * 2654435761;
  for (let i = 0; i < 8; i += 1) {
    n = (n * 48271) % 2147483647;
    out += chars[Math.abs(n) % 16];
  }
  out += "...";
  n = (n * 48271) % 2147483647;
  for (let i = 0; i < 4; i += 1) {
    n = (n * 48271) % 2147483647;
    out += chars[Math.abs(n) % 16];
  }
  return out;
}

function money(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function dateFromOffset(daysAgo, minutesAgo = 0) {
  const d = new Date(Date.UTC(2025, 8, 8, 14, 0, 0));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCMinutes(d.getUTCMinutes() - minutesAgo);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

const TOTAL_USERS = 54;

export const userDirectory = Array.from({ length: TOTAL_USERS }, (_, i) => {
  const index = i + 1;
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 3 + 7) % LAST_NAMES.length];
  const name = `${first} ${last}`;
  const initials = `${first[0]}${last[0]}`.toUpperCase();
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${index}@example.com`;
  const kyc = KYC_WEIGHTED[(i * 5 + 3) % KYC_WEIGHTED.length];
  const account = ACCOUNT_STATUSES[(i * 7 + 3) % ACCOUNT_STATUSES.length];
  const plan = PLANS[(i * 3 + 2) % PLANS.length];
  const usdtBalance = 250 + ((i * 733) % 48000);
  const tokenPrice = 0.5;
  const tokenBalance = Math.round((usdtBalance / tokenPrice) * (0.4 + ((i * 13) % 30) / 100));
  const totalInvested = 500 + ((i * 917) % 60000);
  const totalRoiPaid = Math.round(totalInvested * (0.02 + ((i * 11) % 18) / 100));
  const totalWithdrawn = Math.round(totalRoiPaid * (0.1 + ((i * 17) % 60) / 100));
  const totalBuybacks = Math.round(totalWithdrawn * (0.2 + ((i * 19) % 50) / 100));

  return {
    id: `#USR${pad(index)}`,
    initials,
    name,
    email,
    phone: `+${1 + (i % 9)} ${200 + (i * 37) % 700} ${100 + (i * 53) % 900} ${1000 + (i * 71) % 9000}`,
    country: COUNTRIES[(i * 4 + 1) % COUNTRIES.length],
    kyc,
    kycVerificationId: kyc === "Not Submitted" ? "-" : `KYC-${pad(1000 + index, 4)}`,
    account,
    plan,
    role: "User",
    walletAddress: hexWallet(index * 97 + 13),
    network: "BEP-20",
    usdtBalance: money(usdtBalance),
    tokenBalance: tokenBalance.toLocaleString(),
    totalInvested: money(totalInvested),
    totalRoiPaid: money(totalRoiPaid),
    totalWithdrawn: money(totalWithdrawn),
    totalBuybacks: money(totalBuybacks),
    twoFA: i % 3 === 0 ? "Enabled" : "Disabled",
    date: dateFromOffset(index % 30, (index * 11) % 60),
    lastLogin: dateFromOffset(index % 6, (index * 7) % 45),
    avatar: AVATAR_COLORS[i % AVATAR_COLORS.length],
    notes: "",
  };
});

export function computeUserStats(list) {
  const total = list.length;
  const active = list.filter((u) => u.account === "Active").length;
  const verified = list.filter((u) => u.kyc === "Verified").length;
  const pendingKyc = list.filter((u) => u.kyc === "Pending" || u.kyc === "Not Submitted").length;
  const blocked = list.filter((u) => u.account === "Blocked" || u.account === "Suspended").length;

  return [
    { label: "Total Users", value: total.toLocaleString(), change: "12%", tone: "blue", direction: "up", icon: "users" },
    { label: "Active Users", value: active.toLocaleString(), change: `${total ? ((active / total) * 100).toFixed(1) : "0.0"}%`, tone: "green", direction: "up", icon: "activeUsers" },
    { label: "Verified KYC", value: verified.toLocaleString(), change: `${total ? ((verified / total) * 100).toFixed(1) : "0.0"}%`, tone: "cyan", direction: "up", icon: "verified" },
    { label: "Pending KYC", value: pendingKyc.toLocaleString(), change: `${total ? ((pendingKyc / total) * 100).toFixed(1) : "0.0"}%`, tone: "purple", direction: "down", icon: "pending" },
    { label: "Suspended / Blocked", value: blocked.toLocaleString(), change: `${total ? ((blocked / total) * 100).toFixed(1) : "0.0"}%`, tone: "red", direction: "down", icon: "failed" },
  ];
}

export const PLAN_OPTIONS = PLANS;
export const KYC_OPTIONS = KYC_STATUSES;
export const ACCOUNT_OPTIONS = ["Active", "Suspended", "Blocked"];
export const COUNTRY_OPTIONS = COUNTRIES;
