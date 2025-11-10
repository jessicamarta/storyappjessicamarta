// import "regenerator-runtime";
// import "../../public/styles/styles.css";
// import App from "./views/app.js";

import "regenerator-runtime";
import "../../public/styles/styles.css";
import App from "./views/app.js";

// Inisialisasi App
const app = new App({
  button: document.querySelector("#hamburgerButton"),
  drawer: document.querySelector("#navigationDrawer"),
  content: document.querySelector("#mainContent"),
});

// Re-render halaman setelah navigasi
// window.addEventListener("hashchange", () => {
//   app.renderPage();
// });

// window.addEventListener("load", async () => {
//   app.renderPage();
//   registerServiceWorker();
//   requestNotificationPermission();
// });

window.addEventListener("hashchange", () => app.renderPage());
window.addEventListener("load", async () => {
  await app.renderPage();
  registerServiceWorker();
  requestNotificationPermission();
});

// ==========================
// 🔧 Fungsi: Register Service Worker
// ==========================
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      console.log("✅ Service Worker berhasil didaftarkan:", registration);
    } catch (error) {
      console.error("❌ Gagal mendaftarkan Service Worker:", error);
    }
  } else {
    console.warn("⚠️ Service Worker tidak didukung di browser ini");
  }
}

// ==========================
// 🔔 Fungsi: Meminta izin notifikasi
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
