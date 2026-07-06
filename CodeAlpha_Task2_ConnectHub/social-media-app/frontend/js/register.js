redirectIfAuth();

const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");
const registerSpinner = document.getElementById("registerSpinner");
const passwordInput = document.getElementById("password");
const passwordStrength = document.getElementById("passwordStrength");

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

passwordInput.addEventListener("input", () => {
  const val = passwordInput.value;
  if (!val) {
    passwordStrength.textContent = "";
    passwordStrength.className = "password-strength";
    return;
  }

  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[a-z]/.test(val)) score++;
  if (/\d/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  if (score <= 2) {
    passwordStrength.textContent = "Weak password";
    passwordStrength.className = "password-strength weak";
  } else if (score <= 3) {
    passwordStrength.textContent = "Medium strength";
    passwordStrength.className = "password-strength medium";
  } else {
    passwordStrength.textContent = "Strong password";
    passwordStrength.className = "password-strength strong";
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!PASSWORD_REGEX.test(password)) {
    showToast(
      "Password must be 8+ chars with uppercase, lowercase, and a number",
      "error"
    );
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return;
  }

  registerBtn.disabled = true;
  registerSpinner.classList.remove("hidden");

  try {
    const data = await api.post("/auth/register", {
      name,
      username,
      email,
      password,
      confirmPassword,
    });
    saveAuth(data.token, data.user);
    showToast("Account created successfully!", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } catch (err) {
    showToast(err.message, "error");
    registerBtn.disabled = false;
    registerSpinner.classList.add("hidden");
  }
});
