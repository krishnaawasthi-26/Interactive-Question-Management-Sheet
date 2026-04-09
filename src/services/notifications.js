const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

export const getNotificationPermissionState = () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
};

export const showDueNowBrowserNotification = async (notification) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const title = `Time to revise: ${notification.title}`;
  const body = `Revision ${notification.revisionNumber} for ${notification.sheetTitle} is due now.`;

  if (navigator.serviceWorker?.controller) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag: `revision-${notification.id}`,
        data: { link: notification.link },
      });
      return;
    }
  }

  const browserNotification = new Notification(title, { body, tag: `revision-${notification.id}` });
  browserNotification.onclick = () => {
    window.focus();
    if (notification.link) window.location.assign(notification.link);
  };
};

export const subscribeToPushIfPossible = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (!VAPID_PUBLIC_KEY) return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing.toJSON();

  const created = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  return created.toJSON();
};
