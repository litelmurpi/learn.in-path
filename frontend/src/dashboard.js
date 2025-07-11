import { isAuthenticated, removeToken, getToken } from "./auth.js";
import { API_BASE_URL } from "./apiConfig.js";
import {
  getLogs,
  getHeatmapData,
  createLog,
  updateLog,
  deleteLog as apiDeleteLog,
  getUserProfile,
} from "./apiService.js";
import { displayUserInfo, getUserData } from "./userInfo.js";
import { parseAPIDate, formatDateDisplay } from "./dateUtils.js";

// Lindungi halaman: jika tidak terotentikasi, arahkan ke login
document.addEventListener("DOMContentLoaded", async () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  // === TIMEZONE DEBUG ===
  console.log("=== TIMEZONE DEBUG ===");
  console.log(
    "Browser timezone:",
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  console.log("Current date/time (local):", new Date().toString());
  console.log("Current date/time (ISO):", new Date().toISOString());
  console.log(
    "Current date/time (WIB):",
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );

  // Check if user data exists, if not fetch it
  let userData = getUserData();
  if (!userData) {
    try {
      console.log("User data not found in localStorage, fetching from API...");
      const response = await getUserProfile();
      if (response && response.user) {
        console.log("User data fetched successfully");
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }

  // Display user info
  displayUserInfo();

  // Ambil elemen DOM dengan selector yang lebih spesifik
  const logoutButton = document.getElementById("logoutButton");
  const sessionForm = document.getElementById("sessionForm");
  const editForm = document.getElementById("editForm");
  const recentActivitiesContainer = document.getElementById("recentActivities");
  const heatmapContainer = document.getElementById("heatmapCalendar");

  // Fix: Gunakan selector yang lebih spesifik untuk stat cards
  const statCards = document.querySelectorAll(".stat-card");
  const longestStreakElement = statCards[0]?.querySelector(
    ".text-2xl, .text-3xl"
  );
  const totalHoursElement = statCards[1]?.querySelector(".text-2xl, .text-3xl");
  const todaySessionElement = statCards[2]?.querySelector(
    ".text-2xl, .text-3xl"
  );

  console.log("Stat elements found:", {
    longestStreak: !!longestStreakElement,
    totalHours: !!totalHoursElement,
    todaySession: !!todaySessionElement,
  });

  // Variabel untuk menyimpan data
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let allLogs = []; // Simpan semua logs untuk kalkulasi ulang saat ganti bulan
  let heatmapData = null; // Store heatmap data
  let currentEditLogId = null; // Store current editing log ID

  // Helper function to get today's date in WIB timezone
  function getLocalToday() {
    // Use en-CA locale to get YYYY-MM-DD format directly
    const dateInWIB = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    console.log("Today in WIB (getLocalToday):", dateInWIB);
    return dateInWIB;
  }

  // Helper function to format date to YYYY-MM-DD
  function formatDateToYYYYMMDD(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Set max date to today for date inputs
  function setMaxDateToToday() {
    const today = getLocalToday();
    const dateInput = document.getElementById("date");
    const editDateInput = document.getElementById("editDate");

    console.log("Setting max date to:", today);

    if (dateInput) {
      dateInput.max = today;
      dateInput.value = today;
    }

    if (editDateInput) {
      editDateInput.max = today;
    }
  }

  // Initialize date inputs
  setMaxDateToToday();

  // Fungsi untuk memuat dashboard stats dari API
  async function loadDashboardStats() {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to load stats");

      const result = await response.json();
      const stats = result.data;

      // Update UI dengan data real
      if (longestStreakElement) {
        longestStreakElement.textContent = `${stats.longest_streak} Hari`;
      }

      if (totalHoursElement) {
        totalHoursElement.textContent = stats.total_time_this_month.formatted;
      }

      if (todaySessionElement) {
        todaySessionElement.textContent = `${stats.sessions_today} Sesi`;
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }

  // Fungsi untuk memuat data heatmap
  async function loadHeatmapData() {
    const token = getToken();
    if (!token) return;

    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${API_BASE_URL}/dashboard/heatmap?t=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load heatmap");

      const result = await response.json();
      heatmapData = result.data;

      console.log("Heatmap API response:", result);

      // Render calendar dengan data heatmap
      renderCalendarWithHeatmap();
    } catch (error) {
      console.error("Error loading heatmap data:", error);
    }
  }

  // Fungsi untuk memuat aktivitas terkini
  async function loadRecentActivities() {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/study-logs?per_page=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to load activities");

      const result = await response.json();
      const activities = result.data.data;

      console.log("Recent activities:", activities);
      renderRecentActivities(activities);
    } catch (error) {
      console.error("Error loading recent activities:", error);
      if (recentActivitiesContainer) {
        recentActivitiesContainer.innerHTML =
          '<p class="text-gray-500 text-center text-sm">Gagal memuat aktivitas</p>';
      }
    }
  }

  // Fungsi untuk render aktivitas terkini - FIXED
  // Helper function untuk format tanggal yang konsisten
  function formatDateFromAPI(dateString) {
    // dateString format: "YYYY-MM-DD"
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const [year, month, day] = dateString
      .split("-")
      .map((num) => parseInt(num, 10));

    // Return formatted string directly without Date object
    return `${day} ${months[month - 1]} ${year}`;
  }

  // Dan update renderRecentActivities menggunakan helper ini:
  function renderRecentActivities(activities) {
    if (!recentActivitiesContainer) return;

    recentActivitiesContainer.innerHTML = "";

    if (!activities || activities.length === 0) {
      recentActivitiesContainer.innerHTML =
        '<p class="text-gray-500 text-center text-sm">Belum ada aktivitas. Mulai sesi pertama Anda!</p>';
      return;
    }

    activities.forEach((activity) => {
      const hours = Math.floor(activity.duration_minutes / 60);
      const minutes = activity.duration_minutes % 60;
      const duration = hours > 0 ? `${hours}j ${minutes}m` : `${minutes} menit`;

      // Gunakan pre-formatted date dari backend
      const formattedDate = activity.log_date_formatted || activity.log_date;

      const activityItem = document.createElement("div");
      activityItem.className = "activity-item cursor-pointer";
      activityItem.onclick = () => openEditModalWithData(activity);

      activityItem.innerHTML = `
      <div class="bg-white p-2 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-navy" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.669 0-3.218.51-4.5 1.385V4.804z" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-semibold text-sm">${activity.topic}</p>
        <p class="text-xs opacity-80">${duration}</p>
        <p class="text-xs opacity-60">${formattedDate}</p>
      </div>
    `;

      recentActivitiesContainer.appendChild(activityItem);
    });
  }

  // Fungsi untuk render calendar dengan data heatmap - FIXED
  function renderCalendarWithHeatmap() {
    if (!heatmapData || !heatmapContainer) return;

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    // Update month display
    const monthDisplay = document.querySelector(".calendar-header h4");
    if (monthDisplay) {
      monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }

    // Clear existing calendar
    heatmapContainer.innerHTML = "";

    // Get first day of month (adjust for Monday start)
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Get today's date in WIB
    const todayWIB = getLocalToday();
    const [todayYear, todayMonth, todayDay] = todayWIB
      .split("-")
      .map((num) => parseInt(num));

    const isCurrentMonth =
      todayMonth - 1 === currentMonth && todayYear === currentYear;
    const todayDate = todayDay;

    console.log("Calendar render - Today WIB:", todayWIB);
    console.log(
      "Calendar render - Current viewing:",
      monthNames[currentMonth],
      currentYear
    );
    console.log("Calendar render - Is current month:", isCurrentMonth);

    // Create date map from heatmap data
    const dateIntensityMap = {};
    heatmapData.heatmap.forEach((item) => {
      // Parse date string directly
      const [itemYear, itemMonth, itemDay] = item.date
        .split("-")
        .map((num) => parseInt(num));

      if (itemMonth - 1 === currentMonth && itemYear === currentYear) {
        dateIntensityMap[itemDay] = {
          intensity: item.intensity,
          minutes: item.total_minutes,
          sessions: item.session_count,
        };
        console.log(
          `Heatmap entry for day ${itemDay}:`,
          dateIntensityMap[itemDay]
        );
      }
    });

    console.log("Date intensity map:", dateIntensityMap);

    // Add days from previous month
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day text-gray-400 opacity-50";
      dayElement.textContent = daysInPrevMonth - i;
      dayElement.style.backgroundColor = "#f9fafb";
      heatmapContainer.appendChild(dayElement);
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";
      dayElement.textContent = day;

      // Check if this is today
      if (isCurrentMonth && day === todayDate) {
        dayElement.classList.add("ring-2", "font-bold");
        dayElement.style.boxShadow = "0 0 0 2px #1e3a5f";
      }

      // Check if this is a future date
      const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const isFutureDate = cellDateStr > todayWIB;

      if (isFutureDate) {
        dayElement.classList.add("opacity-50");
        dayElement.style.cursor = "not-allowed";
        dayElement.title = "Tidak bisa mengisi sesi untuk masa depan";
      } else {
        // Apply intensity color
        const dayData = dateIntensityMap[day];
        if (dayData && dayData.intensity > 0) {
          const color = getIntensityColorByLevel(dayData.intensity);
          dayElement.style.backgroundColor = color;
          dayElement.classList.add("text-white");

          const hours = Math.floor(dayData.minutes / 60);
          const mins = dayData.minutes % 60;
          dayElement.title = `${day} ${monthNames[currentMonth]} - ${
            hours > 0 ? hours + " jam " : ""
          }${mins} menit (${dayData.sessions} sesi)`;
        } else {
          dayElement.style.backgroundColor = "#f3f4f6";
          dayElement.title = `${day} ${monthNames[currentMonth]} - Tidak ada sesi belajar`;
        }

        // Add click handler to show details
        dayElement.addEventListener("click", () => {
          showDayDetails(day, currentMonth, currentYear);
        });
      }

      heatmapContainer.appendChild(dayElement);
    }

    // Add remaining cells
    const totalCells = adjustedFirstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day text-gray-400 opacity-50";
      dayElement.textContent = day;
      dayElement.style.backgroundColor = "#f9fafb";
      heatmapContainer.appendChild(dayElement);
    }

    // Update statistics if available
    if (heatmapData.stats) {
      updateMonthStatisticsFromHeatmap(heatmapData.stats);
    }
  }

  // Fungsi untuk mendapatkan warna berdasarkan intensity level
  function getIntensityColorByLevel(intensity) {
    switch (intensity) {
      case 0:
        return "#f3f4f6";
      case 1:
        return "#86efac"; // 1-30 minutes (light)
      case 2:
        return "#4ade80"; // 31-60 minutes (moderate)
      case 3:
        return "#22c55e"; // 61-120 minutes (high)
      case 4:
        return "#16a34a"; // >120 minutes (very high)
      default:
        return "#f3f4f6";
    }
  }

  // Fungsi untuk update statistik bulanan dari heatmap data
  function updateMonthStatisticsFromHeatmap(stats) {
    const statsElement = document.querySelector(".month-stats");
    if (!statsElement) {
      // Create stats element if it doesn't exist
      const calendarCard = document.querySelector(
        ".card:has(#heatmapCalendar)"
      );
      if (calendarCard) {
        const statsDiv = document.createElement("div");
        statsDiv.className = "month-stats mt-4 p-4 bg-gray-50 rounded-lg";
        const legend = calendarCard.querySelector(".mt-4");
        if (legend) {
          calendarCard.insertBefore(statsDiv, legend);
        } else {
          calendarCard.appendChild(statsDiv);
        }
      }
    }

    const statsElement2 = document.querySelector(".month-stats");
    if (statsElement2) {
      statsElement2.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-xs text-gray-600">Total Waktu</p>
            <p class="font-semibold text-navy text-sm">${stats.total_study_time.formatted}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Hari Belajar</p>
            <p class="font-semibold text-navy text-sm">${stats.total_days_studied} hari</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Rata-rata/Hari</p>
            <p class="font-semibold text-navy text-sm">${stats.average_per_day.formatted}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Streak Saat Ini</p>
            <p class="font-semibold text-navy text-sm">${stats.current_streak} hari</p>
          </div>
        </div>
      `;
    }
  }

  function displayDayDetails(day, monthName, year, dayLogs) {
    let content = `<h3 class="font-bold text-lg mb-3">${day} ${monthName} ${year}</h3>`;

    if (dayLogs.length === 0) {
      content +=
        '<p class="text-gray-500">Tidak ada sesi belajar pada hari ini.</p>';
    } else {
      content += '<div class="space-y-2">';
      dayLogs.forEach((log) => {
        const hours = Math.floor(log.duration_minutes / 60);
        const minutes = log.duration_minutes % 60;
        // Gunakan log_date langsung tanpa parsing Date object
        content += `
        <div class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onclick="window.openEditModalFromDetail(${JSON.stringify(
          JSON.stringify(log)
        )})">
          <p class="font-semibold">${log.topic}</p>
          <p class="text-sm text-gray-600">${
            hours > 0 ? hours + " jam " : ""
          }${minutes} menit</p>
          ${
            log.notes
              ? `<p class="text-sm text-gray-500 mt-1">${log.notes}</p>`
              : ""
          }
        </div>
      `;
      });
      content += "</div>";
    }

    Swal.fire({
      html: content,
      confirmButtonColor: "#1e3a5f",
      confirmButtonText: "Tutup",
      width: "500px",
      customClass: {
        popup: "text-left",
      },
    });
  }

  // Fungsi untuk menampilkan detail hari - FIXED
  async function showDayDetails(day, month, year) {
    const token = getToken();
    if (!token) return;

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    try {
      // Format date for API
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      console.log("=== SHOW DAY DETAILS DEBUG ===");
      console.log("Requested date:", dateStr);

      // Try fetching with date filter first
      const response = await fetch(
        `${API_BASE_URL}/study-logs/by-date?date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.log("by-date endpoint failed, trying regular endpoint...");
        // Fallback to regular endpoint
        const fallbackResponse = await fetch(
          `${API_BASE_URL}/study-logs?per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!fallbackResponse.ok) throw new Error("Failed to load logs");

        const result = await fallbackResponse.json();
        const allLogs = result.data.data;

        console.log("Total logs fetched:", allLogs.length);
        console.log(
          "First 5 logs:",
          allLogs.slice(0, 5).map((log) => ({
            date: log.log_date,
            topic: log.topic,
          }))
        );

        // Filter logs for specific date
        const dayLogs = allLogs.filter((log) => {
          const match = log.log_date === dateStr;
          return match;
        });

        console.log(`Logs matching ${dateStr}:`, dayLogs.length);
        if (dayLogs.length > 0) {
          console.log("Matching logs:", dayLogs);
        }

        displayDayDetails(day, monthNames[month], year, dayLogs);
      } else {
        const result = await response.json();
        const dayLogs = result.data.logs || [];
        console.log("Logs from by-date endpoint:", dayLogs.length);
        displayDayDetails(day, monthNames[month], year, dayLogs);
      }
    } catch (error) {
      console.error("Error loading day details:", error);
      Swal.fire("Error", "Gagal memuat detail hari", "error");
    }
  }

  // Function to open edit modal from detail popup
  window.openEditModalFromDetail = function (logJsonStr) {
    const log = JSON.parse(logJsonStr);
    Swal.close();
    setTimeout(() => {
      openEditModalWithData(log);
    }, 300);
  };

  // Fungsi untuk membuka modal edit dengan data
  function openEditModalWithData(log) {
    currentEditLogId = log.id;

    // Populate form fields
    document.getElementById("editLogId").value = log.id;
    document.getElementById("editTopic").value = log.topic;

    const hours = Math.floor(log.duration_minutes / 60);
    const minutes = log.duration_minutes % 60;
    document.getElementById("editHours").value = hours;
    document.getElementById("editMinutes").value = minutes;

    document.getElementById("editDate").value = log.log_date;
    document.getElementById("editNotes").value = log.notes || "";

    // Open modal
    window.openEditModal(log.id);
  }

  // Setup calendar navigation
  function setupCalendarNavigation() {
    const prevButton = document.querySelector(".calendar-nav-prev");
    const nextButton = document.querySelector(".calendar-nav-next");
    const todayButton = document.querySelector(".calendar-today-btn");

    if (prevButton && !prevButton.hasAttribute("data-listener")) {
      prevButton.setAttribute("data-listener", "true");
      prevButton.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        loadHeatmapData(); // Reload heatmap for new month
      });
    }

    if (nextButton && !nextButton.hasAttribute("data-listener")) {
      nextButton.setAttribute("data-listener", "true");
      nextButton.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        loadHeatmapData(); // Reload heatmap for new month
      });
    }

    if (todayButton && !todayButton.hasAttribute("data-listener")) {
      todayButton.setAttribute("data-listener", "true");
      todayButton.addEventListener("click", () => {
        const todayWIB = getLocalToday();
        const [year, month] = todayWIB.split("-").map((num) => parseInt(num));
        currentMonth = month - 1; // JavaScript months are 0-indexed
        currentYear = year;
        loadHeatmapData(); // Reload heatmap for current month
      });
    }
  }

  // Event listener untuk form "Catat Sesi"
  if (sessionForm) {
    sessionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(sessionForm);

      // Konversi jam dan menit ke total menit
      const hours = parseInt(formData.get("hours")) || 0;
      const minutes = parseInt(formData.get("minutes")) || 0;
      const totalMinutes = hours * 60 + minutes;

      if (totalMinutes === 0) {
        Swal.fire({
          icon: "warning",
          title: "Durasi Kosong",
          text: "Durasi belajar harus diisi!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      const selectedDate = formData.get("date");
      const today = getLocalToday();

      console.log("Form submission - Selected date:", selectedDate);
      console.log("Form submission - Today WIB:", today);

      // Validate date is not in the future
      if (selectedDate > today) {
        Swal.fire({
          icon: "warning",
          title: "Tanggal Tidak Valid",
          text: "Tidak bisa mengisi sesi belajar untuk masa depan!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      // Sesuaikan format data dengan StudyLogController
      const logData = {
        topic: formData.get("topic"),
        duration_minutes: totalMinutes,
        log_date: selectedDate,
        notes: formData.get("notes") || null,
      };

      // Validasi input
      if (!logData.topic || !logData.topic.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Topik Kosong",
          text: "Topik pembelajaran harus diisi!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      if (!logData.log_date) {
        Swal.fire({
          icon: "warning",
          title: "Tanggal Kosong",
          text: "Tanggal harus diisi!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Menyimpan...";
        submitBtn.disabled = true;

        await createLog(logData);

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Sesi berhasil disimpan!",
          confirmButtonColor: "#1e3a5f",
          timer: 2000,
          timerProgressBar: true,
        });

        sessionForm.reset();

        // Set default date ke hari ini lagi
        setMaxDateToToday();

        // Reload all dashboard data
        await Promise.all([
          loadDashboardStats(),
          loadHeatmapData(),
          loadRecentActivities(),
        ]);

        // Tutup modal
        const closeModalBtn = document.getElementById("closeModalBtn");
        if (closeModalBtn) closeModalBtn.click();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text: error.message,
          confirmButtonColor: "#1e3a5f",
        });
      } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Simpan Sesi";
        submitBtn.disabled = false;
      }
    });
  }

  // Event listener untuk form edit
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(editForm);
      const logId = document.getElementById("editLogId").value;

      // Konversi jam dan menit ke total menit
      const hours = parseInt(formData.get("hours")) || 0;
      const minutes = parseInt(formData.get("minutes")) || 0;
      const totalMinutes = hours * 60 + minutes;

      if (totalMinutes === 0) {
        Swal.fire({
          icon: "warning",
          title: "Durasi Kosong",
          text: "Durasi belajar harus diisi!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      const selectedDate = formData.get("date");
      const today = getLocalToday();

      // Validate date is not in the future
      if (selectedDate > today) {
        Swal.fire({
          icon: "warning",
          title: "Tanggal Tidak Valid",
          text: "Tidak bisa mengisi sesi belajar untuk masa depan!",
          confirmButtonColor: "#1e3a5f",
        });
        return;
      }

      const updateData = {
        topic: formData.get("topic"),
        duration_minutes: totalMinutes,
        log_date: selectedDate,
        notes: formData.get("notes") || null,
      };

      try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Menyimpan...";
        submitBtn.disabled = true;

        await updateLog(logId, updateData);

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Sesi berhasil diperbarui!",
          confirmButtonColor: "#1e3a5f",
          timer: 2000,
          timerProgressBar: true,
        });

        // Reload all dashboard data
        await Promise.all([
          loadDashboardStats(),
          loadHeatmapData(),
          loadRecentActivities(),
        ]);

        // Tutup modal
        window.closeEditModal();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text: error.message,
          confirmButtonColor: "#1e3a5f",
        });
      } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Simpan Perubahan";
        submitBtn.disabled = false;
      }
    });
  }

  // Delete log function
  window.deleteLog = async function () {
    if (!currentEditLogId) return;

    Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus sesi belajar ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiDeleteLog(currentEditLogId);

          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Sesi belajar berhasil dihapus!",
            confirmButtonColor: "#1e3a5f",
            timer: 2000,
            timerProgressBar: true,
          });

          // Reload all dashboard data
          await Promise.all([
            loadDashboardStats(),
            loadHeatmapData(),
            loadRecentActivities(),
          ]);

          // Close modal
          window.closeEditModal();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus",
            text: error.message,
            confirmButtonColor: "#1e3a5f",
          });
        }
      }
    });
  };

  // Event listener untuk logout
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      Swal.fire({
        title: "Konfirmasi Logout",
        text: "Apakah Anda yakin ingin keluar?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#1e3a5f",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, Keluar",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          removeToken();
          localStorage.removeItem("user"); // Clear user data too

          Swal.fire({
            icon: "success",
            title: "Logout Berhasil",
            text: "Anda telah berhasil keluar.",
            confirmButtonColor: "#1e3a5f",
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = "login.html";
          });
        }
      });
    });
  }

  // Initialize dashboard
  async function initializeDashboard() {
    try {
      console.log("Initializing dashboard...");
      console.log("Today WIB from getLocalToday():", getLocalToday());

      // Load all data in parallel
      await Promise.all([
        loadDashboardStats(),
        loadHeatmapData(),
        loadRecentActivities(),
      ]);

      setupCalendarNavigation();

      // Auto refresh setiap 30 detik
      setInterval(async () => {
        await Promise.all([loadDashboardStats(), loadRecentActivities()]);
      }, 30000);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
    }
  }

  // Start initialization
  initializeDashboard();
});
