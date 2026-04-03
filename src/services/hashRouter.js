export const ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  PROFILE: "/profile",
  APP: "/app",
  IMPORT: "/import",
  SHARED_PREFIX: "/shared",
};

export const getCurrentHashRoute = () => {
  if (typeof window === "undefined") return ROUTES.LOGIN;
  const hash = window.location.hash.replace(/^#/, "") || ROUTES.LOGIN;

  if (hash.startsWith("/shared/")) {
    const [, , shareType, shareId] = hash.split("/");
    return { route: ROUTES.SHARED_PREFIX, shareType, shareId };
  }

  if (hash.startsWith("/app/")) {
    const [, , sheetId] = hash.split("/");
    return { route: ROUTES.APP, sheetId };
  }

  if (Object.values(ROUTES).includes(hash)) return { route: hash };
  return { route: ROUTES.LOGIN };
};

export const navigateTo = (route) => {
  if (typeof window === "undefined") return;
  window.location.hash = route;
};
