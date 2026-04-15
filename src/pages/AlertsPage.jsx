import NotificationsPage from "./NotificationsPage";

function AlertsPage(props) {
  return <NotificationsPage {...props} defaultType="revision" defaultPanel="notifications" title="Notifications & Alerts" />;
}

export default AlertsPage;
