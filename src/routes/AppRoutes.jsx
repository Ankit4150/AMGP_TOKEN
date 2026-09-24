import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import AuthGuard from "../components/auth/AuthGuard";
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("../pages/admin/UserManagement"));
const adminMap = {
  "kyc-verification": ["kyc", () => import("../pages/admin/KycVerification")],
  "token-management": [
    "tokens",
    () => import("../pages/admin/TokenManagement"),
  ],
  buyback: ["buyback", () => import("../pages/admin/BuybackManagement")],
  wallets: ["wallets", () => import("../pages/admin/Wallets")],
  investments: [
    "investments",
    () => import("../pages/admin/InvestmentManagement"),
  ],
  roi: ["roi", () => import("../pages/admin/RoiManagement")],
  withdrawals: [
    "withdrawals",
    () => import("../pages/admin/WithdrawalManagement"),
  ],
  transactions: ["transactions", () => import("../pages/admin/Transactions")],
  reconciliation: [
    "reconciliation",
    () => import("../pages/admin/Reconciliation"),
  ],
  "audit-logs": ["auditLogs", () => import("../pages/admin/AuditLogs")],
  notifications: [
    "notifications",
    () => import("../pages/admin/Notifications"),
  ],
  reports: ["reports", () => import("../pages/admin/Reports")],
  "access-control": [
    "accessControl",
    () => import("../pages/admin/AccessControl"),
  ],
  settings: ["settings", () => import("../pages/admin/Settings")],
};
const userMap = {
  profile: () => import("../pages/user/Profile"),
  kyc: () => import("../pages/user/Kyc"),
  wallet: () => import("../pages/user/Wallet"),
  deposit: () => import("../pages/user/Deposit"),
  investments: () => import("../pages/user/Investments"),
  roi: () => import("../pages/user/RoiProfit"),
  tokens: () => import("../pages/user/MyTokens"),
  transactions: () => import("../pages/user/Transactions"),
  buyback: () => import("../pages/user/Buyback"),
  withdrawal: () => import("../pages/user/Withdrawal"),
  notifications: () => import("../pages/user/Notifications"),
  reports: () => import("../pages/user/Reports"),
  security: () => import("../pages/user/Security"),
};
const adminRoles = [
  "admin",
  "superAdmin",
  "operationsAdmin",
  "financeAdmin",
  "complianceAdmin",
  "supportAdmin",
];
const UserDashboard = lazy(() => import("../pages/user/UserDashboard"));
function Loader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f9fe]">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
    </div>
  );
}
function AdminRoute({ children, permission }) {
  return (
    <AuthGuard allowedRoles={adminRoles} permission={permission}>
      {children}
    </AuthGuard>
  );
}
function UserRoute({ children }) {
  return <AuthGuard allowedRoles={["user"]}>{children}</AuthGuard>;
}
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute permission="dashboard">
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/user-management"
            element={
              <AdminRoute permission="users">
                <UserManagement />
              </AdminRoute>
            }
          />
          {Object.entries(adminMap).map(([path, [permission, loader]]) => {
            const C = lazy(loader);
            return (
              <Route
                key={path}
                path={`/admin/${path}`}
                element={
                  <AdminRoute permission={permission}>
                    <C />
                  </AdminRoute>
                }
              />
            );
          })}
          <Route
            path="/user/dashboard"
            element={
              <UserRoute>
                <UserDashboard />
              </UserRoute>
            }
          />
          {Object.entries(userMap).map(([path, loader]) => {
            const C = lazy(loader);
            return (
              <Route
                key={path}
                path={`/user/${path}`}
                element={
                  <UserRoute>
                    <C />
                  </UserRoute>
                }
              />
            );
          })}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
