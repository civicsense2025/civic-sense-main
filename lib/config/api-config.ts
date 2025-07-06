/*
 * lib/config/api-config.ts
 * ---------------------------------------------------------------------------
 * Centralised configuration for API endpoints used by the React Native app.
 * Provides:
 *  1. ApiConfig – global config object.
 *  2. buildApiUrl – helper to prefix relative API paths with baseUrl.
 *
 * NOTE: This is intentionally minimal. Extend as needed (e.g., auth headers,
 * dynamic env switching). Placing it here (lib/config) matches import paths
 * like "../../lib/config/api-config" already used throughout the codebase.
 */

// --------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------

export interface ApiConfigOptions {
  /** Base URL for your backend (no trailing slash) */
  baseUrl: string;

  /** Toggle verbose network logging */
  enableLogging: boolean;
}

// --------------------------------------------------------------------------
// CONSTANTS
// --------------------------------------------------------------------------

export const ApiConfig: ApiConfigOptions = {
  // Expo SDK automatically exposes env vars prefixed with EXPO_PUBLIC_*
  // Fallback to production URL if env var is undefined.
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.civicsense.one',

  // __DEV__ is injected by Metro / React Native.
  enableLogging: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
};

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------

/**
 * Prepends the configured base URL to a relative path. If an absolute URL is
 * provided, it is returned unchanged.
 *
 * @example
 * ```ts
 * const url = buildApiUrl('/api/collections');
 * // → 'https://api.civicsense.com/api/collections'
 * ```
 */
export function buildApiUrl(path: string): string {
  // Absolute URL – return as-is
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const trimmedBase = ApiConfig.baseUrl.replace(/\/$/, '');
  const trimmedPath = path.replace(/^\//, '');
  return `${trimmedBase}/${trimmedPath}`;
} 