import { useEffect, useState } from "react";
import ImportPage from "./pages/ImportPage";
import LoginPage from "./pages/LoginPage";
import SheetPage from "./pages/SheetPage";
import SignUpPage from "./pages/SignUpPage";
import { getCurrentHashRoute, navigateTo, ROUTES } from "./services/hashRouter";
import { useAuthStore } from "./store/authStore";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import SharedPage from "./pages/SharedPage";
import ExportPage from "./pages/ExportPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import HowToUsePage from "./pages/HowToUsePage";
import LearningInsightsPage from "./pages/LearningInsightsPage";

const THEME_STORAGE_KEY = "iqms-theme";
const THEMES = ["light", "dark", "night"];

function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const [routeState, setRouteState] = useState(getCurrentHashRoute());
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && THEMES.includes(storedTheme)) return storedTheme;
    return "dark";
  });
  const isAuthenticated = Boolean(currentUser?.token);

  useEffect(() => {
    const syncHashRoute = () => setRouteState(getCurrentHashRoute());
    window.addEventListener("hashchange", syncHashRoute);
    window.addEventListener("popstate", syncHashRoute);
    syncHashRoute();
    return () => {
      window.removeEventListener("hashchange", syncHashRoute);
      window.removeEventListener("popstate", syncHashRoute);
    };
  }, []);

  useEffect(() => {
    const route = routeState.route;
    if (route === ROUTES.SHARED_PREFIX || route === ROUTES.PUBLIC_PROFILE || route === ROUTES.PUBLIC_SHEET) return;

    if (
      !isAuthenticated &&
      route !== ROUTES.LOGIN &&
      route !== ROUTES.SIGNUP &&
      route !== ROUTES.ABOUT &&
      route !== ROUTES.CONTACT &&
      route !== ROUTES.HOW_TO_USE
    ) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    if (isAuthenticated && (route === ROUTES.LOGIN || route === ROUTES.SIGNUP)) {
      navigateTo(ROUTES.PROFILE);
    }
  }, [isAuthenticated, routeState]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const prefersDarkClass = theme === "dark" || theme === "night";
    document.documentElement.classList.toggle("dark", prefersDarkClass);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  if (routeState.route === ROUTES.SIGNUP) {
    return <SignUpPage theme={theme} onThemeChange={setTheme} onSignUpSuccess={() => navigateTo(ROUTES.PROFILE)} onGoToLogin={() => navigateTo(ROUTES.LOGIN)} />;
  }

  if (routeState.route === ROUTES.SHARED_PREFIX) {
    return <SharedPage shareType={routeState.shareType} shareId={routeState.shareId} />;
  }

  if (routeState.route === ROUTES.PUBLIC_PROFILE) {
    return <SharedPage shareType="public-profile" username={routeState.username} />;
  }

  if (routeState.route === ROUTES.PUBLIC_SHEET) {
    return <SharedPage shareType="public-sheet" username={routeState.username} sheetSlug={routeState.sheetSlug} />;
  }

  if (routeState.route === ROUTES.IMPORT) {
    return <ImportPage theme={theme} onThemeChange={setTheme} onBack={() => navigateTo(`${ROUTES.APP}/${routeState.sheetId || ""}`)} />;
  }

  if (routeState.route === ROUTES.ABOUT) {
    return <AboutPage theme={theme} onThemeChange={setTheme} />;
  }

  if (routeState.route === ROUTES.CONTACT) {
    return <ContactPage theme={theme} onThemeChange={setTheme} />;
  }

  if (routeState.route === ROUTES.HOW_TO_USE) {
    return <HowToUsePage theme={theme} onThemeChange={setTheme} />;
  }

  if (routeState.route === ROUTES.LEARNING_INSIGHTS) {
    return <LearningInsightsPage theme={theme} onThemeChange={setTheme} />;
  }

  if (routeState.route === ROUTES.EXPORT) {
    return <ExportPage theme={theme} onThemeChange={setTheme} onBack={() => navigateTo(`${ROUTES.APP}/${routeState.sheetId || ""}`)} />;
  }

  if (routeState.route === ROUTES.PROFILE) {
    return (
      <ProfilePage
        theme={theme}
        onThemeChange={setTheme}
        onLogout={() => {
          logout();
          navigateTo(ROUTES.LOGIN);
        }}
      />
    );
  }

  if (routeState.route === ROUTES.EDIT_PROFILE) {
    return <EditProfilePage theme={theme} onThemeChange={setTheme} />;
  }

  if (routeState.route === ROUTES.APP) {
    return (
      <SheetPage
        sheetId={routeState.sheetId}
        theme={theme}
        onThemeChange={setTheme}
        onOpenImport={() => navigateTo(`${ROUTES.IMPORT}/${routeState.sheetId || ""}`)}
        onOpenExport={() => navigateTo(`${ROUTES.EXPORT}/${routeState.sheetId || ""}`)}
      />
    );
  }

  return <LoginPage theme={theme} onThemeChange={setTheme} onLoginSuccess={() => navigateTo(ROUTES.PROFILE)} onGoToSignUp={() => navigateTo(ROUTES.SIGNUP)} />;
}

export default App;
