# Setting up Google OAuth for CivicSense Mobile

This guide will walk you through the process of setting up Google OAuth for the CivicSense mobile app.

## Required Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id

# EAS Build Configuration
EXPO_PUBLIC_EAS_PROJECT_ID=your_eas_project_id
```

## Step-by-Step Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for later use

### 2. Enable Required APIs

1. Navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Google Identity Toolkit API
   - Google People API

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you're using Google Workspace)
3. Fill in the required information:
   - App name: "CivicSense"
   - User support email: Your email
   - Developer contact information: Your email
4. Add the following scopes:
   - `openid`
   - `profile`
   - `email`
5. Add test users if needed
6. Complete the registration

### 4. Create OAuth 2.0 Client IDs

#### Web Application Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Name: "CivicSense Web"
5. Add authorized JavaScript origins:
   - `https://auth.expo.io`
   - `https://localhost:19006` (for local development)
6. Add authorized redirect URIs:
   - `https://auth.expo.io/@your-username/civicsense`
   - `https://localhost:19006`
7. Copy the Client ID as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

#### Android Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Android"
4. Name: "CivicSense Android"
5. Package name: `com.civicsense.one`
6. Generate SHA-1 certificate fingerprint:
   ```bash
   # For debug certificate
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For EAS build
   eas credentials
   ```
7. Add the SHA-1 fingerprint
8. Copy the Client ID as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

#### iOS Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "iOS"
4. Name: "CivicSense iOS"
5. Bundle ID: `com.civicsense.one`
6. Copy the Client ID as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

### 5. Configure Supabase Auth

1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Web Client ID and Secret from Google Cloud Console
5. Set the authorized redirect URL to your app's URL

### 6. Update App Configuration

Make sure your `app.config.ts` has the correct scheme set:

```typescript
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // ...other configs
  scheme: 'com.civicsense.one',
  // ...rest of the config
});
```

## Testing

After setting up, you should be able to sign in with Google on both iOS and Android devices.

### Troubleshooting

- **Web Redirect Issues**: Ensure your redirect URIs are correctly set up in Google Cloud Console
- **Android Signing Issues**: Double-check your SHA-1 fingerprint
- **iOS Problems**: Verify your Bundle ID matches exactly
- **General Errors**: Check the console logs for specific error messages 