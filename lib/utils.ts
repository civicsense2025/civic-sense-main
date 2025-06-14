import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clean citation strings and artifacts from content
 * Removes patterns like ":antCitation[]{citationIdentifiersString="12:0,12:1,12:2"}"
 */
export function cleanCitationStrings(text: string): string {
  if (!text || typeof text !== 'string') return text
  
  return text
    // Remove citation patterns
    .replace(/:antCitation\[\]\{[^}]*\}/g, '')
    .replace(/\{citationIdentifiersString="[^"]*"\}/g, '')
    .replace(/citationIdentifiersString="[^"]*"/g, '')
    .replace(/antCitation\[\]/g, '')
    // Remove any remaining citation artifacts
    .replace(/\s+millions\.:antCitation.*?$/gm, ' millions.')
    .replace(/\s+millions\s*\{.*?\}/g, ' millions')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Clean all text content in an object recursively
 */
export function cleanObjectContent<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectContent(item)) as T
  }
  
  const cleaned = {} as T
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      (cleaned as any)[key] = cleanCitationStrings(value)
    } else if (typeof value === 'object' && value !== null) {
      (cleaned as any)[key] = cleanObjectContent(value)
    } else {
      (cleaned as any)[key] = value
    }
  }
  
  return cleaned
}
