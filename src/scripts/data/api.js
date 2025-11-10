// src/scripts/data/api.js
const BASE = "https://story-api.dicoding.dev/v1";

function authHeader() {
  const token = localStorage.getItem("dicoding_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerUser({ name, email, password }) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.error && json.loginResult?.token) {
    localStorage.setItem("dicoding_token", json.loginResult.token);
    localStorage.setItem("dicoding_name", json.loginResult.name);
  }
  return json;
}

// ✅ FIXED: fetchStories hanya return JSON (bukan Promise lain)
export async function fetchStories({ page = 1, size = 50, location = 0 } = {}) {
  const params = new URLSearchParams({ page, size, location });
  const res = await fetch(`${BASE}/stories?${params.toString()}`, {
    headers: { ...authHeader() },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stories: ${res.status}`);
  }

  const json = await res.json(); // ⬅️ WAJIB pakai await di sini
  return json;
}

export async function fetchStoryDetail(id) {
  const res = await fetch(`${BASE}/stories/${id}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch story detail: ${res.status}`);
  }
  const json = await res.json();
  return json; // ✅ return hasil JSON, bukan Promise
}

export async function postStoryAuth({ description, file, lat, lon }) {
  const fd = new FormData();
  fd.append("description", description);
  if (file) fd.append("photo", file);
  if (lat !== undefined) fd.append("lat", String(lat));
  if (lon !== undefined) fd.append("lon", String(lon));
  const res = await fetch(`${BASE}/stories`, {
    method: "POST",
    headers: { ...authHeader() },
    body: fd,
  });
  return res.json();
}

export async function postStoryGuest({ description, file, lat, lon }) {
  const fd = new FormData();
  fd.append("description", description);
  if (file) fd.append("photo", file);
  if (lat !== undefined) fd.append("lat", String(lat));
  if (lon !== undefined) fd.append("lon", String(lon));
  const res = await fetch(`${BASE}/stories/guest`, {
    method: "POST",
    body: fd,
  });
  return res.json();
}
