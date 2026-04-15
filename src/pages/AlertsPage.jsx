import { Navigate } from "react-router-dom";
import { ROUTES } from "../services/routes";

function AlertsPage() {
  return <Navigate to={ROUTES.NOTIFICATIONS} replace />;
}

export default AlertsPage;
