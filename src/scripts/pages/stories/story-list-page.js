import { fetchStories } from "../../data/api.js";
import { StoryDB } from "../../data/story-db.js";
import { initMap, addMarkersToMap } from "../../utils/map-utils.js";

export default class StoryListPage {
  async render() {
    return `
      <section class="stories">
        <h2 tabindex="0">Cerita Terbaru</h2>
        <div id="storyList" class="story-list">
          <p>Sedang memuat cerita...</p>
        </div>
        <div id="map" style="height: 300px; margin-top: 1rem;"></div>
      </section>
    `;
  }

  async afterRender() {
    // Tunggu DOM benar-benar siap agar #storyList terpasang
    await new Promise((r) => requestAnimationFrame(r));

    const listEl = document.getElementById("storyList");
    if (!listEl) {
      console.error(
        "❌ Elemen #storyList tidak ditemukan di DOM (cek render)."
      );
      return;
    }

    listEl.innerHTML = "<p>Memuat data cerita...</p>";

    try {
      // ✅ Ambil data dari API dan tunggu hasilnya
      const data = await fetchStories({ page: 1, size: 20, location: 1 });
      const stories = data?.listStory ?? [];

      // Simpan ke IndexedDB (cache)
      for (const story of stories) {
        await StoryDB.put(story);
      }

      // Render daftar story
      this._renderStories(stories);

      // Tampilkan peta
      const mapEl = document.getElementById("map");
      if (mapEl) {
        const map = initMap(mapEl);
        addMarkersToMap(map, stories);
      }

      console.log("✅ Cerita berhasil dimuat dari API dan dirender.");
    } catch (error) {
      console.warn(
        "⚠️ Gagal memuat data dari API, ambil dari IndexedDB:",
        error
      );
      const offlineStories = await StoryDB.getAll();

      if (offlineStories.length > 0) {
        this._renderStories(offlineStories);

        const mapEl = document.getElementById("map");
        if (mapEl) {
          const map = initMap(mapEl);
          addMarkersToMap(map, offlineStories);
        }

        console.log("📦 Cerita dimuat dari IndexedDB (offline mode).");
      } else {
        listEl.innerHTML = "<p>Tidak ada data yang bisa ditampilkan.</p>";
      }
    }
  }

  _renderStories(stories) {
    const listEl = document.getElementById("storyList");
    if (!listEl) return;

    if (stories.length === 0) {
      listEl.innerHTML = "<p>Tidak ada cerita tersedia.</p>";
      return;
    }

    // Gunakan join() agar tidak ada koma
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
}
