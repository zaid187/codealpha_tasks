const form = document.getElementById("registerForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const toast = document.getElementById("toast");

function clearErrors() {

    document
        .querySelectorAll(".error")
        .forEach(el => el.innerText = "");

    document
        .querySelectorAll("input")
        .forEach(el =>
            el.classList.remove("input-error")
        );
}

function showError(id, message) {

    const element =
        document.getElementById(id);

    if (element) {
        element.innerText = message;
    }
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    clearErrors();

    const name =
        nameInput
            ? nameInput.value.trim()
            : "";

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    let valid = true;

    // Name Validation (only if field exists)
    if (nameInput) {

        const nameRegex =
            /^[A-Za-z ]{3,}$/;

        if (!nameRegex.test(name)) {

            showError(
                "nameError",
                "Name should contain only letters and be at least 3 characters."
            );

            nameInput.classList.add(
                "input-error"
            );

            valid = false;
        }
    }

    // Email Validation
    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

        showError(
            "emailError",
            "Enter a valid email address."
        );

        emailInput.classList.add(
            "input-error"
        );

        valid = false;
    }

    // Password Validation
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {

        showError(
            "passwordError",
            "Minimum 8 characters, 1 uppercase, 1 lowercase and 1 number."
        );

        passwordInput.classList.add(
            "input-error"
        );

        valid = false;
    }

    if (!valid) return;

    const btn =
        document.querySelector(".auth-btn");

    try {

        if (btn) {
            btn.disabled = true;
            btn.innerText =
                "Creating Account...";
        }

        const response =
            await fetch(
                "https://e-commerce-store-ozor.onrender.com/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Registration Failed"
            );
        }

        if (toast) {

            toast.classList.add("show");

            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1500);

        } else {

            alert(
                "Registration Successful!"
            );

            window.location.href =
                "login.html";
        }

    } catch (error) {

        showError(
            "emailError",
            error.message
        );

        if (btn) {

            btn.disabled = false;

            btn.innerText =
                "Create Account";
        }

        console.log(error);
    }

});