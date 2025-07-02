# OneSignal Configuration Forms - Step by Step

## 🍎 iOS APNs Configuration Form

### What You'll See in OneSignal:
```
APNs Authentication Type: [Dropdown]
Key (.p8 file): [Upload Button]
Key ID: [Text Field]
Team ID: [Text Field] 
App Bundle ID: [Text Field]
```

### What to Fill Out:

1. **APNs Authentication Type**: 
   - Select: `p8 Auth Key (Recommended)`

2. **Key (.p8 file)**: 
   - Click "Upload" 
   - Select your downloaded `.p8` file from Apple Developer Console
   - File name looks like: `AuthKey_ABC1234567.p8`

3. **Key ID**: 
   - Enter your 10-character Key ID from Apple Developer Console
   - Example: `ABC1234567`
   - Found when you created the .p8 key

4. **Team ID**: 
   - Enter your 10-character Team ID from Apple Developer Console
   - Example: `XYZ9876543`
   - Found in Apple Developer Console → Membership

5. **App Bundle ID**: 
   - Enter: `com.civicsense.app`
   - Must match exactly what's in your `app.config.ts`

### Example Filled Form:
```
APNs Authentication Type: p8 Auth Key (Recommended) ✓
Key (.p8 file): AuthKey_ABC1234567.p8 ✓
Key ID: ABC1234567
Team ID: XYZ9876543
App Bundle ID: com.civicsense.app
```

## 🌐 Web Configuration Form

### Option 1: Typical Site (Recommended for CivicSense)

#### What You'll See in OneSignal:
```
1. Choose Integration: [Three boxes showing integration types]
2. Site Setup: [Form fields]
3. Advanced Push Settings (Optional): [Additional options]
```

#### What to Fill Out:

1. **Choose Integration**: 
   - Click **"Typical Site"** (first option)
   - This is for standard websites like CivicSense

2. **Site Name**: 
   - Enter: `CivicSense`
   - This appears as the default notification title

3. **Site URL**: 
   - Enter: `https://civicsense.com`
   - Or your actual domain if different
   - Don't include trailing slash

4. **Auto Resubscribe**: 
   - Leave **ON** (recommended)
   - Helps maintain subscribers

5. **Default Icon URL**: 
   - Upload your CivicSense logo/icon
   - Recommended size: 256x256 pixels
   - Will appear in notifications

### Example Filled Form:
```
Site Name: CivicSense
Site URL: https://civicsense.com
Auto Resubscribe: ✓ ON
Default Icon URL: [Upload CivicSense icon]
```

### Option 2: Custom Code (For Advanced Setup)

If you chose "Custom Code" (third option):

1. **Site Name**: `CivicSense`
2. **Site URL**: `https://civicsense.com` 
3. **Choose SDK**: `OneSignal Web SDK`
4. **Choose Integration**: `Custom Code`

## 🔧 Environment Variables Setup

After OneSignal configuration, update your environment files:

### For Mobile App (`apps/mobile/.env`):
```bash
# OneSignal Configuration
EXPO_PUBLIC_ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key_here

# Apple Developer Configuration
APPLE_DEVELOPER_TEAM_ID=XYZ9876543
```

### For Web App (main `.env.local`):
```bash
# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
ONESIGNAL_USER_AUTH_KEY=your_user_auth_key_here
```

## 🎯 Where to Find OneSignal Keys

After completing the forms above, OneSignal will generate these keys:

### In OneSignal Dashboard → Settings → Keys & IDs:

1. **App ID**: 
   - Found under "App ID" 
   - Looks like: `12345678-1234-1234-1234-123456789012`
   - Use for `EXPO_PUBLIC_ONESIGNAL_APP_ID`

2. **REST API Key**: 
   - Found under "REST API Key"
   - Looks like: `ZmFiOWVmYzMtNzUyNy00YjI1LTlhNWMtMjdkZjBjMjE1ODY5`
   - Use for `ONESIGNAL_REST_API_KEY`

3. **User Auth Key** (Optional):
   - Found under "User Auth Key"
   - Only needed for advanced features
   - Use for `ONESIGNAL_USER_AUTH_KEY`

## 📱 Integration Code for Your App

### For Mobile (React Native/Expo):

```typescript
// In your main App.tsx or _layout.tsx
import { useOneSignal } from './hooks/useOneSignal';

export default function App() {
  const { 
    isInitialized, 
    userId, 
    requestPermission, 
    updateTags 
  } = useOneSignal();

  useEffect(() => {
    if (isInitialized) {
      // OneSignal is ready!
      console.log('OneSignal User ID:', userId);
    }
  }, [isInitialized, userId]);

  return (
    // Your app content
  );
}
```

### For Web (Next.js):

```typescript
// In your main layout or _app.tsx
import { useEffect } from 'react';

export default function Layout({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-onesignal').then((OneSignal) => {
        OneSignal.default.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          safari_web_id: 'web.onesignal.auto.your-web-id',
          notifyButton: {
            enable: true,
          },
        });
      });
    }
  }, []);

  return <>{children}</>;
}
```

## ✅ Verification Checklist

After filling out all forms:

### iOS Configuration:
- [ ] All OneSignal iOS fields show green checkmarks
- [ ] Bundle ID matches `app.config.ts`: `com.civicsense.app`
- [ ] Apple Developer certificates are active
- [ ] Environment variables are set correctly

### Web Configuration:
- [ ] Site URL is correct: `https://civicsense.com`
- [ ] Default icon uploaded successfully
- [ ] Web SDK is properly integrated
- [ ] Browser permission prompts work

### Testing:
- [ ] Send test notification from OneSignal dashboard
- [ ] Test on real iOS device (simulators don't support push)
- [ ] Test web notifications in different browsers
- [ ] Verify user registration in OneSignal audience

## 🚨 Common Errors and Solutions

### iOS Setup Errors:
- **"Invalid Bundle ID"**: Must match exactly across OneSignal, Apple Developer, and `app.config.ts`
- **"Certificate Error"**: Re-download .p8 file, ensure Key ID and Team ID are correct
- **"Permission Denied"**: Test on real device, check notification permissions

### Web Setup Errors:
- **"Domain Mismatch"**: Ensure Site URL matches your actual domain
- **"Icon Not Loading"**: Use HTTPS URLs for icons, check file size (recommended 256x256)
- **"SDK Not Loading"**: Check console for errors, ensure OneSignal script is loaded

---

**Next Step**: Install dependencies and test the integration! 