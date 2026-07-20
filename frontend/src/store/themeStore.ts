import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  initTheme: () => void;
}

function getSystemPreference(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("pf-theme", next);
    applyTheme(next);
    set({ theme: next });
  },

  initTheme: () => {
    const stored = localStorage.getItem("pf-theme") as Theme | null;
    const theme = stored ?? getSystemPreference();
    applyTheme(theme);
    set({ theme });

    // Listen for system preference changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        // Only follow system if user hasn't manually set a preference
        if (!localStorage.getItem("pf-theme")) {
          const next = e.matches ? "dark" : "light";
          applyTheme(next);
          set({ theme: next });
        }
      });
  },
}));
