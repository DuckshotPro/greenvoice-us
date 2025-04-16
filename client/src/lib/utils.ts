import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class values with Tailwind's class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency value according to the provided currency code
 * @param amount - The amount to format
 * @param currencyCode - ISO currency code (e.g., USD, EUR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date string into a localized date format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 * @param str - The string to truncate
 * @param length - Maximum length before truncation
 * @returns Truncated string
 */
export function truncateString(str: string, length: number = 30): string {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
}

/**
 * Debounces a function to limit how often it can be called
 * @param fn - The function to debounce
 * @param ms - Milliseconds to wait between calls
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Generates an array of numbers in a range
 * @param start - Starting number (inclusive)
 * @param end - Ending number (inclusive)
 * @returns Array of numbers
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Safely access nested object properties without error
 * @param obj - The object to access
 * @param path - The path to the property (e.g., "user.profile.name")
 * @param defaultValue - Fallback value if property doesn't exist
 * @returns The property value or default value
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = undefined): any {
  try {
    return path.split(".").reduce((prev, curr) => prev?.[curr], obj) ?? defaultValue;
  } catch (e) {
    return defaultValue;
  }
}