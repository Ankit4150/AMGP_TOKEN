import { CONFIG } from "../config";

// In demo mode endpoints stay relative so the mock database can use the same
// route contract. When VITE_API_URL points to the backend, these become full URLs.
const BASE_URL = CONFIG.USE_MOCK_API ? "" : CONFIG.API_URL;

export { BASE_URL };

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    ME: `${BASE_URL}/auth/me`,
    REGISTER: `${BASE_URL}/auth/register`,
    VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
    FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
    TWO_FACTOR: `${BASE_URL}/auth/2fa`,
  },

  ADMIN: {
    DASHBOARD: {
      LIST: `${BASE_URL}/admin/dashboard`,
      GET: (id) => `${BASE_URL}/admin/dashboard/${id}`,
      CREATE: `${BASE_URL}/admin/dashboard`,
      UPDATE: (id) => `${BASE_URL}/admin/dashboard/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/dashboard/${id}`,
    },
    USERS: {
      LIST: `${BASE_URL}/admin/users`,
      GET: (id) => `${BASE_URL}/admin/users/${id}`,
      CREATE: `${BASE_URL}/admin/users`,
      UPDATE: (id) => `${BASE_URL}/admin/users/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/users/${id}`,
    },
    KYC: {
      LIST: `${BASE_URL}/admin/kyc`,
      GET: (id) => `${BASE_URL}/admin/kyc/${id}`,
      CREATE: `${BASE_URL}/admin/kyc`,
      UPDATE: (id) => `${BASE_URL}/admin/kyc/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/kyc/${id}`,
    },
    INVESTMENTS: {
      LIST: `${BASE_URL}/admin/investments`,
      GET: (id) => `${BASE_URL}/admin/investments/${id}`,
      CREATE: `${BASE_URL}/admin/investments`,
      UPDATE: (id) => `${BASE_URL}/admin/investments/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/investments/${id}`,
    },
    ROI: {
      LIST: `${BASE_URL}/admin/roi`,
      GET: (id) => `${BASE_URL}/admin/roi/${id}`,
      CREATE: `${BASE_URL}/admin/roi`,
      UPDATE: (id) => `${BASE_URL}/admin/roi/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/roi/${id}`,
    },
    TOKENS: {
      LIST: `${BASE_URL}/admin/tokens`,
      GET: (id) => `${BASE_URL}/admin/tokens/${id}`,
      CREATE: `${BASE_URL}/admin/tokens`,
      UPDATE: (id) => `${BASE_URL}/admin/tokens/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/tokens/${id}`,
    },
    BUYBACKS: {
      LIST: `${BASE_URL}/admin/buybacks`,
      GET: (id) => `${BASE_URL}/admin/buybacks/${id}`,
      CREATE: `${BASE_URL}/admin/buybacks`,
      UPDATE: (id) => `${BASE_URL}/admin/buybacks/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/buybacks/${id}`,
    },
    WITHDRAWALS: {
      LIST: `${BASE_URL}/admin/withdrawals`,
      GET: (id) => `${BASE_URL}/admin/withdrawals/${id}`,
      CREATE: `${BASE_URL}/admin/withdrawals`,
      UPDATE: (id) => `${BASE_URL}/admin/withdrawals/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/withdrawals/${id}`,
    },
    TRANSACTIONS: {
      LIST: `${BASE_URL}/admin/transactions`,
      GET: (id) => `${BASE_URL}/admin/transactions/${id}`,
      CREATE: `${BASE_URL}/admin/transactions`,
      UPDATE: (id) => `${BASE_URL}/admin/transactions/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/transactions/${id}`,
    },
    RECONCILIATION: {
      LIST: `${BASE_URL}/admin/reconciliation`,
      GET: (id) => `${BASE_URL}/admin/reconciliation/${id}`,
      CREATE: `${BASE_URL}/admin/reconciliation`,
      UPDATE: (id) => `${BASE_URL}/admin/reconciliation/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/reconciliation/${id}`,
    },
    AUDIT_LOGS: {
      LIST: `${BASE_URL}/admin/audit-logs`,
      GET: (id) => `${BASE_URL}/admin/audit-logs/${id}`,
      CREATE: `${BASE_URL}/admin/audit-logs`,
      UPDATE: (id) => `${BASE_URL}/admin/audit-logs/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/audit-logs/${id}`,
    },
    NOTIFICATIONS: {
      LIST: `${BASE_URL}/admin/notifications`,
      GET: (id) => `${BASE_URL}/admin/notifications/${id}`,
      CREATE: `${BASE_URL}/admin/notifications`,
      UPDATE: (id) => `${BASE_URL}/admin/notifications/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/notifications/${id}`,
    },
    REPORTS: {
      LIST: `${BASE_URL}/admin/reports`,
      GET: (id) => `${BASE_URL}/admin/reports/${id}`,
      CREATE: `${BASE_URL}/admin/reports`,
      UPDATE: (id) => `${BASE_URL}/admin/reports/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/reports/${id}`,
    },
    WALLETS: {
      LIST: `${BASE_URL}/admin/wallets`,
      GET: (id) => `${BASE_URL}/admin/wallets/${id}`,
      CREATE: `${BASE_URL}/admin/wallets`,
      UPDATE: (id) => `${BASE_URL}/admin/wallets/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/wallets/${id}`,
    },
    SETTINGS: {
      LIST: `${BASE_URL}/admin/settings`,
      GET: (id) => `${BASE_URL}/admin/settings/${id}`,
      CREATE: `${BASE_URL}/admin/settings`,
      UPDATE: (id) => `${BASE_URL}/admin/settings/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/settings/${id}`,
    },
    ACCESS_CONTROL: {
      LIST: `${BASE_URL}/admin/access-control`,
      GET: (id) => `${BASE_URL}/admin/access-control/${id}`,
      CREATE: `${BASE_URL}/admin/access-control`,
      UPDATE: (id) => `${BASE_URL}/admin/access-control/${id}`,
      DELETE: (id) => `${BASE_URL}/admin/access-control/${id}`,
    },
  },

  USER: {
    DASHBOARD: {
      LIST: `${BASE_URL}/user/dashboard`,
      GET: (id) => `${BASE_URL}/user/dashboard/${id}`,
      CREATE: `${BASE_URL}/user/dashboard`,
      UPDATE: (id) => `${BASE_URL}/user/dashboard/${id}`,
    },
    PROFILE: {
      GET: `${BASE_URL}/user/profile`,
      UPDATE: `${BASE_URL}/user/profile`,
    },
    KYC: {
      LIST: `${BASE_URL}/user/kyc`,
      GET: (id) => `${BASE_URL}/user/kyc/${id}`,
      CREATE: `${BASE_URL}/user/kyc`,
      UPDATE: (id) => `${BASE_URL}/user/kyc/${id}`,
    },
    WALLET: {
      LIST: `${BASE_URL}/user/wallet`,
      GET: (id) => `${BASE_URL}/user/wallet/${id}`,
      CREATE: `${BASE_URL}/user/wallet`,
      UPDATE: (id) => `${BASE_URL}/user/wallet/${id}`,
      DELETE: (id) => `${BASE_URL}/user/wallet/${id}`,
    },
    DEPOSITS: {
      LIST: `${BASE_URL}/user/deposits`,
      GET: (id) => `${BASE_URL}/user/deposits/${id}`,
      CREATE: `${BASE_URL}/user/deposits`,
      UPDATE: (id) => `${BASE_URL}/user/deposits/${id}`,
    },
    INVESTMENTS: {
      LIST: `${BASE_URL}/user/investments`,
      GET: (id) => `${BASE_URL}/user/investments/${id}`,
      CREATE: `${BASE_URL}/user/investments`,
      UPDATE: (id) => `${BASE_URL}/user/investments/${id}`,
    },
    INVESTMENT_PACKAGES: {
      LIST: `${BASE_URL}/user/investment-packages`,
    },
    ROI: {
      LIST: `${BASE_URL}/user/roi`,
      GET: (id) => `${BASE_URL}/user/roi/${id}`,
    },
    TOKENS: {
      LIST: `${BASE_URL}/user/tokens`,
      GET: (id) => `${BASE_URL}/user/tokens/${id}`,
      CREATE: `${BASE_URL}/user/tokens`,
      UPDATE: (id) => `${BASE_URL}/user/tokens/${id}`,
    },
    TRANSACTIONS: {
      LIST: `${BASE_URL}/user/transactions`,
      GET: (id) => `${BASE_URL}/user/transactions/${id}`,
      CREATE: `${BASE_URL}/user/transactions`,
      UPDATE: (id) => `${BASE_URL}/user/transactions/${id}`,
    },
    BUYBACKS: {
      LIST: `${BASE_URL}/user/buybacks`,
      GET: (id) => `${BASE_URL}/user/buybacks/${id}`,
      CREATE: `${BASE_URL}/user/buybacks`,
    },
    WITHDRAWALS: {
      LIST: `${BASE_URL}/user/withdrawals`,
      GET: (id) => `${BASE_URL}/user/withdrawals/${id}`,
      CREATE: `${BASE_URL}/user/withdrawals`,
    },
    NOTIFICATIONS: {
      LIST: `${BASE_URL}/user/notifications`,
      GET: (id) => `${BASE_URL}/user/notifications/${id}`,
      MARK_READ: (id) => `${BASE_URL}/user/notifications/${id}`,
      MARK_ALL_READ: `${BASE_URL}/user/notifications`,
    },
    REPORTS: {
      LIST: `${BASE_URL}/user/reports`,
      GET: (id) => `${BASE_URL}/user/reports/${id}`,
    },
    SECURITY: {
      SETTINGS: `${BASE_URL}/user/security/settings`,
      PASSWORD: `${BASE_URL}/user/security/password`,
      SESSIONS: `${BASE_URL}/user/security/sessions`,
      SESSION: (id) => `${BASE_URL}/user/security/sessions/${id}`,
      ACTIVITY: `${BASE_URL}/user/security/activity`,
    },
  },
};
