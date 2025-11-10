import { registerUser } from "../../data/api.js";

export default class RegisterPage {
  render() {
    return `
      <section>
      <h1>Register</h1>
    
        <form id="registerForm">
          <label for="name">Name</label>
          <input id="name" name="name" type="text" required />
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" minlength="8" required />
          <button type="submit">Register</button>
        </form>
        <div id="regMsg" role="status" aria-live="polite"></div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("registerForm");
    const msg = document.getElementById("regMsg");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "Registering...";
      try {
        const res = await registerUser({
          name: form.name.value,
          email: form.email.value,
          password: form.password.value,
        });
        if (!res.error) {
          msg.textContent = "Register success. Please login.";
          location.hash = "#/login";
        } else {
          msg.textContent = res.message || "Register failed";
        }
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }
}
