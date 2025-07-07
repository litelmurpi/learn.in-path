// Fungsi untuk mendapatkan data user
export function getUserData() {
  const userDataString = localStorage.getItem("userData");
  if (userDataString) {
    try {
      return JSON.parse(userDataString);
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  }
  return null;
}

// Fungsi untuk menampilkan nama user di dashboard
export function displayUserInfo() {
  const userData = getUserData();

  // Update greeting jika ada element
  const greetingElement = document.querySelector(".greeting");
  if (greetingElement && userData) {
    const hour = new Date().getHours();
    let greeting = "Selamat";
    if (hour < 12) greeting = "Selamat Pagi";
    else if (hour < 15) greeting = "Selamat Siang";
    else if (hour < 18) greeting = "Selamat Sore";
    else greeting = "Selamat Malam";

    greetingElement.textContent = `${greeting}, ${
      userData.name || userData.username || "User"
    }!`;
  }

  // Update profile name jika ada
  const profileNameElement = document.querySelector(".profile-name");
  if (profileNameElement && userData) {
    profileNameElement.textContent =
      userData.name || userData.username || "User";
  }
}
