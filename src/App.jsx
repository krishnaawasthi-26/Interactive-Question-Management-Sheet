import { useEffect, useRef } from "react";
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
import NotificationsPage from "./pages/NotificationsPage";
import AlertsPage from "./pages/AlertsPage";
import AlarmsPage from "./pages/AlarmsPage";
import SharedPage from "./pages/SharedPage";
import SheetPage from "./pages/SheetPage";
import SignUpPage from "./pages/SignUpPage";
import ApplyPage from "./pages/ApplyPage";
import { ProtectedRoute, PublicOnlyRoute } from "./components/routing/ProtectedRoute";
import ReminderNotificationCenter from "./components/ReminderNotificationCenter";
import { getUserProfileRoute, ROUTES } from "./services/routes";
import { useAuthStore } from "./store/authStore";
import { useSheetStore } from "./store/sheetStore";

function LoginRoute() {
  const navigate = useNavigate();
  return (
    <LoginPage
      onLoginSuccess={() => navigate(getUserProfileRoute(useAuthStore.getState().currentUser?.username))}
      onGoToSignUp={() => navigate(ROUTES.SIGNUP)}
    />
  );
}

function SignupRoute() {
  const navigate = useNavigate();
  return (
    <SignUpPage
      onSignUpSuccess={() => navigate(getUserProfileRoute(useAuthStore.getState().currentUser?.username))}
      onGoToLogin={() => navigate(ROUTES.LOGIN)}
    />
  );
}

function SheetRoute() {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return (
    <SheetPage
      sheetId={sheetId}
      onOpenImport={() => navigate(`${ROUTES.IMPORT}/${sheetId || ""}`)}
      onOpenExport={() => navigate(`${ROUTES.EXPORT}/${sheetId || ""}`)}
    />
  );
}

function ImportRoute() {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return <ImportPage onBack={() => navigate(`${ROUTES.APP}/${sheetId || ""}`)} />;
}

function ExportRoute() {
  const navigate = useNavigate();
  const { sheetId } = useParams();

  return <ExportPage onBack={() => navigate(`${ROUTES.APP}/${sheetId || ""}`)} />;
}

function SharedRoute() {
  const { shareType, shareId } = useParams();
  return <SharedPage shareType={shareType} shareId={shareId} />;
}

function PublicProfileRoute() {
  const { username } = useParams();
  return <SharedPage shareType="public-profile" username={username} />;
}

function ProtectedAppLayout() {
  return (
    <>
      <ReminderNotificationCenter />
      <ProtectedRoute />
    </>
  );
}

function OwnProfileRedirectRoute() {
  const currentUser = useAuthStore((state) => state.currentUser);
  return <Navigate to={getUserProfileRoute(currentUser?.username)} replace />;
}

function UserProfileRoute() {
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isOwnProfile = currentUser?.username?.toLowerCase() === `${username || ""}`.trim().toLowerCase();

  if (isOwnProfile) {
    return <ProfilePage onLogout={() => useAuthStore.getState().logout()} />;
  }

  return <PublicProfileRoute />;
}

function PublicSheetRoute() {
  const { username, sheetSlug } = useParams();
  return <SharedPage shareType="public-sheet" username={username} sheetSlug={sheetSlug} />;
}

function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const resetSheetState = useSheetStore((state) => state.resetSheetState);
  const previousUserIdRef = useRef(currentUser?.id || null);

  useEffect(() => {
    const currentUserId = currentUser?.id || null;
    if (previousUserIdRef.current !== currentUserId) {
      resetSheetState();
      previousUserIdRef.current = currentUserId;
    }
  }, [currentUser?.id, resetSheetState]);

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginRoute />} />
        <Route path={ROUTES.SIGNUP} element={<SignupRoute />} />
      </Route>

      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.ABOUT} element={<AboutPage />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage />} />
      <Route path={ROUTES.HOW_TO_USE} element={<HowToUsePage />} />
      <Route path="/apply" element={<ApplyPage />} />

      <Route path={`${ROUTES.SHARED_PREFIX}/:shareType/:shareId`} element={<SharedRoute />} />
      <Route path={`${ROUTES.PROFILE}/:username/:sheetSlug`} element={<PublicSheetRoute />} />
      <Route path={`${ROUTES.PROFILE}/:username`} element={<UserProfileRoute />} />

      <Route element={<ProtectedAppLayout />}>
        <Route path={ROUTES.LEARNING_INSIGHTS} element={<LearningInsightsPage />} />
        <Route path={ROUTES.PREMIUM} element={<PremiumPage />} />
        <Route path={ROUTES.PUBLIC_SHEETS} element={<PublicSheetsPage />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
        <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
        <Route path={ROUTES.ALARMS} element={<AlarmsPage />} />
        <Route path={ROUTES.PROFILE} element={<OwnProfileRedirectRoute />} />
        <Route path={ROUTES.EDIT_PROFILE} element={<EditProfilePage />} />
        <Route path={`${ROUTES.APP}/:sheetId?`} element={<SheetRoute />} />
        <Route path={`${ROUTES.IMPORT}/:sheetId?`} element={<ImportRoute />} />
        <Route path={`${ROUTES.EXPORT}/:sheetId?`} element={<ExportRoute />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;
