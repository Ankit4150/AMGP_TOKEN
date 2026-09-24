import React, { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getTokenManagementApi, getTokenManagementByIdApi, createTokenManagementApi, updateTokenManagementApi, deleteTokenManagementApi } from "../../services/admin/tokenManagementApi";
import {
  Coins,
  Copy,
  Droplets,
  Eye,
  X,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const DEFAULT_TOKEN = {
  name: "Native Token",
  symbol: "AMGP",
  contractAddress: "0xA1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  network: "BNB Smart Chain / BEP-20",
  totalSupply: "10,000,000,000",
  decimals: 18,
  contractStatus: "Active",
};

const DEFAULT_SUMMARY = {
  tokenPrice: "0.50 USDT",
  priceChange: "+2.5%",
  treasury: "245,000 TOKEN",
  distributed: "1,250,000 TOKEN",
};

const DEFAULT_WALLETS = [
  { label: "Token Treasury", address: "0x12a3...9f8c", amount: "95,000 TOKEN", tone: "green" },
  { label: "Reward Distribution", address: "0x34b5...2d7e", amount: "80,000 TOKEN", tone: "orange" },
  { label: "Liquidity", address: "0x56c7...8e1f", amount: "40,000 TOKEN", tone: "blue" },
  { label: "Buyback", address: "0x78e9...4a2b", amount: "20,000 TOKEN", tone: "amber" },
  { label: "Operational / Marketing", address: "0x91e0...7c3d", amount: "10,000 TOKEN", tone: "purple" },
];

const DEFAULT_LIQUIDITY = {
  pool: "AMGP/USDT",
  liquidity: "250,000 USDT",
  network: "BNB Smart Chain / BEP-20",
  status: "Active",
};

function payloadFrom(response) {
  return response?.data ?? response ?? {};
}

function getItems(payload) {
  return payload?.items ?? payload?.tokens ?? payload?.transactions ?? [];
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const styles = normalized === "completed" || normalized === "active"
    ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
    : normalized === "processing"
      ? "bg-blue-50 text-blue-600 ring-blue-100"
      : normalized === "pending"
        ? "bg-amber-50 text-amber-600 ring-amber-100"
        : normalized === "failed"
          ? "bg-rose-50 text-rose-600 ring-rose-100"
          : "bg-slate-50 text-slate-600 ring-slate-100";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "-"}
    </span>
  );
}

