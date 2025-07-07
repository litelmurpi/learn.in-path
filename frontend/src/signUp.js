import { registerUser } from "./apiService.js";

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
        alert("Nama pengguna harus diisi!");
        return;
      }

      if (!email) {
        alert("Email harus diisi!");
        return;
      }

      if (!isAgreed) {
        alert("Anda harus menyetujui ketentuan layanan dan kebijakan privasi!");
        return;
      }

      if (password.length < 8) {
        alert("Kata sandi minimal 8 karakter!");
        return;
      }

      if (password !== passwordConfirm) {
        alert("Konfirmasi kata sandi tidak cocok!");
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

      alert("Registrasi berhasil! Silakan login.");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Error saat registrasi:", error);
      alert(`Registrasi gagal: ${error.message}`);

      // Reset button state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = "Daftar";
        submitBtn.disabled = false;
      }
    }
  });
});
