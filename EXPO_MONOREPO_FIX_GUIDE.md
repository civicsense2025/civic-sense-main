# CivicSense Expo Monorepo Fix Guide

## 🔍 Current Issues & Solutions

### 1. Module Type Conflict
**Issue**: Root package.json has `"type": "module"` which conflicts with Expo's CommonJS expectations.

**Fix**: Update root package.json to remove the module type:
```json
{
  "name": "civic-sense",
  "version": "1.0.0",
  "private": true,
  // Remove: "type": "module",
  ...
}
```

### 2. React Version Conflict
**Issue**: Root has React 19 overrides while mobile uses React 18.2.0

**Fix**: Update root package.json overrides:
```json
{
  "overrides": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@types/react": "18.2.14",
    "@types/react-dom": "18.2.7"
  }
}
```

### 3. Dependency Consolidation
**Issue**: Duplicated dependencies between root and mobile

**Fix**: Move shared dependencies to root:
```bash
# From root directory
pnpm add -w react-native-safe-area-context@^5.5.1 react-native-screens@~4.0.0 date-fns@^3.6.0

# Then remove from mobile/package.json
cd apps/mobile
pnpm remove react-native-safe-area-context react-native-screens date-fns
```

### 4. Metro Config Simplification
**Issue**: Complex metro config might have edge cases

**Fix**: Simplify the metro.config.js:
```javascript
// apps/mobile/metro.config.js
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

module.exports = withNativeWind(config, { input: './global.css' });
```

### 5. TypeScript Configuration Updates
**Issue**: Module resolution might need adjustment

**Fix**: Update apps/mobile/tsconfig.json:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@civicsense/types": ["../../packages/types/src/index"],
      "@civicsense/types/*": ["../../packages/types/src/*"],
      "@civicsense/business-logic": ["../../packages/business-logic/src/index"],
      "@civicsense/business-logic/*": ["../../packages/business-logic/src/*"],
      "@civicsense/design-tokens": ["../../packages/design-tokens/src/index"],
      "@civicsense/design-tokens/*": ["../../packages/design-tokens/src/*"]
    },
    "jsx": "react-native",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "commonjs",
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": [
    "src/**/*",
    "app/**/*",
    "lib/**/*",
    "components/**/*",
    "*.ts",
    "*.tsx",
    "*.js",
    "*.jsx",
    "nativewind-env.d.ts",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js"
  ]
}
```

### 6. Clean Installation Process
```bash
# From root directory
# 1. Clean everything
rm -rf node_modules
rm -rf apps/mobile/node_modules
rm -rf packages/*/node_modules
rm -f pnpm-lock.yaml

# 2. Clear caches
cd apps/mobile
rm -rf .expo
rm -rf node_modules/.cache
cd ../..

# 3. Fresh install
pnpm install

# 4. Verify symlinks
ls -la apps/mobile/node_modules/@civicsense/
# Should show symlinks to packages directory
```

### 7. Pre-flight Checks
Before running the app, verify:

```bash
# 1. Check workspace packages are linked
cd apps/mobile
pnpm list @civicsense/types @civicsense/business-logic @civicsense/design-tokens

# 2. Clear Metro cache
npx expo start --clear

# 3. If issues persist, reset Metro
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

### 8. Common Runtime Issues & Solutions

#### Issue: "Unable to resolve module @civicsense/types"
```bash
# Fix: Ensure packages are built
cd packages/types && pnpm build
cd ../business-logic && pnpm build
cd ../design-tokens && pnpm build
```

#### Issue: "Module parse failed: Unexpected token"
```bash
# Fix: Ensure babel is transpiling workspace packages
# Add to babel.config.js:
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'expo-router/babel',
    'nativewind/babel',
    ['module-resolver', {
      alias: {
        '@': './src',
        '@civicsense/types': '../../packages/types/src',
        '@civicsense/business-logic': '../../packages/business-logic/src',
        '@civicsense/design-tokens': '../../packages/design-tokens/src',
      }
    }]
  ],
};
```

### 9. Running the App
```bash
cd apps/mobile
pnpm start --clear
# Or for specific platforms:
pnpm ios
pnpm android
```

### 10. Troubleshooting Checklist
- [ ] Root package.json doesn't have `"type": "module"`
- [ ] React versions are consistent (18.2.0)
- [ ] No duplicate dependencies between root and mobile
- [ ] Metro config properly references workspace root
- [ ] TypeScript paths point to package src directories
- [ ] All workspace packages have main/types fields in package.json
- [ ] Metro and watchman caches are cleared
- [ ] Node modules are freshly installed with pnpm

## 🎯 Quick Fix Script
Save this as `fix-monorepo.sh` in the root:

```bash
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
```

Make it executable: `chmod +x fix-monorepo.sh`
Then run: `./fix-monorepo.sh`
