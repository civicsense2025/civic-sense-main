/**
 * Mobile API Configuration
 * 
 * This file contains configuration for connecting the mobile app to your web API.
 * Update these settings based on your development/production environment.
 */

// Default to localhost for development
// In production, you'll want to update this to your actual domain
const DEFAULT_API_URL = 'http://localhost:3000';

// For mobile development, we need to handle different environments
const getMobileApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // Check for environment variable first
    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) {
      console.log(`🔧 Using environment API URL: ${envUrl}`);
      return envUrl;
    }
    
    // Try to detect if we're in Expo development
    if (typeof window !== 'undefined' && window.location?.hostname) {
      // Web environment - use current host
      const webUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
      console.log(`🌐 Using web environment URL: ${webUrl}`);
      return webUrl;
    }
    
    // Mobile development - try common development IPs
    // You should replace this with your actual machine's IP address
    const developmentIPs = [
      'http://192.168.1.151:3000',  // Replace with your actual IP
      'http://10.0.2.2:3000',       // Android emulator host
      'http://192.168.1.151:3000'        // Fallback for iOS simulator
    ];
    
    // For now, use the first one but log a warning
    const devUrl = developmentIPs[0];
    console.warn(`⚠️ Using default development IP: ${devUrl}`);
    console.warn(`🔧 To fix this, find your machine's IP address and set EXPO_PUBLIC_API_URL in your .env file`);
    console.warn(`💡 Example: EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3000`);
    
    return devUrl;
  }
  
  // Production environment
  return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-domain.com';
};

export const ApiConfig = {
  /**
   * Base URL for your web API
   * 
   * Development: Usually 'http://localhost:3000' (Next.js default)
   * Production: Your actual domain like 'https://yourdomain.com'
   * 
   * You can also set this via environment variable: EXPO_PUBLIC_API_URL
   */
  baseUrl: getMobileApiUrl(),

  /**
   * Timeout for API requests (in milliseconds)
   */
  timeout: 10000,

  /**
   * Whether to show detailed API logs
   */
  enableLogging: __DEV__, // Only in development

  /**
   * Whether to use mock data when API is unavailable
   */
  useMockFallback: true,

  /**
   * Headers to include with all API requests
   */
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Helper to build full API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Remove trailing slash from base URL if present
  const cleanBaseUrl = ApiConfig.baseUrl.endsWith('/') 
    ? ApiConfig.baseUrl.slice(0, -1) 
    : ApiConfig.baseUrl;
  
  return `${cleanBaseUrl}/${cleanEndpoint}`;
};

/**
 * Development notes:
 * 
 * 1. If you're running the web app on a different port, update DEFAULT_API_URL
 * 2. For device testing, you may need to use your computer's IP address instead of localhost
 * 3. Set EXPO_PUBLIC_API_URL in your .env file for environment-specific URLs
 * 4. In production, make sure your API endpoints support CORS for mobile requests
 */ 