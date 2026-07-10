import { create } from "zustand";

interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("pf_token"),
  isAuthenticated: !!localStorage.getItem("pf_token"),

  login: (user, token) => {
    localStorage.setItem("pf_token", token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("pf_token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));