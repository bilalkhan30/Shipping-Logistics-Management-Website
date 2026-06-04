document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  // Listen for when the user clicks the "Login" button
  loginForm.addEventListener("submit", async (event) => {
    // 1. Stop the form from submitting normally
    event.preventDefault();
    loginError.textContent = ""; // Clear previous errors

    // 2. Get the form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      // 3. Send the data to our new backend API
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 4. If login is successful, save the token and user role
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userRole", data.userRole);

        // 5. Redirect to the dashboard
        window.location.href = "admin/dashboard.html";
      } else {
        // 6. If not valid, show an error message from the server
        loginError.textContent =
          data.message || "Invalid login. Please try again.";
        loginError.style.color = "red";
      }
    } catch (error) {
      // 7. Handle network errors
      console.error("Login fetch error:", error);
      loginError.textContent =
        "Cannot connect to server. Please try again later.";
      loginError.style.color = "red";
    }
  });
});
