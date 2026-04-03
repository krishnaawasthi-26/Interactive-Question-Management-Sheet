import { useEffect, useState } from "react";
import ImportPage from "./pages/ImportPage";
import LoginPage from "./pages/LoginPage";
import SheetPage from "./pages/SheetPage";
import SignUpPage from "./pages/SignUpPage";
import { getCurrentHashRoute, navigateTo, ROUTES } from "./services/hashRouter";
import { useAuthStore } from "./store/authStore";
import ProfilePage from "./pages/ProfilePage";
import SharedPage from "./pages/SharedPage";
import ExportPage from "./pages/ExportPage";

function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const [routeState, setRouteState] = useState(getCurrentHashRoute());

  useEffect(() => {
    const syncHashRoute = () => setRouteState(getCurrentHashRoute());
    window.addEventListener("hashchange", syncHashRoute);
    syncHashRoute();
    return () => window.removeEventListener("hashchange", syncHashRoute);
  }, []);

  useEffect(() => {
    const route = routeState.route;
    if (route === ROUTES.SHARED_PREFIX) return;

    if (!currentUser && route !== ROUTES.LOGIN && route !== ROUTES.SIGNUP) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    if (currentUser && (route === ROUTES.LOGIN || route === ROUTES.SIGNUP)) {
      navigateTo(ROUTES.PROFILE);
    }
  }, [currentUser, routeState]);

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

  if (routeState.route === ROUTES.IMPORT) {
    return <ImportPage onBack={() => navigateTo(`${ROUTES.APP}/${routeState.sheetId || ""}`)} />;
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
