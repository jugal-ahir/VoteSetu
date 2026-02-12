import { create } from "zustand";

const getInitialToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("votesetu-token");
};

const getInitialUser = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("votesetu-user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  setAuth: (user, token) => {
    if (typeof window !== "undefined" && token) {
      window.localStorage.setItem("votesetu-token", token);
    }
    if (typeof window !== "undefined" && user) {
      window.localStorage.setItem("votesetu-user", JSON.stringify(user));
    }
    set({ user, token });
  },
  clearAuth: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("votesetu-token");
      window.localStorage.removeItem("votesetu-user");
    }
    set({ user: null, token: null });
  },
}));



