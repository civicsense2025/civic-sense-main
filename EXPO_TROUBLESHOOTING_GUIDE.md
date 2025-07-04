# CivicSense Expo Monorepo Troubleshooting Guide

## Common Issues & Solutions

### 🔴 Issue: "Unable to resolve module @civicsense/types"

**Symptoms:**
- Metro bundler shows module resolution errors
- App crashes on startup with import errors

**Solutions:**
1. **Verify symlinks exist:**
   ```bash
   ls -la apps/mobile/node_modules/@civicsense/
   # Should show symlinks like: types -> ../../../packages/types
   ```

2. **Force recreate symlinks:**
   ```bash
   cd apps/mobile
   rm -rf node_modules
   cd ../..
   pnpm install
   ```

3. **Add to Metro config:**
   ```javascript
   config.resolver.extraNodeModules = {
     '@civicsense/types': path.resolve(workspaceRoot, 'packages/types/src'),
   };
   ```

### 🔴 Issue: "Module parse failed: Unexpected token"

**Symptoms:**
- TypeScript files not being transpiled
- Syntax errors on import statements

**Solutions:**
1. **Ensure Metro processes TypeScript:**
   ```javascript
   // metro.config.js
   config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];
   ```

2. **Check Babel configuration includes workspace paths:**
   ```javascript
   // babel.config.js
   alias: {
     '@civicsense/types': '../../packages/types/src',
   }
   ```

### 🔴 Issue: "React version mismatch"

**Symptoms:**
- Type errors about React versions
- Runtime errors about hooks

**Solutions:**
1. **Check all React versions:**
   ```bash
   pnpm list react --depth=0
   ```

2. **Force resolution in root package.json:**
   ```json
   "overrides": {
     "react": "18.2.0",
     "react-native": "0.73.9"
   }
   ```

### 🔴 Issue: "Cannot find module 'next'"

**Symptoms:**
- Business logic imports fail
- Next.js specific imports in React Native

**Solutions:**
1. **Use mobile-specific entry:**
   ```typescript
   // Change imports from:
   import { someFunction } from '@civicsense/business-logic';
   // To:
   import { someFunction } from '@civicsense/business-logic/mobile';
   ```

2. **Configure package.json exports:**
   ```json
   "exports": {
     ".": {
       "react-native": "./src/mobile.ts",
       "default": "./src/index.ts"
     }
   }
   ```

### 🔴 Issue: "Metro cache issues"

**Symptoms:**
- Changes not reflected after saving
- Old errors persist after fixes

**Solutions:**
```bash
# Nuclear option - clear everything
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
cd apps/mobile
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear
```

### 🔴 Issue: "Duplicate packages"

**Symptoms:**
- "Tried to register two views with the same name"
- Hook errors about multiple React instances

**Solutions:**
1. **Deduplicate with pnpm:**
   ```bash
   pnpm dedupe
   ```

2. **Check for duplicate dependencies:**
   ```bash
   pnpm why react-native-screens
   pnpm why react
   ```

### 🔴 Issue: "Type errors in IDE but app runs"

**Symptoms:**
- VSCode shows errors but Metro builds fine
- TypeScript paths not resolving in IDE

**Solutions:**
1. **Restart TypeScript server:**
   - VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server"

2. **Ensure root tsconfig.json extends to packages:**
   ```json
   {
     "references": [
       { "path": "./packages/types" },
       { "path": "./packages/business-logic" },
       { "path": "./apps/mobile" }
     ]
   }
   ```

### 🔴 Issue: "Pod install fails" (iOS)

**Symptoms:**
- iOS build fails
- CocoaPods errors

**Solutions:**
```bash
cd apps/mobile/ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install --repo-update
```

### 🔴 Issue: "Android build fails"

**Symptoms:**
- Gradle errors
- Duplicate class errors

**Solutions:**
```bash
cd apps/mobile/android
./gradlew clean
cd ..
npx expo run:android --clear
```

## 🛠️ Debug Commands

### Check Monorepo Health
```bash
node check-monorepo-health.js
```

### Verify Package Linking
```bash
# From mobile app
cd apps/mobile
pnpm list @civicsense/types @civicsense/business-logic @civicsense/design-tokens
```

### Metro Debug Mode
```bash
DEBUG=* npx expo start --clear
```

### TypeScript Compilation Check
```bash
cd packages/types && pnpm type-check
cd ../business-logic && pnpm type-check
cd ../../apps/mobile && pnpm type-check
```

## 🚀 Quick Reset Script

Save as `reset-expo.sh`:
```bash
#!/bin/bash
echo "🧹 Resetting Expo app..."

# Clear all caches
watchman watch-del-all 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Clear local caches
cd apps/mobile
rm -rf .expo
rm -rf node_modules/.cache
rm -rf ios/build
rm -rf android/app/build

# Reinstall
rm -rf node_modules
cd ../..
pnpm install

# Start fresh
cd apps/mobile
npx expo start --clear
```

## 📱 Platform-Specific Issues

### iOS Specific
- Ensure Xcode is up to date
- Check iOS deployment target matches app.config.ts
- Run `npx expo prebuild --clear` if native changes

### Android Specific  
- Ensure ANDROID_HOME is set
- Check JDK version (11 or 17 recommended)
- Increase gradle memory if needed

### Web Specific
- Not all React Native packages work on web
- Check platform-specific imports

## 🆘 Last Resort Options

1. **Eject and manually link:**
   ```bash
   npx expo prebuild
   # Then manually add packages to native files
   ```

2. **Use patch-package for quick fixes:**
   ```bash
   pnpm add -D patch-package
   # Make fixes in node_modules
   pnpm patch-package <package-name>
   ```

3. **Temporarily vendor packages:**
   ```bash
   # Copy package source into mobile app
   cp -r packages/types apps/mobile/src/vendor/types
   ```

## 📞 Getting Help

1. Check Expo docs: https://docs.expo.dev/
2. Search issues on GitHub
3. Ask in Expo Discord
4. File detailed bug report with:
   - Output of `npx expo-env-info`
   - Error messages
   - Steps to reproduce
