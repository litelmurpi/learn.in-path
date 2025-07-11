// Utility functions untuk konsisten date handling
export function parseAPIDate(dateString) {
  // Parse YYYY-MM-DD without timezone issues
  const [year, month, day] = dateString
    .split("-")
    .map((num) => parseInt(num, 10));
  return { year, month, day };
}

export function formatDateDisplay(dateString, format = "short") {
  const { year, month, day } = parseAPIDate(dateString);

  const monthNames = {
    short: [
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
    ],
    long: [
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
    ],
  };

  const monthFormat = format === "long" ? "long" : "short";
  return `${day} ${monthNames[monthFormat][month - 1]} ${year}`;
}

export function compareDates(date1, date2) {
  // Compare YYYY-MM-DD strings directly
  return date1.localeCompare(date2);
}
