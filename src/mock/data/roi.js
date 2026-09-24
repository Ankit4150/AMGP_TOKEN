// Current native token price (USDT per AMGP). In production this comes from
// the Token Price Engine (Phase 3) - DEX price / oracle / admin controlled.
export const roiTokenPrice = 0.5;

// Summary cards shown at the top of ROI Management (Phase 8 / 12).
export const roiStats = [
  { label: "Eligible users today", value: "248", tone: "blue", icon: "users" },
  { label: "Today's USDT profit", value: "18,420 USDT", tone: "green", icon: "earnings" },
  { label: "Token price", value: "0.50 USDT", tone: "purple", icon: "token" },
  { label: "Token payout today", value: "36,840 AMGP", tone: "yellow", icon: "token" },
];

// Eligible investors used to build the admin preview before Approve & Release
// (Phase 10, Step 3: User, Investment, ROI, USDT profit, Token price, Token quantity).
export const roiEligibleInvestors = [
  { id: "INV-2201", user: "Ahmad Faisal", wallet: "0x71C...9e2A", investment: 10000 },
  { id: "INV-2202", user: "Lim Wei Jian", wallet: "0x4Af...3b17", investment: 5000 },
  { id: "INV-2203", user: "Nur Aisyah", wallet: "0x9Bd...c441", investment: 2000 },
  { id: "INV-2204", user: "Ravi Chandran", wallet: "0x22e...aa09", investment: 25000 },
  { id: "INV-2205", user: "Siti Noraini", wallet: "0x8Fc...771d", investment: 1500 },
  { id: "INV-2206", user: "Tan Mei Ling", wallet: "0x5Da...0c93", investment: 8000 },
];

// Daily ROI run history (Phase 13 transaction history / Phase 24 reconciliation).
// Historical payouts keep the token price that was in effect on that day and
// never change even if the live token price moves later (Phase 3).
export const roi = [
  {
    id: "ROI-00116",
    date: "2026-09-16 16:00",
    roiPercent: "0.28%",
    totalUsers: 246,
    usdtProfit: "17,360 USDT",
    tokenPrice: "0.50 USDT",
    tokenPayout: "34,720 AMGP",
    status: "Completed",
  },
  {
    id: "ROI-00115",
    date: "2026-09-15 16:00",
    roiPercent: "0.31%",
    totalUsers: 244,
    usdtProfit: "18,930 USDT",
    tokenPrice: "0.50 USDT",
    tokenPayout: "37,860 AMGP",
    status: "Completed",
  },
  {
    id: "ROI-00114",
    date: "2026-09-14 16:00",
    roiPercent: "0.29%",
    totalUsers: 241,
    usdtProfit: "16,755 USDT",
    tokenPrice: "0.48 USDT",
    tokenPayout: "34,906 AMGP",
    status: "Reconciled",
  },
  {
    id: "ROI-00113",
    date: "2026-09-13 16:00",
    roiPercent: "0.30%",
    totalUsers: 238,
    usdtProfit: "16,940 USDT",
    tokenPrice: "0.48 USDT",
    tokenPayout: "35,292 AMGP",
    status: "Completed",
  },
  {
    id: "ROI-00112",
    date: "2026-09-12 16:00",
    roiPercent: "0.27%",
    totalUsers: 235,
    usdtProfit: "15,120 USDT",
    tokenPrice: "0.47 USDT",
    tokenPayout: "32,170 AMGP",
    status: "Completed",
  },
  {
    id: "ROI-00111",
    date: "2026-09-11 16:00",
    roiPercent: "0.30%",
    totalUsers: 233,
    usdtProfit: "16,280 USDT",
    tokenPrice: "0.47 USDT",
    tokenPayout: "34,638 AMGP",
    status: "Failed",
  },
  {
    id: "ROI-00110",
    date: "2026-09-10 16:00",
    roiPercent: "0.29%",
    totalUsers: 230,
    usdtProfit: "15,410 USDT",
    tokenPrice: "0.46 USDT",
    tokenPayout: "33,500 AMGP",
    status: "Completed",
  },
];
