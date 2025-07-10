import { login } from "./apiService.js";
import { saveToken } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email-address");
  const passwordInput = document.getElementById("password");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const credentials = {
      email: emailInput.value,
      password: passwordInput.value,
    };

    try {
      const data = await login(credentials);
      console.log("=== LOGIN RESPONSE DEBUG ===");
      console.log("Full response:", data);
      console.log("Response type:", typeof data);
      console.log("Response keys:", Object.keys(data || {}));

      // Debug nested structures
      if (data) {
        console.log("data.user:", data.user);
        console.log("data.data:", data.data);
        console.log("Token:", data.token);
      }

      if (data && data.token) {
        // Save token
        saveToken(data.token);
        console.log("Token saved successfully");

        // Try different ways to get user data from response
        let userData = null;

        // Method 1: Check if user data is in data.user
        if (data.user) {
          userData = data.user;
          console.log("Found user data in data.user:", userData);
        }
        // Method 2: Check if user data is in data.data
        else if (data.data) {
          userData = data.data;
          console.log("Found user data in data.data:", userData);
        }
        // Method 3: Check if user info is in root level
        else if (data.id || data.email || data.name) {
          userData = {
            id: data.id,
            username: data.username,
            name: data.name,
            email: data.email,
          };
          console.log("Found user data in root level:", userData);
        }

        // If still no user data, try to get from API
        if (!userData) {
          console.log("No user data in login response, will fetch from API");
          // We'll fetch it in dashboard
        } else {
          // Save user data
          const normalizedUserData = {
            id: userData.id,
            username:
              userData.username ||
              userData.name ||
              userData.email?.split("@")[0],
            name:
              userData.name ||
              userData.username ||
              userData.email?.split("@")[0],
            email: userData.email,
          };

          console.log("Saving normalized user data:", normalizedUserData);
          localStorage.setItem("user", JSON.stringify(normalizedUserData));

          // Verify it was saved
          const savedData = localStorage.getItem("user");
          console.log("Verified saved user data:", savedData);
        }

        // Success alert with SweetAlert2
        await Swal.fire({
          icon: "success",
          title: "Login Berhasil!",
          text: data.message || "Selamat datang kembali!",
          showConfirmButton: false,
          timer: 1500,
        });

        // Redirect to dashboard
        window.location.replace("dasboard_login.html");
      } else {
        console.error("Login failed - no token received");
        // Error alert with SweetAlert2
        Swal.fire({
          icon: "error",
          title: "Login Gagal",
          text: "Silakan coba lagi.",
          confirmButtonColor: "#1e3a5f",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      // Error alert with SweetAlert2
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Terjadi kesalahan saat login. Silakan coba lagi.",
        confirmButtonColor: "#1e3a5f",
      });
    }
  });
});
