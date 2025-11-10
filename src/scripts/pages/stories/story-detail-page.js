import { fetchStoryDetail } from "../../data/api.js";

export default class StoryDetailPage {
  render() {
    return `
      <section>
        <h1 tabindex="0">Detail Cerita</h1>
        <div id="storyDetail">Loading story...</div>
      </section>
    `;
  }

  async afterRender(parsed) {
    const id = parsed.id;
    const el = document.getElementById("storyDetail");
    try {
      const res = await fetchStoryDetail(id);
      if (res.error) {
        el.innerHTML = "<p>" + res.message + "</p>";
        return;
      }
      const s = res.story;
      el.innerHTML = `
        <article>
          <h2>${s.name}</h2>
          <img src="${s.photoUrl}" alt="${
        s.description || ""
      }" style="max-width:400px" />
          <p>${s.description}</p>
          <p>Location: ${s.lat ?? "-"} , ${s.lon ?? "-"}</p>
          <p>Created: ${new Date(s.createdAt).toLocaleString()}</p>
        </article>
      `;
    } catch (err) {
      el.innerHTML = "<p>Failed to load: " + err.message + "</p>";
    }
  }
}
