import { API_BASE_URL } from "./apiConfig.js";
import { getToken } from "./auth.js";
import { isAuthenticated, removeToken } from "./auth.js";

// Redirect to login if not authenticated
if (!isAuthenticated()) {
  window.location.href = "login.html";
}

let charts = {};
let currentPeriod = "month";
let analyticsData = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeCharts();
  setupEventListeners();
  loadAnalyticsData();
});

function setupEventListeners() {
  // Period selector buttons
  const periodButtons = document.querySelectorAll(".period-btn");
  periodButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all buttons
      periodButtons.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");
      // Update current period and reload data
      currentPeriod = this.dataset.period;
      loadAnalyticsData();
    });
  });

  // Logout button
  const logoutButton = document.getElementById("logoutButton");
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
          localStorage.removeItem("user");
          window.location.href = "login.html";
        }
      });
    });
  }
}

async function loadAnalyticsData() {
  const token = getToken();
  if (!token) return;

  // Show loading state
  showLoadingState();

  try {
    const response = await fetch(
      `${API_BASE_URL}/analytics?period=${currentPeriod}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to load analytics data");

    const result = await response.json();
    analyticsData = result.data;

    console.log("Analytics data loaded:", analyticsData);

    // Update all visualizations with the new data structure
    updateOverviewStats(analyticsData.overview);
    updateDailyChart(analyticsData.daily_chart);
    updateTopicChart(analyticsData.topic_distribution);
    updateWeeklyChart(analyticsData.weekly_pattern);
    updateTimeOfDayChart(analyticsData.time_of_day);
    updateInsights(analyticsData.insights);
  } catch (error) {
    console.error("Error loading analytics:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Gagal memuat data analytics",
      confirmButtonColor: "#1e3a5f",
    });
  }
}

function showLoadingState() {
  document.getElementById("totalHours").innerHTML =
    '<div class="loading mx-auto"></div>';
  document.getElementById("avgDaily").innerHTML =
    '<div class="loading mx-auto"></div>';
  document.getElementById("consistency").innerHTML =
    '<div class="loading mx-auto"></div>';
}

function updateOverviewStats(overview) {
  // Animate overview statistics
  animateValue("totalHours", 0, overview.total_hours, 1000);
  animateValue("avgDaily", 0, overview.avg_daily_minutes, 1000);
  animateValue("consistency", 0, overview.consistency_percentage, 1000, "%");
}

function updateDailyChart(dailyData) {
  // Update daily chart with data from backend
  charts.daily.data.labels = dailyData.labels;
  charts.daily.data.datasets[0].data = dailyData.data;
  charts.daily.update();

  // Update total
  document.getElementById("dailyTotal").textContent =
    dailyData.total.toLocaleString("id-ID");
}

function updateTopicChart(topicData) {
  if (!topicData || topicData.length === 0) {
    charts.topic.data.labels = ["Belum ada data"];
    charts.topic.data.datasets[0].data = [1];
    charts.topic.update();

    document.getElementById("topicLegend").innerHTML =
      '<p class="text-gray-500 text-center">Belum ada data topik</p>';
    return;
  }

  // Update chart
  charts.topic.data.labels = topicData.map((item) => item.topic);
  charts.topic.data.datasets[0].data = topicData.map((item) => item.minutes);
  charts.topic.update();

  // Update legend
  const legendContainer = document.getElementById("topicLegend");
  legendContainer.innerHTML = "";

  topicData.forEach((item, index) => {
    const color = charts.topic.data.datasets[0].backgroundColor[index];
    legendContainer.innerHTML += `
      <div class="flex items-center justify-between text-sm mb-1">
        <div class="flex items-center">
          <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${color}"></span>
          <span class="text-gray-700">${item.topic}</span>
        </div>
        <span class="font-semibold">${item.percentage}%</span>
      </div>
    `;
  });
}

function updateWeeklyChart(weeklyData) {
  // Update chart with Monday-first data from backend
  const labels = weeklyData.map((item) => item.day.substring(0, 3));
  const data = weeklyData.map((item) => item.average_minutes);

  charts.weekly.data.labels = labels;
  charts.weekly.data.datasets[0].data = data;
  charts.weekly.update();

  // Find most productive day
  const maxMinutes = Math.max(...data);
  const maxIndex = data.indexOf(maxMinutes);
  const mostProductiveDay = maxMinutes > 0 ? weeklyData[maxIndex].day : "-";

  document.getElementById("mostProductiveDay").textContent = mostProductiveDay;
}

function updateTimeOfDayChart(timeData) {
  // Update chart
  charts.timeOfDay.data.labels = timeData.map((item) => item.period);
  charts.timeOfDay.data.datasets[0].data = timeData.map((item) => item.count);
  charts.timeOfDay.update();
}

function updateInsights(insights) {
  document.getElementById("bestAchievement").textContent = insights.achievement;
  document.getElementById("learningTrend").textContent = insights.trend;
  document.getElementById("recommendation").textContent =
    insights.recommendation;
}

function animateValue(id, start, end, duration, suffix = "") {
  const element = document.getElementById(id);
  const range = end - start;
  const startTime = performance.now();

  function updateValue(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const value = Math.floor(progress * range + start);
    element.textContent = value + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  }

  requestAnimationFrame(updateValue);
}

// Keep existing chart initialization code
function initializeCharts() {
  // Chart.js default font
  Chart.defaults.font.family = "Inter, sans-serif";

  // Daily Study Time Chart
  charts.daily = new Chart(document.getElementById("dailyChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Waktu Belajar (menit)",
          data: [],
          borderColor: "#1e3a5f",
          backgroundColor: "rgba(30, 58, 95, 0.1)",
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1e3a5f",
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const hours = Math.floor(context.parsed.y / 60);
              const minutes = context.parsed.y % 60;
              return hours > 0 ? `${hours}j ${minutes}m` : `${minutes} menit`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });

  // Topic Distribution Chart
  charts.topic = new Chart(document.getElementById("topicChart"), {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            "#1e3a5f",
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              const hours = Math.floor(context.parsed / 60);
              const minutes = context.parsed % 60;
              const timeStr =
                hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m`;
              return [`${context.label}`, `${timeStr} (${percentage}%)`];
            },
          },
        },
      },
    },
  });

  // Weekly Pattern Chart
  charts.weekly = new Chart(document.getElementById("weeklyChart"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Rata-rata (menit)",
          data: [],
          backgroundColor: "rgba(30, 58, 95, 0.8)",
          borderRadius: 8,
          barThickness: "flex",
          maxBarThickness: 50,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const hours = Math.floor(context.parsed.y / 60);
              const minutes = context.parsed.y % 60;
              return hours > 0 ? `${hours}j ${minutes}m` : `${minutes} menit`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });

  // Time of Day Chart
  charts.timeOfDay = new Chart(document.getElementById("timeOfDayChart"), {
    type: "polarArea",
    data: {
      labels: [],
      datasets: [
        {
          label: "Sesi Belajar",
          data: [],
          backgroundColor: [
            "rgba(251, 191, 36, 0.7)",
            "rgba(251, 146, 60, 0.7)",
            "rgba(147, 51, 234, 0.7)",
            "rgba(59, 130, 246, 0.7)",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          cornerRadius: 8,
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    },
  });
}

// Export function
window.exportData = async function () {
  const token = getToken();
  if (!token) return;

  try {
    Swal.fire({
      title: "Export Data",
      text: "Pilih format export:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "CSV",
      cancelButtonText: "Batal",
      confirmButtonColor: "#1e3a5f",
      showDenyButton: true,
      denyButtonText: "PDF",
      denyButtonColor: "#3b82f6",
    }).then(async (result) => {
      if (result.isConfirmed || result.isDenied) {
        const format = result.isConfirmed ? "csv" : "pdf";

        try {
          const response = await fetch(
            `${API_BASE_URL}/analytics/export?format=${format}&period=${currentPeriod}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            // Handle successful export
            window.open(data.download_url, "_blank");
          } else {
            // For now, show coming soon message
            Swal.fire({
              icon: "info",
              title: "Coming Soon!",
              text: `Export ${format.toUpperCase()} akan segera tersedia`,
              confirmButtonColor: "#1e3a5f",
            });
          }
        } catch (error) {
          console.error("Export error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Gagal mengekspor data",
            confirmButtonColor: "#1e3a5f",
          });
        }
      }
    });
  } catch (error) {
    console.error("Export error:", error);
  }
};
