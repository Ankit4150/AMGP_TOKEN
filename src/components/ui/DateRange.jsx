import React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
export default function DateRange() {
  return (
    <button className="flex h-[50px] w-full items-center justify-between gap-3 rounded-lg border border-[#dce9f7] bg-white px-4 text-sm text-[#23456e] shadow-sm sm:w-auto">
      <CalendarDays size={19} />
      <span className="whitespace-nowrap">Sep 1, 2025 - Sep 7, 2025</span>
      <ChevronDown size={16} />
    </button>
  );
}
