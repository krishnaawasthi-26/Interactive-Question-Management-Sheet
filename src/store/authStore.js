import { create } from "zustand";

const USERS_KEY = "iqms-users";
const CURRENT_USER_KEY = "iqms-current-user";

const isBrowser = typeof window !== "undefined";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readUsers = () => {
  if (!isBrowser) return [];
  return safeParse(window.localStorage.getItem(USERS_KEY), []);
};

const readCurrentUser = () => {
  if (!isBrowser) return null;
  return safeParse(window.localStorage.getItem(CURRENT_USER_KEY), null);
};

const writeUsers = (users) => {
  if (!isBrowser) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const writeCurrentUser = (user) => {
  if (!isBrowser) return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return;
  }
  window.localStorage.removeItem(CURRENT_USER_KEY);
};

const sanitizeUser = ({ password, ...user }) => user;

export const useAuthStore = create((set, get) => ({
  users: readUsers(),
  currentUser: readCurrentUser(),
  authError: null,

  clearAuthError: () => set({ authError: null }),

  signUp: ({ name, email, password }) => {
    const users = get().users;
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedName) {
      set({ authError: "Name is required." });
      return false;
    }

    if (!normalizedEmail) {
      set({ authError: "Email is required." });
      return false;
    }

    if (normalizedPassword.length < 6) {
      set({ authError: "Password must be at least 6 characters." });
      return false;
    }

    const alreadyExists = users.some((user) => user.email === normalizedEmail);

    if (alreadyExists) {
      set({ authError: "Account already exists. Please login." });
      return false;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...users, newUser];
    const sessionUser = sanitizeUser(newUser);

    writeUsers(nextUsers);
    writeCurrentUser(sessionUser);

    set({ users: nextUsers, currentUser: sessionUser, authError: null });
    return true;
  },

  login: ({ email, password }) => {
    const users = get().users;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const userByEmail = users.find((user) => user.email === normalizedEmail);

    if (!userByEmail) {
      set({ authError: "Account does not exist. Please sign up first." });
      return false;
    }

    if (userByEmail.password !== normalizedPassword) {
      set({ authError: "Incorrect password. Please try again." });
      return false;
    }

    const sessionUser = sanitizeUser(userByEmail);
    writeCurrentUser(sessionUser);
    set({ currentUser: sessionUser, authError: null });
    return true;
  },

  logout: () => {
    writeCurrentUser(null);
    set({ currentUser: null, authError: null });
  },
}));
