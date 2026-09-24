import React from "react";
import { Bell, ChevronDown, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import ThemeToggle from "../ui/ThemeToggle";
export default function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user),
    logout = useAuthStore((s) => s.logout);
    const handleLogout = async () => {
  await logout();
  navigate("/login", { replace: true });
};
  const isAdmin = user?.role !== "user";
  const name = `${user?.firstName || "John"} ${user?.lastName || (isAdmin ? "Doe" : "Smith")}`;
  const initials=`${(user?.firstName||"John").charAt(0)}${(user?.lastName||(isAdmin?"Doe":"Smith")).charAt(0)}`.toUpperCase();
  const role = isAdmin
    ? user?.role === "superAdmin"
      ? "Super Admin"
      : "Admin"
    : "User";
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center bg-[#061d38] px-3 text-white shadow sm:px-5">
      <button
        onClick={onMenu}
        className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10 lg:hidden"
      >
        <Menu size={23} />
      </button>
      <div className="flex-1" />
      <ThemeToggle className="mr-2" />
      <button className="relative mr-2 grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10">
        <Bell size={22} />
        <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold">
          3
        </span>
      </button>
      <div className="mx-2 hidden h-8 w-px bg-white/20 sm:block" />
      <div className="group relative flex items-center gap-2">
       <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 bg-slate-100 text-xs font-bold text-[#061d38]">{initials}</div>
        <div className="hidden leading-4 sm:block">
          <strong className="block text-xs">{name}</strong>
          <span className="text-[11px] text-slate-300">{role}</span>
        </div>
        <button
          onClick={handleLogout}
          className="grid h-8 w-7 place-items-center rounded hover:bg-white/10"
          title="Sign out"
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
