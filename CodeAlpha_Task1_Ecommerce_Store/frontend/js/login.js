const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const btn =
        document.querySelector(".auth-btn");

    try {

        btn.disabled = true;
        btn.innerText = "Logging In...";

        const response = await fetch(
            "https://e-commerce-store-ozor.onrender.com/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Invalid Email or Password"
            );

            btn.disabled = false;
            btn.innerText = "Login";

            return;
        }

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "user",
            JSON.stringify(data)
        );

        btn.innerText =
            "Login Successful ✓";

        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 1000);

    }
    catch (error) {

        console.log(error);

        alert("Server Error");

        btn.disabled = false;
        btn.innerText = "Login";
    }

});