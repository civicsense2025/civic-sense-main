# CivicSense Expo Monorepo - Fix Documentation

## 📋 Overview

This directory contains comprehensive documentation and scripts to fix the Expo app after moving to a monorepo structure. The main issues identified are:

1. Module type conflicts (ESM vs CommonJS)
2. React version mismatches
3. Dependency conflicts (Next.js in React Native)
4. Metro bundler configuration complexity
5. Package resolution issues

## 📚 Documentation Files

### 1. **EXPO_MONOREPO_FIX_GUIDE.md**
Complete step-by-step guide to fix all monorepo issues, including:
- Module type conflicts
- React version alignment
- Dependency consolidation
- Metro configuration
- TypeScript setup

### 2. **MONOREPO_AUDIT_COMPLETE.md**
Comprehensive audit results showing:
- Critical issues found
- Impact analysis
- Complete fix checklist
- Expected final state

### 3. **EXPO_TROUBLESHOOTING_GUIDE.md**
Detailed troubleshooting for common issues:
- Module resolution errors
- TypeScript parsing failures
- Cache problems
- Platform-specific issues

## 🛠️ Fix Scripts

### Quick Start (Recommended)
```bash
# Make scripts executable
bash make-scripts-executable.sh

# Run comprehensive fix
./quick-fix-monorepo.sh
```

### Individual Scripts

1. **quick-fix-monorepo.sh** (Recommended)
   - Automated implementation of all fixes
   - Backs up files before changes
   - Cleans and reinstalls everything
   ```bash
   ./quick-fix-monorepo.sh
   ```

2. **fix-monorepo.sh**
   - Basic fix script
   - Cleans and rebuilds packages
   ```bash
   ./fix-monorepo.sh
   ```

3. **check-monorepo-health.js**
   - Diagnostic tool
   - Checks all configurations
   - Reports issues
   ```bash
   node check-monorepo-health.js
   ```

## 🚀 Quick Fix Process

1. **Run the automated fix:**
   ```bash
   ./quick-fix-monorepo.sh
   ```

2. **Start the app:**
   ```bash
   cd apps/mobile
   pnpm start --clear
   ```

3. **If issues persist:**
   - Check `EXPO_TROUBLESHOOTING_GUIDE.md`
   - Run `node check-monorepo-health.js`
   - Try manual fixes from `EXPO_MONOREPO_FIX_GUIDE.md`

## 🎯 Key Fixes Applied

1. **Root package.json**
   - Remove `"type": "module"`
   - Fix React version to 18.2.0
   - Update overrides

2. **Business Logic Package**
   - Remove Next.js dependency
   - Create mobile-safe exports
   - Standardize date-fns version

3. **Metro Configuration**
   - Simplify to basic monorepo setup
   - Enable symlinks
   - Add TypeScript support

4. **Dependencies**
   - Consolidate shared deps at root
   - Remove duplicates
   - Align versions

## ⚠️ Important Notes

- Always run `pnpm install` from the root directory
- Use `pnpm start --clear` to avoid cache issues
- Check symlinks with `ls -la apps/mobile/node_modules/@civicsense/`
- Backups are created before automated fixes

## 🆘 Getting Help

If automated fixes don't work:

1. **Restore backups:**
   ```bash
   mv package.json.backup package.json
   mv apps/mobile/package.json.backup apps/mobile/package.json
   ```

2. **Try manual fixes:**
   - Follow `EXPO_MONOREPO_FIX_GUIDE.md`
   - Check specific issues in `EXPO_TROUBLESHOOTING_GUIDE.md`

3. **Nuclear option:**
   ```bash
   # Complete reset
   git stash
   git clean -fdx
   pnpm install
   ```

## ✅ Success Criteria

You'll know the fixes worked when:
- `pnpm start` runs without module errors
- Hot reload works with package changes
- No React version warnings
- TypeScript finds all types correctly
- App runs on iOS/Android simulators

---

*Generated: July 2025 - CivicSense Monorepo Migration*
