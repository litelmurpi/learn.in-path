import { registerUser } from "./apiService.js";
import { saveToken } from "./auth.js";
import { setUserData } from "./userInfo.js";

// Fungsi helper untuk mendapatkan element dengan aman
function getElementSafely(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Element dengan ID "${id}" tidak ditemukan!`);
  }
  return element;
}

// Tunggu sampai seluruh halaman selesai dimuat
window.addEventListener("load", () => {
  console.log("Halaman selesai dimuat, mencari form...");

  const signUpForm = getElementSafely("signupForm");

  if (!signUpForm) {
    console.error("Form registrasi tidak ditemukan!");
    return;
  }

  console.log("Form ditemukan, menambahkan event listener...");

  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submit dipicu");

    try {
      // Ambil semua input
      const usernameInput = getElementSafely("namaPengguna");
      const emailInput = getElementSafely("email");
      const passwordInput = getElementSafely("kataSandi");
      const passwordConfirmInput = getElementSafely("konfirmasiKataSandi");
      const persetujuanCheckbox = getElementSafely("persetujuan");

      // Cek apakah semua element ada
      if (
        !usernameInput ||
        !emailInput ||
        !passwordInput ||
        !passwordConfirmInput ||
        !persetujuanCheckbox
      ) {
        throw new Error("Beberapa elemen form tidak ditemukan");
      }

      // Ambil nilai dengan aman
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const passwordConfirm = passwordConfirmInput.value;
      const isAgreed = persetujuanCheckbox.checked;

      // Validasi
      if (!username) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian",
          text: "Nama pengguna harus diisi!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      if (!email) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian",
          text: "Email harus diisi!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      if (!isAgreed) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian",
          text: "Anda harus menyetujui ketentuan layanan dan kebijakan privasi!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      if (password.length < 8) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian",
          text: "Kata sandi minimal 8 karakter!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      if (password !== passwordConfirm) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Konfirmasi kata sandi tidak cocok!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      const userData = {
        name: username,
        username: username,
        email: email,
        password: password,
        password_confirmation: passwordConfirm,
      };

      // Update button state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = "Mendaftar...";
        submitBtn.disabled = true;
      }

      console.log("Mengirim data registrasi:", userData);
      const data = await registerUser(userData);
      console.log("Full registration response:", data);

      // Di bagian setelah register berhasil
      if (data && data.token) {
        saveToken(data.token);

        // Handle different response formats
        let responseUserData = null;

        if (data.user) {
          responseUserData = data.user;
        } else if (data.data && data.data.user) {
          responseUserData = data.data.user;
        }

        if (responseUserData) {
          const normalizedUserData = {
            id: responseUserData.id,
            username:
              responseUserData.username || responseUserData.name || username,
            name:
              responseUserData.name || responseUserData.username || username,
            email: responseUserData.email || email,
          };

          const saved = setUserData(normalizedUserData);

          if (saved) {
            console.log(
              "User data saved after registration:",
              normalizedUserData
            );
          } else {
            console.error("Failed to save user data after registration");
          }
        }

        // Success alert with SweetAlert2
        await Swal.fire({
          icon: "success",
          title: "Registrasi Berhasil!",
          text: "Silakan login dengan akun yang baru dibuat.",
          confirmButtonColor: "#1e3a5f",
          confirmButtonText: "OK",
        });

        window.location.replace("login.html");
      } else {
        throw new Error("Token tidak diterima dari server");
      }
    } catch (error) {
      console.error("Error saat registrasi:", error);

      // Error alert with SweetAlert2
      Swal.fire({
        icon: "error",
        title: "Registrasi Gagal",
        text:
          error.message ||
          "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
        confirmButtonColor: "#1e3a5f",
      });

      // Reset button state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = "Daftar";
        submitBtn.disabled = false;
      }
    }
  });
});
