/* =============================== 
   🌐 Service Worker - Story App (FIXED VERSION)
================================== */

const CACHE_NAME = "story-app-v3";
const RUNTIME_CACHE = "story-runtime-v3";
const API_CACHE = "story-api-v3";

// ✅ Path untuk GitHub Pages deployment
const BASE_PATH = "/storyappjessicamarta";

const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/styles/styles.css`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
];

// ===============================
// 📦 Install
// ===============================
self.addEventListener("install", (event) => {
  console.log("⚙️ Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Service Worker: Caching app shell");
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// ===============================
// ♻️ Activate
// ===============================
self.addEventListener("activate", (event) => {
  console.log("♻️ Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                name !== CACHE_NAME &&
                name !== RUNTIME_CACHE &&
                name !== API_CACHE
            )
            .map((name) => {
              console.log("🗑️ Service Worker: Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ===============================
// 🚀 Fetch
// ===============================
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1️⃣ API Dicoding - Network First with Cache Fallback
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(req, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            if (cached) {
              console.log("📦 Using cached API data:", req.url);
              return cached;
            }
            return new Response(
              JSON.stringify({
                error: true,
                message: "Offline - no cached data",
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
    return;
  }

  // 2️⃣ Navigation - Cache First with Network Fallback
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req)
          .then((response) => {
            return caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(req, response.clone());
              return response;
            });
          })
          .catch(() => {
            return caches.match(`${BASE_PATH}/index.html`);
          });
      })
    );
    return;
  }

  // 3️⃣ Local Assets - Cache First
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((response) => {
          return caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(req, response.clone());
            return response;
          });
        });
      })
    );
  }
});

// ===============================
// 🔔 Push Notification
// ===============================
self.addEventListener("push", (event) => {
  console.log("🔔 Push notification received:", event);

  let notificationData = {
    title: "New Story",
    body: "Ada story baru!",
    icon: "/storyappjessicamarta/icons/icon-192.png",
    badge: "/storyappjessicamarta/icons/icon-192.png",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData.title = data.title || notificationData.title;
      notificationData.body =
        (data.options && data.options.body) || notificationData.body;
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: "dicoding-story",
      vibrate: [200, 100, 200],
    })
  );
});

// ===============================
// 🖱️ Notification Click
// ===============================
self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notification clicked");
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(BASE_PATH) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(`${BASE_PATH}/#/stories`);
        }
      })
  );
});
