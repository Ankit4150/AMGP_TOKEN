import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeftRight,
  Clock3,
  ExternalLink,
  Landmark,
  RefreshCw,
} from "lucide-react";
import UserLayout from "../../components/user/UserLayout";
import StatCard from "../../components/ui/StatCard";
import { useUserDashboard } from "../../hooks/queries/useUserDashboard";
import {
  formatDate,
  formatPercent,
  formatPrice,
  formatTokenAmount,
  formatUsdt,
} from "../../lib/format";

const card =
  "rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

// 5 stat cards: 1 col on mobile, 2 on tablet, 3 + 2 (wider) on desktop, 5 in a row on very wide screens.
const statSpans = [
  "xl:col-span-2 2xl:col-span-1",
  "xl:col-span-2 2xl:col-span-1",
  "xl:col-span-2 2xl:col-span-1",
  "xl:col-span-3 2xl:col-span-1",
  "sm:col-span-2 xl:col-span-3 2xl:col-span-1",
];

function statusClasses(status) {
  const value = String(status || "").toLowerCase();
  if (["credited", "released", "approved", "completed"].includes(value))
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
  if (["failed", "rejected", "cancelled"].includes(value))
    return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400";
  return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
}

// Phase 12 cards: token balance, token price, estimated value, today's profit, today's ROI.
function buildStats(data) {
  const { symbol } = data.token;
  const today = data.today;

  return [
    {
      label: "Native Token Balance",
      value: formatTokenAmount(data.tokenBalance, symbol),
      icon: "token",
      tone: "blue",
    },
    {
      label: "Current Token Price",
      value: formatPrice(data.tokenPrice),
      helper: `Price of 1 ${symbol}`,
      icon: "price",
      tone: "green",
    },
    {
      label: "Estimated Value",
      value: formatUsdt(data.estimatedValueUsdt),
      helper: `${formatTokenAmount(data.tokenBalance)} × ${formatPrice(data.tokenPrice)}`,
      icon: "investment",
      tone: "cyan",
    },
    {
      label: "Today's Profit",
      value: formatTokenAmount(today?.tokenPayout ?? 0, symbol),
      helper: today ? `${formatUsdt(today.usdtProfit)} profit` : "Today's ROI not declared yet",
      icon: "earnings",
      tone: "purple",
    },
    {
      label: "Today's ROI",
      value: today ? formatPercent(today.roiPercent) : "—",
      helper: today ? "Daily ROI" : "Declared around 4:00 PM Malaysia Time",
      icon: "percent",
      tone: "yellow",
    },
  ];
}

export default function UserDashboard() {
  const { data, isPending, isError, error, isFetching, refetch } = useUserDashboard();
  const stats = useMemo(() => (data ? buildStats(data) : []), [data]);
  const errorMessage =
    error?.response?.data?.message || error?.message || "Unable to load your dashboard.";

  return (
    <UserLayout>
      <Header refreshing={isFetching} onRefresh={() => refetch()} />

      {isPending && !isError && <DashboardSkeleton />}

      {isError && !data && (
        <div className={`${card} flex flex-col items-center gap-3 p-8 text-center`} role="alert">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertCircle size={22} />
          </span>
          <div>
            <h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">
              Couldn't load your dashboard
            </h2>
            <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className={`inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 ${focusRing}`}
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {data && (
        <>
          {isError && (
            <p className="mb-3 text-xs text-amber-600" role="status">
              Couldn't refresh just now. Showing the last loaded data.
            </p>
          )}

          <section
            aria-label="Token overview"
            className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6 2xl:grid-cols-5"
          >
            {stats.map((item, index) => (
              <div key={item.label} className={`min-w-0 ${statSpans[index]}`}>
                <StatCard item={item} />
              </div>
            ))}
          </section>

          <TodayRoi data={data} />
          <ExitOptions data={data} />
        </>
      )}
    </UserLayout>
  );
}

function Header({ refreshing, onRefresh }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] dark:text-white sm:text-[29px]">
          User Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">
          Your investment, ROI and token overview
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className={`inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#dce5ef] bg-white px-3 text-xs font-semibold text-[#496783] shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-[#263752] dark:bg-[#101f38] dark:text-slate-300 sm:self-auto ${focusRing}`}
      >
        <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
      </button>
    </div>
  );
}

