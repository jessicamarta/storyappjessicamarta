import { postStoryAuth, postStoryGuest } from "../../data/api.js";
import { initMap, placeTempMarker } from "../../utils/map-utils.js";

export default class AddStoryPage {
  render() {
    return `
      <section>
        <h1 tabindex="0">Add Story</h1>

        <form id="addForm">
          <label for="desc">Description</label>
          <textarea id="desc" name="description" required></textarea>

          <label for="photo">Photo (≤1MB)</label>
          <input id="photo" type="file" accept="image/*" />

          <div>
            <button type="button" id="openCamera">Use Camera</button>
          </div>

          <label for="lat">Latitude</label>
          <input id="lat" name="lat" readonly />

          <label for="lon">Longitude</label>
          <input id="lon" name="lon" readonly />

          <button type="submit">Submit</button>
        </form>

        <div id="mapAdd" class="map"></div>
        <video id="camPreview" autoplay playsinline style="display:none;"></video>
        <canvas id="camCanvas" style="display:none;"></canvas>
        <div id="formMsg" role="status" aria-live="polite"></div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("addForm");
    const photoInput = document.getElementById("photo");
    const latInput = document.getElementById("lat");
    const lonInput = document.getElementById("lon");
    const mapEl = document.getElementById("mapAdd");
    const msg = document.getElementById("formMsg");
    const video = document.getElementById("camPreview");
    const canvas = document.getElementById("camCanvas");
    let stream = null;
    let tempMarker = null;

    // --- Inisialisasi peta
    const map = initMap(mapEl, { center: [-6.2, 106.8], zoom: 5 });
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (tempMarker) tempMarker.remove();
      tempMarker = placeTempMarker(map, lat, lng);
      latInput.value = lat.toFixed(6);
      lonInput.value = lng.toFixed(6);
    });

    // --- Fungsi pembuka dan penutup kamera
    async function openCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = "block";
      } catch (err) {
        alert("Cannot access camera: " + err.message);
      }
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      video.style.display = "none";
    }

    // --- Tombol buka / ambil gambar
    const openCamBtn = document.getElementById("openCamera");
    openCamBtn.addEventListener("click", async () => {
      if (!stream) {
        // Buka kamera
        await openCamera();
        openCamBtn.textContent = "Capture";
      } else {
        // Ambil foto
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            const dt = new DataTransfer();
            const file = new File([blob], "camera.jpg", { type: "image/jpeg" });
            dt.items.add(file);
            photoInput.files = dt.files;
          },
          "image/jpeg",
          0.9
        );
        stopCamera();
        openCamBtn.textContent = "Use Camera";
      }
    });

    // --- Bersihkan stream jika user berpindah halaman
    window.addEventListener("hashchange", () => {
      stopCamera();
    });

    // --- Tambahkan juga pembersihan saat window ditutup / reload
    window.addEventListener("beforeunload", () => {
      stopCamera();
    });

    // --- Submit form
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "Submitting...";
      const description = form.description.value;
      const file = photoInput.files[0];
      const lat = latInput.value ? Number(latInput.value) : undefined;
      const lon = lonInput.value ? Number(lonInput.value) : undefined;

      if (file && file.size > 1 * 1024 * 1024) {
        msg.textContent = "File size max 1 MB";
        return;
      }

      try {
        const token = localStorage.getItem("dicoding_token");
        let res;
        if (token) {
          res = await postStoryAuth({ description, file, lat, lon });
        } else {
          res = await postStoryGuest({ description, file, lat, lon });
        }

        if (!res.error) {
          msg.textContent = "Story submitted";
          form.reset();
          if (tempMarker) {
            tempMarker.remove();
            tempMarker = null;
          }
          // Tutup kamera jika masih aktif
          stopCamera();
          // Navigasi ke halaman Stories
          setTimeout(() => {
            window.location.hash = "/stories";
          }, 1000);
        } else {
          msg.textContent = res.message || "Submit failed";
        }
      } catch (err) {
        msg.textContent = "Submit error: " + err.message;
      }
    });
  }
}
