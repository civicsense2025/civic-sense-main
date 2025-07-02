# Google OAuth Setup for CivicSense Mobile Calendar Sync

## Issue
The calendar sync feature is showing an "invalid_request" error with the redirect URI `exp://192.168.1.151:8081`. This happens because the Google Cloud Console OAuth configuration doesn't include the development and production redirect URIs needed for Expo apps.

## Step-by-Step Fix

### 1. Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your CivicSense project (or create one if needed)
3. Navigate to **APIs & Services** > **Credentials**

### 2. Configure OAuth 2.0 Client ID
1. Find your existing OAuth 2.0 Client ID or create a new one
2. Click **Edit** on your OAuth client
3. Under **Authorized redirect URIs**, add these URIs:

#### For Development (Expo Go):
```
exp://192.168.1.151:8081
exp://localhost:8081
exp://127.0.0.1:8081
```

#### For Development (Local Network):
Replace `192.168.1.151` with your actual local IP:
```
exp://[YOUR_LOCAL_IP]:8081
```

#### For Production (Expo standalone app):
```
com.civicsense.mobile://auth/google
```

#### For Web (if supporting web platform):
```
https://localhost:3000/auth/google/callback
https://civicsense.com/auth/google/callback
```

### 3. Update Environment Variables

Create or update your `.env` file:

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here.apps.googleusercontent.com

# For calendar scopes
EXPO_PUBLIC_GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events
```

### 4. Update app.config.ts

Ensure your `app.config.ts` includes the Google scheme:

```typescript
export default {
  expo: {
    name: "CivicSense",
    scheme: "com.civicsense.mobile",
    ios: {
      bundleIdentifier: "com.civicsense.mobile",
      associatedDomains: ["applinks:civicsense.com"],
      // Add Google URL scheme
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLName: "google",
            CFBundleURLSchemes: [process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.split('.')[0] || "com.civicsense.mobile"]
          }
        ]
      }
    },
    android: {
      package: "com.civicsense.mobile",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "civicsense.com"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    plugins: [
      [
        "expo-auth-session",
        {
          schemes: ["com.civicsense.mobile"]
        }
      ]
    ]
  }
};
```

### 5. Enable Required APIs

In Google Cloud Console, enable these APIs:
1. **Google Calendar API**
2. **Google+ API** (for profile info)
3. **People API** (for user info)

### 6. Test Configuration

To verify your setup works:

1. **Check your current IP:**
   ```bash
   ipconfig getifaddr en0  # macOS
   ip route get 1 | grep -oP 'src \K\S+'  # Linux
   ipconfig  # Windows (look for IPv4 Address)
   ```

2. **Update redirect URI in Google Console** with your actual IP

3. **Restart Expo development server:**
   ```bash
   npx expo start --clear
   ```

4. **Test the calendar sync** in the profile screen

### 7. Production Deployment

For production apps:

1. **Update redirect URIs** in Google Console to use your app's custom scheme:
   ```
   com.civicsense.mobile://auth/google
   ```

2. **Ensure app.config.ts** has the correct bundle identifier and package name

3. **Build and test** the standalone app

## Troubleshooting

### Common Issues:

1. **"invalid_request" error:**
   - Verify the redirect URI exactly matches what's in Google Console
   - Check that you're using the correct IP address
   - Ensure the OAuth client ID is correct

2. **"redirect_uri_mismatch":**
   - The redirect URI in your app doesn't match Google Console
   - Add all possible development URIs to Google Console

3. **"Access blocked":**
   - Your app might need to go through Google's verification process
   - For development, add test users in Google Console

4. **Calendar events not syncing:**
   - Verify Calendar API is enabled
   - Check that your app requests the correct calendar scopes

### Debug Mode:

Add debug logging to see the exact redirect URI being used:

```typescript
// In your calendar service
console.log('Using redirect URI:', AuthSession.makeRedirectUri({
  useProxy: false,
  preferLocalhost: true,
}));
```

## Security Notes

1. **Never commit** OAuth client secrets to version control
2. **Use environment variables** for sensitive configuration
3. **Restrict API keys** to your app's bundle identifier/package name
4. **Regularly rotate** OAuth credentials
5. **Monitor usage** in Google Cloud Console

## Testing Checklist

- [ ] Google Cloud Console OAuth client configured
- [ ] All redirect URIs added (development + production)
- [ ] Required APIs enabled (Calendar, People)
- [ ] Environment variables set correctly
- [ ] App config includes Google URL schemes
- [ ] Test calendar sync works in development
- [ ] Verify production build works with custom scheme

## Need Help?

If you're still having issues:

1. Check the exact error message in the Expo development tools
2. Verify your Google Cloud Console project has billing enabled
3. Ensure you're using the correct OAuth client ID for your platform
4. Test with a simple OAuth flow first before adding calendar functionality

---

*This guide covers the setup for Expo development with Google OAuth. For bare React Native apps, additional native configuration may be required.* 