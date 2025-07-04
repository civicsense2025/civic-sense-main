// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const fs = require('fs');

// Find the workspace root
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

// Create the default config
const config = getDefaultConfig(projectRoot, {
  // Enable experimental features needed for monorepo
  experiments: {
    tsconfigPaths: true,
    unstable_enableSymlinks: true,
  },
});

// 1. Watch all files in the monorepo
config.watchFolders = [
  workspaceRoot,
  path.resolve(workspaceRoot, 'packages/types/src'),
  path.resolve(workspaceRoot, 'packages/business-logic/src'),
  path.resolve(workspaceRoot, 'packages/design-tokens/src'),
];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Configure module resolution
config.resolver.resolverMainFields = [
  'browser',
  'react-native',
  'module',
  'main',
];

// 4. Add TypeScript extensions
config.resolver.sourceExts = [
  'expo.ts',
  'expo.tsx',
  'expo.js',
  'expo.jsx',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'cjs',
  'mjs',
];

// 5. Configure platforms
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 6. Enable symlinks for monorepo
config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;

// Configure asset resolver
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'bin'];

// Helper function to check file existence with multiple extensions
function resolveWithExtensions(basePath, extensions) {
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

// Enhanced resolver for workspace packages and entry points
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Debug module resolution
  if (process.env.DEBUG_MODULE_RESOLUTION) {
    console.log(`Resolving module: ${moduleName} (platform: ${platform})`);
  }

  // Handle entry point resolution
  if (moduleName === './apps/mobile/index') {
    const entryPoint = path.resolve(projectRoot, 'index.js');
    if (fs.existsSync(entryPoint)) {
      if (process.env.DEBUG_MODULE_RESOLUTION) {
        console.log(`Resolved entry point to: ${entryPoint}`);
      }
      return {
        filePath: entryPoint,
        type: 'sourceFile',
      };
    }
  }

  // Handle @/ imports
  if (moduleName.startsWith('@/')) {
    const relativePath = moduleName.substring(2);
    const srcPath = path.resolve(projectRoot, 'src');
    const filePath = path.resolve(srcPath, relativePath);
    
    const resolvedPath = resolveWithExtensions(filePath, ['.ts', '.tsx', '.js', '.jsx']);
    if (resolvedPath) {
      if (process.env.DEBUG_MODULE_RESOLUTION) {
        console.log(`Resolved ${moduleName} to ${resolvedPath}`);
      }
      return {
        filePath: resolvedPath,
        type: 'sourceFile',
      };
    }
  }

  // Handle workspace package imports
  if (moduleName.startsWith('@civicsense/')) {
    const [, packageName, ...rest] = moduleName.split('/');
    const packagePath = path.resolve(workspaceRoot, 'packages', packageName, 'src', ...rest);
    
    const resolvedPath = resolveWithExtensions(packagePath, ['.ts', '.tsx', '.js', '.jsx']);
    if (resolvedPath) {
      if (process.env.DEBUG_MODULE_RESOLUTION) {
        console.log(`Resolved ${moduleName} to ${resolvedPath}`);
      }
      return {
        filePath: resolvedPath,
        type: 'sourceFile',
      };
    }
  }
  
  // Handle expo-router entry point
  if (moduleName === 'expo-router/entry') {
    try {
      const resolvedPath = require.resolve('expo-router/entry');
      return {
        filePath: resolvedPath,
        type: 'sourceFile',
      };
    } catch (error) {
      console.warn('Failed to resolve expo-router/entry:', error);
    }
  }
  
  // Fall back to the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Configure transformer
config.transformer = {
  ...config.transformer,
  assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: true,
      inlineRequires: true,
      unstable_disableES6Transforms: true,
    },
  }),
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

// Apply NativeWind transformations
module.exports = withNativeWind(config, { input: './global.css' });

// Note: Sentry configuration has been removed
// To re-enable Sentry, install @sentry/react-native and replace:
// const { getDefaultConfig } = require('expo/metro-config');
// with:
// const { getSentryExpoConfig } = require('@sentry/react-native/metro');
// and change:
// const config = getDefaultConfig(__dirname);
// to:
// const config = getSentryExpoConfig(__dirname); 