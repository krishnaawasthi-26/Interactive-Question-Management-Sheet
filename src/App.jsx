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
import ProfilePage from "./pages/ProfilePage";
import SharedPage from "./pages/SharedPage";
import SheetPage from "./pages/SheetPage";
import SignUpPage from "./pages/SignUpPage";
import { ProtectedRoute, PublicOnlyRoute } from "./components/routing/ProtectedRoute";
import { ROUTES } from "./services/routes";
import { useAuthStore } from "./store/authStore";

const THEME_STORAGE_KEY = "iqms-theme";
const THEMES = ["light", "dark", "night"];

function LoginRoute({ theme, onThemeChange }) {
  const navigate = useNavigate();
  return <LoginPage theme={theme} onThemeChange={onThemeChange} onLoginSuccess={() => navigate(ROUTES.PROFILE)} onGoToSignUp={() => navigate(ROUTES.SIGNUP)} />;
}

function SignupRoute({ theme, onThemeChange }) {
  const navigate = useNavigate();
  return <SignUpPage theme={theme} onThemeChange={onThemeChange} onSignUpSuccess={() => navigate(ROUTES.PROFILE)} onGoToLogin={() => navigate(ROUTES.LOGIN)} />;
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

function SharedRoute() {
  const { shareType, shareId } = useParams();
  return <SharedPage shareType={shareType} shareId={shareId} />;
}

function PublicProfileRoute() {
  const { username } = useParams();
  return <SharedPage shareType="public-profile" username={username} />;
}

function PublicSheetRoute() {
  const { username, sheetSlug } = useParams();
  return <SharedPage shareType="public-sheet" username={username} sheetSlug={sheetSlug} />;
}

function App() {
  const logout = useAuthStore((state) => state.logout);
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

      <Route path={ROUTES.ABOUT} element={<AboutPage theme={theme} onThemeChange={setTheme} />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage theme={theme} onThemeChange={setTheme} />} />
      <Route path={ROUTES.HOW_TO_USE} element={<HowToUsePage theme={theme} onThemeChange={setTheme} />} />

      <Route path={`${ROUTES.SHARED_PREFIX}/:shareType/:shareId`} element={<SharedRoute />} />
      <Route path={`${ROUTES.PROFILE}/:username/:sheetSlug`} element={<PublicSheetRoute />} />
      <Route path={`${ROUTES.PROFILE}/:username`} element={<PublicProfileRoute />} />

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.LEARNING_INSIGHTS} element={<LearningInsightsPage theme={theme} onThemeChange={setTheme} />} />
        <Route
          path={ROUTES.PROFILE}
          element={(
            <ProfilePage
              theme={theme}
              onThemeChange={setTheme}
              onLogout={() => {
                logout();
              }}
            />
          )}
        />
        <Route path={ROUTES.EDIT_PROFILE} element={<EditProfilePage theme={theme} onThemeChange={setTheme} />} />
        <Route path={`${ROUTES.APP}/:sheetId?`} element={<SheetRoute theme={theme} onThemeChange={setTheme} />} />
        <Route path={`${ROUTES.IMPORT}/:sheetId?`} element={<ImportRoute theme={theme} onThemeChange={setTheme} />} />
        <Route path={`${ROUTES.EXPORT}/:sheetId?`} element={<ExportRoute theme={theme} onThemeChange={setTheme} />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}

export default App;
