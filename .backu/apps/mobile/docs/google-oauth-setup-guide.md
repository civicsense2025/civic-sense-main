# Google OAuth Setup Guide for CivicSense Mobile

## 📋 Prerequisites

Before starting, ensure you have:
- A Google Cloud Console account
- Access to the CivicSense project repository
- Admin access to create OAuth credentials
- The CivicSense bundle identifier: `com.civicsense.app`

## 🚀 Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project details:
   - **Project name**: `CivicSense Mobile`
   - **Organization**: Select your organization (if applicable)
   - **Location**: Choose appropriate folder
4. Click "Create" and wait for project creation

### Step 2: Enable Required APIs

1. In your project dashboard, go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Google Calendar API**
   - **Google Identity Toolkit API**
   - **Google People API**
3. Click "Enable" for each API

### Step 3: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" → "OAuth consent screen"
2. Select **User Type**:
   - Choose "External" for public app
   - Choose "Internal" for organization-only app
3. Click "Create"

4. **OAuth consent screen configuration**:
   ```
   App information:
   - App name: CivicSense
   - User support email: support@civicsense.com
   - App logo: Upload CivicSense logo (optional)
   
   App domain:
   - Application home page: https://civicsense.com
   - Privacy policy: https://civicsense.com/privacy
   - Terms of service: https://civicsense.com/terms
   
   Developer contact:
   - Email: dev@civicsense.com
   ```

5. **Scopes configuration**:
   - Click "Add or Remove Scopes"
   - Add these scopes:
     ```
     openid
     profile
     email
     https://www.googleapis.com/auth/calendar
     https://www.googleapis.com/auth/calendar.events
     ```
   - Click "Update"

6. **Test users** (if using External type):
   - Add test email addresses
   - Click "Save and Continue"

### Step 4: Create OAuth 2.0 Client IDs

#### Web Client ID (Required for all platforms)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure:
   ```
   Application type: Web application
   Name: CivicSense Web Client
   
   Authorized JavaScript origins:
   - https://auth.expo.io
   - https://localhost:19006
   - https://localhost:8081
   
   Authorized redirect URIs:
   - https://auth.expo.io/@your-expo-username/civicsense
   - https://localhost:19006
   - com.civicsense.app://
   - exp://localhost:19000
   ```
4. Click "Create"
5. Copy the **Client ID** as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

#### iOS Client ID

1. Click "Create Credentials" → "OAuth client ID"
2. Configure:
   ```
   Application type: iOS
   Name: CivicSense iOS
   Bundle ID: com.civicsense.app
   ```
3. Click "Create"
4. Copy the **Client ID** as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

#### Android Client ID

1. First, generate your SHA-1 certificate fingerprints:

   **For Development (Debug Certificate):**
   ```bash
   # macOS/Linux
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Windows
   keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   ```

   **For Production (EAS Build):**
   ```bash
   # Using EAS CLI
   eas credentials
   # Select: Android → Production → Keystore → View
   ```

2. Click "Create Credentials" → "OAuth client ID"
3. Configure:
   ```
   Application type: Android
   Name: CivicSense Android
   Package name: com.civicsense.app
   SHA-1 certificate fingerprint: [Your SHA-1 from step 1]
   ```
4. Click "Create"
5. Copy the **Client ID** as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### Step 5: Configure Environment Variables

1. Create `.env` file in project root:
   ```env
   # Google OAuth Configuration
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
   
   # Optional: For server-side operations
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

2. Add `.env` to `.gitignore`:
   ```gitignore
   # Environment variables
   .env
   .env.local
   .env.*.local
   ```

### Step 6: Update app.json/app.config.ts

Ensure your app configuration includes proper URL schemes:

```typescript
// app.config.ts
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  scheme: 'com.civicsense.app',
  ios: {
    bundleIdentifier: 'com.civicsense.app',
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [
            'com.googleusercontent.apps.YOUR_IOS_CLIENT_ID', // Replace with actual iOS client ID
          ],
        },
      ],
    },
  },
  android: {
    package: 'com.civicsense.app',
  },
});
```

### Step 7: Configure Redirect URIs

For production builds, add these redirect URIs in Google Cloud Console:

1. **Standalone app redirects**:
   ```
   com.civicsense.app://oauth/google
   com.googleusercontent.apps.YOUR_IOS_CLIENT_ID://oauth/google
   ```

2. **Expo Go redirects** (development):
   ```
   exp://localhost:19000
   exp://YOUR_IP_ADDRESS:19000
   ```

### Step 8: Test the Configuration

1. **Run in development**:
   ```bash
   npx expo start
   ```

2. **Test authentication flow**:
   - Open app in Expo Go
   - Navigate to Profile screen
   - Toggle Google Calendar Sync
   - Complete OAuth flow
   - Verify calendar access granted

### Step 9: Production Build Configuration

For EAS Build, ensure credentials are properly configured:

1. **Configure EAS secrets**:
   ```bash
   eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value your_web_client_id
   eas secret:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value your_ios_client_id
   eas secret:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value your_android_client_id
   ```

2. **Update eas.json**:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "@EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
           "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "@EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
           "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "@EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID"
         }
       }
     }
   }
   ```

