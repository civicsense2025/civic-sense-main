/**
 * UI Strings Extractor - Server-safe utility for extracting translatable strings
 * This file has no Supabase dependencies and can be safely imported in server contexts
 */

import { uiStrings } from './ui-strings'

/**
 * Extract all translatable strings from the UI strings object
 */
export function extractTranslatableStrings(): Array<{ path: string; text: string }> {
  const strings: Array<{ path: string; text: string }> = []

  function traverse(obj: any, currentPath: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key

      if (typeof value === 'string') {
        strings.push({ path, text: value })
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, path)
      }
    }
  }

  traverse(uiStrings)
  return strings
}

/**
 * Helper to get string value by dot notation path
 */
export function getStringByPath(path: string): string | undefined {
  const keys = path.split('.')
  let result: any = uiStrings

  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) {
      return undefined
    }
  }

  return typeof result === 'string' ? result : undefined
} 