import { fetchStories } from "../../data/api.js";
import { StoryDB } from "../../data/story-db.js";
import { initMap, addMarkersToMap } from "../../utils/map-utils.js";

export default class StoryListPage {
  async render() {
    return `
      <section class="stories">
        <h2 tabindex="0">Cerita Terbaru</h2>
        
        <!-- Button untuk manajemen IndexedDB -->
        <div class="db-controls">
          <button id="btnLoadFromAPI" class="btn-primary">📡 Load dari API</button>
<button id="btnLoadOffline" class="btn-secondary">💾 Laporan Tersimpan (Offline)</button>
<button id="btnClearDB" class="btn-danger">🗑️ Hapus Cache</button>
          <span id="dbStatus" aria-live="polite"></span>
        </div>

        <div id="storyList" class="story-list">
          <p>Pilih sumber data...</p>
        </div>
        <div id="map" style="height: 300px; margin-top: 1rem;"></div>
      </section>
    `;
  }

  async afterRender() {
    await new Promise((r) => requestAnimationFrame(r));

    const listEl = document.getElementById("storyList");
    const dbStatus = document.getElementById("dbStatus");

    if (!listEl) {
      console.error("❌ #storyList not found");
      return;
    }
    await this._autoLoad(listEl, dbStatus);

    // ✅ Button handlers untuk CRUD IndexedDB
    document.getElementById("btnLoadFromAPI").addEventListener("click", () => {
      this._loadFromAPI(listEl, dbStatus);
    });

    document.getElementById("btnLoadOffline").addEventListener("click", () => {
      this._loadFromIndexedDB(listEl, dbStatus);
    });

    document
      .getElementById("btnClearDB")
      .addEventListener("click", async () => {
        await StoryDB.clear();
        dbStatus.textContent = "✅ IndexedDB cleared!";
        listEl.innerHTML = "<p>Data IndexedDB telah dihapus.</p>";
      });

    // Auto load from IndexedDB on first load
    this._loadFromIndexedDB(listEl, dbStatus);
  }

  async _autoLoad(listEl, statusEl) {
    statusEl.textContent = "🔄 Memuat data...";

    try {
      // Coba ambil dari API
      const data = await fetchStories({ page: 1, size: 20, location: 1 });
      const stories = data?.listStory ?? [];

      if (stories.length > 0) {
        // Simpan ke IndexedDB
        for (const story of stories) {
          await StoryDB.put(story);
        }

        this._renderStories(stories);
        this._renderMap(stories);
        statusEl.textContent = `✅ ${stories.length} cerita (online)`;
      } else {
        throw new Error("Tidak ada data dari API");
      }
    } catch (error) {
      console.warn("⚠️ API gagal, coba IndexedDB:", error.message);

      // Fallback: ambil dari IndexedDB
      const cachedStories = await StoryDB.getAll();

      if (cachedStories.length > 0) {
        this._renderStories(cachedStories);
        this._renderMap(cachedStories);
        statusEl.textContent = `💾 ${cachedStories.length} cerita (offline)`;
      } else {
        listEl.innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <p>⚠️ Tidak ada koneksi internet dan belum ada data offline.</p>
          <p>Silahkan coba lagi saat online.</p>
        </div>
      `;
        statusEl.textContent = "❌ Tidak ada data";
      }
    }
  }

  // ✅ CREATE & READ: Load dari API dan simpan ke IndexedDB
  async _loadFromAPI(listEl, statusEl) {
    listEl.innerHTML = "<p>Loading dari API...</p>";
    statusEl.textContent = "⏳ Fetching...";

    try {
      const data = await fetchStories({ page: 1, size: 20, location: 1 });
      const stories = data?.listStory ?? [];

      // ✅ CREATE: Simpan ke IndexedDB
      for (const story of stories) {
        await StoryDB.put(story);
      }

      this._renderStories(stories);
      this._renderMap(stories);

      statusEl.textContent = `✅ ${stories.length} stories loaded from API & saved to IndexedDB`;
    } catch (error) {
      console.error("❌ Failed to load from API:", error);
      statusEl.textContent = "❌ Gagal memuat dari API";
      listEl.innerHTML = `
    <div style="text-align:center; padding:2rem; background:#fff3cd; border-radius:8px;">
      <p>❌ Gagal mengambil data dari server</p>
      <p style="font-size:14px; color:#856404;">${error.message}</p>
      <button id="retryOffline" class="btn-secondary" style="margin-top:1rem;">
        💾 Lihat Data Offline
      </button>
    </div>
  `;

      document.getElementById("retryOffline")?.addEventListener("click", () => {
        this._loadFromIndexedDB(listEl, statusEl);
      });
    }
  }

  // ✅ READ: Load dari IndexedDB
  async _loadFromIndexedDB(listEl, statusEl) {
    listEl.innerHTML = "<p>Loading dari IndexedDB...</p>";
    statusEl.textContent = "⏳ Reading...";

    try {
      const stories = await StoryDB.getAll();

      if (stories.length > 0) {
        this._renderStories(stories);
        this._renderMap(stories);
        statusEl.textContent = `✅ ${stories.length} stories loaded from IndexedDB (offline)`;
      } else {
        listEl.innerHTML = "<p>IndexedDB kosong. Load dari API dulu.</p>";
        statusEl.textContent = "ℹ️ No data in IndexedDB";
      }
    } catch (error) {
      console.error("❌ Failed to read IndexedDB:", error);
      statusEl.textContent = "❌ IndexedDB error";
    }
  }

  _renderStories(stories) {
    const listEl = document.getElementById("storyList");
    if (!listEl) return;

    if (stories.length === 0) {
      listEl.innerHTML = "<p>Tidak ada cerita tersedia.</p>";
      return;
    }

    listEl.innerHTML = stories
      .map(
        (story) => `
        <article class="story-item">
          <img src="${story.photoUrl}" alt="${story.description}" class="story-image"/>
          <div class="story-info">
            <h3>${story.name}</h3>
            <p>${story.description}</p>
          </div>
        </article>
      `
      )
      .join("");
  }

  _renderMap(stories) {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    const map = initMap(mapEl);
    addMarkersToMap(map, stories);
  }
}
