// src/scripts/utils/map-utils.js
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export function initMap(containerOrId, opts = {}) {
  const el =
    typeof containerOrId === "string"
      ? document.getElementById(containerOrId)
      : containerOrId;
  if (!el) throw new Error("Map container not found: " + containerOrId);
  el.style.height = el.style.height || "400px";
  const center = opts.center || [-6.2, 106.816667];
  const zoom = opts.zoom || 5;

  const map = L.map(el).setView(center, zoom);

  const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors",
    }
  ).addTo(map);

  const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenTopoMap contributors",
  });

  const hot = L.tileLayer(
    "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap HOT",
    }
  );

  const baseMaps = { OSM: osm, Topo: topo, HOT: hot };
  L.control.layers(baseMaps).addTo(map);

  return map;
}

export function addMarkersToMap(map, stories = []) {
  const markers = [];
  stories.forEach((s) => {
    if (s.lat !== undefined && s.lon !== undefined) {
      const marker = L.marker([s.lat, s.lon]).addTo(map);
      const popup = `
        <strong>${escapeHtml(s.name || "")}</strong><br/>
        <img src="${s.photoUrl}" alt="${
        s.description || ""
      }" style="width:120px;display:block" />
        <p>${escapeHtml((s.description || "").slice(0, 120))}</p>
      `;
      marker.bindPopup(popup);
      markers.push(marker);
    }
  });
  return markers;
}

export function placeTempMarker(map, lat, lon) {
  const marker = L.marker([lat, lon]).addTo(map);
  marker.bindPopup("Lokasi dipilih").openPopup();
  return marker;
}

function escapeHtml(str = "") {
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  );
}
