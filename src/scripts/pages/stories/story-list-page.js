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
          <button id="btnLoadFromAPI" class="btn-primary">Load dari API</button>
          <button id="btnLoadFromDB" class="btn-secondary">Load dari IndexedDB</button>
          <button id="btnClearDB" class="btn-danger">Clear IndexedDB</button>
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

    // ✅ Button handlers untuk CRUD IndexedDB
    document.getElementById("btnLoadFromAPI").addEventListener("click", () => {
      this._loadFromAPI(listEl, dbStatus);
    });

    document.getElementById("btnLoadFromDB").addEventListener("click", () => {
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
      statusEl.textContent = "❌ API error, coba load dari IndexedDB";
      listEl.innerHTML = "<p>Gagal load dari API. Gunakan IndexedDB.</p>";
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
