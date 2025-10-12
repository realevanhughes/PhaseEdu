document.addEventListener("DOMContentLoaded", async () => {
    const loginForm = document.getElementById("login-form");
    const messageEl = document.getElementById("login-message");
    const quickLoginForm = document.getElementById("quick-login-form");

    try {
        const res = await fetch("/api/server/env", { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            if (data.type === "dev") {
                quickLoginForm.style.display = "block";
                console.log("Dev mode detected — showing Quick Login button.");
            }
        }
    } catch (err) {
        console.warn("Could not determine environment:", err);
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        messageEl.textContent = "";
        messageEl.className = "message";

        const payload = {
            username: loginForm.username.value.trim(),
            password: loginForm.password.value,
        };

        try {
            const res = await fetch("/internal/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                redirect: "manual",
            });

            if (res.type === "opaqueredirect" || res.status === 0) {
                window.location.href = "/app";
                return;
            }

            const data = await res.json().catch(() => null);

            if (data && data.success === false) {
                messageEl.textContent = data.message || "Login failed.";
                messageEl.classList.add("error");
            } else if (res.status >= 400) {
                messageEl.textContent = "Invalid username or password.";
                messageEl.classList.add("error");
            } else {
                window.location.href = "/app";
            }
        } catch (err) {
            console.error(err);
            messageEl.textContent = "Network error. Please try again.";
            messageEl.classList.add("error");
        }
    });
});