function SectionCard({ title, icon: Icon, action, className = "", children }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-[#e4ecf7] bg-white shadow-[0_8px_30px_rgba(32,74,135,0.05)] ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#edf2f8] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon size={16} />
          </span>
          <h2 className="truncate text-sm font-bold text-[#18365f]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function KpiCard({ label, value, hint, icon: Icon, tone }) {
  const tones = {
    purple: "bg-violet-100 text-violet-600",
    green: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-[#e4ecf7] bg-white p-4 shadow-[0_8px_30px_rgba(32,74,135,0.05)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#6c82a0]">{label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <strong className="truncate text-xl font-bold tracking-tight text-[#17355f] sm:text-[23px]">{value}</strong>
            {tone === "purple" && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">↑ {hint}</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-[#8aa0bb]">{tone === "purple" ? "Current price per token" : hint}</p>
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, children }) {
  return (
    <div className="grid grid-cols-[minmax(115px,1fr)_minmax(0,1.5fr)] gap-3 border-b border-[#f0f4f8] py-2.5 last:border-b-0 sm:grid-cols-[145px_minmax(0,1fr)]">
      <span className="text-xs text-[#6d83a0]">{label}</span>
      <div className="min-w-0 text-xs font-medium text-[#1d3d67]">{children}</div>
    </div>
  );
}

function WalletIcon({ tone }) {
  const colors = {
    green: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-violet-100 text-violet-600",
  };
  return <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${colors[tone] || colors.blue}`}><Wallet size={16} /></span>;
}

function DistributionDetailsModal({ item, onClose }) {
  if (!item) return null;

  const user = item.user || item.name || item.email || "Unknown User";
  const roi = item.roi || item.roiRate || "0.30%";
  const usdtProfit = item.usdtProfit || item.amount || "30 USDT";
  const tokenPrice = item.tokenPrice || "0.50";
  const tokenQuantity = item.tokenQuantity || item.tokenAmount || "60";
  const status = item.status || "Completed";
  const txId = item.txId || item.txHash || item.id || "-";
  const date = item.date || item.createdAt || "-";
  const id = item.id || item._id || "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a4d]/35 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-distribution-details-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#dce7f5] bg-white shadow-[0_24px_70px_rgba(22,55,95,0.20)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#edf2f8] px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Eye size={17} />
            </span>
            <div className="min-w-0">
              <h3 id="token-distribution-details-title" className="text-sm font-bold text-[#18365f] sm:text-base">Token Distribution Details</h3>
              <p className="mt-0.5 truncate text-[11px] text-[#8195ae]">{id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dfe8f4] text-[#7087a3] hover:bg-slate-50"
            aria-label="Close details"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <div className="rounded-xl border border-[#e7eef7] bg-[#f8faff] p-4 sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9db5]">User</p>
            <p className="mt-1 break-all text-sm font-semibold text-[#24466f]">{user}</p>
          </div>
          <DataRow label="ROI">{roi}</DataRow>
          <DataRow label="USDT Profit">{usdtProfit}</DataRow>
          <DataRow label="Token Price">{tokenPrice} USDT</DataRow>
          <DataRow label="Token Quantity">{tokenQuantity} TOKEN</DataRow>
          <DataRow label="Status"><StatusBadge status={status} /></DataRow>
          <DataRow label="Distribution ID">{id}</DataRow>
          <div className="sm:col-span-2">
            <DataRow label="Transaction ID">
              <span className="break-all text-blue-600">{txId}</span>
            </DataRow>
            <DataRow label="Date & Time">{date}</DataRow>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionTable({ items, page, totalPages, total, limit, setPage, search, setSearch, status, setStatus, refetch, loading, updating }) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <>
      <SectionCard
        title="Token Distribution"
        icon={Coins}
        className="xl:col-span-12"
        action={
          <button onClick={() => refetch()} className="grid h-8 w-8 place-items-center rounded-lg border border-[#dfe8f4] text-[#6b82a0] hover:bg-slate-50" title="Refresh distribution">
            <RefreshCw size={14} className={updating ? "animate-spin" : ""} />
          </button>
        }
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "processing", "completed", "failed"].map((value) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${status === value ? "bg-[#3157e8] text-white shadow-sm" : "bg-[#f4f7fc] text-[#5f7695] hover:bg-[#edf2fb]"}`}
              >
                {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-[#dfe8f4] px-3 sm:w-[245px]">
            <Search size={14} className="shrink-0 text-[#97a8bd]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-[#23466f] outline-none placeholder:text-[#a3b0c0]" placeholder="Search user or tx id" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : !items.length ? (
          <div className="rounded-xl border border-dashed border-[#dfe8f4] px-4 py-10 text-center text-xs text-[#8ea2bb]">No token distribution records found.</div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-[#e3ebf5] md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full text-left text-[11px]">
                  <thead className="bg-[#f7f9fd] text-[9px] font-bold uppercase tracking-wide text-[#7b8fa8]">
                    <tr>
                      {['User', 'ROI', 'USDT Profit', 'Token Price', 'Token Qty', 'Status', 'Tx ID', 'Action'].map((head) => (
                        <th
                          key={head}
                          className={`whitespace-nowrap px-3 py-3 ${head === 'Action' ? 'sticky right-0 bg-[#f7f9fd] text-center shadow-[-8px_0_14px_rgba(232,238,246,0.9)]' : ''}`}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const id = item.id || item._id || `row-${index}`;
                      return (
                        <tr key={id} className="border-t border-[#edf2f7] text-[#425f82]">
                          <td className="whitespace-nowrap px-3 py-3 font-medium text-[#26476e]">{item.user || item.name || item.email || `User ${index + 1}`}</td>
                          <td className="whitespace-nowrap px-3 py-3">{item.roi || item.roiRate || "0.30%"}</td>
                          <td className="whitespace-nowrap px-3 py-3">{item.usdtProfit || item.amount || "30 USDT"}</td>
                          <td className="whitespace-nowrap px-3 py-3">{item.tokenPrice || "0.50"}</td>
                          <td className="whitespace-nowrap px-3 py-3">{item.tokenQuantity || item.tokenAmount || "60"}</td>
                          <td className="whitespace-nowrap px-3 py-3"><StatusBadge status={item.status || "Completed"} /></td>
                          <td className="max-w-[150px] whitespace-nowrap px-3 py-3 font-medium text-blue-600">{item.txId || item.txHash || item.id || "-"}</td>
                          <td className="sticky right-0 whitespace-nowrap bg-white px-3 py-2 text-center shadow-[-8px_0_14px_rgba(232,238,246,0.9)]">
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              title="View full details"
                              aria-label={`View full details for ${item.user || item.name || item.email || `User ${index + 1}`}`}
                              className="inline-grid h-8 w-8 place-items-center rounded-lg border border-[#dce6f3] text-[#567395] transition hover:border-[#bfcff0] hover:bg-indigo-50 hover:text-[#3157e8]"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-2 md:hidden">
              {items.map((item, index) => {
                const id = item.id || item._id || `mobile-row-${index}`;
                return (
                  <article key={id} className="rounded-xl border border-[#e3ebf5] bg-white p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#26476e]">{item.user || item.name || item.email || `User ${index + 1}`}</p>
                        <p className="mt-1 truncate text-[10px] text-[#91a3b8]">{item.txId || item.txHash || item.id || "No transaction id"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={item.status || "Completed"} />
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          title="View full details"
                          aria-label="View full details"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce6f3] text-[#567395] hover:bg-indigo-50 hover:text-[#3157e8]"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-[#f7f9fd] p-2"><span className="block text-[9px] uppercase text-[#8da0b7]">ROI</span><strong className="text-[10px] text-[#345577]">{item.roi || item.roiRate || "0.30%"}</strong></div>
                      <div className="rounded-lg bg-[#f7f9fd] p-2"><span className="block text-[9px] uppercase text-[#8da0b7]">USDT Profit</span><strong className="text-[10px] text-[#345577]">{item.usdtProfit || item.amount || "30 USDT"}</strong></div>
                      <div className="rounded-lg bg-[#f7f9fd] p-2"><span className="block text-[9px] uppercase text-[#8da0b7]">Token Price</span><strong className="text-[10px] text-[#345577]">{item.tokenPrice || "0.50"}</strong></div>
                      <div className="rounded-lg bg-[#f7f9fd] p-2"><span className="block text-[9px] uppercase text-[#8da0b7]">Token Qty</span><strong className="text-[10px] text-[#345577]">{item.tokenQuantity || item.tokenAmount || "60"}</strong></div>
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </SectionCard>

      <DistributionDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}

export default function TokenManagement() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 6;

  const { data: response, isPending, isFetching, isError, error, refetch } = usePaginatedQuery({
    queryKey: ["admin-token-management"],
    api: getTokenManagementApi,
    endpoint: "/admin/tokens",
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const payload = useMemo(() => payloadFrom(response), [response]);
  const items = useMemo(() => getItems(payload), [payload]);
  const total = Number(payload?.total ?? items.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / limit)));

  const summary = { ...DEFAULT_SUMMARY, ...(payload?.summary || {}) };
  const token = { ...DEFAULT_TOKEN, ...(payload?.token || payload?.overview || {}) };
  const wallets = payload?.wallets?.length ? payload.wallets : DEFAULT_WALLETS;
  const liquidity = { ...DEFAULT_LIQUIDITY, ...(payload?.liquidity || payload?.liquidityInfo || {}) };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.contractAddress);
    } catch {
      // Clipboard may be unavailable in non-secure preview environments.
    }
  };

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-indigo-100"><Coins size={22} /></span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight text-[#17355f] sm:text-[29px]">Token Management</h1>
                <p className="mt-0.5 text-xs text-[#7187a4] sm:text-sm">Manage token details, price, treasury, distribution and buyback settings.</p>
              </div>
            </div>
          </div>
          <button onClick={() => refetch()} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#dfe8f4] bg-white px-3 text-xs font-semibold text-[#5e7594] shadow-sm hover:bg-slate-50" disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {isError && !response ? (
          <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-rose-500">{error?.message || "Unable to load token management data."}</p>
            <button onClick={() => refetch()} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Try again</button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <KpiCard label="Token Price" value={summary.tokenPrice} hint={summary.priceChange} icon={Coins} tone="purple" />
              <KpiCard label="Treasury Balance" value={summary.treasury} hint="Total tokens in treasury" icon={Wallet} tone="green" />
            </div>

            <div className="grid gap-4 xl:grid-cols-12">
              <SectionCard
                title="Token Overview"
                icon={ShieldCheck}
                className="xl:col-span-7"
                action={<button className="rounded-lg border border-[#dfe8f4] px-3 py-1.5 text-[10px] font-semibold text-[#557092]">Edit</button>}
              >
                <div>
                  <DataRow label="Token Name">{token.name}</DataRow>
                  <DataRow label="Symbol">{token.symbol}</DataRow>
                  <DataRow label="Contract Address">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 truncate">{token.contractAddress}</span>
                      <button onClick={copyAddress} className="shrink-0 text-[#7d93ae]" title="Copy contract address"><Copy size={14} /></button>
                    </div>
                  </DataRow>
                  <DataRow label="Network"><span>{token.network}</span></DataRow>
                  <DataRow label="Total Supply">{token.totalSupply}</DataRow>
                  <DataRow label="Decimals">{token.decimals}</DataRow>
                  <DataRow label="Contract Status"><StatusBadge status={token.contractStatus} /></DataRow>
                </div>
              </SectionCard>


              <SectionCard
                title="Treasury & Wallets"
                icon={Wallet}
                className="xl:col-span-5"
              >
                <div className="space-y-2.5">
                  {wallets.map((wallet) => (
                    <div key={wallet.label} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#edf2f8] px-3 py-2.5">
                      <WalletIcon tone={wallet.tone} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-[#345577]">{wallet.label}</p>
                        <p className="truncate text-[9px] text-[#93a5ba]">{wallet.address}</p>
                      </div>
                      <strong className="shrink-0 text-[10px] font-bold text-[#254870]">{wallet.amount}</strong>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <DistributionTable
                items={items}
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                setPage={setPage}
                search={search}
                setSearch={setSearch}
                status={status}
                setStatus={setStatus}
                refetch={refetch}
                loading={isPending}
                updating={isFetching && !isPending}
              />

              <SectionCard title="Liquidity Information" icon={Droplets} className="xl:col-span-12">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-[#f8faff] p-3.5"><p className="text-[10px] text-[#8398b1]">Pool</p><strong className="mt-1 block text-sm text-[#24496f]">{liquidity.pool}</strong></div>
                  <div className="rounded-xl bg-[#f8faff] p-3.5"><p className="text-[10px] text-[#8398b1]">Liquidity</p><strong className="mt-1 block text-sm text-[#24496f]">{liquidity.liquidity}</strong></div>
                  <div className="rounded-xl bg-[#f8faff] p-3.5"><p className="text-[10px] text-[#8398b1]">Network</p><strong className="mt-1 block truncate text-sm text-[#24496f]">{liquidity.network}</strong></div>
                  <div className="rounded-xl bg-[#f8faff] p-3.5"><p className="text-[10px] text-[#8398b1]">Pool Status</p><div className="mt-1"><StatusBadge status={liquidity.status} /></div></div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
