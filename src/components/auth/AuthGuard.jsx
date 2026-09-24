import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { hasPermission, useAuthStore } from "../../store/authStore";
export default function AuthGuard({ children, allowedRoles, permission }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f9fe] text-slate-600">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
          <p className="text-sm">Checking your session...</p>
        </div>
      </div>
    );
  if (!isAuthenticated || !user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <AccessDenied />;
  if (permission && !hasPermission(user.role, permission))
    return <AccessDenied />;
  return children;
}
function AccessDenied() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f9fe] p-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-500">
          <ShieldAlert />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your account does not have permission to access this area.
        </p>
      </div>
    </div>
  );
}
