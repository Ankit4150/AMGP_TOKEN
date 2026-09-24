import {
  adminStats,
  transactions,
  dashboardOperational,
} from "./data/dashboard";
import { userStats, users } from "./data/users";
export function mockAdminApi(url) {
  if (url === "/admin/dashboard")
    return {
      success: true,
      data: {
        stats: adminStats,
        transactions,
        operational: dashboardOperational,
        treasury: {
          tokenBalance: "980,000 AMGP",
          buybackReserve: "125,000 USDT",
          liquidity: "420,000 AMGP / 210,000 USDT",
        },
      },
    };
  if (url === "/admin/users")
    return { success: true, data: { stats: userStats, users } };
  return { success: true, data: { items: [], total: 0 } };
}
