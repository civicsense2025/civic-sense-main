#!/bin/bash

echo "🧹 Starting deep cleanup of monorepo..."

# Kill any running Metro processes
echo "Killing any running Metro processes..."
pkill -f "metro" || true

# Clear watchman watches
echo "Clearing Watchman watches..."
watchman watch-del-all || true

# Remove all node_modules
echo "Removing node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} \;

# Remove all build directories
echo "Removing build directories..."
find . -name "build" -type d -prune -exec rm -rf {} \;
find . -name "dist" -type d -prune -exec rm -rf {} \;

# Remove Expo specific directories
echo "Removing Expo directories and caches..."
find . -name ".expo" -type d -prune -exec rm -rf {} \;
rm -rf apps/mobile/.expo
rm -rf apps/mobile/node_modules/.cache
rm -rf apps/mobile/node_modules/.expo

# Remove package manager files
echo "Removing package manager files..."
rm -f pnpm-lock.yaml
rm -rf .pnpm-store

# Clear Metro bundler cache
echo "Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-* || true
rm -rf $TMPDIR/haste-* || true

# Clear React Native cache
echo "Clearing React Native cache..."
rm -rf $TMPDIR/react-* || true

# Remove iOS build artifacts
echo "Cleaning iOS build artifacts..."
rm -rf apps/mobile/ios/build
rm -rf apps/mobile/ios/Pods
rm -rf apps/mobile/ios/Podfile.lock

# Remove Android build artifacts
echo "Cleaning Android build artifacts..."
rm -rf apps/mobile/android/build
rm -rf apps/mobile/android/app/build
rm -rf apps/mobile/android/.gradle

echo "✨ Cleanup complete! Run 'pnpm install' to reinstall dependencies." 