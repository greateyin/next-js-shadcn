// utils/cn.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to combine class names conditionally.
 * This function uses clsx for conditional class merging and tailwind-merge
 * to properly handle Tailwind CSS class conflicts.
 * 
 * @param {...ClassValue[]} inputs - The class values to combine
 * @returns {string} The combined and merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
