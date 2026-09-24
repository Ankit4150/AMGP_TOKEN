import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Clock3,
  Coins,
  Gift,
  Package,
  Percent,
  Tag,
  TrendingUp,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

const icons = {
  users: Users,
  activeUsers: Users,
  investment: CircleDollarSign,
  earnings: TrendingUp,
  roi: TrendingUp,
  token: Coins,
  treasury: WalletCards,
  buyback: Gift,
  withdrawal: WalletCards,
  pending: Clock3,
  failed: XCircle,
  packages: Package,
  totalInvestments: Clock3,
  price: Tag,
  percent: Percent,
};

const tones = {
  blue: "bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400",
  cyan: "bg-cyan-50 text-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-400",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  yellow: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  red: "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400",
};

export default function StatCard({ item }) {
  const Icon = icons[item.icon] || BarChart3;
  const isDown = item.direction === "down";
  const hasChange = item.change && item.change !== "—";

  return (
    <div className="flex min-h-[112px] min-w-0 items-center rounded-xl border border-[#dce9f7] bg-white p-4 shadow-sm dark:border-[#223250] dark:bg-[#101f38] sm:p-[18px]">
     <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12 ${tones[item.tone] || tones.blue}`}>
  <Icon className="h-5 w-5 sm:h-5 sm:w-5" />
</div>
      <div className="ml-4 min-w-0 sm:ml-4">
        <span className="block truncate text-xs font-medium text-[#254a77] dark:text-[#90a5c4] sm:text-[12px]">
          {item.label}
        </span>
        <strong className="mt-1 block truncate text-lg font-bold tracking-tight text-[#102e54] dark:text-white sm:text-[22px]">
          {item.value}
        </strong>
        {item.helper && (
          <small className="mt-0.5 block truncate text-[11px] text-[#64809f] dark:text-[#90a5c4]">
            {item.helper}
          </small>
        )}
      </div>
      {hasChange && (
        <div className={`ml-auto flex shrink-0 items-center gap-0.5 self-end pb-1 text-xs font-semibold sm:text-[12px] ${isDown ? "text-rose-500" : "text-emerald-500"}`}>
          {isDown ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
          {item.change}
        </div>
      )}
    </div>
  );
}
