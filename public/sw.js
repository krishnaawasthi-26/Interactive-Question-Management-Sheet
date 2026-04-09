self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || "/app";
  event.waitUntil(clients.openWindow(link));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title || "Revision reminder", {
      body: payload.body || "A revision is due.",
      data: payload.data || {},
      tag: payload.tag,
    })
  );
});
