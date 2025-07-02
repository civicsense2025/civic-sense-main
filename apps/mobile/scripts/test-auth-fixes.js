/**
 * CivicSense Auth Fixes Verification Script
 * 
 * This script verifies that all the auth-related fixes are properly implemented
 * Run with: node scripts/test-auth-fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CivicSense Auth Fixes Verification\n');

// Check if files exist and contain expected fixes
const checks = [
  {
    name: 'Guest Session Filter Fix',
    file: 'components/ui/GuestProgressWidget.tsx',
    check: (content) => {
      return content.includes('Object.values(sessionsObject || {})') &&
             content.includes('sessionsArray.filter(session => session.guest_token === token)');
    },
    description: 'Ensures guest sessions are converted to array before filtering'
  },
  {
    name: 'Google OAuth Service',
    file: 'lib/services/google-oauth.ts',
    check: (content) => {
      return content.includes('GoogleOAuthService') &&
             content.includes('expo-auth-session') &&
             content.includes('signInWithIdToken');
    },
    description: 'Checks if mobile-specific Google OAuth service exists'
  },
  {
    name: 'Improved Auth Context',
    file: 'lib/auth-context-improved.tsx',
    check: (content) => {
      return content.includes('initialized') &&
             content.includes('initializeRef.current') &&
             content.includes('Platform.OS === \'web\'');
    },
    description: 'Verifies the improved auth context with race condition fixes'
  },
  {
    name: 'Test Auth Component',
    file: 'app/auth/test-improved-auth.tsx',
    check: (content) => {
      return content.includes('useAuth') &&
             content.includes('auth-context-improved') &&
             content.includes('handleGoogleSignIn');
    },
    description: 'Confirms test component exists for validation'
  },
  {
    name: 'Font Size Fix',
    file: 'components/ui/GuestProgressWidget.tsx',
    check: (content) => {
      return content.includes('responsiveFontSizes.emojiLarge') &&
             !content.includes('responsiveFontSizes.xl');
    },
    description: 'Ensures the font size property is correctly referenced'
  }
];

// Required dependencies
const requiredDeps = [
  'expo-auth-session',
  'expo-web-browser', 
  'expo-linking'
];

// App config checks
const configChecks = [
  {
    name: 'OAuth Scheme Configuration',
    file: 'app.config.ts',
    check: (content) => {
      return content.includes("scheme: 'civicsense'");
    },
    description: 'Verifies OAuth redirect scheme is configured'
  }
];

let passedChecks = 0;
let totalChecks = checks.length + configChecks.length + 1; // +1 for dependencies

// Test file fixes
console.log('📁 File-based Checks:\n');

[...checks, ...configChecks].forEach((check, index) => {
  const filePath = path.join(process.cwd(), check.file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${check.name}: File ${check.file} not found`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (check.check(content)) {
      console.log(`✅ ${check.name}: ${check.description}`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}: ${check.description} - Fix not found`);
    }
  } catch (error) {
    console.log(`❌ ${check.name}: Error reading file - ${error.message}`);
  }
});

// Test dependencies
console.log('\n📦 Dependency Checks:\n');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
  
  if (missingDeps.length === 0) {
    console.log('✅ Required Dependencies: All auth dependencies installed');
    passedChecks++;
  } else {
    console.log(`❌ Required Dependencies: Missing ${missingDeps.join(', ')}`);
    console.log('   Run: npm install expo-auth-session expo-web-browser expo-linking');
  }
} catch (error) {
  console.log(`❌ Required Dependencies: Error reading package.json - ${error.message}`);
}

// Summary
console.log('\n📊 Summary:\n');
console.log(`Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('🎉 All auth fixes are properly implemented!');
  console.log('\n🚀 Next steps:');
  console.log('1. Set up Google OAuth credentials in .env file');
  console.log('2. Configure Google Cloud Console OAuth credentials');
  console.log('3. Test with: expo start and navigate to /auth/test-improved-auth');
  console.log('4. Gradually migrate to improved auth context in production');
} else {
  console.log('⚠️  Some fixes are missing. Please review the failed checks above.');
  console.log('\n🔧 To fix:');
  console.log('1. Ensure all files have been created/updated as specified');
  console.log('2. Install missing dependencies if any');
  console.log('3. Re-run this verification script');
}

console.log('\n📖 For detailed setup instructions, see: FIXED_AUTH_GUIDE.md');

// Additional environment check
console.log('\n🔧 Environment Setup Reminder:');
console.log('Make sure to set these environment variables:');
console.log('- EXPO_PUBLIC_GOOGLE_CLIENT_ID');
console.log('- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (for iOS)');
console.log('- EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (for Android)');
console.log('- EXPO_PUBLIC_SUPABASE_URL');
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY'); 