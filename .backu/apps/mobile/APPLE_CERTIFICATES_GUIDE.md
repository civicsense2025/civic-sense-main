# Apple Developer Certificates Setup for OneSignal

## 📋 Prerequisites
- Apple Developer Account ($99/year)
- Access to Apple Developer Console
- Xcode installed on Mac (for certificate management)

## 🔑 Option 1: .p8 Auth Key (Recommended)

### Step 1: Create APNs Auth Key
1. Go to [Apple Developer Console](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Keys** in the sidebar
4. Click the **+** button to create a new key
5. Enter a **Key Name**: `CivicSense Push Notifications`
6. Check **Apple Push Notifications service (APNs)**
7. Click **Continue** → **Register**
8. **Download the .p8 file** (you can only download this once!)
9. Note the **Key ID** (10-character string)

### Step 2: Get Your Team ID
1. In Apple Developer Console, go to **Membership**
2. Copy your **Team ID** (10-character string)

### Step 3: Create App Identifier
1. Go to **Identifiers** in Apple Developer Console
2. Click **+** to create new identifier
3. Select **App IDs** → **App**
4. **Description**: `CivicSense iOS App`
5. **Bundle ID**: `com.civicsense.app` (explicit bundle ID)
6. Under **Capabilities**, check:
   - **Push Notifications**
   - **Associated Domains** (for deep linking)
7. Click **Continue** → **Register**

### Step 4: OneSignal Configuration Values

Copy these values to OneSignal:

```
APNs Authentication Type: p8 Auth Key (Recommended)
Key (.p8 file): [Upload your downloaded .p8 file]
Key ID: [Your 10-character Key ID]
Team ID: [Your 10-character Team ID]  
App Bundle ID: com.civicsense.app
```

## 🔐 Option 2: .p12 Certificate (Alternative)

### Step 1: Create Certificate Signing Request (CSR)
1. Open **Keychain Access** on Mac
2. Go to **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
3. **User Email**: Your Apple ID email
4. **Common Name**: `CivicSense Push Certificate`
5. **CA Email**: Leave empty
6. Select **Saved to disk** → **Continue**
7. Save the CSR file

### Step 2: Create APNs Certificate
1. In Apple Developer Console, go to **Certificates**
2. Click **+** to create new certificate
3. Under **Services**, select **Apple Push Notification service SSL (Sandbox & Production)**
4. Select your App ID: `com.civicsense.app`
5. Upload your CSR file
6. Download the certificate (.cer file)

### Step 3: Export .p12 File
1. Double-click the .cer file to add to Keychain
2. In Keychain Access, find your certificate
3. Right-click → **Export**
4. Save as .p12 file with password
5. Remember the password!

### Step 4: OneSignal Configuration Values

```
APNs Authentication Type: iOS Push Certificate
Certificate (.p12 file): [Upload your .p12 file]
Certificate Password: [Your .p12 password]
App Bundle ID: com.civicsense.app
```

## 🎯 Recommended Configuration for CivicSense

Use **Option 1 (.p8 Auth Key)** because:
- ✅ Never expires (unlike .p12 certificates)
- ✅ Works for all your apps
- ✅ Easier to manage
- ✅ More secure

## 📱 App Bundle ID Configuration

Make sure your `app.config.ts` matches:

```typescript
// apps/mobile/app.config.ts
export default {
  // ... other config
  ios: {
    bundleIdentifier: 'com.civicsense.app',
    // ... other iOS config
  }
}
```

## 🔍 Verification Steps

After setting up certificates:

1. **OneSignal Dashboard**: All fields should show green checkmarks
2. **Test Push**: Send a test notification from OneSignal
3. **Real Device**: Test on actual iOS device (simulators don't support push)
4. **Certificate Status**: Check expiration dates in Apple Developer Console

## 🚨 Common Issues

### "Invalid Certificate"
- Ensure Bundle ID matches exactly: `com.civicsense.app`
- Verify certificate is for the correct App ID
- Check certificate isn't expired

### "Key ID Invalid"
- Key ID should be exactly 10 characters
- Copy from Apple Developer Console, not the filename

### "Team ID Invalid"  
- Team ID should be exactly 10 characters
- Found in Apple Developer Console → Membership

### "Bundle ID Mismatch"
- OneSignal Bundle ID must match `app.config.ts`
- Must match Apple Developer App ID
- No wildcards allowed for push notifications

## 📋 Final Checklist

- [ ] Apple Developer Account active
- [ ] App ID created with Push Notifications enabled
- [ ] .p8 Auth Key generated and downloaded
- [ ] Key ID and Team ID copied
- [ ] Bundle ID matches across all platforms
- [ ] OneSignal configuration saved successfully
- [ ] Test notification sent and received

---

**Next**: Configure your app's environment variables and test on a real iOS device! 