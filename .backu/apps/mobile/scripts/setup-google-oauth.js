#!/usr/bin/env node

/**
 * Google OAuth Setup Script for CivicSense
 * 
 * This script automates the configuration of Google OAuth for the mobile app
 * Run with: node scripts/setup-google-oauth.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  envPath: path.join(process.cwd(), '.env'),
  exampleEnvPath: path.join(process.cwd(), '.env.example'),
  appConfigPath: path.join(process.cwd(), 'app.config.ts'),
  easJsonPath: path.join(process.cwd(), 'eas.json'),
  bundleId: 'com.civicsense.app',
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  header: (msg) => console.log(`\n${COLORS.bright}${msg}${COLORS.reset}\n`),
};

// ============================================================================
// SETUP FUNCTIONS
// ============================================================================

/**
 * Check prerequisites
 */
async function checkPrerequisites() {
  log.header('Checking Prerequisites');

  // Check if running in a React Native project
  if (!fs.existsSync('package.json')) {
    log.error('package.json not found. Are you in the project root?');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.dependencies['expo']) {
    log.error('This doesn\'t appear to be an Expo project');
    process.exit(1);
  }

  log.success('Running in Expo project');

  // Check for required tools
  try {
    execSync('which keytool', { stdio: 'ignore' });
    log.success('keytool found (for Android SHA-1)');
  } catch {
    log.warning('keytool not found. You\'ll need it to generate Android SHA-1');
    log.info('Install Java Development Kit (JDK) to get keytool');
  }

  // Check for EAS CLI
  try {
    execSync('which eas', { stdio: 'ignore' });
    log.success('EAS CLI found');
  } catch {
    log.warning('EAS CLI not found. Install with: npm install -g eas-cli');
  }
}

/**
 * Create .env file
 */
async function createEnvFile() {
  log.header('Setting up Environment Variables');

  // Check if .env exists
  if (fs.existsSync(CONFIG.envPath)) {
    const overwrite = await question(
      `${COLORS.yellow}.env file already exists. Overwrite? (y/N): ${COLORS.reset}`
    );
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Keeping existing .env file');
      return;
    }
  }

  // Create .env.example if it doesn't exist
  if (!fs.existsSync(CONFIG.exampleEnvPath)) {
    const envExample = `# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here

# Optional: For server-side operations
GOOGLE_CLIENT_SECRET=your_client_secret_here
`;
    fs.writeFileSync(CONFIG.exampleEnvPath, envExample);
    log.success('Created .env.example');
  }

  // Copy .env.example to .env
  fs.copyFileSync(CONFIG.exampleEnvPath, CONFIG.envPath);
  log.success('Created .env from .env.example');
  log.info('You\'ll need to fill in the actual values later');
}

/**
 * Generate Android SHA-1
 */
async function generateAndroidSHA1() {
  log.header('Generating Android SHA-1 Certificate Fingerprint');

  const debugKeystorePath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    '.android',
    'debug.keystore'
  );

  if (!fs.existsSync(debugKeystorePath)) {
    log.warning('Debug keystore not found. Creating one...');
    try {
      execSync(
        `keytool -genkey -v -keystore ${debugKeystorePath} -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"`,
        { stdio: 'inherit' }
      );
    } catch (error) {
      log.error('Failed to create debug keystore');
      return null;
    }
  }

  try {
    const output = execSync(
      `keytool -list -v -keystore ${debugKeystorePath} -alias androiddebugkey -storepass android -keypass android`,
      { encoding: 'utf8' }
    );

    const sha1Match = output.match(/SHA1:\s+([A-F0-9:]+)/);
    if (sha1Match) {
      const sha1 = sha1Match[1];
      log.success(`Debug SHA-1: ${COLORS.bright}${sha1}${COLORS.reset}`);
      return sha1;
    }
  } catch (error) {
    log.error('Failed to extract SHA-1 from keystore');
  }

  return null;
}

/**
 * Update app.config.ts with URL schemes
 */
async function updateAppConfig() {
  log.header('Updating app.config.ts');

  const webClientId = await question(
    'Enter your Web Client ID (or press Enter to skip): '
  );

  if (!webClientId) {
    log.info('Skipping app.config.ts update');
    return;
  }

  const iosClientId = await question(
    'Enter your iOS Client ID (or press Enter to skip): '
  );

  if (!fs.existsSync(CONFIG.appConfigPath)) {
    log.error('app.config.ts not found');
    return;
  }

  let appConfig = fs.readFileSync(CONFIG.appConfigPath, 'utf8');

  // Add iOS URL scheme if provided
  if (iosClientId) {
    const urlScheme = `com.googleusercontent.apps.${iosClientId.split('.').pop()}`;
    
    // Check if infoPlist exists
    if (appConfig.includes('infoPlist:')) {
      // Add to existing infoPlist
      const infoPlistRegex = /infoPlist:\s*{([^}]+)}/;
      const match = appConfig.match(infoPlistRegex);
      
      if (match && !appConfig.includes('CFBundleURLTypes')) {
        const newInfoPlist = match[0].replace(
          '}',
          `,
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ['${urlScheme}'],
        },
      ],
    }`
        );
        appConfig = appConfig.replace(infoPlistRegex, newInfoPlist);
        log.success('Added iOS URL scheme to app.config.ts');
      }
    }
  }

  fs.writeFileSync(CONFIG.appConfigPath, appConfig);
}

