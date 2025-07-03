// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Find the workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Get the default Expo metro config
const config = getDefaultConfig(projectRoot);

// Configure Metro for monorepo
config.watchFolders = [workspaceRoot];

// Add workspace packages to node_modules_paths
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Configure disableHierarchicalLookup for better performance in monorepo
config.resolver.disableHierarchicalLookup = false;

// Enable package.json exports (default in SDK 53)
config.resolver.unstable_enablePackageExports = true;

// Add source extensions for better module resolution
config.resolver.sourceExts = [
  'js',
  'jsx',
  'json',
  'ts',
  'tsx',
  'cjs',
  'mjs',
  // Add native extensions
  'android.js',
  'android.jsx',
  'android.ts',
  'android.tsx',
  'ios.js',
  'ios.jsx',
  'ios.ts',
  'ios.tsx',
  'web.js',
  'web.jsx',
  'web.ts',
  'web.tsx'
];

// Add asset extensions
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];

// Add platforms for better resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure resolver to handle workspace packages and missing web dependencies
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Special handling for expo-router entry
  if (moduleName === 'expo-router/entry') {
    try {
      const routerPath = require.resolve('expo-router/entry');
      return {
        filePath: routerPath,
        type: 'sourceFile',
      };
    } catch (error) {
      console.warn('Failed to resolve expo-router/entry:', error);
    }
  }

  // Handle workspace packages
  if (moduleName.startsWith('@civicsense/')) {
    const packageName = moduleName.replace('@civicsense/', '');
    const packagePath = path.resolve(workspaceRoot, 'packages', packageName);
    
    try {
      const packageJson = require(path.join(packagePath, 'package.json'));
      const mainFile = packageJson.main || 'index.js';
      const resolvedPath = path.resolve(packagePath, mainFile);
      
      if (require('fs').existsSync(resolvedPath)) {
        return {
          filePath: resolvedPath,
          type: 'sourceFile',
        };
      }
    } catch (error) {
      // Fall through to default resolution
    }
  }
  
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

// Configure transformer with React 19 support and monorepo compatibility
config.transformer = {
  ...config.transformer,
  assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
  },
  // Enable experimental features for React 19
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
      // Enable import.meta transform for React 19
      unstable_transformImportMeta: true,
    },
  }),
  // Enable unstable_allowRequireContext for workspace compatibility
  unstable_allowRequireContext: true,
};

// Configure Metro cache - use workspace root for better caching
config.projectRoot = projectRoot;

// Add resolver main fields for better package resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configure server for monorepo development
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set correct MIME types for web platform
      if (req.url.includes('.bundle') || req.url.includes('.chunk.')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      
      // Allow requests from all local origins
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      middleware(req, res, next);
    };
  },
  port: 8081, // Match the port being used
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