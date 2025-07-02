# OneSignal iOS Setup Guide for CivicSense

This guide walks you through setting up OneSignal push notifications for the CivicSense iOS app.

## Prerequisites

1. **Apple Developer Account** - Required for iOS push notifications
2. **OneSignal Account** - Sign up at [onesignal.com](https://onesignal.com)
3. **iOS Device or Simulator** - For testing (push notifications require real device)

## Step 1: OneSignal Dashboard Setup

### 1.1 Create OneSignal App

1. Log into your OneSignal dashboard
2. Click **"New App/Website"**
3. Enter app name: **"CivicSense"**
4. Select **Apple iOS (APNs)** platform
5. Click **"Next: Configure Your Platform"**

### 1.2 iOS APNs Configuration

You'll need to configure Apple Push Notification service (APNs). You have two options:

#### Option A: .p8 Auth Key (Recommended)

1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/authkeys/list)
2. Click **"+"** to create a new key
3. Enter **Key Name**: "CivicSense Push Notifications"
4. Check **"Apple Push Notifications service (APNs)"**
5. Click **"Continue"** → **"Register"**
6. **Download the .p8 file** (you can only download once!)
7. Note your **Key ID** and **Team ID**

In OneSignal:
1. Select **".p8 Auth Key (Recommended)"**
2. Upload your `.p8` file
3. Enter your **Key ID**
4. Enter your **Team ID**
5. Select **"iOS App Development"** for development or **"iOS App Store"** for production

#### Option B: .p12 Certificate (Alternative)

If you prefer certificates:
1. Generate CSR in Keychain Access
2. Create push certificate in Apple Developer Console
3. Download and install certificate
4. Export as .p12 file
5. Upload to OneSignal

### 1.3 Complete OneSignal Setup

1. Enter **App Bundle ID**: `com.civicsense.app`
2. Click **"Save & Continue"**
3. Copy your **OneSignal App ID** (you'll need this for environment variables)

## Step 2: Environment Variables

Create a `.env` file in `apps/mobile/` with these variables:

```bash
# OneSignal Configuration
EXPO_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id_here
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key_here
ONESIGNAL_USER_AUTH_KEY=your_onesignal_user_auth_key_here

# Apple Developer Team ID
APPLE_DEVELOPER_TEAM_ID=your_apple_team_id_here

# Supabase (if not already configured)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Finding Your OneSignal Keys

1. **App ID**: Available on your OneSignal app dashboard
2. **REST API Key**: Settings → "Keys & IDs" → "REST API Key"
3. **User Auth Key**: Settings → "Keys & IDs" → "User Auth Key"

## Step 3: Install Dependencies

```bash
cd apps/mobile
npm install
```

This will install the OneSignal dependencies added to package.json:
- `react-native-onesignal`
- `onesignal-expo-plugin`
- `expo-notifications`

## Step 4: Build and Test

### 4.1 Development Build

```bash
# Create development build with OneSignal plugin
npx expo install --fix
npx expo prebuild --clean

# For iOS development build
eas build --profile development --platform ios
```

### 4.2 Install on Device

1. Install the development build on a real iOS device
2. Push notifications don't work in iOS Simulator
3. Make sure device is connected to internet

### 4.3 Test Push Notifications

1. Open the CivicSense app
2. Grant notification permissions when prompted
3. Check OneSignal dashboard → "Audience" → "All Users" to see your device
4. Send a test notification from OneSignal dashboard

## Step 5: Database Schema Updates

Add OneSignal user tracking to your Supabase database:

```sql
-- Add OneSignal fields to user profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onesignal_user_id TEXT,
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"notifications": true, "emailUpdates": true, "democraticAlerts": true, "localCivicReminders": true}'::jsonb;

