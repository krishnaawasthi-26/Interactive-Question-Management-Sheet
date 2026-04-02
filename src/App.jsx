import { useEffect, useState } from "react";
import ImportPage from "./pages/ImportPage";
import LoginPage from "./pages/LoginPage";
import SheetPage from "./pages/SheetPage";
import SignUpPage from "./pages/SignUpPage";
import { getCurrentHashRoute, navigateTo, ROUTES } from "./services/hashRouter";
import { useAuthStore } from "./store/authStore";

function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const [route, setRoute] = useState(getCurrentHashRoute());

  useEffect(() => {
    const syncHashRoute = () => setRoute(getCurrentHashRoute());
    window.addEventListener("hashchange", syncHashRoute);
    syncHashRoute();
    return () => window.removeEventListener("hashchange", syncHashRoute);
  }, []);

  useEffect(() => {
    if (!currentUser && route !== ROUTES.LOGIN && route !== ROUTES.SIGNUP) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    if (currentUser && (route === ROUTES.LOGIN || route === ROUTES.SIGNUP)) {
      navigateTo(ROUTES.APP);
    }
  }, [currentUser, route]);

  if (route === ROUTES.SIGNUP) {
    return (
      <SignUpPage
        onSignUpSuccess={() => navigateTo(ROUTES.APP)}
        onGoToLogin={() => navigateTo(ROUTES.LOGIN)}
      />
    );
  }

  if (route === ROUTES.IMPORT) {
    return <ImportPage onBack={() => navigateTo(ROUTES.APP)} />;
  }

  if (route === ROUTES.APP) {
    return (
      <SheetPage
        onOpenImport={() => navigateTo(ROUTES.IMPORT)}
        onLogout={() => {
          logout();
          navigateTo(ROUTES.LOGIN);
        }}
      />
    );
  }

  return (
    <LoginPage
      onLoginSuccess={() => navigateTo(ROUTES.APP)}
      onGoToSignUp={() => navigateTo(ROUTES.SIGNUP)}
    />
  );
}

export default App;
