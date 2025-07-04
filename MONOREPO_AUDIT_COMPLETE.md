# CivicSense Expo Monorepo - Complete Audit Summary

## 🚨 Critical Issues Found

### 1. **Next.js Dependency in Business Logic**
The `@civicsense/business-logic` package depends on `next`, which is incompatible with React Native.
- **Impact**: Will cause module resolution errors
- **Fix**: Remove Next.js dependency or create separate entry points for web/mobile

### 2. **Module Type Conflict**
Root package.json has `"type": "module"` while React Native expects CommonJS
- **Impact**: Import/export errors
- **Fix**: Remove `"type": "module"` from root package.json

### 3. **React Version Mismatch**
- Root: React 19 (in overrides)
- Mobile: React 18.2.0
- **Impact**: Type errors and potential runtime issues
- **Fix**: Standardize on React 18.2.0 across the monorepo

### 4. **Date-fns Version Conflict**
- Root: date-fns@^3.6.0
- Business Logic: date-fns@^4.1.0
- Mobile: date-fns@3.0.0
- **Impact**: API incompatibilities between versions
- **Fix**: Standardize on date-fns@3.6.0

## 📋 Complete Fix Checklist

### Step 1: Fix Root package.json
```bash
# Remove these lines from root package.json:
# - "type": "module"
# Update overrides to:
"overrides": {
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "@types/react": "18.2.14",
  "@types/react-dom": "18.2.7"
}
```

### Step 2: Fix Business Logic Package
```bash
cd packages/business-logic
# Remove Next.js dependency
pnpm remove next
# Standardize date-fns
pnpm add date-fns@3.6.0
```

### Step 3: Create Mobile-Safe Business Logic Entry
Create `packages/business-logic/src/mobile.ts`:
```typescript
// Re-export only React Native compatible modules
export * from './auth';
export * from './database';
export * from './services';
export * from './quiz';
export * from './multiplayer';
export * from './ai';
// Exclude any Next.js specific exports
```

Update `packages/business-logic/package.json`:
```json
{
  "exports": {
    ".": {
      "react-native": "./src/mobile.ts",
      "default": "./src/index.ts"
    }
  }
}
```

### Step 4: Standardize Dependencies
```bash
# From root
pnpm add -w date-fns@3.6.0
cd apps/mobile
pnpm remove date-fns
```

### Step 5: Clean Install
```bash
# From root
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules packages/*/node_modules
pnpm install
```

### Step 6: Verify Setup
```bash
# Run the health check
node check-monorepo-health.js

# Clear Metro cache
cd apps/mobile
rm -rf .expo
npx expo start --clear
```

## 🔧 Metro Config (Use Simplified Version)
Replace the complex metro.config.js with metro.config.simple.js:
```bash
cd apps/mobile
mv metro.config.js metro.config.complex.js
mv metro.config.simple.js metro.config.js
```

## 🎯 Quick Commands

### Start Fresh
```bash
./fix-monorepo.sh
```

### Start Development
```bash
cd apps/mobile
pnpm start --clear
```

### If Module Resolution Fails
```bash
# Clear all caches
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
cd apps/mobile
rm -rf .expo node_modules/.cache
pnpm start --clear
```

## 📊 Expected Final State
- All packages use React 18.2.0
- No "type": "module" in package.json files
- Business logic has mobile-safe exports
- date-fns@3.6.0 used consistently
- Metro properly resolves workspace packages
- TypeScript paths align with actual file structure

## 🚦 Success Indicators
- `pnpm list` shows consistent versions
- No symlink warnings during install
- Metro starts without module resolution errors
- App runs on iOS/Android simulators
- Hot reload works with changes in packages/*

## 🆘 If All Else Fails
1. Try using npm/yarn instead of pnpm (temporary)
2. Copy package source directly into mobile app (temporary)
3. Use explicit file paths instead of workspace protocol
4. Disable some Metro optimizations

Remember: The goal is to have a working monorepo where changes in packages/* are immediately reflected in the mobile app during development.
