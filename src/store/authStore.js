import { create } from "zustand";
import { googleAuth, loginUser, resendSignUpOtp, signUpUser, verifySignUpOtp } from "../api/authApi";
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
  pendingSignupEmail: "",
  otpResendAvailableInSeconds: 0,
  otpInfoMessage: "",

  clearAuthError: () => set({ authError: null }),

  signUp: async ({ name, email, username, password }) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await signUpUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
      });
      set({
        pendingSignupEmail: response?.email ?? email.trim().toLowerCase(),
        otpResendAvailableInSeconds: Number(response?.resendAvailableInSeconds ?? 60),
        otpInfoMessage: response?.message ?? "",
        authError: null,
        authLoading: false,
      });
      return true;
    } catch (error) {
      set({ authError: error.message, authLoading: false });
      return false;
    }
  },

  resendOtp: async (emailOverride) => {
    const email = (emailOverride || get().pendingSignupEmail || "").trim().toLowerCase();
    if (!email) {
      set({ authError: "Missing signup email. Please sign up again." });
      return false;
    }

    set({ authLoading: true, authError: null });
    try {
      const response = await resendSignUpOtp({ email });
      set({
        pendingSignupEmail: response?.email ?? email,
        otpResendAvailableInSeconds: Number(response?.resendAvailableInSeconds ?? 60),
        otpInfoMessage: response?.message ?? "",
        authLoading: false,
      });
      return true;
    } catch (error) {
      set({ authError: error.message, authLoading: false });
      return false;
    }
  },

  verifyOtp: async ({ email, otp }) => {
    set({ authLoading: true, authError: null });
    try {
      const user = await verifySignUpOtp({
        email: (email || get().pendingSignupEmail || "").trim().toLowerCase(),
        otp: otp.trim(),
      });
      writeCurrentUser(user);
      set({
        currentUser: user,
        pendingSignupEmail: "",
        otpResendAvailableInSeconds: 0,
        otpInfoMessage: "",
        authError: null,
        authLoading: false,
      });
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

  loginWithGoogle: async (idToken) => {
    const sanitizedTokenPreview = typeof idToken === "string" ? `${idToken.slice(0, 18)}...` : null;
    console.info("[AuthStore] Google login start.", { hasToken: Boolean(idToken), tokenPreview: sanitizedTokenPreview });
    if (typeof idToken !== "string" || !idToken.trim()) {
      const message = "Google callback payload is malformed: missing credential token.";
      console.error("[AuthStore] Google login aborted.", { reason: message });
      set({ authError: message });
      return false;
    }

    set({ authLoading: true, authError: null });
    try {
      console.info("[AuthStore] Sending Google credential token to backend /api/auth/google.");
      const user = await googleAuth({ idToken });
      console.info("[AuthStore] Google auth backend response received.", {
        hasToken: Boolean(user?.token),
        userId: user?.id ?? null,
        username: user?.username ?? null,
      });
      writeCurrentUser(user);
      console.info("[AuthStore] Auth state updated after Google login.", {
        currentUserId: user?.id ?? null,
      });
      set({ currentUser: user, authError: null, authLoading: false, pendingSignupEmail: "", otpInfoMessage: "" });
      return true;
    } catch (error) {
      const fallbackMessage = error?.status === 401
        ? "Google verification failed. Please choose the same Google account configured for this app."
        : error?.status === 503
          ? "Google Sign-In is not configured on the server. Please contact support."
          : "Unable to complete Google sign-in right now.";
      const safeMessage = error?.message || fallbackMessage;
      console.error("[AuthStore] Google login failed.", {
        message: safeMessage,
        status: error?.status ?? null,
        code: error?.code ?? null,
        details: error?.details ?? null,
      });
      set({ authError: safeMessage, authLoading: false });
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


  dismissPremiumTrialWelcomePopup: () => {
    const user = get().currentUser;
    if (!user) return;
    const updated = { ...user, showPremiumTrialWelcomePopup: false };
    writeCurrentUser(updated);
    set({ currentUser: updated });
  },

  logout: () => {
    writeCurrentUser(null);
    set({
      currentUser: null,
      authError: null,
      authLoading: false,
      pendingSignupEmail: "",
      otpResendAvailableInSeconds: 0,
      otpInfoMessage: "",
    });
  },
}));
