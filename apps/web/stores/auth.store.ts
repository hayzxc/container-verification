import { create } from "zustand";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "INSPECTOR" | "AUDITOR";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, token) => set({ user, accessToken: token }),
  logout: () => set({ user: null, accessToken: null }),
}));
