/* =============================== 
   🌐 Service Worker - Story App (Final Version)
   Fitur:
   - Cache shell (file statis)
   - Cache runtime (navigasi & assets)
   - Cache API (data stories Dicoding)
   - Push notification handler
================================== */

const CACHE_NAME = "story-app-shell-v2";
const RUNTIME_CACHE = "story-app-runtime-v2";
const API_CACHE = "story-app-api-v2";

// ✅ BENAR
const OFFLINE_URL = "./index.html";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles/styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./scripts/index.js",
  "./scripts/views/app.js",
  "./scripts/views/pages/story-list-page.js",
  "./scripts/data/api.js",
  "./scripts/data/story-db.js",
];

// ===============================
// 📦 Install - simpan shell awal
// ===============================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ===============================
// ♻️ Activate - hapus cache lama
// ===============================
self.addEventListener("activate", (event) => {
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
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ===============================
// 🚀 Fetch - intercept semua request
// ===============================
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ========== 1️⃣ Caching untuk API Dicoding ==========
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const res = await fetch(req); // coba ambil dari jaringan
          cache.put(req, res.clone()); // simpan versi terbaru
          return res;
        } catch (error) {
          // jika offline → ambil dari cache
          const cachedRes = await cache.match(req);
          if (cachedRes) {
            console.log("📦 Menggunakan data API dari cache:", req.url);
            return cachedRes;
          }
          // jika tidak ada di cache → fallback kosong
          return new Response(
            JSON.stringify({
              error: true,
              message: "Offline - tidak ada data di cache",
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return; // penting agar tidak lanjut ke bawah
  }

  // ========== 2️⃣ Navigasi halaman (reload) ==========
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req)
            .then((res) => {
              return caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(req, res.clone());
                return res;
              });
            })
            .catch(() => caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // ========== 3️⃣ Aset lokal (CSS, JS, gambar, ikon, dll) ==========
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            return caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(req, res.clone());
              return res;
            });
          })
      )
    );
  }

  // ========== 4️⃣ Request eksternal (misal tile map) ==========
  // Tidak dicache, langsung fetch
});

// ===============================
// 🔔 Push Notification Handler
// ===============================
self.addEventListener("push", (event) => {
  let data = { title: "New Story", options: { body: "You have a new story" } };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "New Story", options: { body: event.data.text() } };
    }
  }

  const title = data.title || "New Story";
  const options = data.options || { body: "You have a new story" };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ===============================
// 🖱️ Notification Click Handler
// ===============================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && "focus" in client)
            return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});
