// CivicSense Utility Functions
// Platform-agnostic utilities and configuration

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Export feature flags from a single source
export { envFeatureFlags } from "./feature-flags";

export * from "./debug-flags";
export * from "./statsig-integration";
export * from "./performance";
export * from "./cache-debug";
export * from "./debug-config";
export * from "./mock-data";
export * from "./constants";
export * from "./toast";
