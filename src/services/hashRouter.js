export const ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  PROFILE: "/profile",
  EDIT_PROFILE: "/edit-profile",
  PUBLIC_PROFILE: "/public-profile",
  PUBLIC_SHEET: "/public-sheet",
  APP: "/app",
  IMPORT: "/import",
  EXPORT: "/export",
  SHARED_PREFIX: "/shared",
};

export const slugifySegment = (value) => {
  const cleaned = `${value || ""}`.trim().toLowerCase();
  const slug = cleaned.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "untitled-sheet";
};

export const getCurrentHashRoute = () => {
  if (typeof window === "undefined") return ROUTES.LOGIN;
  const hash = window.location.hash.replace(/^#/, "");

  if (hash) {
    if (hash.startsWith("/shared/")) {
      const [, , shareType, shareId] = hash.split("/");
      return { route: ROUTES.SHARED_PREFIX, shareType, shareId };
    }

    if (hash.startsWith("/app/")) {
      const [, , sheetId] = hash.split("/");
      return { route: ROUTES.APP, sheetId };
    }

    if (hash.startsWith("/import/")) {
      const [, , sheetId] = hash.split("/");
      return { route: ROUTES.IMPORT, sheetId };
    }

    if (hash.startsWith("/export/")) {
      const [, , sheetId] = hash.split("/");
      return { route: ROUTES.EXPORT, sheetId };
    }

    if (Object.values(ROUTES).includes(hash)) return { route: hash };
  }

  const pathname = window.location.pathname || "/";
  const pathParts = pathname.split("/").filter(Boolean);

  if (pathParts[0] === "profile" && pathParts[1] && pathParts[2]) {
    return { route: ROUTES.PUBLIC_SHEET, username: pathParts[1], sheetSlug: pathParts[2] };
  }

  if (pathParts[0] === "profile" && pathParts[1]) {
    return { route: ROUTES.PUBLIC_PROFILE, username: pathParts[1] };
  }

  return { route: ROUTES.LOGIN };
};

export const navigateTo = (route) => {
  if (typeof window === "undefined") return;
  if (route.startsWith("/profile/")) {
    window.history.pushState({}, "", route);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }
  window.location.hash = route;
};
