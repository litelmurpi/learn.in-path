// Fungsi untuk mendapatkan data user dengan debugging yang lebih detail
export function getUserData() {
  try {
    // Debug: Cek semua keys di localStorage
    console.log("=== DEBUG getUserData ===");
    console.log("All localStorage keys:", Object.keys(localStorage));

    const userDataString = localStorage.getItem("user");
    console.log("Raw user data string:", userDataString);
    console.log("Type of userDataString:", typeof userDataString);

    // Cek berbagai kondisi
    if (!userDataString) {
      console.log("userDataString is null or undefined");
      return null;
    }

    if (userDataString === "undefined") {
      console.log("userDataString is string 'undefined'");
      localStorage.removeItem("user");
      return null;
    }

    // Try to parse JSON
    try {
      const userData = JSON.parse(userDataString);
      console.log("Successfully parsed user data:", userData);
      console.log("User data type:", typeof userData);
      console.log("User data keys:", Object.keys(userData || {}));

      // Validate that userData is an object with required fields
      if (
        userData &&
        typeof userData === "object" &&
        (userData.id || userData.email)
      ) {
        return userData;
      } else {
        console.error("Parsed data is not valid user object");
        return null;
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Invalid JSON string:", userDataString);
      localStorage.removeItem("user");
      return null;
    }
  } catch (e) {
    console.error("Unexpected error in getUserData:", e);
    return null;
  }
}

// Fungsi helper untuk set user data dengan validasi
export function setUserData(userData) {
  try {
    if (!userData || typeof userData !== "object") {
      console.error("Invalid user data to save:", userData);
      return false;
    }

    console.log("Saving user data:", userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Verify it was saved correctly
    const saved = localStorage.getItem("user");
    console.log("Verified saved data:", saved);

    return true;
  } catch (error) {
    console.error("Error saving user data:", error);
    return false;
  }
}

// Fungsi untuk menampilkan nama user di dashboard
export function displayUserInfo() {
  try {
    const userData = getUserData();
    console.log("Display user info - userData:", userData);

    const greetingElement = document.querySelector(".greeting");
    if (!greetingElement) {
      console.error("Greeting element not found in DOM");
      return;
    }

    if (!userData) {
      console.warn("No user data found for display");
      greetingElement.textContent = "Selamat datang!";
      return;
    }

    // Determine greeting based on time
    const hour = new Date().getHours();
    let greeting = "Selamat";
    if (hour >= 5 && hour < 12) greeting = "Selamat Pagi";
    else if (hour >= 12 && hour < 15) greeting = "Selamat Siang";
    else if (hour >= 15 && hour < 18) greeting = "Selamat Sore";
    else greeting = "Selamat Malam";

    // Use name or username, with fallback
    const displayName =
      userData.name ||
      userData.username ||
      userData.email?.split("@")[0] ||
      "User";

    greetingElement.textContent = `${greeting}, ${displayName}!`;
    console.log("Greeting set to:", greetingElement.textContent);

    // Update profile name if exists
    const profileNameElement = document.querySelector(".profile-name");
    if (profileNameElement) {
      profileNameElement.textContent = displayName;
    }
  } catch (error) {
    console.error("Error in displayUserInfo:", error);
  }
}

// Debug function untuk melihat semua data di localStorage
export function debugLocalStorage() {
  console.log("=== LocalStorage Debug ===");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`Key: ${key}, Value:`, value);

    // Try to parse if it looks like JSON
    if (value && value.startsWith("{")) {
      try {
        const parsed = JSON.parse(value);
        console.log(`Parsed ${key}:`, parsed);
      } catch (e) {
        console.log(`Failed to parse ${key} as JSON`);
      }
    }
  }
  console.log("=== End Debug ===");
}

// Auto-clear invalid user data on load
window.addEventListener("load", () => {
  console.log("UserInfo module loaded");
  debugLocalStorage(); // This will help us see what's in localStorage
});
