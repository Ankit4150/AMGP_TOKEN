import { create } from "zustand";
import { loginApi, getMeApi, logoutApi } from "../services/auth/authApi";
export const ADMIN_ROLES = [
  "admin",
  "superAdmin",
  "operationsAdmin",
  "financeAdmin",
  "complianceAdmin",
  "supportAdmin",
];
export const ROLE_PERMISSIONS = {
  superAdmin: ["*"],
  admin: [
    "dashboard",
    "users",
    "kyc",
    "tokens",
    "buyback",
    "wallets",
    "reports",
    "settings",
    "investments",
    "roi",
    "withdrawals",
    "transactions",
    "reconciliation",
    "auditLogs",
    "notifications",
    "accessControl",
  ],
  operationsAdmin: [
    "dashboard",
    "investments",
    "roi",
    "transactions",
    "notifications",
  ],
  financeAdmin: [
    "dashboard",
    "tokens",
    "buyback",
    "withdrawals",
    "transactions",
    "reconciliation",
    "reports",
  ],
  complianceAdmin: [
    "dashboard",
    "users",
    "kyc",
    "auditLogs",
    "reports",
    "notifications",
  ],
  supportAdmin: ["dashboard", "users", "notifications"],
};
export const hasPermission = (role, key) => {
  const p = ROLE_PERMISSIONS[role] || [];
  return p.includes("*") || p.includes(key);
};
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  initialize: async () => {
    try {
      const r = await getMeApi();
      const u = r?.data?.user || r?.user;
      if (u) set({ user: u, isAuthenticated: true });
      else set({ user: null, isAuthenticated: false });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const r = await loginApi({ email: email.trim(), password });
      let u = r?.data?.user || r?.user;
      if (!u) {
        const m = await getMeApi();
        u = m?.data?.user || m?.user;
      }
      if (!u) throw new Error("Invalid login response");
      set({ user: u, isAuthenticated: true, isLoading: false });
      return { success: true, user: u };
    } catch (e) {
      set({ isLoading: false });
      return {
        success: false,
        error: e?.response?.data?.message || e?.message || "Login failed",
      };
    }
  },
  logout: async () => {
  try {
    await logoutApi();
  } catch {}

  set({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
},
  hasPermission: (key) => hasPermission(get().user?.role, key),
}));
window.addEventListener("auth:unauthorized", () => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
  if (!window.location.pathname.includes("login"))
    window.location.replace("/login");
});
