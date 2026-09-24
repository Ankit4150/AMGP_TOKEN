import { ROLE_PERMISSIONS } from "../store/authStore";

// Every module key that exists in the platform (mirrors the admin sidebar).
export const ALL_PERMISSIONS = [
  "dashboard",
  "users",
  "kyc",
  "tokens",
  "buyback",
  "wallets",
  "investments",
  "roi",
  "withdrawals",
  "transactions",
  "reconciliation",
  "auditLogs",
  "notifications",
  "reports",
  "settings",
  "accessControl",
];

export const PERMISSION_LABELS = {
  dashboard: "Dashboard",
  users: "User Management",
  kyc: "KYC Verification",
  tokens: "Token Management",
  buyback: "Buyback",
  wallets: "Wallets",
  investments: "Investment Management",
  roi: "ROI Management",
  withdrawals: "Withdrawal Management",
  transactions: "Transactions",
  reconciliation: "Reconciliation",
  auditLogs: "Audit Log",
  notifications: "Notifications",
  reports: "Reports",
  settings: "Settings",
  accessControl: "Access Control",
};

// Roles from Phase 21 (Role-Based Access Control) of the platform plan.
// "admin" is a legacy/full-access role kept for backward compatibility and
// is intentionally left out of the people-facing Access Control screen.
export const ROLE_META = {
  superAdmin: {
    label: "Super Admin",
    description: "Full access to every module on the platform.",
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    ring: "ring-amber-300 dark:ring-amber-500/40",
    dot: "bg-amber-500",
  },
  financeAdmin: {
    label: "Finance Admin",
    description: "Buybacks, withdrawals and reconciliation.",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    ring: "ring-emerald-300 dark:ring-emerald-500/40",
    dot: "bg-emerald-500",
  },
  operationsAdmin: {
    label: "Operations Admin",
    description: "Daily ROI and investment operations.",
    badge:
      "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
    ring: "ring-cyan-300 dark:ring-cyan-500/40",
    dot: "bg-cyan-500",
  },
  complianceAdmin: {
    label: "Compliance Admin",
    description: "KYC/AML review and audit oversight.",
    badge:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
    ring: "ring-violet-300 dark:ring-violet-500/40",
    dot: "bg-violet-500",
  },
  supportAdmin: {
    label: "Support Admin",
    description: "User support only.",
    badge:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
    ring: "ring-slate-300 dark:ring-slate-500/40",
    dot: "bg-slate-400",
  },
};

// The roles shown as cards on the Access Control page, in display order.
export const ACCESS_CONTROL_ROLES = [
  "superAdmin",
  "financeAdmin",
  "operationsAdmin",
  "complianceAdmin",
  "supportAdmin",
];

export function permissionsForRole(role) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") ? ALL_PERMISSIONS : perms;
}

export function moduleCountForRole(role) {
  return permissionsForRole(role).length;
}
