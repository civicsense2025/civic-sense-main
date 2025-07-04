#!/bin/bash

# CivicSense Monorepo Quick Fix Script
# Implements all recommended fixes automatically

set -e

echo "🚀 CivicSense Monorepo Quick Fix"
echo "================================"

# Store the root directory
ROOT_DIR=$(pwd)

# Step 1: Backup current package.json files
echo "📦 Backing up package.json files..."
cp package.json package.json.backup
cp apps/mobile/package.json apps/mobile/package.json.backup
cp packages/business-logic/package.json packages/business-logic/package.json.backup

# Step 2: Fix root package.json
echo "🔧 Fixing root package.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' '/"type": "module",/d' package.json
    sed -i '' 's/"react-dom": "\^19.1.0"/"react": "18.2.0"/g' package.json
    sed -i '' 's/"@types\/react-dom": "\^19.1.6"/"@types\/react": "18.2.14"/g' package.json
else
    # Linux
    sed -i '/"type": "module",/d' package.json
    sed -i 's/"react-dom": "\^19.1.0"/"react": "18.2.0"/g' package.json
    sed -i 's/"@types\/react-dom": "\^19.1.6"/"@types\/react": "18.2.14"/g' package.json
fi

# Step 3: Fix business-logic dependencies
echo "🔧 Fixing business-logic package..."
cd packages/business-logic
pnpm remove next 2>/dev/null || true
pnpm add date-fns@3.6.0
cd $ROOT_DIR

# Step 4: Create simple metro config
echo "📱 Creating simplified Metro config..."
cat > apps/mobile/metro.config.new.js << 'EOF'
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force resolving workspace packages from source
config.resolver.extraNodeModules = {
  '@civicsense/types': path.resolve(workspaceRoot, 'packages/types/src'),
  '@civicsense/business-logic': path.resolve(workspaceRoot, 'packages/business-logic/src'),
  '@civicsense/design-tokens': path.resolve(workspaceRoot, 'packages/design-tokens/src'),
};

// Enable symlinks
config.resolver.unstable_enableSymlinks = true;

// Add TypeScript extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

module.exports = withNativeWind(config, { input: './global.css' });
EOF

# Backup old metro config and use new one
mv apps/mobile/metro.config.js apps/mobile/metro.config.old.js
mv apps/mobile/metro.config.new.js apps/mobile/metro.config.js

# Step 5: Clean everything
echo "🧹 Cleaning node_modules and caches..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -f pnpm-lock.yaml

# Clear Metro caches
watchman watch-del-all 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Clear Expo caches
cd apps/mobile
rm -rf .expo
rm -rf node_modules/.cache
cd $ROOT_DIR

# Step 6: Fresh install
echo "📦 Running fresh install..."
pnpm install

# Step 7: Verify setup
echo "✅ Running health check..."
if [ -f "check-monorepo-health.js" ]; then
    node check-monorepo-health.js
fi

echo ""
echo "✨ Quick fix complete!"
echo ""
echo "Next steps:"
echo "1. cd apps/mobile"
echo "2. pnpm start --clear"
echo ""
echo "If you encounter issues:"
echo "- Check EXPO_TROUBLESHOOTING_GUIDE.md"
echo "- Restore backups with: mv package.json.backup package.json"
echo ""
