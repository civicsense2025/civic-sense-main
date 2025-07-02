// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get the default Expo metro config
const config = getDefaultConfig(__dirname);

// Add source extensions for better module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Add asset extensions
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];

// Add platforms for better resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure resolver to handle missing web dependencies
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle shaka-player missing dependency for react-native-track-player web support
  if (moduleName === 'shaka-player/dist/shaka-player.ui' && platform === 'web') {
    // Return a mock module for web that doesn't break bundling
    return {
      filePath: require.resolve('./web-mocks/shaka-player-mock.js'),
      type: 'sourceFile',
    };
  }
  
  // Fall back to the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Configure transformer with HMR error handling
config.transformer = {
  ...config.transformer,
  assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
  },
  // Add HMR options to prevent errors
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Configure Metro cache
config.resetCache = true;

// Add HMR configuration to prevent undefined property errors
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add CORS configuration for local development
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Allow requests from local network IP ranges
      const allowedOrigins = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^http:\/\/192\.168\.1\.\d+:\d+$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/,
      ];
      
      const origin = req.headers.origin;
      if (origin && allowedOrigins.some(pattern => pattern.test(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      middleware(req, res, next);
    };
  },
  port: process.env.PORT || 8081,
};

// Export the config with NativeWind support
module.exports = withNativeWind(config, { 
  input: path.join(__dirname, 'global.css'),
  configPath: path.join(__dirname, 'tailwind.config.js')
});

// Note: Sentry configuration has been removed
// To re-enable Sentry, install @sentry/react-native and replace:
// const { getDefaultConfig } = require('expo/metro-config');
// with:
// const { getSentryExpoConfig } = require('@sentry/react-native/metro');
// and change:
// const config = getDefaultConfig(__dirname);
// to:
// const config = getSentryExpoConfig(__dirname); 