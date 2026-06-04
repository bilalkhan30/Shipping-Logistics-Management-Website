document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const messageHolder = document.getElementById("signup-message");

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
      showMessage("Passwords do not match. Please try again.", "red");
      return;
    }

    const formData = new FormData(signupForm);
    const data = Object.fromEntries(formData.entries());
    delete data["confirm-password"];

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(
          "Account created successfully! It is now pending admin approval.",
          "green"
        );

        // --- THIS IS THE FIX ---
        // Redirect to the new login.html page
        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);
      } else {
        showMessage(result.message || "Error creating account.", "red");
      }
    } catch (error) {
      console.error("Signup error:", error);
      showMessage("A network error occurred. Please try again.", "red");
    }
  });

  function showMessage(message, color) {
    messageHolder.textContent = message;
    messageHolder.style.color = color;
  }
});
