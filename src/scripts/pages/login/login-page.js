import { loginUser } from "../../data/api.js";

export default class LoginPage {
  render() {
    return `
      <section>
      <h1>Login</h1>
        
        <form id="loginForm">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" minlength="8" required />
          <button type="submit">Login</button>
        </form>
        <div id="loginMsg" role="status" aria-live="polite"></div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("loginForm");
    const msg = document.getElementById("loginMsg");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "Logging in...";
      try {
        const res = await loginUser({
          email: form.email.value,
          password: form.password.value,
        });
        if (!res.error) {
          msg.textContent = "Login successful";
          location.hash = "#/stories";
        } else {
          msg.textContent = res.message || "Login failed";
        }
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }
}
