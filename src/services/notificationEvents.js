const NOTIFICATION_EVENT = "iqms:notifications:changed";

export const emitNotificationChanged = (detail = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail }));
};

export const subscribeNotificationChanged = (listener) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(NOTIFICATION_EVENT, listener);
  return () => window.removeEventListener(NOTIFICATION_EVENT, listener);
};
