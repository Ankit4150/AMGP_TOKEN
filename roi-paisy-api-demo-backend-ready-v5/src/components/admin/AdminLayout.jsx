import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import Topbar from "../shared/Topbar";
export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f9fe] dark:bg-[#0a1424]">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 lg:pl-[284px]">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1660px] min-w-0 overflow-x-hidden p-3 pb-8 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