/**
 * Setup EAS secrets
 */
async function setupEASSecrets() {
  log.header('Setting up EAS Secrets');

  try {
    execSync('eas whoami', { stdio: 'ignore' });
  } catch {
    log.warning('Not logged in to EAS. Please run: eas login');
    return;
  }

  const setupSecrets = await question(
    'Do you want to set up EAS secrets now? (y/N): '
  );

  if (setupSecrets.toLowerCase() !== 'y') {
    log.info('Skipping EAS secrets setup');
    return;
  }

  // Read client IDs from user
  const webClientId = await question('Web Client ID: ');
  const iosClientId = await question('iOS Client ID: ');
  const androidClientId = await question('Android Client ID: ');

  // Set secrets
  const secrets = [
    { name: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', value: webClientId },
    { name: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', value: iosClientId },
    { name: 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', value: androidClientId },
  ];

  for (const secret of secrets) {
    if (secret.value) {
      try {
        execSync(
          `eas secret:create --name ${secret.name} --value "${secret.value}" --force`,
          { stdio: 'inherit' }
        );
        log.success(`Set secret: ${secret.name}`);
      } catch (error) {
        log.error(`Failed to set secret: ${secret.name}`);
      }
    }
  }
}

/**
 * Generate setup instructions
 */
async function generateInstructions(sha1) {
  log.header('Setup Instructions');

  const instructions = `
${COLORS.bright}Next Steps:${COLORS.reset}

1. ${COLORS.bright}Create a Google Cloud Project${COLORS.reset}
   - Go to: https://console.cloud.google.com/
   - Create a new project named "CivicSense Mobile"

2. ${COLORS.bright}Enable Required APIs${COLORS.reset}
   - Google Calendar API
   - Google Identity Toolkit API
   - Google People API

3. ${COLORS.bright}Configure OAuth Consent Screen${COLORS.reset}
   - Choose "External" for public app
   - Add required scopes:
     • openid
     • profile
     • email
     • https://www.googleapis.com/auth/calendar
     • https://www.googleapis.com/auth/calendar.events

4. ${COLORS.bright}Create OAuth 2.0 Client IDs${COLORS.reset}

   ${COLORS.yellow}Web Client:${COLORS.reset}
   - Application type: Web application
   - Authorized JavaScript origins:
     • https://auth.expo.io
     • https://localhost:19006
   - Authorized redirect URIs:
     • https://auth.expo.io/@your-expo-username/civicsense
     • ${CONFIG.bundleId}://

   ${COLORS.yellow}iOS Client:${COLORS.reset}
   - Application type: iOS
   - Bundle ID: ${CONFIG.bundleId}

   ${COLORS.yellow}Android Client:${COLORS.reset}
   - Application type: Android
   - Package name: ${CONFIG.bundleId}
   - SHA-1 certificate: ${sha1 || '[Run this script again to generate]'}

5. ${COLORS.bright}Update .env file${COLORS.reset}
   Add your client IDs to the .env file

6. ${COLORS.bright}Test the integration${COLORS.reset}
   - Run: npx expo start
   - Navigate to Profile screen
   - Test Google Calendar sync

${COLORS.dim}For detailed instructions, see: docs/google-oauth-setup-guide.md${COLORS.reset}
`;

  console.log(instructions);

  // Save instructions to file
  const saveInstructions = await question(
    '\nSave these instructions to a file? (y/N): '
  );

  if (saveInstructions.toLowerCase() === 'y') {
    const filename = 'google-oauth-setup-instructions.txt';
    fs.writeFileSync(filename, instructions.replace(/\x1b\[[0-9;]*m/g, ''));
    log.success(`Instructions saved to ${filename}`);
  }
}

/**
 * Main setup flow
 */
async function main() {
  console.clear();
  log.header('🔐 CivicSense Google OAuth Setup');

  try {
    await checkPrerequisites();
    await createEnvFile();
    const sha1 = await generateAndroidSHA1();
    await updateAppConfig();
    await setupEASSecrets();
    await generateInstructions(sha1);

    log.header('✨ Setup Complete!');
    log.info('Follow the instructions above to complete Google OAuth configuration');
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// ============================================================================
// RUN SETUP
// ============================================================================

if (require.main === module) {
  main();
}

module.exports = { main }; 