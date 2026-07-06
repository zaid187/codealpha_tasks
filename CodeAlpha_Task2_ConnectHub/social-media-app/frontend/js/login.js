redirectIfAuth();

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginSpinner = document.getElementById("loginSpinner");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginBtn.disabled = true;
  loginSpinner.classList.remove("hidden");

  try {
    const data = await api.post("/auth/login", { email, password });
    saveAuth(data.token, data.user);
    showToast("Welcome back!", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } catch (err) {
    showToast(err.message, "error");
    loginBtn.disabled = false;
    loginSpinner.classList.add("hidden");
  }
});
