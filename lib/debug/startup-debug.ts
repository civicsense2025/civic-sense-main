import { Platform } from 'react-native';

export function debugStartup() {
  console.log('\n=== CivicSense Mobile Debug Info ===');
  console.log('Platform:', Platform.OS);
  console.log('Node version:', process.version);
  console.log('Bundle:', __DEV__ ? 'Development' : 'Production');
  console.log('Startup debug: running in React Native environment');
  
  // Log module resolution paths
  console.log('\nModule Resolution:');
  console.log('Startup debug: process.cwd() is not available in React Native');
  console.log('Module paths:', module.paths);
  
  // Log environment variables that might affect module resolution
  console.log('\nEnvironment:');
  console.log('NODE_PATH:', process.env.NODE_PATH);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Log Metro config if available
  try {
    const metro = require('metro-config');
    console.log('\nMetro Config:');
    console.log('Watchman enabled:', metro.watchman);
    console.log('Module resolution:', metro.resolver);
  } catch (e) {
    console.log('Metro config not available');
  }
  
  console.log('\n=== End Debug Info ===\n');
} 