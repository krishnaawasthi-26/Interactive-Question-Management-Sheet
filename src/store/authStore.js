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

export const useAuthStore = create((set, get) => ({
  users: readUsers(),
  currentUser: readCurrentUser(),
  authError: null,

  clearAuthError: () => set({ authError: null }),

  signUp: ({ name, email, password }) => {
    const users = get().users;
    const normalizedEmail = email.trim().toLowerCase();
    const alreadyExists = users.some((user) => user.email === normalizedEmail);

    if (alreadyExists) {
      set({ authError: "Account already exists. Please login." });
      return false;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...users, newUser];
    writeUsers(nextUsers);
    writeCurrentUser(newUser);

    set({ users: nextUsers, currentUser: newUser, authError: null });
    return true;
  },

  login: ({ email, password }) => {
    const users = get().users;
    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = users.find(
      (user) => user.email === normalizedEmail && user.password === password
    );

    if (!matchedUser) {
      set({ authError: "Invalid email or password." });
      return false;
    }

    writeCurrentUser(matchedUser);
    set({ currentUser: matchedUser, authError: null });
    return true;
  },

  logout: () => {
    writeCurrentUser(null);
    set({ currentUser: null, authError: null });
  },
}));
