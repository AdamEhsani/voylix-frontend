import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_URL } from "./config/api";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

export const getImageUrl = (path?: string | null) => {
  if (!path) return null;

  // full URL
  if (path.startsWith("http")) return path;

  // blob
  if (path.startsWith("blob:")) return path;

  // remove wwwroot if exists
  let cleanPath = path.replace(/^\/?wwwroot/, "");

  // اگر فقط اسم agency یا logo type داده شد
  if (!cleanPath.startsWith("/")) {
    // special known endpoints
    if (cleanPath === "agency") {
      return `${API_URL}/uploads/Logo/agency`;
    }
    // fallback
    cleanPath = "/" + cleanPath;
  }
  return `${API_URL}${cleanPath}`;
};
