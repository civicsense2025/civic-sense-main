#!/bin/bash

echo "🧹 Cleaning up..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -f pnpm-lock.yaml

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building packages..."
pnpm --filter "@civicsense/types" build || echo "Types package has no build script"
pnpm --filter "@civicsense/business-logic" build || echo "Business logic has no build script"
pnpm --filter "@civicsense/design-tokens" build || echo "Design tokens has no build script"

echo "🧹 Clearing caches..."
cd apps/mobile
rm -rf .expo node_modules/.cache
npx expo start --clear &
sleep 5
kill $!

echo "✅ Monorepo fix complete!"
echo "📱 Run 'cd apps/mobile && pnpm start' to start the app"
