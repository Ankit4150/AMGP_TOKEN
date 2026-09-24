import { useCallback, useEffect, useState } from "react";
import { getUserDashboardApi } from "../../services/user/dashboardApi";
import { toNumber } from "../../lib/format";

export function normalizeUserDashboard(response) {
  const payload = response?.data ?? response ?? {};
  const today = payload.today || null;
  return {
    token: { symbol: payload.token?.symbol || "AMGP", name: payload.token?.name || "Native Token" },
    tokenBalance: toNumber(payload.balance?.token),
    estimatedValueUsdt: toNumber(payload.balance?.estimatedValueUsdt),
    tokenPrice: toNumber(payload.price?.current),
    today: today ? { date: today.date, status: today.status || "Pending", roiPercent: toNumber(today.roiPercent), investmentUsdt: toNumber(today.investmentUsdt), usdtProfit: toNumber(today.usdtProfit), tokenPrice: toNumber(today.tokenPrice), tokenPayout: toNumber(today.tokenPayout) } : null,
    dex: { name: payload.exit?.dex?.name || "PancakeSwap", url: payload.exit?.dex?.url || "" },
    buyback: { price: toNumber(payload.exit?.buyback?.price), active: String(payload.exit?.buyback?.status || "").toLowerCase() === "active" },
  };
}

export function useUserDashboard() {
  const [data, setData] = useState(); const [error, setError] = useState(null); const [isPending, setPending] = useState(true); const [isFetching, setFetching] = useState(false);
  const fetchData = useCallback(async () => {
    setFetching(true); setError(null);
    try { const res = await getUserDashboardApi({}, undefined); setData(normalizeUserDashboard(res)); return res; }
    catch (e) { setError(e); throw e; }
    finally { setPending(false); setFetching(false); }
  }, []);
  useEffect(() => { fetchData().catch(() => {}); return undefined; }, [fetchData]);
  return { data, error, isPending, isLoading: isPending, isFetching, isError: Boolean(error), refetch: fetchData };
}
