#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CivicSense Monorepo Health Check\n');

const rootDir = path.resolve(__dirname);
const mobileDir = path.join(rootDir, 'apps/mobile');

// Check 1: Verify pnpm workspace
console.log('1️⃣ Checking pnpm workspace setup...');
try {
  const workspaceFile = fs.readFileSync(path.join(rootDir, 'pnpm-workspace.yaml'), 'utf8');
  console.log('✅ pnpm-workspace.yaml exists');
  
  if (workspaceFile.includes('apps/*') && workspaceFile.includes('packages/*')) {
    console.log('✅ Workspace configuration looks correct');
  } else {
    console.log('❌ Workspace configuration missing apps/* or packages/*');
  }
} catch (e) {
  console.log('❌ pnpm-workspace.yaml not found');
}

// Check 2: Verify package.json configurations
console.log('\n2️⃣ Checking package.json configurations...');
try {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  
  if (rootPkg.type === 'module') {
    console.log('⚠️  Root package.json has "type": "module" - this may cause issues with Expo');
  } else {
    console.log('✅ Root package.json module type is compatible');
  }
  
  const mobilePkg = JSON.parse(fs.readFileSync(path.join(mobileDir, 'package.json'), 'utf8'));
  console.log(`✅ Mobile app name: ${mobilePkg.name}`);
  
  // Check workspace dependencies
  const workspaceDeps = Object.keys(mobilePkg.dependencies || {})
    .filter(dep => mobilePkg.dependencies[dep] === 'workspace:*');
  
  if (workspaceDeps.length > 0) {
    console.log(`✅ Found ${workspaceDeps.length} workspace dependencies:`, workspaceDeps);
  } else {
    console.log('⚠️  No workspace dependencies found');
  }
} catch (e) {
  console.log('❌ Error reading package.json files:', e.message);
}

// Check 3: Verify symlinks
console.log('\n3️⃣ Checking workspace symlinks...');
const packagesToCheck = ['@civicsense/types', '@civicsense/business-logic', '@civicsense/design-tokens'];

packagesToCheck.forEach(pkg => {
  const symlinkPath = path.join(mobileDir, 'node_modules', pkg);
  try {
    const stats = fs.lstatSync(symlinkPath);
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(symlinkPath);
      console.log(`✅ ${pkg} → ${target}`);
    } else {
      console.log(`⚠️  ${pkg} exists but is not a symlink`);
    }
  } catch (e) {
    console.log(`❌ ${pkg} not found in mobile/node_modules`);
  }
});

// Check 4: Metro configuration
console.log('\n4️⃣ Checking Metro configuration...');
try {
  const metroConfig = fs.readFileSync(path.join(mobileDir, 'metro.config.js'), 'utf8');
  
  const checks = [
    { pattern: /watchFolders/, name: 'watchFolders configuration' },
    { pattern: /nodeModulesPaths/, name: 'nodeModulesPaths configuration' },
    { pattern: /withNativeWind/, name: 'NativeWind integration' },
  ];
  
  checks.forEach(check => {
    if (metroConfig.includes(check.pattern.source)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`⚠️  ${check.name} might be missing`);
    }
  });
} catch (e) {
  console.log('❌ metro.config.js not found');
}

// Check 5: TypeScript configuration
console.log('\n5️⃣ Checking TypeScript configuration...');
try {
  const tsConfig = JSON.parse(fs.readFileSync(path.join(mobileDir, 'tsconfig.json'), 'utf8'));
  
  if (tsConfig.compilerOptions?.paths) {
    const pathMappings = Object.keys(tsConfig.compilerOptions.paths);
    console.log(`✅ Found ${pathMappings.length} path mappings`);
    
    packagesToCheck.forEach(pkg => {
      if (pathMappings.some(p => p.startsWith(pkg))) {
        console.log(`✅ ${pkg} path mapping configured`);
      } else {
        console.log(`⚠️  ${pkg} path mapping missing`);
      }
    });
  } else {
    console.log('⚠️  No path mappings found in tsconfig.json');
  }
} catch (e) {
  console.log('❌ Error reading tsconfig.json:', e.message);
}

// Check 6: Babel configuration
console.log('\n6️⃣ Checking Babel configuration...');
try {
  const babelConfig = fs.readFileSync(path.join(mobileDir, 'babel.config.js'), 'utf8');
  
  if (babelConfig.includes('module-resolver')) {
    console.log('✅ module-resolver plugin configured');
    
    packagesToCheck.forEach(pkg => {
      if (babelConfig.includes(pkg)) {
        console.log(`✅ ${pkg} alias found`);
      } else {
        console.log(`⚠️  ${pkg} alias might be missing`);
      }
    });
  } else {
    console.log('⚠️  module-resolver plugin not found');
  }
} catch (e) {
  console.log('❌ babel.config.js not found');
}

// Check 7: Common issues
console.log('\n7️⃣ Checking for common issues...');

// Check for duplicate React versions
try {
  const output = execSync('pnpm list react --depth=0', { cwd: rootDir, encoding: 'utf8' });
  const reactVersions = output.match(/react@[\d.]+/g);
  if (reactVersions && reactVersions.length > 1) {
    console.log('⚠️  Multiple React versions detected:', [...new Set(reactVersions)]);
  } else {
    console.log('✅ Single React version detected');
  }
} catch (e) {
  console.log('⚠️  Could not check React versions');
}

// Check for .expo directory
if (fs.existsSync(path.join(mobileDir, '.expo'))) {
  console.log('✅ .expo directory exists');
} else {
  console.log('⚠️  .expo directory not found - run expo start once');
}

console.log('\n📋 Summary:');
console.log('- Run "pnpm install" from the root to install all dependencies');
console.log('- Run "cd apps/mobile && pnpm start --clear" to start with clean cache');
console.log('- If issues persist, run the fix-monorepo.sh script');
