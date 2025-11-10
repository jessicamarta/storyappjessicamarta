// src/scripts/views/app.js
import routes from "../routes/routes.js";
import { getActiveRoute, parseActivePathname } from "../routes/url-parser.js";

const root =
  document.getElementById("app") || document.getElementById("main-content");

function applyViewTransition(renderFn) {
  if (document.startViewTransition) {
    document.startViewTransition(() => renderFn());
  } else {
    const container = root;
    container.classList.add("fade-out");
    setTimeout(() => {
      renderFn();
      container.classList.remove("fade-out");
      container.classList.add("fade-in");
      setTimeout(() => container.classList.remove("fade-in"), 300);
    }, 150);
  }
}

export default class App {
  async renderPage() {
    const routeKey = getActiveRoute();
    const route = routes[routeKey] || routes["/"];
    console.log("✅ App rendered:", routeKey);

    applyViewTransition(async () => {
      // 🔧 Pastikan hasil render adalah string
      const renderedHTML = await Promise.resolve(route.render());
      root.innerHTML = renderedHTML;

      // 🔧 Tunggu DOM benar-benar attach
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 🔧 Jalankan afterRender jika tersedia
      if (typeof route.afterRender === "function") {
        const parsed = parseActivePathname();

        // Retry loop agar elemen target (seperti #storyList) sudah ada
        let retries = 5;
        while (retries > 0 && !root.querySelector("#storyList")) {
          await new Promise((r) => setTimeout(r, 50));
          retries--;
        }

        try {
          await route.afterRender(parsed);
          console.log(`✅ afterRender dijalankan untuk: ${routeKey}`);
        } catch (err) {
          console.error("❌ Error di afterRender:", err);
        }
      }

      // Fokus ke h1 (aksesibilitas)
      root.querySelector("h1, h2")?.focus?.();
    });
  }
}

// === Navbar Dinamis & Logout ===
function updateNavbar() {
  const nav = document.getElementById("nav-list");
  const token = localStorage.getItem("dicoding_token");

  if (!nav) return;

  if (token) {
    nav.innerHTML = `
      <ul class="nav-list">
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/about">About</a></li>
        <li><a href="#/stories">Stories</a></li>
        <li><a href="#/add">Add Story</a></li>
        <li><button id="logoutBtn" class="logout-btn">Logout</button></li>
      </ul>
    `;
  } else {
    nav.innerHTML = `
      <ul class="nav-list">
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/about">About</a></li>
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
      </ul>
    `;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("dicoding_token");
      alert("Anda telah logout.");
      window.location.hash = "/login";
      updateNavbar();
    });
  }
}

window.addEventListener("load", updateNavbar);
window.addEventListener("hashchange", updateNavbar);
