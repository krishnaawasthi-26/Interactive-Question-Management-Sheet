import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../../services/routes";
import { useAuthStore } from "../../store/authStore";

export function ProtectedRoute() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = Boolean(currentUser?.token);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = Boolean(currentUser?.token);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.PROFILE} replace />;
  }

  return <Outlet />;
}
