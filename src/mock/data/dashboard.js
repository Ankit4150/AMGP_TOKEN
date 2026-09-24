import { adminStats, transactions, userDashboardStats } from "../../data/mockData";
export { adminStats, transactions, userDashboardStats };

// ---------------------------------------------------------------------------
// GET /user/dashboard - payload the user dashboard expects from the backend.
// Mirrors Phase 12 (User Token Balance) and the Phase 3 / Phase 9 example:
//   10,000 USDT x 0.30% = 30 USDT  ->  30 / 0.50 = 60 TOKEN
// Numbers are computed by the backend; the UI only formats them.
// ---------------------------------------------------------------------------
const todayKey = new Date().toISOString().slice(0, 10);

export const userDashboard = {
  token: {
    name: "Native Token",
    symbol: "AMGP", // symbol is still to be finalised (plan Phase 1) - never hard-code it in the UI
    network: "BNB Smart Chain / BEP-20",
  },
  balance: {
    token: 2450,
    estimatedValueUsdt: 1225, // token balance x current token price
  },
  price: {
    current: 0.5, // USDT per token (Phase 3)
  },
  // Today's ROI payout with its stored price snapshot. `null` until the admin
  // has declared today's ROI (declared around 4 PM Malaysia Time, Phase 8).
  today: {
    date: todayKey,
    status: "Credited", // "Pending" until admin clicks Approve & Release (Phase 10)
    roiPercent: 0.3,
    investmentUsdt: 10000,
    usdtProfit: 30,
    tokenPrice: 0.5,
    tokenPayout: 60,
  },
  exit: {
    dex: {
      name: "PancakeSwap",
      // Token contract is not deployed yet (Phase 1), so no inputCurrency is set.
      // Backend should return the full swap URL once the contract exists.
      url: "https://pancakeswap.finance/swap?chain=bsc&outputCurrency=0x55d398326f99059fF775485246999027B3197955",
    },
    buyback: {
      price: 0.48, // buyback price is set by admin in Buyback Settings (Phase 17)
      status: "Active",
    },
  },
};
