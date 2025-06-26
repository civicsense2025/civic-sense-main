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

/**
 * Shuffle an array using the Fisher-Yates algorithm
 * This provides true randomization unlike Array.sort(() => Math.random() - 0.5)
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ============================================================================
// REQUEST DEDUPLICATION & DEBOUNCING UTILITIES
// ============================================================================

// Map to store active requests and prevent duplicates
const activeRequests = new Map<string, Promise<any>>()

/**
 * Prevents duplicate API requests by caching active promises
 * @param key - Unique identifier for the request
 * @param requestFn - Function that returns a promise
 * @returns Promise that resolves to the request result
 */
export function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  // If request is already active, return the existing promise
  const existingRequest = activeRequests.get(key)
  if (existingRequest) {
    return existingRequest
  }

  // Create new request and cache it
  const request = requestFn().finally(() => {
    // Remove from cache when complete
    activeRequests.delete(key)
  })

  activeRequests.set(key, request)
  return request
}

/**
 * Creates a debounced version of a function
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Creates a throttled version of a function
 * @param func - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        func(...args)
      }, delay - (now - lastCall))
    }
  }
}

// ============================================================================
// TOPIC LOADING OPTIMIZATION
// ============================================================================

// Cache for topic queries to prevent duplicate database calls
const topicQueryCache = new Map<string, { data: any; timestamp: number }>()
const TOPIC_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

/**
 * Cached topic query function
 * @param queryKey - Unique key for the query
 * @param queryFn - Function that performs the actual query
 * @returns Cached or fresh query result
 */
export function cachedTopicQuery<T>(queryKey: string, queryFn: () => Promise<T>): Promise<T> {
  const cached = topicQueryCache.get(queryKey)
  const now = Date.now()

  // Return cached data if it's still valid
  if (cached && (now - cached.timestamp) < TOPIC_CACHE_TTL) {
    return Promise.resolve(cached.data)
  }

  // Use request deduplication for fresh queries
  return deduplicateRequest(`topic-query-${queryKey}`, async () => {
    const data = await queryFn()
    
    // Cache the result
    topicQueryCache.set(queryKey, {
      data,
      timestamp: now
    })
    
    return data
  })
}

/**
 * Clear topic cache (useful for forced refreshes)
 */
export function clearTopicCache() {
  topicQueryCache.clear()
  activeRequests.clear()
}

// Date utilities for daily card stack
export const getTodayAtMidnight = () => {
  const mock = process.env.NEXT_PUBLIC_MOCK_DATE
  if (mock) {
    const [y, m, d] = mock.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Optimized date parsing with caching
const dateCache = new Map<string, Date | null>()

export const parseTopicDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return null
  
  const cacheKey = typeof dateString === 'string' ? dateString : null
  if (cacheKey && dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey)
  }
  
  try {
    let parsed: Date | null = null
    
    if (dateString instanceof Date) {
      if (isNaN(dateString.getTime())) return null
      parsed = new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate())
    }
    
    if (typeof dateString === 'string') {
      if (dateString.trim() === '' || dateString === 'null' || dateString === 'undefined') {
        parsed = null
      } else if (dateString.includes('-') && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number)
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          parsed = null
        } else {
          parsed = new Date(year, month - 1, day)
        }
      } else {
        const tempDate = new Date(dateString)
        if (isNaN(tempDate.getTime())) {
          console.warn(`Failed to parse date: "${dateString}"`)
          parsed = null
        } else {
          parsed = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())
        }
      }
    }
    
    if (cacheKey) {
      dateCache.set(cacheKey, parsed)
    }
    
    return parsed
  } catch (error) {
    console.warn(`parseTopicDate error parsing "${dateString}":`, error)
    if (cacheKey) {
      dateCache.set(cacheKey, null)
    }
    return null
  }
}
