export const ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  APP: "/app",
  IMPORT: "/import",
};

export const getCurrentHashRoute = () => {
  if (typeof window === "undefined") return ROUTES.LOGIN;
  const hash = window.location.hash.replace(/^#/, "") || ROUTES.LOGIN;
  return Object.values(ROUTES).includes(hash) ? hash : ROUTES.LOGIN;
};

export const navigateTo = (route) => {
  if (typeof window === "undefined") return;
  window.location.hash = route;
};
