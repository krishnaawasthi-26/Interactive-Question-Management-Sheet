import { create } from "zustand";
import { loginUser, signUpUser } from "../api/authApi";

const CURRENT_USER_KEY = "iqms-current-user";

const isBrowser = typeof window !== "undefined";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readCurrentUser = () => {
  if (!isBrowser) return null;
  return safeParse(window.localStorage.getItem(CURRENT_USER_KEY), null);
};

const writeCurrentUser = (user) => {
  if (!isBrowser) return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return;
  }
  window.localStorage.removeItem(CURRENT_USER_KEY);
};

export const useAuthStore = create((set) => ({
  currentUser: readCurrentUser(),
  authError: null,
  authLoading: false,

  clearAuthError: () => set({ authError: null }),

  signUp: async ({ name, email, password }) => {
    set({ authLoading: true, authError: null });

    try {
      const user = await signUpUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      writeCurrentUser(user);
      set({ currentUser: user, authError: null, authLoading: false });
      return true;
    } catch (error) {
      set({ authError: error.message, authLoading: false });
      return false;
    }
  },

  login: async ({ email, password }) => {
    set({ authLoading: true, authError: null });

    try {
      const user = await loginUser({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      writeCurrentUser(user);
      set({ currentUser: user, authError: null, authLoading: false });
      return true;
    } catch (error) {
      set({ authError: error.message, authLoading: false });
      return false;
    }
  },

  logout: () => {
    writeCurrentUser(null);
    set({ currentUser: null, authError: null, authLoading: false });
  },
}));
