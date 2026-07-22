/**
 * Check whether a value is a valid Date object
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidDateObject = (value) => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

/**
 * Parse YYYY-MM-DD strictly (reject impossible dates like 2026-02-31)
 * @param {string} value
 * @returns {Date|null}
 */
export const parseDateInputValue = (value) => {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
};

/**
 * Format a Date object as YYYY-MM-DD for HTML date input
 * @param {Date} date
 * @returns {string}
 */
export const formatDateForInput = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

/**
 * Format a date string or Date as DD/MM/YY
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateShort = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

/**
 * Format a date range stored as "YYYY-MM-DD - YYYY-MM-DD" into "DD/MM/YY → DD/MM/YY"
 * @param {string} dateRange  e.g. "2025-02-27 - 2026-02-27"
 * @returns {string}
 */
export const formatDateRange = (dateRange) => {
  if (!dateRange) return "";
  const parts = dateRange.split(" - ");
  if (parts.length === 2) {
    return `${formatDateShort(parts[0])} → ${formatDateShort(parts[1])}`;
  }
  return dateRange;
};

/**
 * Format two dates as "DD/MM/YY → DD/MM/YY"
 * @param {Date|string} start
 * @param {Date|string} end
 * @returns {string}
 */
export const formatDateRangeFromDates = (start, end) => {
  return `${formatDateShort(start)} → ${formatDateShort(end)}`;
};
