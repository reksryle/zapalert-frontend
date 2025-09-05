// sw.js
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "ZapAlert", {
      body: data.body,
      icon: "/icons/zapalert-icon-192.png",
      badge: "/icons/zapalert-badge-72.png",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        // If the dashboard tab is already open, focus it
        if (client.url.includes("/responder") && "focus" in client) return client.focus();
      }
      // Otherwise, open it
      if (clients.openWindow) return clients.openWindow("/responder");
    })
  );
});

