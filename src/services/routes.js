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
};

export const slugifySegment = (value) => {
  const cleaned = `${value || ""}`.trim().toLowerCase();
  const slug = cleaned.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "untitled-sheet";
};

export const getCurrentRoute = () => {
  if (typeof window === "undefined") return { route: ROUTES.LOGIN };

  const path = window.location.pathname || ROUTES.LOGIN;

  if (path === ROUTES.LOGIN) return { route: ROUTES.LOGIN };
  if (path === ROUTES.HOME) return { route: ROUTES.HOME };
  if (path === ROUTES.SIGNUP) return { route: ROUTES.SIGNUP };
  if (path === ROUTES.ABOUT) return { route: ROUTES.ABOUT };
  if (path === ROUTES.CONTACT) return { route: ROUTES.CONTACT };
  if (path === ROUTES.HOW_TO_USE) return { route: ROUTES.HOW_TO_USE };
  if (path === ROUTES.LEARNING_INSIGHTS) return { route: ROUTES.LEARNING_INSIGHTS };
  if (path === ROUTES.PUBLIC_SHEETS) return { route: ROUTES.PUBLIC_SHEETS };
  if (path === ROUTES.PROFILE) return { route: ROUTES.PROFILE };
  if (path === ROUTES.EDIT_PROFILE) return { route: ROUTES.EDIT_PROFILE };
  if (path === ROUTES.APP || path.startsWith(`${ROUTES.APP}/`)) return { route: ROUTES.APP };
  if (path === ROUTES.IMPORT || path.startsWith(`${ROUTES.IMPORT}/`)) return { route: ROUTES.IMPORT };
  if (path === ROUTES.EXPORT || path.startsWith(`${ROUTES.EXPORT}/`)) return { route: ROUTES.EXPORT };
  if (path.startsWith(`${ROUTES.SHARED_PREFIX}/`)) return { route: ROUTES.SHARED_PREFIX };
  if (path.startsWith(`${ROUTES.PROFILE}/`)) return { route: ROUTES.SHARED_PREFIX };

  return { route: ROUTES.LOGIN };
};

export const navigateTo = (route) => {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", route);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
