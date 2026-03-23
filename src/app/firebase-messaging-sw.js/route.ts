import { type NextRequest, NextResponse } from "next/server";

/**
 * Serves the Firebase Cloud Messaging service worker at /firebase-messaging-sw.js
 * with Firebase config injected from server-side environment variables.
 *
 * Service workers cannot access process.env directly, so we render the script
 * on the server and embed the config as a literal JS object.
 */
export function GET(_request: NextRequest): NextResponse {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const script = `
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

// Background message handler — called when the app tab is not focused or is closed.
messaging.onBackgroundMessage(function(payload) {
  var title = (payload.notification && payload.notification.title) || "New notification";
  var options = {
    body: (payload.notification && payload.notification.body) || "",
    icon:
      (payload.notification && payload.notification.icon) ||
      "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: payload.data || {},
    tag: (payload.data && payload.data.tag) || "worldvisa-notification",
    renotify: true,
  };
  self.registration.showNotification(title, options);
});

// Notification click — focus an existing tab or open a new one.
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  var url = (event.notification.data && event.notification.data.url) || "/";
  var origin = self.location.origin;
  var fullUrl = url.startsWith("http") ? url : origin + url;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function(windowClients) {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.startsWith(origin) && "focus" in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Allow the SW to control the full origin
      "Service-Worker-Allowed": "/",
      // Revalidate after 1 hour in case config changes
      "Cache-Control": "public, max-age=3600",
    },
  });
}
