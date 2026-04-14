export const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ABOUT: "/about",
  CONTACT: "/contact",
  HOW_TO_USE: "/how-to-use",
  LEARNING_INSIGHTS: "/learning-insights",
  PROFILE: "/profile",
  EDIT_PROFILE: "/edit-profile",
  SHARED_PREFIX: "/shared",
  PUBLIC_SHEETS: "/public-sheets",
  APP: "/app",
  IMPORT: "/import",
  EXPORT: "/export",
  PREMIUM: "/premium",
  NOTIFICATIONS: "/notifications",
  ALERTS: "/alerts",
  ALARMS: "/alarms",
};

export const slugifySegment = (value) => {
  const cleaned = `${value || ""}`.trim().toLowerCase();
  const slug = cleaned.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "untitled-sheet";
};

export const getUserProfileRoute = (username) => {
  const normalized = `${username || ""}`.trim().toLowerCase();
  if (!normalized) return ROUTES.PROFILE;
  return `${ROUTES.PROFILE}/${normalized}`;
};

export const getCurrentRoute = () => {
  if (typeof window === "undefined") return { route: ROUTES.LOGIN };

  const path = window.location.pathname || ROUTES.LOGIN;

  const exactRouteMap = new Map([
    [ROUTES.LOGIN, ROUTES.LOGIN],
    [ROUTES.HOME, ROUTES.HOME],
    [ROUTES.SIGNUP, ROUTES.SIGNUP],
    [ROUTES.ABOUT, ROUTES.ABOUT],
    [ROUTES.CONTACT, ROUTES.CONTACT],
    [ROUTES.HOW_TO_USE, ROUTES.HOW_TO_USE],
    [ROUTES.LEARNING_INSIGHTS, ROUTES.LEARNING_INSIGHTS],
    [ROUTES.PUBLIC_SHEETS, ROUTES.PUBLIC_SHEETS],
    [ROUTES.EDIT_PROFILE, ROUTES.EDIT_PROFILE],
    [ROUTES.PREMIUM, ROUTES.PREMIUM],
    [ROUTES.NOTIFICATIONS, ROUTES.NOTIFICATIONS],
    [ROUTES.ALERTS, ROUTES.ALERTS],
    [ROUTES.ALARMS, ROUTES.ALARMS],
  ]);
  const exactRoute = exactRouteMap.get(path);
  if (exactRoute) return { route: exactRoute };

  // Prefix checks are ordered from specific sections to generic shared prefixes.
  const prefixRoutes = [
    ROUTES.PROFILE,
    ROUTES.APP,
    ROUTES.IMPORT,
    ROUTES.EXPORT,
    ROUTES.SHARED_PREFIX,
  ];
  const matchedPrefix = prefixRoutes.find((prefix) => path.startsWith(`${prefix}/`));
  if (matchedPrefix) return { route: matchedPrefix };

  return { route: ROUTES.LOGIN };
};

export const navigateTo = (route) => {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", route);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
