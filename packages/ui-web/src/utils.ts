import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for conditionally joining CSS class names
 * Combines clsx for conditional class logic with tailwind-merge for Tailwind CSS class deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 