// Phase 3 (price snapshot) + Phase 9 (USDT profit ÷ token price = token payout).
function TodayRoi({ data }) {
  const { today, token } = data;

  return (
    <section className={`${card} mb-5 min-w-0 p-4 sm:p-5`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-bold text-[#112f55] dark:text-white">Today's ROI payout</h2>
          <p className="mt-1 text-xs text-[#64809f] dark:text-[#90a5c4]">
            Profit is calculated in USDT and paid to you in {token.symbol} at the token price of the day.
          </p>
        </div>
        {today && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#64809f] dark:text-[#90a5c4]">{formatDate(today.date)}</span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses(today.status)}`}>
              {today.status}
            </span>
          </div>
        )}
      </div>

      {!today ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#e4ebf4] bg-[#f7faff] p-4 dark:border-[#263752] dark:bg-[#0d1a2e]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Clock3 size={18} />
          </span>
          <div>
            <p className="m-0 text-sm font-semibold text-[#112f55] dark:text-white">
              Today's ROI hasn't been declared yet
            </p>
            <p className="mt-1 text-xs text-[#64809f] dark:text-[#90a5c4]">
              The daily ROI is declared around 4:00 PM Malaysia Time. Your payout will show up here once it is released.
            </p>
          </div>
        </div>
      ) : (
        <>
          <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Investment", formatUsdt(today.investmentUsdt)],
              ["Daily ROI", formatPercent(today.roiPercent)],
              ["USDT profit", formatUsdt(today.usdtProfit)],
              ["Token price", formatPrice(today.tokenPrice)],
              ["Token payout", formatTokenAmount(today.tokenPayout, token.symbol)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-[#e4ebf4] bg-[#fbfdff] p-3 dark:border-[#263752] dark:bg-[#0d1a2e]"
              >
                <dt className="text-[11px] font-medium text-[#68809d] dark:text-slate-400">{label}</dt>
                <dd className="m-0 mt-1 truncate text-sm font-bold text-[#163a62] dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            {formatUsdt(today.usdtProfit)} ÷ {formatPrice(today.tokenPrice)} ={" "}
            {formatTokenAmount(today.tokenPayout, token.symbol)}
          </p>
          <p className="mt-2 text-[11px] text-[#64809f] dark:text-[#90a5c4]">
            The token price is saved with every payout, so past payouts never change when the price moves later.
          </p>
        </>
      )}
    </section>
  );
}

// Phase 14 (PancakeSwap exit) + Phase 15 (Sell Tokens / platform buyback).
function ExitOptions({ data }) {
  const { token, dex, buyback } = data;

  return (
    <section className="min-w-0">
      <div className="mb-3">
        <h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">Turn tokens into USDT</h2>
        <p className="mt-1 text-xs text-[#64809f] dark:text-[#90a5c4]">
          Choose the route that suits you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <article className={`${card} flex min-w-0 flex-col p-4 sm:p-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
              <ArrowLeftRight size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-sm font-bold text-[#112f55] dark:text-white">Trade on {dex.name}</h3>
              <p className="m-0 mt-0.5 text-[11px] text-[#64809f] dark:text-[#90a5c4]">
                {token.symbol} → {dex.name} → USDT / USDC
              </p>
            </div>
          </div>
          <p className="mt-3 flex-1 text-xs leading-5 text-[#3e5d83] dark:text-[#b4c4dc]">
            Swap with your own crypto wallet. The price you receive depends on liquidity and market conditions,
            so it can differ from the token price shown above.
          </p>
          {dex.url ? (
            <a
              href={dex.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-300 dark:hover:bg-blue-500/10 ${focusRing}`}
            >
              Trade Token <ExternalLink size={14} />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="mt-4 inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-400 dark:border-[#263752]"
            >
              Trade Token unavailable
            </button>
          )}
        </article>

        <article className={`${card} flex min-w-0 flex-col p-4 sm:p-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Landmark size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-sm font-bold text-[#112f55] dark:text-white">Sell to the platform</h3>
              <p className="m-0 mt-0.5 text-[11px] text-[#64809f] dark:text-[#90a5c4]">
                {token.symbol} → Platform buyback → USDT → Withdrawal
              </p>
            </div>
          </div>
          <p className="mt-3 flex-1 text-xs leading-5 text-[#3e5d83] dark:text-[#b4c4dc]">
            {buyback.active
              ? `Sell your tokens at the buyback price of ${formatPrice(buyback.price)} per ${token.symbol}, then withdraw the USDT.`
              : "Buyback is not available right now. Please check back later."}
          </p>
          {buyback.active ? (
            <Link
              to="/user/buyback"
              className={`mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 ${focusRing}`}
            >
              Sell Tokens
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-4 inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg bg-slate-100 px-4 text-xs font-semibold text-slate-400 dark:bg-[#0d1a2e]"
            >
              Sell Tokens
            </button>
          )}
        </article>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6 2xl:grid-cols-5">
        {statSpans.map((span, index) => (
          <div
            key={index}
            className={`h-[112px] animate-pulse rounded-xl border border-[#dce9f7] bg-slate-100 dark:border-[#223250] dark:bg-[#101f38] ${span}`}
          />
        ))}
      </div>
      <div className="mb-5 h-56 animate-pulse rounded-xl border border-[#dce9f7] bg-slate-100 dark:border-[#223250] dark:bg-[#101f38]" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="h-44 animate-pulse rounded-xl border border-[#dce9f7] bg-slate-100 dark:border-[#223250] dark:bg-[#101f38]" />
        <div className="h-44 animate-pulse rounded-xl border border-[#dce9f7] bg-slate-100 dark:border-[#223250] dark:bg-[#101f38]" />
      </div>
    </div>
  );
}
