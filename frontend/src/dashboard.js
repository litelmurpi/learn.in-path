import { isAuthenticated, removeToken } from "./auth.js";
import {
  getLogs,
  getHeatmapData,
  createLog,
  getUserProfile,
} from "./apiService.js";
import { displayUserInfo, getUserData } from "./userInfo.js";

// Lindungi halaman: jika tidak terotentikasi, arahkan ke login
document.addEventListener("DOMContentLoaded", async () => {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

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
  const recentActivitiesContainer = document.getElementById("recentActivities");
  const heatmapContainer = document.getElementById("heatmapCalendar");

  // Fix: Gunakan selector yang lebih spesifik untuk stat cards
  const statCards = document.querySelectorAll(".stat-card");
  const longestStreakElement = statCards[0]?.querySelector(
    ".stat-value, .text-2xl, .text-3xl"
  );
  const totalHoursElement = statCards[1]?.querySelector(
    ".stat-value, .text-2xl, .text-3xl"
  );
  const todaySessionElement = statCards[2]?.querySelector(
    ".stat-value, .text-2xl, .text-3xl"
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

  // Fungsi untuk memuat data dasbor
  async function loadDashboardData(updateCalendarOnly = false) {
    try {
      if (!updateCalendarOnly) {
        console.log("Loading dashboard data...");

        // Try to get logs data
        let logsResponse = null;
        let heatmapResponse = null;

        try {
          logsResponse = await getLogs();
          console.log("Raw logs response:", logsResponse);
        } catch (error) {
          console.error("Error fetching logs:", error);
        }

        try {
          heatmapResponse = await getHeatmapData();
          console.log("Raw heatmap response:", heatmapResponse);
        } catch (error) {
          console.error("Error fetching heatmap:", error);
        }

        // Handle response dari StudyLogController dengan pagination
        let logs = [];

        // Different response formats handling
        if (logsResponse) {
          // If response has success property
          if (logsResponse.success && logsResponse.data) {
            if (
              logsResponse.data.data &&
              Array.isArray(logsResponse.data.data)
            ) {
              logs = logsResponse.data.data;
            } else if (Array.isArray(logsResponse.data)) {
              logs = logsResponse.data;
            }
          }
          // If response has data property directly
          else if (logsResponse.data) {
            if (Array.isArray(logsResponse.data)) {
              logs = logsResponse.data;
            } else if (
              logsResponse.data.data &&
              Array.isArray(logsResponse.data.data)
            ) {
              logs = logsResponse.data.data;
            }
          }
          // If response is array directly
          else if (Array.isArray(logsResponse)) {
            logs = logsResponse;
          }
          // If response has logs property
          else if (logsResponse.logs && Array.isArray(logsResponse.logs)) {
            logs = logsResponse.logs;
          }
        }

        console.log("Processed logs array:", logs);
        console.log("Number of logs:", logs.length);

        allLogs = logs; // Simpan untuk digunakan saat navigasi bulan

        // Update statistik
        updateStatistics(logs);

        // Render Aktivitas Terkini
        renderRecentActivities(logs);
      }

      // Render Calendar/Heatmap
      renderCalendar(allLogs);
    } catch (error) {
      console.error("Gagal memuat data dasbor:", error);
      console.error("Error detail:", error.stack);

      if (error.message && error.message.includes("Token")) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        removeToken();
        window.location.href = "login.html";
      } else {
        if (recentActivitiesContainer && !updateCalendarOnly) {
          recentActivitiesContainer.innerHTML =
            '<p class="text-red-500 text-center text-sm">Gagal memuat data. Silakan refresh halaman.</p>';
        }
      }
    }
  }

  // Fungsi untuk render aktivitas terkini
  function renderRecentActivities(logs) {
    if (!recentActivitiesContainer) return;

    recentActivitiesContainer.innerHTML = "";

    if (!logs || logs.length === 0) {
      recentActivitiesContainer.innerHTML =
        '<p class="text-gray-500 text-center text-sm">Belum ada aktivitas</p>';
      return;
    }

    // Ambil 5 log terbaru
    logs.slice(0, 5).forEach((log) => {
      const topic = log.topic || "Tanpa Topik";
      const totalMinutes = parseInt(log.duration_minutes) || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const logDate = new Date(log.log_date || log.created_at);

      const activityItem = document.createElement("div");
      activityItem.className = "activity-item";
      activityItem.innerHTML = `
        <div class="bg-white p-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-navy" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.669 0-3.218.51-4.5 1.385V4.804z" />
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-semibold text-sm">${topic}</p>
          <p class="text-xs opacity-80">${
            hours > 0 ? hours + " jam " : ""
          }${minutes} menit</p>
          <p class="text-xs opacity-60">${formatDate(logDate)}</p>
        </div>
      `;
      recentActivitiesContainer.appendChild(activityItem);
    });
  }

  // Fungsi untuk update statistik
  function updateStatistics(logs) {
    console.log("Updating statistics with logs:", logs);

    if (!Array.isArray(logs)) {
      console.error("Logs is not an array");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let totalMonthMinutes = 0;
    let todayMinutes = 0;

    // Hitung total menit dan hari ini
    logs.forEach((log) => {
      try {
        const logDate = new Date(log.log_date || log.created_at);
        const durationMinutes = parseInt(log.duration_minutes) || 0;

        console.log(
          `Processing log: date=${logDate.toDateString()}, minutes=${durationMinutes}`
        );

        if (
          logDate.getMonth() === currentMonth &&
          logDate.getFullYear() === currentYear
        ) {
          totalMonthMinutes += durationMinutes;
        }

        // Check if log date is today
        const logDateOnly = new Date(logDate);
        logDateOnly.setHours(0, 0, 0, 0);

        if (logDateOnly.getTime() === today.getTime()) {
          todayMinutes += durationMinutes;
          console.log(`Today's log found: ${durationMinutes} minutes`);
        }
      } catch (e) {
        console.warn("Error processing log:", log, e);
      }
    });

    console.log("Statistics calculated:", {
      totalMonthMinutes,
      todayMinutes,
    });

    // Hitung streak
    const streak = calculateStreak(logs);
    console.log("Streak calculated:", streak);

    // Update UI
    if (totalHoursElement) {
      const totalHours = Math.floor(totalMonthMinutes / 60);
      const remainingMinutes = totalMonthMinutes % 60;
      const text =
        totalHours > 0
          ? `${totalHours} jam ${
              remainingMinutes > 0 ? remainingMinutes + " menit" : ""
            }`
          : `${remainingMinutes} menit`;
      totalHoursElement.textContent = text;
      console.log("Updated total hours:", text);
    }

    if (todaySessionElement) {
      const todayHours = Math.floor(todayMinutes / 60);
      const remainingMinutes = todayMinutes % 60;
      const text =
        todayMinutes > 0
          ? todayHours > 0
            ? `${todayHours} jam ${
                remainingMinutes > 0 ? remainingMinutes + " menit" : ""
              }`
            : `${remainingMinutes} menit`
          : "0 jam";
      todaySessionElement.textContent = text;
      console.log("Updated today session:", text);
    }

    if (longestStreakElement) {
      longestStreakElement.textContent = `${streak} Hari`;
      console.log("Updated streak:", `${streak} Hari`);
    }
  }

  // Fungsi untuk menghitung streak
  function calculateStreak(logs) {
    if (!logs || logs.length === 0) {
      console.log("No logs available");
      return 0;
    }

    const getDateKey = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Get today's date key
    const today = new Date();
    const todayKey = getDateKey(today);

    // Build set of dates that have logs
    const datesWithLogs = new Set();

    logs.forEach((log) => {
      const dateKey = getDateKey(log.log_date);
      datesWithLogs.add(dateKey);
    });

    console.log("Today:", todayKey);
    console.log("Dates with logs:", Array.from(datesWithLogs).sort());

    // Calculate streak starting from today
    let streak = 0;
    let currentDate = new Date(today);

    // Check consecutive days backwards from today
    while (true) {
      const dateKey = getDateKey(currentDate);

      if (datesWithLogs.has(dateKey)) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // No log for this date, streak ends
        break;
      }
    }

    console.log("Final streak:", streak);
    return streak;
  }

  // Fungsi untuk render calendar
  function renderCalendar(logs) {
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

    // Update current date info
    updateCurrentDateInfo();

    // Clear existing calendar
    if (!heatmapContainer) return;
    heatmapContainer.innerHTML = "";

    // Get first day of month (adjust for Monday start)
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to 6, Monday (1) to 0
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Today's date for comparison
    const today = new Date();
    const isCurrentMonth =
      today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const todayDate = today.getDate();

    // Process logs for current month
    const monthLogs = logs.filter((log) => {
      const logDate = new Date(log.log_date || log.created_at);
      return (
        logDate.getMonth() === currentMonth &&
        logDate.getFullYear() === currentYear
      );
    });

    // Create a map of dates to minutes
    const dateMinutesMap = {};
    monthLogs.forEach((log) => {
      const logDate = new Date(log.log_date || log.created_at);
      const dateKey = logDate.getDate();
      if (!dateMinutesMap[dateKey]) {
        dateMinutesMap[dateKey] = 0;
      }
      dateMinutesMap[dateKey] += parseInt(log.duration_minutes || 0);
    });

    // Add days from previous month
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day text-gray-400";
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
        dayElement.classList.add("ring-2", "ring-navy", "font-bold");
      }

      // Check if this day has study data
      const minutes = dateMinutesMap[day] || 0;
      if (minutes > 0) {
        const intensity = getIntensityColor(minutes);
        dayElement.style.backgroundColor = intensity;
        dayElement.classList.add("text-white");
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        dayElement.title = `${day} ${monthNames[currentMonth]} - ${
          hours > 0 ? hours + " jam " : ""
        }${mins} menit belajar`;
      } else {
        dayElement.style.backgroundColor = "#f3f4f6";
        dayElement.title = `${day} ${monthNames[currentMonth]} - Tidak ada sesi belajar`;
      }

      // Add click handler to show details
      dayElement.addEventListener("click", () => {
        showDayDetails(
          day,
          monthLogs.filter((log) => {
            const logDate = new Date(log.log_date || log.created_at);
            return logDate.getDate() === day;
          })
        );
      });

      heatmapContainer.appendChild(dayElement);
    }

    // Add days from next month to complete the grid
    const totalCells = adjustedFirstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day text-gray-400";
      dayElement.textContent = day;
      dayElement.style.backgroundColor = "#f9fafb";
      heatmapContainer.appendChild(dayElement);
    }

    // Update month statistics
    updateMonthStatistics(monthLogs);
  }

  // Fungsi untuk update info tanggal saat ini
  function updateCurrentDateInfo() {
    const dateInfoElement = document.querySelector(".current-date-info");
    if (!dateInfoElement) {
      // Create date info element if it doesn't exist
      const calendarHeader = document.querySelector(".calendar-header");
      if (calendarHeader) {
        const dateInfo = document.createElement("div");
        dateInfo.className =
          "current-date-info text-xs md:text-sm text-gray-600 mt-2";
        calendarHeader.appendChild(dateInfo);
      }
    }

    const today = new Date();
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
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

    const dateInfoElement2 = document.querySelector(".current-date-info");
    if (dateInfoElement2) {
      dateInfoElement2.textContent = `Hari ini: ${
        dayNames[today.getDay()]
      }, ${today.getDate()} ${
        monthNames[today.getMonth()]
      } ${today.getFullYear()}`;
    }
  }

  // Fungsi untuk update statistik bulanan
  function updateMonthStatistics(monthLogs) {
    const statsElement = document.querySelector(".month-stats");
    if (!statsElement) {
      // Create stats element if it doesn't exist
      const calendarCard = document.querySelector(
        ".card:has(#heatmapCalendar)"
      );
      if (calendarCard) {
        const stats = document.createElement("div");
        stats.className = "month-stats mt-4 p-4 bg-gray-50 rounded-lg";
        const legend = calendarCard.querySelector(".mt-4");
        if (legend) {
          calendarCard.insertBefore(stats, legend);
        } else {
          calendarCard.appendChild(stats);
        }
      }
    }

    let totalMinutes = 0;
    let totalSessions = monthLogs.length;
    let studyDays = new Set();

    monthLogs.forEach((log) => {
      totalMinutes += parseInt(log.duration_minutes || 0);
      const logDate = new Date(log.log_date || log.created_at);
      studyDays.add(logDate.getDate());
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const avgMinutesPerDay =
      studyDays.size > 0 ? Math.round(totalMinutes / studyDays.size) : 0;

    const statsElement2 = document.querySelector(".month-stats");
    if (statsElement2) {
      statsElement2.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-xs text-gray-600">Total Waktu</p>
            <p class="font-semibold text-navy text-sm">${totalHours}j ${remainingMinutes}m</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Total Sesi</p>
            <p class="font-semibold text-navy text-sm">${totalSessions}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Hari Belajar</p>
            <p class="font-semibold text-navy text-sm">${
              studyDays.size
            } hari</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Rata-rata/Hari</p>
            <p class="font-semibold text-navy text-sm">${Math.floor(
              avgMinutesPerDay / 60
            )}j ${avgMinutesPerDay % 60}m</p>
          </div>
        </div>
      `;
    }
  }

  // Fungsi untuk menampilkan detail hari
  function showDayDetails(day, dayLogs) {
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

    let content = `<h3 class="font-bold text-lg mb-3">${day} ${monthNames[currentMonth]} ${currentYear}</h3>`;

    if (dayLogs.length === 0) {
      content +=
        '<p class="text-gray-500">Tidak ada sesi belajar pada hari ini.</p>';
    } else {
      content += '<div class="space-y-2">';
      dayLogs.forEach((log) => {
        const hours = Math.floor(log.duration_minutes / 60);
        const minutes = log.duration_minutes % 60;
        content += `
          <div class="p-3 bg-gray-50 rounded-lg">
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

    // You can implement a modal or tooltip to show this content
    // For now, let's use alert (you should replace with a proper modal)
    // alert(content);
    console.log("Day details:", dayLogs);
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
        loadDashboardData(true); // Only update calendar
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
        loadDashboardData(true); // Only update calendar
      });
    }

    if (todayButton && !todayButton.hasAttribute("data-listener")) {
      todayButton.setAttribute("data-listener", "true");
      todayButton.addEventListener("click", () => {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        loadDashboardData(true); // Only update calendar
      });
    }
  }

  // Fungsi untuk menentukan intensitas warna
  function getIntensityColor(minutes) {
    const hours = minutes / 60;
    if (hours === 0) return "#f3f4f6";
    if (hours < 1) return "#86efac";
    if (hours < 3) return "#4ade80";
    if (hours < 5) return "#22c55e";
    return "#16a34a";
  }

  // Fungsi format tanggal
  function formatDate(date) {
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
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
        alert("Durasi belajar harus diisi!");
        return;
      }

      // Sesuaikan format data dengan StudyLogController
      const logData = {
        topic: formData.get("topic"),
        duration_minutes: totalMinutes,
        log_date: formData.get("date"),
        notes: formData.get("notes") || null,
      };

      // Validasi input
      if (!logData.topic || !logData.topic.trim()) {
        alert("Topik pembelajaran harus diisi!");
        return;
      }

      if (!logData.log_date) {
        alert("Tanggal harus diisi!");
        return;
      }

      try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Menyimpan...";
        submitBtn.disabled = true;

        await createLog(logData);
        alert("Sesi berhasil disimpan!");
        sessionForm.reset();

        // Set default date ke hari ini lagi
        const dateInput = document.getElementById("date");
        if (dateInput) {
          dateInput.valueAsDate = new Date();
        }

        loadDashboardData();

        // Tutup modal
        const closeModalBtn = document.getElementById("closeModalBtn");
        if (closeModalBtn) closeModalBtn.click();
      } catch (error) {
        alert(`Gagal menyimpan sesi: ${error.message}`);
      } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = "Simpan Sesi";
        submitBtn.disabled = false;
      }
    });
  }

  // Event listener untuk logout
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      if (confirm("Apakah Anda yakin ingin keluar?")) {
        removeToken();
        localStorage.removeItem("user"); // Clear user data too
        window.location.href = "login.html";
      }
    });
  }

  // Muat data saat halaman pertama kali dibuka
  loadDashboardData();
  setupCalendarNavigation();

  // Refresh data setiap 60 detik
  setInterval(() => loadDashboardData(false), 60000);
});
