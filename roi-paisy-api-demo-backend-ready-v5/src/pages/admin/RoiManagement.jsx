import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/ui/StatCard";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getRoiManagementApi, getRoiManagementByIdApi, createRoiManagementApi, updateRoiManagementApi, deleteRoiManagementApi } from "../../services/admin/roiManagementApi";
import {
  roi as fallbackRoi,
  roiStats as fallbackStats,
  roiEligibleInvestors,
  roiTokenPrice,
} from "../../mock/data/roi";

function currency(value, suffix = "USDT") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${number.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${suffix}`;
}

const STATUS_TONES = {
  completed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  reconciled: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  approved: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  processing: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  failed: "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400",
};

function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        STATUS_TONES[key] || "bg-slate-50 text-slate-500 dark:bg-white/10 dark:text-slate-300"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function RoiManagement() {
  // ---- Daily ROI entry + preview + approve & release ------------------
  const [roiPercent, setRoiPercent] = useState("0.30");
  const [previewRows, setPreviewRows] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState("");
  const [lastRelease, setLastRelease] = useState(null);
  const [releasedRuns, setReleasedRuns] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const parsedRoi = Number(roiPercent);
  const canPreview = Number.isFinite(parsedRoi) && parsedRoi > 0;

  const handlePreview = () => {
    if (!canPreview) return;
    const rows = roiEligibleInvestors.map((investor) => {
      const usdtProfit = investor.investment * (parsedRoi / 100);
      const tokenPayout = usdtProfit / roiTokenPrice;
      return { ...investor, usdtProfit, tokenPayout };
    });
    setPreviewRows(rows);
    setLastRelease(null);
    setReleaseError("");
  };

  const previewTotals = useMemo(() => {
    if (!previewRows) return null;
    return previewRows.reduce(
      (acc, row) => ({
        users: acc.users + 1,
        usdtProfit: acc.usdtProfit + row.usdtProfit,
        tokenPayout: acc.tokenPayout + row.tokenPayout,
      }),
      { users: 0, usdtProfit: 0, tokenPayout: 0 }
    );
  }, [previewRows]);

  const handleRoiChange = (event) => {
    setRoiPercent(event.target.value);
    setPreviewRows(null);
    setLastRelease(null);
  };

  const handleCancelPreview = () => {
    setPreviewRows(null);
    setReleaseError("");
  };

  const handleApproveRelease = async () => {
    if (!previewTotals) return;
    setReleasing(true);
    setReleaseError("");

    const payload = {
      roiPercent: `${parsedRoi.toFixed(2)}%`,
      date: `${new Date().toISOString().slice(0, 10)} 16:00`,
      totalUsers: previewTotals.users,
      usdtProfit: currency(previewTotals.usdtProfit),
      tokenPrice: currency(roiTokenPrice),
      tokenPayout: currency(previewTotals.tokenPayout, "AMGP"),
      status: "Completed",
    };

    try {
      const response = await createRoiManagementApi(payload);
      const created = response?.data ?? payload;
      const run = { id: created.id || `ROI-${Date.now()}`, ...payload, ...created };
      setReleasedRuns((prev) => [run, ...prev]);
      setLastRelease(run);
      setPreviewRows(null);
    } catch (error) {
      // Demo backend always succeeds; this guards a real backend failure.
      setReleaseError(error?.message || "Could not release the payout. Please try again.");
    } finally {
      setReleasing(false);
    }
  };

  // ---- Run history ------------------------------------------------------
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search, 400);

  const {
    data: response,
    isPending,
    isFetching,
    error,
    refetch,
  } = usePaginatedQuery({
    queryKey: ["admin-roi-management"],
    api: getRoiManagementApi,
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payload = useMemo(() => response?.data ?? response ?? {}, [response]);
  const fetchedRuns = payload?.items ?? fallbackRoi;
  const runs = useMemo(() => [...releasedRuns, ...fetchedRuns], [releasedRuns, fetchedRuns]);

  const total = Number(payload?.total ?? runs.length) + releasedRuns.length;
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / limit)));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, limit]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  const stats = useMemo(() => {
    if (!lastRelease) return fallbackStats;
    return fallbackStats.map((item) => {
      if (item.label === "Token payout today") return { ...item, value: lastRelease.tokenPayout };
      if (item.label === "Today's USDT profit") return { ...item, value: lastRelease.usdtProfit };
      return item;
    });
  }, [lastRelease]);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <TrendingUp size={20} />
        </span>
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[#112e52] dark:text-white sm:text-[29px]">
            ROI Management
          </h1>
          <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">
            Set daily ROI, preview the token conversion, then approve and release.
          </p>
        </div>
      </div>

      <section className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      {/* Set today's ROI */}
      <section className="mb-4 rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        <p className="m-0 mb-3 text-sm font-bold text-[#112f55] dark:text-white">Set today's ROI</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#254a77] dark:text-[#90a5c4]">
              Daily ROI (%)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={roiPercent}
              onChange={handleRoiChange}
              placeholder="e.g. 0.30"
              className="input w-[140px]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#254a77] dark:text-[#90a5c4]">
              Effective date
            </span>
            <input readOnly value={today} className="input w-[160px] opacity-70" />
          </label>

          <button
            onClick={handlePreview}
            disabled={!canPreview}
            className="h-[42px] rounded-lg border border-[#d9e6f4] bg-white px-4 text-sm font-semibold text-[#2d5077] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce9f7]"
          >
            Preview calculation
          </button>

          <span className="text-xs text-[#68809d] dark:text-[#7189a8]">
            Token price used: {currency(roiTokenPrice)} / AMGP
          </span>
        </div>
      </section>

      {/* Preview */}
      {previewRows && (
        <section className="mb-4 overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
          <div className="border-b border-slate-100 p-4 dark:border-[#223250]">
            <p className="m-0 text-sm font-bold text-[#112f55] dark:text-white">
              Preview — eligible users
            </p>
            <p className="mt-1 text-xs text-[#68809d] dark:text-[#7189a8]">
              Review every user before releasing. Nothing is credited until you approve.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#f2f7fc] text-[10px] font-semibold text-[#426287] dark:bg-[#0d1a2e] dark:text-[#90a5c4]">
                  <th className="px-3 py-3">USER</th>
                  <th className="px-3 py-3">INVESTMENT</th>
                  <th className="px-3 py-3">ROI</th>
                  <th className="px-3 py-3">USDT PROFIT</th>
                  <th className="px-3 py-3">TOKEN PRICE</th>
                  <th className="px-3 py-3">TOKEN PAYOUT</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 text-[12px] text-[#274c76] last:border-0 dark:border-[#1b2c46] dark:text-[#dce9f7]"
                  >
                    <td className="px-3 py-3">
                      <p className="m-0 font-semibold">{row.user}</p>
                      <p className="m-0 text-[10px] text-[#7189a8]">{row.wallet}</p>
                    </td>
                    <td className="px-3 py-3">{currency(row.investment)}</td>
                    <td className="px-3 py-3">{parsedRoi.toFixed(2)}%</td>
                    <td className="px-3 py-3">{currency(row.usdtProfit)}</td>
                    <td className="px-3 py-3">{currency(roiTokenPrice)}</td>
                    <td className="px-3 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {currency(row.tokenPayout, "AMGP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#dce9f7] bg-blue-50/60 p-4 dark:border-[#223250] dark:bg-blue-500/10 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-[#0c447c] dark:text-blue-300">
              {previewTotals.users} users will receive a total of{" "}
              {currency(previewTotals.tokenPayout, "AMGP")}. This action cannot be undone.
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleCancelPreview}
                disabled={releasing}
                className="h-10 rounded-lg border border-[#d9e6f4] bg-white px-4 text-xs font-semibold text-[#2d5077] hover:bg-slate-50 disabled:opacity-50 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce9f7]"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveRelease}
                disabled={releasing}
                className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {releasing && <Loader2 size={14} className="animate-spin" />}
                Approve and release
              </button>
            </div>
          </div>

          {releaseError && (
            <div className="flex items-center gap-2 border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10">
              <AlertTriangle size={14} />
              {releaseError}
            </div>
          )}
        </section>
      )}

      {lastRelease && !previewRows && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={15} />
          ROI released — {lastRelease.totalUsers} users credited {lastRelease.tokenPayout}.
        </div>
      )}

      {/* History */}
      <section className="mb-3 grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-[#dce9f7] bg-white p-3 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_120px]">
        <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#d9e6f4] px-3 text-[#577699] dark:border-[#223250]">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ROI runs by ID or date..."
            className="min-w-0 flex-1 bg-transparent text-xs text-[#24496f] outline-none placeholder:text-[#6681a2] dark:text-[#dce9f7]"
          />
        </div>

        <Dropdown
          value={status}
          onChange={setStatus}
          fullWidth
          options={[
            { value: "all", label: "All status" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" },
          ]}
        />

        <button
          onClick={handleReset}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#d9e6f4] bg-white text-xs font-semibold text-[#2d5077] hover:bg-slate-50 dark:border-[#223250] dark:bg-[#0d1a2e] dark:text-[#dce9f7]"
        >
          <RefreshCw size={15} />
          Reset
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#dce9f7] bg-white shadow-sm dark:border-[#223250] dark:bg-[#101f38]">
        {isPending && !runs.length ? (
          <div className="space-y-2 p-3 sm:p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-[#16283f]" />
            ))}
          </div>
        ) : error && !response && !runs.length ? (
          <div className="p-10 text-center">
            <p className="text-sm text-rose-500">{error.message || "Unable to load ROI history."}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-[#223250] dark:text-[#90a5c4]"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {isFetching && (
              <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500 dark:border-[#223250] dark:text-[#90a5c4]">
                <RefreshCw size={12} className="animate-spin" />
                Loading...
              </div>
            )}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="bg-[#f2f7fc] text-left text-[10px] font-semibold text-[#426287] dark:bg-[#0d1a2e] dark:text-[#90a5c4]">
                    <th className="px-3 py-3">RUN ID</th>
                    <th className="px-3 py-3">DATE</th>
                    <th className="px-3 py-3">ROI</th>
                    <th className="px-3 py-3">USERS</th>
                    <th className="px-3 py-3">USDT PROFIT</th>
                    <th className="px-3 py-3">TOKEN PRICE</th>
                    <th className="px-3 py-3">TOKEN PAYOUT</th>
                    <th className="px-3 py-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="border-b border-slate-100 text-[12px] text-[#274c76] last:border-0 dark:border-[#1b2c46] dark:text-[#dce9f7]"
                    >
                      <td className="px-3 py-3 font-semibold">{run.id}</td>
                      <td className="px-3 py-3">{run.date}</td>
                      <td className="px-3 py-3">{run.roiPercent}</td>
                      <td className="px-3 py-3">{run.totalUsers}</td>
                      <td className="px-3 py-3">{run.usdtProfit}</td>
                      <td className="px-3 py-3">{run.tokenPrice}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {run.tokenPayout}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={run.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 p-3 lg:hidden">
              {runs.map((run) => (
                <article
                  key={run.id}
                  className="min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm dark:border-[#223250]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold text-slate-800 dark:text-white">{run.id}</p>
                      <p className="m-0 mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#90a5c4]">
                        <Clock3 size={11} />
                        {run.date}
                      </p>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">ROI</span>
                      <strong className="mt-1 block text-slate-700 dark:text-[#dce9f7]">{run.roiPercent}</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">Users</span>
                      <strong className="mt-1 block text-slate-700 dark:text-[#dce9f7]">{run.totalUsers}</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">USDT profit</span>
                      <strong className="mt-1 block truncate text-slate-700 dark:text-[#dce9f7]">
                        {run.usdtProfit}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                      <span className="block text-slate-400 dark:text-[#7189a8]">Token payout</span>
                      <strong className="mt-1 block truncate text-emerald-600 dark:text-emerald-400">
                        {run.tokenPayout}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!runs.length && <div className="p-10 text-center text-sm text-slate-400">No ROI runs found.</div>}

            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />

            <div className="border-t border-slate-100 px-3 py-2 text-right text-[10px] text-slate-400 dark:border-[#223250]">
              <label className="flex items-center gap-1.5">
                Rows
                <Dropdown
                  value={limit}
                  onChange={(val) => setLimit(Number(val))}
                  icon={null}
                  className="!h-8 !rounded-lg !px-2.5 !text-[11px]"
                  options={[
                    { value: 10, label: "10" },
                    { value: 20, label: "20" },
                    { value: 50, label: "50" },
                  ]}
                />
              </label>
            </div>
          </>
        )}
      </section>

      {selectedInvestor && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedInvestor(null); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#dce9f7] bg-white p-5 shadow-2xl dark:border-[#223250] dark:bg-[#101f38]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="m-0 text-lg font-bold text-[#112e52] dark:text-white">User ROI Preview</p>
                <p className="mt-1 text-xs text-[#68809d] dark:text-[#90a5c4]">User-level calculation for the current ROI release.</p>
              </div>
              <button onClick={() => setSelectedInvestor(null)} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">×</button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                ["User", selectedInvestor.user],
                ["Investment", currency(selectedInvestor.investment)],
                ["ROI", `${Number(selectedInvestor.roiPercent).toFixed(2)}%`],
                ["USDT Profit", currency(selectedInvestor.usdtProfit)],
                ["Token Price", currency(selectedInvestor.tokenPrice)],
                ["AMGP Payout", currency(selectedInvestor.tokenPayout, "AMGP")],
                ["Wallet", selectedInvestor.wallet],
                ["Investment ID", selectedInvestor.id],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-[#7189a8]">{label}</span>
                  <strong className="mt-1 block break-all text-sm text-slate-700 dark:text-[#dce9f7]">{value}</strong>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              Calculation: USDT Profit = Investment × ROI. AMGP Payout = USDT Profit ÷ Token Price.
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          height: 42px;
          border-radius: 0.5rem;
          border: 1px solid #d9e6f4;
          background: #fff;
          padding: 0 0.75rem;
          font-size: 12.5px;
          color: #24496f;
          outline: none;
        }
        .dark .input { background: #101f38; border-color: #223250; color: #dce9f7; }
      `}</style>
    </AdminLayout>
  );
}
