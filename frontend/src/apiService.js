import { API_BASE_URL } from "./apiConfig.js";

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
      // Menangani error validasi dari Laravel
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

import { getToken } from "./auth.js";

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Email atau kata sandi salah.");
    }

    return data;
  } catch (error) {
    console.error("Error during login:", error);
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

// Fungsi lain seperti login, dll. akan ditambahkan di sini
export { registerUser, login, getLogs, getHeatmapData, createLog };
