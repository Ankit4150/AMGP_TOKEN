import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/ui/Pagination";
import Dropdown from "../../components/ui/Dropdown";
import { useDebounce } from "../../hooks/useDebounce";
import { usePaginatedQuery } from "../../hooks/queries/usePaginatedQuery";
import { getAdminWalletApi, getAdminWalletByIdApi, createAdminWalletApi, updateAdminWalletApi, deleteAdminWalletApi } from "../../services/admin/walletApi";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Coins,
  Copy,
  Eye,
  Gift,
  Landmark,
  Megaphone,
  RefreshCw,
  Search,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";

const DEFAULT_SUMMARY = {
  totalTreasuryValue: "122,500 USDT",
  totalTokenBalance: "245,000 TOKEN",
  activeWallets: 5,
  flaggedWallets: 0,
};

const WALLET_ICONS = {
  "Token Treasury": Landmark,
  "Reward Distribution": Gift,
  Liquidity: RefreshCw,
  Buyback: Coins,
  "Operational / Marketing": Megaphone,
};

const WALLET_TONES = {
  "Token Treasury": "bg-[#e8f0ff] text-[#2e67e8]",
  "Reward Distribution": "bg-[#dcf8ea] text-[#10a56f]",
  Liquidity: "bg-[#eef2ff] text-[#5a48e8]",
  Buyback: "bg-[#fff2e0] text-[#b9761f]",
  "Operational / Marketing": "bg-[#fbe8f2] text-[#c22a76]",
};

function getPayload(response) {
  return response?.data ?? response ?? {};
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    processing: "bg-indigo-50 text-indigo-700 border-indigo-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    restricted: "bg-rose-50 text-rose-700 border-rose-100",
    failed: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const classes = map[normalized] || "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "-"}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <div className="rounded-2xl border border-[#dce8f6] bg-white p-5 shadow-[0_8px_24px_rgba(33,86,138,0.04)]">
      <div className="flex items-start gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="m-0 text-xs font-medium text-[#6d82a0]">{label}</p>
          <p className="m-0 mt-1 truncate text-[22px] font-bold tracking-tight text-[#163763]">{value}</p>
          <p className="m-0 mt-1 text-[11px] text-[#8194ad]">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function shortenAddress(address, front = 10, back = 6) {
  if (!address) return "-";
  if (address.length <= front + back + 3) return address;
  return `${address.slice(0, front)}...${address.slice(-back)}`;
}

function CopyableAddress({ address }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable in non-secure preview environments.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : address}
      className="flex w-full min-w-0 items-center gap-1.5 text-[10px] text-[#8ca0b7] hover:text-[#2e67e8]"
    >
      <span className="min-w-0 flex-1 truncate whitespace-nowrap font-mono">{shortenAddress(address)}</span>
      <Copy size={12} className="shrink-0" />
      {copied && <span className="shrink-0 text-emerald-500">Copied</span>}
    </button>
  );
}

function TreasuryWalletCard({ wallet }) {
  const Icon = WALLET_ICONS[wallet.label] || Wallet;
  const tone = WALLET_TONES[wallet.label] || "bg-slate-50 text-slate-600";

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#dce8f6] bg-white p-4 shadow-[0_8px_24px_rgba(33,86,138,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="m-0 truncate text-[13px] font-bold text-[#173a66]">{wallet.label}</p>
            <p className="m-0 mt-0.5 text-[10px] text-[#8ca0b7]">{wallet.type}</p>
          </div>
        </div>
        <StatusBadge status={wallet.status} />
      </div>

      <p className="m-0 mt-3 text-[11px] leading-5 text-[#5f7898]">{wallet.purpose}</p>

      <div className="mt-3 min-w-0 overflow-hidden rounded-xl border border-[#edf2f8] bg-[#fbfcfe] px-3 py-2">
        <CopyableAddress address={wallet.address} />
        <p className="m-0 mt-1 text-[10px] text-[#a3b0c0]">{wallet.network}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#f8faff] p-2.5">
          <span className="block text-[9px] uppercase text-[#8ca0b7]">Token balance</span>
          <strong className="mt-1 block text-xs font-bold text-[#183a67]">{wallet.tokenBalance}</strong>
        </div>
        <div className="rounded-xl bg-[#f8faff] p-2.5">
          <span className="block text-[9px] uppercase text-[#8ca0b7]">USDT equivalent</span>
          <strong className="mt-1 block text-xs font-bold text-[#183a67]">{wallet.usdtEquivalent}</strong>
        </div>
      </div>

      <p className="m-0 mt-3 text-[10px] text-[#a3b0c0]">Last activity: {wallet.lastActivity}</p>
    </div>
  );
}

function DetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17355b]/25 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#d9e6f4] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#edf2f7] px-5 py-4">
          <div>
            <p className="m-0 text-sm font-bold text-[#183a67]">Wallet Transaction Details</p>
            <p className="m-0 mt-1 text-[11px] text-[#8294ac]">{item.id || "Transaction"}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe8f4] text-[#6280a4] hover:bg-[#f7f9fd]">
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {[
            ["Date & Time", item.date],
            ["Wallet", item.wallet],
            ["Type", item.type],
            ["Direction", item.direction],
            ["Amount", item.amount],
            ["Value", item.value],
            ["Counterparty", item.counterparty],
            ["Transaction Hash", item.txHash],
            ["Status", item.status],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e5edf6] bg-[#fbfcfe] p-3">
              <span className="block text-[10px] uppercase tracking-wide text-[#91a2b8]">{label}</span>
              <div className="mt-1 text-xs font-semibold text-[#284c76]">
                {label === "Status" ? <StatusBadge status={value} /> : String(value || "-")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Wallets() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: response, isPending, isFetching, isError, error, refetch } = usePaginatedQuery({
    queryKey: ["admin-wallets"],
    api: getAdminWalletApi,
    page,
    limit: 5,
    search: debouncedSearch,
    status,
    extraParams: walletFilter !== "all" ? { wallet: walletFilter } : {},
  });

  const payload = useMemo(() => getPayload(response), [response]);
  const items = useMemo(() => payload?.items ?? [], [payload]);
  const total = Number(payload?.total ?? items.length);
  const totalPages = Math.max(1, Number(payload?.totalPages ?? Math.ceil(total / 5)));
  const summary = payload?.summary ?? DEFAULT_SUMMARY;
  const treasuryWallets = payload?.treasuryWallets ?? [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, walletFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => window.history.back()} className="mt-1 grid h-9 w-9 place-items-center rounded-lg text-[#547399] hover:bg-white">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="m-0 text-2xl font-bold text-[#102f56] sm:text-[29px]">Wallets</h1>
              <p className="mt-1 text-sm text-[#5f7898]">Platform treasury wallets, balances and the wallet transaction ledger.</p>
            </div>
          </div>
          <div className="rounded-lg border border-[#dfe8f4] bg-white px-3 py-2 text-xs text-[#55708f]">08 Sep 2025 · 14:32</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Landmark} label="Total Treasury Value" value={summary.totalTreasuryValue} helper="Combined USDT equivalent" tone="bg-[#e8f0ff] text-[#2e67e8]" />
          <StatCard icon={Coins} label="Total Token Balance" value={summary.totalTokenBalance} helper="Across all treasury wallets" tone="bg-[#dcf8ea] text-[#10a56f]" />
          <StatCard icon={Wallet} label="Active Wallets" value={summary.activeWallets} helper="Monitored treasury wallets" tone="bg-[#ecebff] text-[#5542e8]" />
          <StatCard icon={ShieldAlert} label="Flagged Wallets" value={summary.flaggedWallets} helper="Wallets needing review" tone="bg-[#fff2e0] text-[#b9761f]" />
        </div>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef4ff] text-[#2f68ea]"><Wallet size={16} /></div>
            <div>
              <h2 className="m-0 text-sm font-bold text-[#173a66]">Treasury Wallets</h2>
              <p className="m-0 mt-0.5 text-[11px] text-[#8294ac]">Token Treasury, Reward Distribution, Liquidity, Buyback and Operational wallets.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(treasuryWallets.length ? treasuryWallets : Array.from({ length: 5 })).map((wallet, index) =>
              wallet ? (
                <TreasuryWalletCard key={wallet.id || index} wallet={wallet} />
              ) : (
                <div key={index} className="h-[220px] animate-pulse rounded-2xl bg-slate-100" />
              )
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dce8f6] bg-white shadow-[0_8px_24px_rgba(33,86,138,0.04)]">
          <div className="border-b border-[#edf2f7] p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff] text-[#2f68ea]"><RefreshCw size={18} /></div>
                <div>
                  <h2 className="m-0 text-sm font-bold text-[#173a66]">Wallet Transaction Ledger</h2>
                  <p className="m-0 mt-1 text-[11px] text-[#8294ac]">Transfers, payouts, top-ups and rebalances across treasury wallets.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 lg:flex-row">
                <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-[#dfe8f4] px-3 lg:w-[260px]">
                  <Search size={15} className="shrink-0 text-[#99aabd]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 text-xs text-[#294c74] outline-none placeholder:text-[#a3b0c0]" placeholder="Search by hash, wallet or amount..." />
                </div>
                <Dropdown
                  value={walletFilter}
                  onChange={setWalletFilter}
                  placeholder="All Wallets"
                  options={[
                    { value: "all", label: "All Wallets" },
                    { value: "Token Treasury", label: "Token Treasury" },
                    { value: "Reward Distribution", label: "Reward Distribution" },
                    { value: "Liquidity", label: "Liquidity" },
                    { value: "Buyback", label: "Buyback" },
                    { value: "Operational / Marketing", label: "Operational / Marketing" },
                  ]}
                />
                <Dropdown
                  value={status}
                  onChange={setStatus}
                  placeholder="All Status"
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "completed", label: "Completed" },
                    { value: "processing", label: "Processing" },
                    { value: "pending", label: "Pending" },
                    { value: "failed", label: "Failed" },
                  ]}
                />
                <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe8f4] bg-white px-3 text-xs font-semibold text-[#567394] disabled:opacity-50">
                  <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {isError && !response ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-rose-500">{error?.message || "Unable to load wallet data."}</p>
              <button onClick={() => refetch()} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Try again</button>
            </div>
          ) : isPending ? (
            <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : !items.length ? (
            <div className="p-12 text-center text-sm text-[#8ba0b8]">No wallet transactions found.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[1100px] w-full text-left text-[11px]">
                  <thead className="bg-[#f8faff] text-[9px] font-bold uppercase tracking-wide text-[#7f93ac]">
                    <tr>
                      {["Date & Time", "Wallet", "Type", "Direction", "Amount", "Value", "Counterparty", "Tx Hash", "Status", "Action"].map((head) => (
                        <th key={head} className="whitespace-nowrap px-4 py-3">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id || index} className="border-t border-[#edf2f7] text-[#3f5f82]">
                        <td className="whitespace-nowrap px-4 py-3">{item.date || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-[#31567f]">{item.wallet || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.type || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex items-center gap-1 font-semibold ${item.direction === "In" ? "text-emerald-600" : "text-[#31567f]"}`}>
                            {item.direction === "In" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {item.direction || "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{item.amount || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.value || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.counterparty || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-600">{item.txHash || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button type="button" onClick={() => setSelectedItem(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce7f3] text-[#5b7798] hover:bg-[#f1f5ff] hover:text-[#315fe0]" title="View full details">
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {items.map((item, index) => (
                  <article key={item.id || index} className="rounded-xl border border-[#e2ebf5] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-xs font-bold text-[#26486f]">{item.wallet || item.id || "Wallet"}</p>
                        <p className="m-0 mt-1 truncate text-[10px] text-[#899cb4]">{item.date || "-"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <button type="button" onClick={() => setSelectedItem(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce7f3] text-[#5b7798]">
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ["Type", item.type],
                        ["Direction", item.direction],
                        ["Amount", item.amount],
                        ["Value", item.value],
                        ["Counterparty", item.counterparty],
                        ["Tx Hash", item.txHash],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-[#f8faff] p-2.5">
                          <span className="block text-[9px] uppercase text-[#8ca0b7]">{label}</span>
                          <strong className="mt-1 block break-all text-[10px] font-semibold text-[#365a82]">{value || "-"}</strong>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} total={total} limit={5} onPageChange={setPage} />
            </>
          )}
        </section>
      </div>

      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </AdminLayout>
  );
}
