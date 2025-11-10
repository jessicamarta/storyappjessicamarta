import { openDB } from "idb";

// Membuka atau membuat database bernama 'story-db' versi 1
const dbPromise = openDB("story-db", 1, {
  upgrade(db) {
    // Membuat object store 'stories' jika belum ada
    if (!db.objectStoreNames.contains("stories")) {
      db.createObjectStore("stories", { keyPath: "id" });
    }
  },
});

// Simpan data story ke IndexedDB
export async function saveStoriesToDB(stories) {
  const db = await dbPromise;
  const tx = db.transaction("stories", "readwrite");
  stories.forEach((story) => tx.store.put(story));
  await tx.done;
}

// Ambil semua data story dari IndexedDB
export async function getStoriesFromDB() {
  const db = await dbPromise;
  return db.getAll("stories");
}

// Hapus semua story (opsional)
export async function clearStoriesFromDB() {
  const db = await dbPromise;
  const tx = db.transaction("stories", "readwrite");
  await tx.store.clear();
  await tx.done;
}
