import "regenerator-runtime";
import "../../public/styles/styles.css";
import App from "./views/app.js";

// Inisialisasi App
const app = new App({
  button: document.querySelector("#hamburgerButton"),
  drawer: document.querySelector("#navigationDrawer"),
  content: document.querySelector("#mainContent"),
});

window.addEventListener("hashchange", () => app.renderPage());

window.addEventListener("load", async () => {
  await app.renderPage();
  await registerServiceWorker();
  requestNotificationPermission();
});

// ==========================
// 🔧 Register Service Worker
// ==========================
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("⚠️ Service Worker tidak didukung di browser ini");
    return;
  }

  try {
    // ✅ BENAR: untuk GitHub Pages deployment
    const registration = await navigator.serviceWorker.register(
      "/storyappjessicamarta/sw.js",
      {
        scope: "/storyappjessicamarta/",
      }
    );

    console.log("✅ Service Worker registered:", registration);

    // Tunggu hingga SW active
    await navigator.serviceWorker.ready;
    console.log("✅ Service Worker is ready");

    // Setup push notification subscription
    setupPushNotification(registration);
  } catch (error) {
    console.error("❌ Service Worker registration failed:", error);
  }
}

// ==========================
// 🔔 Setup Push Notification
// ==========================
async function setupPushNotification(registration) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🚫 Notifikasi ditolak oleh user");
      return;
    }

    // VAPID public key dari Dicoding
    const vapidPublicKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("✅ Push subscription:", subscription);
    await sendSubscriptionToServer(subscription);

    // Kirim subscription ke server (optional)
    // await sendSubscriptionToServer(subscription);
  } catch (error) {
    console.error("❌ Push notification setup failed:", error);
  }
}

async function sendSubscriptionToServer(subscription) {
  const token = localStorage.getItem("dicoding_token");

  if (!token) {
    console.warn("⚠️ User belum login, skip send subscription");
    return;
  }

  try {
    const response = await fetch(
      "https://story-api.dicoding.dev/v1/stories/push/subscribe",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      }
    );

    if (response.ok) {
      console.log("✅ Subscription berhasil dikirim ke server");
    } else {
      const error = await response.json();
      console.error("❌ Gagal kirim subscription:", error);
    }
  } catch (error) {
    console.error("❌ Error kirim subscription:", error);
  }
}

// Helper untuk convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ==========================
// 🔔 Request Notification Permission
// ==========================
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("⚠️ Browser tidak mendukung notifikasi.");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("✅ Izin notifikasi diberikan.");
    } else if (permission === "denied") {
      console.warn("🚫 Izin notifikasi ditolak.");
    } else {
      console.log("ℹ️ Izin notifikasi belum diputuskan.");
    }
  });
}
