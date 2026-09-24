import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Filter } from "lucide-react";

export default function Dropdown({
  value, onChange, options = [], placeholder = "Select", icon: Icon = Filter,
  className = "", fullWidth = false, disabled = false, menuClassName = "",
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});

  const selected = options.find((option) => String(option.value) === String(value));
  const label = selected?.label ?? placeholder;

  const updatePosition = () => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 190);
    const viewportPadding = 8;
    const maxLeft = Math.max(viewportPadding, window.innerWidth - width - viewportPadding);
    const left = Math.min(Math.max(viewportPadding, rect.left), maxLeft);
    const menuHeight = menu?.getBoundingClientRect().height || Math.min(300, Math.max(56, options.length * 42 + 12));
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < Math.min(menuHeight, 260) && spaceAbove > spaceBelow;
    const availableHeight = Math.max(120, openUp ? spaceAbove : spaceBelow);
    setMenuStyle({
      position: "fixed",
      left,
      top: openUp ? Math.max(viewportPadding, rect.top - Math.min(menuHeight, availableHeight) - 8) : rect.bottom + 8,
      width,
      maxHeight: Math.min(300, availableHeight),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const key = (event) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    const viewport = () => updatePosition();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", viewport);
    window.addEventListener("scroll", viewport, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", viewport);
      window.removeEventListener("scroll", viewport, true);
    };
  }, [open, options.length]);

  const menu = open ? (
    <div ref={menuRef} style={menuStyle} className={`z-[99999] overflow-y-auto rounded-xl border border-[#dfe7f1] bg-white p-1.5 shadow-[0_16px_40px_rgba(20,42,80,0.18)] dark:border-[#2b3c58] dark:bg-[#12223b] ${menuClassName}`} role="listbox" aria-label={placeholder}>
      {options.length ? options.map((option) => {
        const selectedOption = String(option.value) === String(value);
        return <button key={String(option.value)} type="button" role="option" aria-selected={selectedOption} onClick={() => { onChange?.(option.value); setOpen(false); }} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition ${selectedOption ? "bg-[#eef6ff] text-[#2563eb] dark:bg-blue-500/10 dark:text-blue-300" : "text-[#344963] hover:bg-[#f7faff] dark:text-slate-200 dark:hover:bg-white/5"}`}><span className="truncate">{option.label}</span>{selectedOption && <Check size={15} className="shrink-0" />}</button>;
      }) : <div className="px-3 py-3 text-xs text-slate-400">No options</div>}
    </div>
  ) : null;

  return <>
    <button ref={triggerRef} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`flex h-10 min-w-[150px] items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-[#22344a] outline-none transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2b3c58] dark:bg-[#101f38] dark:text-slate-200 ${open ? "border-blue-500 ring-2 ring-blue-500/15" : "border-[#e1e7f0] hover:border-[#c6d3e6]"} ${fullWidth ? "w-full justify-between" : ""} ${className}`}>
      <span className="flex min-w-0 items-center gap-2">{Icon && <Icon size={15} className="shrink-0 text-[#8394ac]" />}<span className="truncate">{label}</span></span>
      <ChevronDown size={15} className={`shrink-0 text-[#8394ac] transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
  </>;
}
