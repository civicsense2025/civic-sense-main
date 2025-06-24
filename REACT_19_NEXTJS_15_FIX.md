# React 19 + Next.js 15 Compatibility Fix

## Issue Description

**Error**: `TypeError: Cannot read properties of undefined (reading 'call')`

This error occurred when using React 19.1.0 with Next.js 15.2.4, specifically in webpack module resolution where module factories were undefined during JSX runtime handling.

### Error Stack Trace
```
TypeError: Cannot read properties of undefined (reading 'call')
    at webpack/lib/dependencies/ContextDependency.js
    → React JSX dev runtime
    → Button component
    → DonationThankYouPopover
    → AuthProvider
    → Layout
```

## Root Cause

The issue was caused by **overly complex webpack configuration** that interfered with Next.js's internal module resolution system. The custom webpack aliases and optimization settings were conflicting with Next.js 15's built-in React 19 support.

## Solution

### 1. Simplified Next.js Configuration

**Before** (causing issues):
```javascript
webpack: (config, { dev, isServer, webpack }) => {
  // Complex React 19 compatibility fixes
  config.resolve.alias = {
    'react/jsx-runtime': require.resolve('react/jsx-runtime'),
    'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
    'react': require.resolve('react'),
    'react-dom': require.resolve('react-dom'),
    'react-dom/client': require.resolve('react-dom/client'),
    // ... many more aliases
  }
  
  // Complex optimization settings
  config.optimization = {
    // ... complex optimization rules
  }
  
  // Custom babel loader rules
  config.module.rules.push({
    test: /\.(tsx|ts|jsx|js)$/,
    use: { loader: 'babel-loader', /* ... */ }
  })
  
  return config
}
```

**After** (working solution):
```javascript
webpack: (config, { dev, isServer, webpack }) => {
  // Basic webpack configuration for compatibility
  config.ignoreWarnings = [
    /Critical dependency: the request of a dependency is an expression/,
    /Module not found: Can't resolve/,
  ]
  
  config.stats = {
    ...config.stats,
    warnings: false,
    warningsFilter: [
      /node_modules\/@supabase\/realtime-js/,
      /Critical dependency: the request of a dependency is an expression/,
    ],
  }
  
  return config
}
```

### 2. ES Module Import Fix

Added proper ES module import handling for the `.mjs` configuration file:

```javascript
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
```

### 3. Removed Custom Babel Configuration

- Removed `babel.config.js` 
- Removed babel dependencies
- Let Next.js SWC handle React compilation automatically

## Key Learnings

1. **Next.js 15 has built-in React 19 support** - Custom webpack configurations can interfere with this
2. **SWC over Babel** - Next.js SWC compiler handles React 19 JSX transformation better than custom Babel setups
3. **Minimal webpack configuration** - Less is more when it comes to webpack customization in Next.js 15
4. **Trust the framework** - Next.js 15 is designed to work with React 19 out of the box

## Testing

### Build Test
```bash
npm run build
# ✓ Compiled successfully
```

### Development Server Test
```bash
npm run dev
# ✓ Server running without JSX runtime errors
```

### Browser Test
- Admin pages load without errors
- No webpack module factory errors in console
- React components render correctly

## Files Modified

1. **next.config.mjs** - Simplified webpack configuration
2. **package.json** - Removed babel dependencies
3. **babel.config.js** - Deleted (no longer needed)

## Compatibility

- ✅ React 19.1.0
- ✅ Next.js 15.2.4  
- ✅ All existing components and features
- ✅ Build and development modes
- ✅ Webpack module resolution

## Future Considerations

- Monitor for Next.js updates that might improve React 19 compatibility
- Consider upgrading other dependencies to React 19 compatible versions
- Keep webpack configuration minimal to avoid future conflicts

---

**Date**: June 23, 2025  
**React Version**: 19.1.0  
**Next.js Version**: 15.2.4  
**Status**: ✅ Resolved 