-- Add user events table for notification tracking
CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_onesignal_id ON user_profiles(onesignal_user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_type ON user_events(user_id, event_type);
```

## Step 6: Integration with CivicSense App

### 6.1 Initialize OneSignal in App

Add the OneSignal hook to your main app component:

```typescript
// In your main App.tsx or _layout.tsx
import { useOneSignal } from '@/hooks/useOneSignal'

export default function App() {
  const oneSignal = useOneSignal()

  useEffect(() => {
    console.log('OneSignal Status:', {
      initialized: oneSignal.isInitialized,
      hasPermission: oneSignal.notificationPermission === 'granted',
      subscribed: oneSignal.isSubscribed
    })
  }, [oneSignal.isInitialized])

  return (
    // Your app content
  )
}
```

### 6.2 Sync Users on Authentication

```typescript
// When user logs in or signs up
import { useOneSignal } from '@/hooks/useOneSignal'

function handleUserAuthentication(user) {
  const oneSignal = useOneSignal()
  
  // Sync user data to OneSignal
  oneSignal.syncUser({
    userId: user.id,
    email: user.email,
    preferences: {
      notifications: true,
      emailUpdates: true,
      democraticAlerts: true,
      localCivicReminders: true
    },
    civicProfile: {
      engagementLevel: 'beginner',
      topicsOfInterest: [],
      streakCount: 0
    }
  })
}
```

### 6.3 Track Civic Engagement

```typescript
// Track quiz completion
oneSignal.updateCivicEngagement({
  quizCompleted: true,
  quizScore: 85,
  contentViewed: 'constitutional_rights',
  engagementLevel: 'intermediate'
})

// Trigger streak notification
oneSignal.triggerCivicNotification('streak', {
  streakCount: 7
})
```

## Step 7: Testing Civic Notifications

### 7.1 Test via OneSignal Dashboard

1. Go to OneSignal Dashboard → "Messages" → "New Push"
2. Select your app
3. Choose **"Send to Test Users"**
4. Add custom data for civic actions:

```json
{
  "civic_action_type": "quiz_reminder",
  "urgency": "medium",
  "quiz_id": "constitutional_rights"
}
```

### 7.2 Test via API

```bash
# Test streak notification
curl -X POST http://localhost:3000/api/integrations/onesignal/trigger-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "type": "streak",
    "data": {
      "streakCount": 7
    }
  }'
```

## Step 8: Production Setup

### 8.1 Update OneSignal for Production

1. In OneSignal dashboard, add **production** certificate/key
2. Update Bundle ID to match production app
3. Switch environment variables to production values

### 8.2 App Store Build

```bash
# Production build for App Store
eas build --profile production --platform ios
```

### 8.3 Production Environment Variables

```bash
# Production .env
EXPO_PUBLIC_ONESIGNAL_APP_ID=your_production_app_id
ONESIGNAL_REST_API_KEY=your_production_rest_key
# ... other production keys
```

## Troubleshooting

### Common Issues

1. **No push token received**
   - Ensure you're testing on real iOS device
   - Check notification permissions are granted
   - Verify Apple Developer certificates are valid

2. **OneSignal user not created**
   - Check network connectivity
   - Verify OneSignal App ID in environment variables
   - Check console logs for initialization errors

3. **Notifications not appearing**
   - Test from OneSignal dashboard first
   - Check device notification settings
   - Verify app is properly signed

4. **Build errors with OneSignal plugin**
   - Run `npx expo prebuild --clean`
   - Ensure all dependencies are installed
   - Check app.config.ts plugin configuration

### Debug Commands

```bash
# Check OneSignal plugin status
npx expo config --type public

# Inspect build for iOS
npx expo prebuild --platform ios --clear

# Check dependencies
npm ls react-native-onesignal
```

## Civic Engagement Features

### Automated Notifications

The OneSignal integration supports these civic engagement notifications:

1. **Quiz Streaks** - Celebrate learning consistency
2. **Voting Alerts** - Remind about elections and deadlines
3. **Achievement Badges** - Recognize civic knowledge milestones
4. **Topic Reminders** - Encourage continued learning
5. **Breaking Civic News** - Alert about important developments

### Segmentation

Users are automatically segmented by:
- Engagement level (beginner, intermediate, advanced)
- Location (state, district, city)
- Quiz performance and topics of interest
- Notification preferences

### Analytics

Track civic engagement through:
- Notification open rates
- Actions taken from notifications
- User progression through civic learning
- Democratic participation metrics

## Support

For issues specific to:
- **OneSignal**: [OneSignal Documentation](https://documentation.onesignal.com/)
- **Expo**: [Expo Documentation](https://docs.expo.dev/)
- **Apple Push Notifications**: [Apple Developer Documentation](https://developer.apple.com/documentation/usernotifications)

---

**Ready to build a more informed democracy through mobile civic education!** 🗳️📱 