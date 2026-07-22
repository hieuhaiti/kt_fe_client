import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Merge Tailwind CSS classes with proper precedence
 * @param {...import('clsx').ClassValue} inputs - Class values to merge
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function isHtmlContent(value) {
  return /<\/?[a-z][\s\S]*>/i.test(value || "");
}

export function praseLink(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  } else {
    if (url.startsWith("/")) {
      return `${BASE_URL}${url}`;
    } else {
      return `${BASE_URL}/${url}`;
    }
  }
}

/**
 * Format price in VND currency
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

/**
 * Format date with locale support
 * @param {Date|string} date - Date to format
 * @param {string} [locale='vi-VN'] - Locale string
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = "vi-VN") {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: VIETNAM_TIMEZONE,
  }).format(parsed);
}

/**
 * Format date time with locale support
 * @param {string} dateStr - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateTime(dateStr) {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: VIETNAM_TIMEZONE,
  }).format(parsed);
}

/** Format km² with 2 decimal places (vi-VN locale) */
export function fmtKm2(v) {
  return v != null
    ? `${Number(v).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} km²`
    : null;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if code is running in browser
 * @returns {boolean}
 */
export function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
