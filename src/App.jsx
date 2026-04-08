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

function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const [routeState, setRouteState] = useState(getCurrentHashRoute());
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

  if (routeState.route === ROUTES.SIGNUP) {
    return (
      <SignUpPage
        onSignUpSuccess={() => navigateTo(ROUTES.PROFILE)}
        onGoToLogin={() => navigateTo(ROUTES.LOGIN)}
      />
    );
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
    return <ImportPage onBack={() => navigateTo(`${ROUTES.APP}/${routeState.sheetId || ""}`)} />;
  }

  if (routeState.route === ROUTES.ABOUT) {
    return <AboutPage />;
  }

  if (routeState.route === ROUTES.CONTACT) {
    return <ContactPage />;
  }

  if (routeState.route === ROUTES.HOW_TO_USE) {
    return <HowToUsePage />;
  }

  if (routeState.route === ROUTES.LEARNING_INSIGHTS) {
    return <LearningInsightsPage />;
  }

  if (routeState.route === ROUTES.EXPORT) {
    return <ExportPage onBack={() => navigateTo(`${ROUTES.APP}/${routeState.sheetId || ""}`)} />;
  }

  if (routeState.route === ROUTES.PROFILE) {
    return (
      <ProfilePage
        onLogout={() => {
          logout();
          navigateTo(ROUTES.LOGIN);
        }}
      />
    );
  }

  if (routeState.route === ROUTES.EDIT_PROFILE) {
    return <EditProfilePage />;
  }

  if (routeState.route === ROUTES.APP) {
    return (
      <SheetPage
        sheetId={routeState.sheetId}
        onOpenImport={() => navigateTo(`${ROUTES.IMPORT}/${routeState.sheetId || ""}`)}
        onOpenExport={() => navigateTo(`${ROUTES.EXPORT}/${routeState.sheetId || ""}`)}
        onBackProfile={() => navigateTo(ROUTES.PROFILE)}
        onLogout={() => {
          logout();
          navigateTo(ROUTES.LOGIN);
        }}
      />
    );
  }

  return (
    <LoginPage
      onLoginSuccess={() => navigateTo(ROUTES.PROFILE)}
      onGoToSignUp={() => navigateTo(ROUTES.SIGNUP)}
    />
  );
}

export default App;
