import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import EditProfilePage from "./pages/EditProfilePage";
import ExportPage from "./pages/ExportPage";
import HowToUsePage from "./pages/HowToUsePage";
import ImportPage from "./pages/ImportPage";
import LearningInsightsPage from "./pages/LearningInsightsPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PremiumPage from "./pages/PremiumPage";
import PublicSheetsPage from "./pages/PublicSheetsPage";
import SharedPage from "./pages/SharedPage";
import SheetPage from "./pages/SheetPage";
import SignUpPage from "./pages/SignUpPage";
import { ProtectedRoute, PublicOnlyRoute } from "./components/routing/ProtectedRoute";
import { getUserProfileRoute, ROUTES } from "./services/routes";
import { useAuthStore } from "./store/authStore";

const THEME_STORAGE_KEY = "iqms-theme";
const THEMES = ["light", "dark", "night"];

function LoginRoute({ theme, onThemeChange }) {
  const navigate = useNavigate();
  return (
    <LoginPage
      theme={theme}
      onThemeChange={onThemeChange}
      onLoginSuccess={() => navigate(getUserProfileRoute(useAuthStore.getState().currentUser?.username))}
      onGoToSignUp={() => navigate(ROUTES.SIGNUP)}
    />
  );
}

function SignupRoute({ theme, onThemeChange }) {
  const navigate = useNavigate();
  return (
    <SignUpPage
      theme={theme}
      onThemeChange={onThemeChange}
      onSignUpSuccess={() => navigate(getUserProfileRoute(useAuthStore.getState().currentUser?.username))}
      onGoToLogin={() => navigate(ROUTES.LOGIN)}
    />
  );
}

function SheetRoute({ theme, onThemeChange }) {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return (
    <SheetPage
      sheetId={sheetId}
      theme={theme}
      onThemeChange={onThemeChange}
      onOpenImport={() => navigate(`${ROUTES.IMPORT}/${sheetId || ""}`)}
      onOpenExport={() => navigate(`${ROUTES.EXPORT}/${sheetId || ""}`)}
    />
  );
}

function ImportRoute({ theme, onThemeChange }) {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return <ImportPage theme={theme} onThemeChange={onThemeChange} onBack={() => navigate(`${ROUTES.APP}/${sheetId || ""}`)} />;
}

function ExportRoute({ theme, onThemeChange }) {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return <ExportPage theme={theme} onThemeChange={onThemeChange} onBack={() => navigate(`${ROUTES.APP}/${sheetId || ""}`)} />;
}

function SharedRoute({ theme, onThemeChange }) {
  const { shareType, shareId } = useParams();
  return <SharedPage shareType={shareType} shareId={shareId} theme={theme} onThemeChange={onThemeChange} />;
}

function PublicProfileRoute({ theme, onThemeChange }) {
  const { username } = useParams();
  return <SharedPage shareType="public-profile" username={username} theme={theme} onThemeChange={onThemeChange} />;
}

function OwnProfileRedirectRoute() {
  const currentUser = useAuthStore((state) => state.currentUser);
  return <Navigate to={getUserProfileRoute(currentUser?.username)} replace />;
}

function UserProfileRoute({ theme, onThemeChange }) {
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isOwnProfile = currentUser?.username?.toLowerCase() === `${username || ""}`.trim().toLowerCase();

  if (isOwnProfile) {
    return <ProfilePage theme={theme} onThemeChange={onThemeChange} onLogout={() => useAuthStore.getState().logout()} />;
  }

  return <PublicProfileRoute theme={theme} onThemeChange={onThemeChange} />;
}

function PublicSheetRoute({ theme, onThemeChange }) {
  const { username, sheetSlug } = useParams();
  return <SharedPage shareType="public-sheet" username={username} sheetSlug={sheetSlug} theme={theme} onThemeChange={onThemeChange} />;
}

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && THEMES.includes(storedTheme)) return storedTheme;
    return "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const prefersDarkClass = theme === "dark" || theme === "night";
    document.documentElement.classList.toggle("dark", prefersDarkClass);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginRoute theme={theme} onThemeChange={setTheme} />} />
        <Route path={ROUTES.SIGNUP} element={<SignupRoute theme={theme} onThemeChange={setTheme} />} />
      </Route>

      <Route path={ROUTES.HOME} element={<HomePage theme={theme} onThemeChange={setTheme} />} />
      <Route path={ROUTES.ABOUT} element={<AboutPage theme={theme} onThemeChange={setTheme} />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage theme={theme} onThemeChange={setTheme} />} />
      <Route path={ROUTES.HOW_TO_USE} element={<HowToUsePage theme={theme} onThemeChange={setTheme} />} />

      <Route path={`${ROUTES.SHARED_PREFIX}/:shareType/:shareId`} element={<SharedRoute theme={theme} onThemeChange={setTheme} />} />
      <Route path={`${ROUTES.PROFILE}/:username/:sheetSlug`} element={<PublicSheetRoute theme={theme} onThemeChange={setTheme} />} />
      <Route path={`${ROUTES.PROFILE}/:username`} element={<UserProfileRoute theme={theme} onThemeChange={setTheme} />} />

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.LEARNING_INSIGHTS} element={<LearningInsightsPage theme={theme} onThemeChange={setTheme} />} />
        <Route path={ROUTES.PREMIUM} element={<PremiumPage theme={theme} onThemeChange={setTheme} />} />
        <Route path={ROUTES.PUBLIC_SHEETS} element={<PublicSheetsPage theme={theme} onThemeChange={setTheme} />} />
        <Route path={ROUTES.PROFILE} element={<OwnProfileRedirectRoute />} />
        <Route path={ROUTES.EDIT_PROFILE} element={<EditProfilePage theme={theme} onThemeChange={setTheme} />} />
        <Route path={`${ROUTES.APP}/:sheetId?`} element={<SheetRoute theme={theme} onThemeChange={setTheme} />} />
        <Route path={`${ROUTES.IMPORT}/:sheetId?`} element={<ImportRoute theme={theme} onThemeChange={setTheme} />} />
        <Route path={`${ROUTES.EXPORT}/:sheetId?`} element={<ExportRoute theme={theme} onThemeChange={setTheme} />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;
