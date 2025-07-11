import { API_BASE_URL } from "./apiConfig.js";
import { getToken } from "./auth.js";

async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        const errors = Object.values(data.errors).flat().join("\n");
        throw new Error(errors);
      }
      throw new Error(data.message || "Terjadi kesalahan saat registrasi.");
    }

    return data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
}

async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(credentials),
    });

    console.log("Raw response:", response);
    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("=== API LOGIN RESPONSE ===");
    console.log("Parsed response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Login error response:", data);
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Login API error:", error);
    throw error;
  }
}

async function getUserProfile() {
  const token = getToken();
  if (!token) throw new Error("Token otentikasi tidak ditemukan.");

  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log("Get user profile response status:", response.status);

    if (!response.ok) {
      // If 404, the endpoint might be different
      if (response.status === 404) {
        console.log("User endpoint not found, trying /me");
        // Try alternative endpoint
        const altResponse = await fetch(`${API_BASE_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (altResponse.ok) {
          const data = await altResponse.json();
          console.log("User data from /me endpoint:", data);
          return data;
        }
      }
      throw new Error("Gagal mengambil data user");
    }

    const data = await response.json();
    console.log("User profile data:", data);

    // Save user data
    if (data) {
      let userData = data.user || data.data || data;

      if (userData && (userData.id || userData.email)) {
        const normalizedUserData = {
          id: userData.id,
          username: userData.username || userData.name,
          name: userData.name || userData.username,
          email: userData.email,
        };
        localStorage.setItem("user", JSON.stringify(normalizedUserData));
        console.log("User data saved from API:", normalizedUserData);
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

async function getLogs() {
  const token = getToken();
  if (!token) throw new Error("Token otentikasi tidak ditemukan.");

  const response = await fetch(`${API_BASE_URL}/study-logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("Gagal memuat log.");
  return await response.json();
}

async function getHeatmapData() {
  const token = getToken();
  if (!token) throw new Error("Token otentikasi tidak ditemukan.");

  const response = await fetch(`${API_BASE_URL}/dashboard/heatmap`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("Gagal memuat data heatmap.");
  return await response.json();
}

async function createLog(logData) {
  const token = getToken();
  if (!token) throw new Error("Token otentikasi tidak ditemukan.");

  const response = await fetch(`${API_BASE_URL}/study-logs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(logData),
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 422) {
      const errors = Object.values(data.errors).flat().join("\n");
      throw new Error(errors);
    }
    throw new Error(data.message || "Gagal menyimpan sesi.");
  }
  return data;
}

// Update study log
async function updateLog(logId, logData) {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/study-logs/${logId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(logData),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 422) {
      const errors = Object.values(data.errors).flat().join("\n");
      throw new Error(errors);
    }
    throw new Error(data.message || "Failed to update study log");
  }

  return data;
}

// Delete study log
async function deleteLog(logId) {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/study-logs/${logId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete study log");
  }

  return data;
}

// Get logs by date
async function getLogsByDate(date) {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(
    `${API_BASE_URL}/study-logs/by-date?date=${date}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get logs by date");
  }

  return data;
}

export {
  registerUser,
  login,
  getLogs,
  getHeatmapData,
  createLog,
  updateLog,
  deleteLog,
  getLogsByDate,
  getUserProfile,
};
