import { create } from "zustand";
import { loginUser, signUpUser } from "../api/authApi";
import { updateProfile as updateProfileApi } from "../api/profileApi";

const CURRENT_USER_KEY = "iqms-current-user";
const LOGIN_LOCK_KEY = "iqms-login-lock";

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
  const parsed = safeParse(window.localStorage.getItem(CURRENT_USER_KEY), null);
  if (!parsed?.token) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
  return parsed;
};

const writeCurrentUser = (user) => {
  if (!isBrowser) return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return;
  }
  window.localStorage.removeItem(CURRENT_USER_KEY);
};

const readLoginLockUntil = () => {
  if (!isBrowser) return 0;
  const raw = Number(window.localStorage.getItem(LOGIN_LOCK_KEY) ?? 0);
  return Number.isFinite(raw) ? raw : 0;
};

const writeLoginLockUntil = (timestamp) => {
  if (!isBrowser) return;
  if (timestamp > Date.now()) {
    window.localStorage.setItem(LOGIN_LOCK_KEY, String(timestamp));
    return;
  }
  window.localStorage.removeItem(LOGIN_LOCK_KEY);
};

export const useAuthStore = create((set, get) => ({
  currentUser: readCurrentUser(),
  authError: null,
  authLoading: false,
  loginBlockedUntil: readLoginLockUntil(),

  clearAuthError: () => set({ authError: null }),

  signUp: async ({ name, email, username, password }) => {
    set({ authLoading: true, authError: null });

    try {
      const user = await signUpUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
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

  login: async ({ identifier, password }) => {
    const blockedUntil = get().loginBlockedUntil;
    if (blockedUntil > Date.now()) {
      const seconds = Math.ceil((blockedUntil - Date.now()) / 1000);
      set({
        authError: `Too many wrong attempts. Try after ${Math.ceil(seconds / 60)} minutes.`,
      });
      return false;
    }

    set({ authLoading: true, authError: null });

    try {
      const user = await loginUser({
        identifier: identifier.trim().toLowerCase(),
        password: password.trim(),
      });

      writeCurrentUser(user);
      writeLoginLockUntil(0);
      set({ currentUser: user, authError: null, authLoading: false, loginBlockedUntil: 0 });
      return true;
    } catch (error) {
      const disabledUntilEpochMs = Number(error?.disabledUntilEpochMs ?? 0);
      const isLoginLock = error?.code === "LOGIN_LOCKED" && disabledUntilEpochMs > Date.now();
      if (isLoginLock) {
        writeLoginLockUntil(disabledUntilEpochMs);
      }
      set({
        authError: error.message,
        authLoading: false,
        loginBlockedUntil: isLoginLock ? disabledUntilEpochMs : get().loginBlockedUntil,
      });
      return false;
    }
  },

  updateProfile: async (payload) => {
    const user = get().currentUser;
    if (!user?.token) return false;

    try {
      const updated = await updateProfileApi(user.token, payload);
      const merged = { ...user, ...updated };
      writeCurrentUser(merged);
      set({ currentUser: merged });
      return true;
    } catch (error) {
      set({ authError: error.message });
      return false;
    }
  },

  logout: () => {
    writeCurrentUser(null);
    set({ currentUser: null, authError: null, authLoading: false });
  },
}));