## 🔒 Security Best Practices

### Client ID Security
- ✅ Client IDs can be safely exposed in client-side code
- ❌ Never expose Client Secret in mobile apps
- ✅ Use server-side proxy for sensitive operations

### Token Storage
- ✅ Use Expo SecureStore for token storage
- ✅ Enable device authentication for token access
- ✅ Implement token refresh logic
- ❌ Never store tokens in plain text

### Scope Management
- ✅ Request minimal necessary scopes
- ✅ Explain why each scope is needed
- ❌ Don't request unnecessary permissions

## 🧪 Testing Different Scenarios

### Test Matrix

| Scenario | iOS | Android | Web |
|----------|-----|---------|-----|
| Fresh install | ✓ | ✓ | ✓ |
| Existing user | ✓ | ✓ | ✓ |
| Token expired | ✓ | ✓ | ✓ |
| Network offline | ✓ | ✓ | ✓ |
| Permission denied | ✓ | ✓ | ✓ |
| App backgrounded | ✓ | ✓ | N/A |

### Debug Commands

```bash
# View Android SHA-1 for debugging
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android

# Test deep links on iOS simulator
xcrun simctl openurl booted com.civicsense.app://oauth/google

# Test deep links on Android emulator
adb shell am start -W -a android.intent.action.VIEW -d "com.civicsense.app://oauth/google"
```

## 🚨 Common Issues & Solutions

### Issue: "Invalid client" error
**Solution**: Verify bundle ID/package name matches exactly in Google Console

### Issue: Redirect URI mismatch
**Solution**: Add all possible redirect URIs including variants with and without trailing slashes

### Issue: Consent screen not showing
**Solution**: Ensure OAuth consent screen is properly configured and published (if using External type)

### Issue: iOS authentication fails
**Solution**: Add Google Sign-In URL scheme to Info.plist:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

## 📊 Monitoring & Analytics

### Track OAuth Success Rate
```typescript
// In GoogleCalendarService
private async trackAuthEvent(event: 'started' | 'completed' | 'failed', metadata?: any) {
  analytics.track(`google_oauth_${event}`, {
    platform: Platform.OS,
    ...metadata,
  });
}
```

### Monitor API Usage
- Check Google Cloud Console → APIs & Services → Metrics
- Set up alerts for quota usage
- Monitor error rates

## 🔄 Maintenance Checklist

### Monthly
- [ ] Review API usage and quotas
- [ ] Check for deprecated API versions
- [ ] Update OAuth consent screen if needed
- [ ] Review and rotate credentials if necessary

### Quarterly
- [ ] Audit authorized domains and redirect URIs
- [ ] Review scope usage
- [ ] Update privacy policy if scopes changed
- [ ] Test full OAuth flow on all platforms

### Annually
- [ ] Renew/verify developer accounts
- [ ] Update certificates and provisioning profiles
- [ ] Review and update security practices
- [ ] Audit third-party dependencies

---

## 📞 Support Resources

### Google OAuth Documentation
- [OAuth 2.0 for Mobile Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios/start)
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android/start)

### Expo Documentation
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo Google Authentication](https://docs.expo.dev/guides/google-authentication/)

### Troubleshooting
- Google OAuth Playground: https://developers.google.com/oauthplayground/
- JWT Decoder: https://jwt.io/
- Google API Explorer: https://developers.google.com/apis-explorer

---

*Last updated: January 2024* 