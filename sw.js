// Updraft service worker: daily reminders (Web Push) only.
// Deliberately no fetch handler and no caching: a stale cached build would be worse than no
// offline mode. See src/lib/reminders.ts and scripts/send-reminders.mts.

const scope = self.registration.scope; // e.g. https://lucasit003.github.io/updraft/

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === "string" ? data.title : "Updraft";
  const body = typeof data.body === "string" ? data.body : "Today's climb is ready. How high can you fly?";
  const url = typeof data.url === "string" ? data.url : scope;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: new URL("icons/icon-192.png", scope).href,
      badge: new URL("icons/icon-192.png", scope).href,
      tag: "daily-reminder",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || scope;
  event.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // An open game tab: bring it forward (its Take off and "new climb" buttons load today's climb).
      const open = tabs.find((c) => c.url.startsWith(scope));
      if (open) return open.focus();
      return self.clients.openWindow(url);
    })(),
  );
});
