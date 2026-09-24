import React from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

const VARIANTS = {
  header: "text-white hover:bg-white/10",
  page: "text-slate-600 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-white/10",
};

export default function ThemeToggle({ className = "", variant = "header" }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors ${VARIANTS[variant] || VARIANTS.header} ${className}`}
    >
      {isDark ? <Moon size={21} /> : <Sun size={21} />}
    </button>
  );
}