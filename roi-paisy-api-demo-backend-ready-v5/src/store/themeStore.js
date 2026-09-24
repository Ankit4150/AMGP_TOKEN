import { create } from "zustand";

const STORAGE_KEY = "nextoken-theme";

function applyThemeClass(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // ignore storage errors (e.g. privacy mode)
  }
  return "light";
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  // Call once on app start so the <html> class matches the stored/loaded theme.
  initTheme: () => {
    applyThemeClass(get().theme);
  },

  setTheme: (theme) => {
    applyThemeClass(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
