// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force resolving workspace packages from source
config.resolver.extraNodeModules = {
  '@civicsense/types': path.resolve(workspaceRoot, 'packages/types/src'),
  '@civicsense/business-logic': path.resolve(workspaceRoot, 'packages/business-logic/src'),
  '@civicsense/design-tokens': path.resolve(workspaceRoot, 'packages/design-tokens/src'),
};

// 4. Enable symlinks for pnpm workspaces
config.resolver.unstable_enableSymlinks = true;

// 5. Add support for TypeScript extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

module.exports = withNativeWind(config, { input: './global.css' });
