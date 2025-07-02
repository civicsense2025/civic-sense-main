# CivicSense Mobile Auth Fixes 🔐

This document explains the auth-related issues that were fixed and how to use the improved authentication system.

## 🚨 Issues Fixed

### 1. Guest Session Filter Error
**Problem**: `sessions.filter is not a function (it is undefined)`
- The `OfflineSessionManager.getAllProgressSessions()` method returns an object `{sessionId: session}` 
- But `GuestProgressWidget.tsx` was trying to call `.filter()` on it expecting an array

**Fix**: Convert object to array before filtering
```typescript
// ❌ Before (caused error)
const sessions = await offlineManager.getAllProgressSessions();
return sessions.filter(session => session.guest_token === token);

// ✅ After (fixed)
const sessionsObject = await offlineManager.getAllProgressSessions();
const sessionsArray = Object.values(sessionsObject || {});
return sessionsArray.filter(session => session.guest_token === token);
```

### 2. Google OAuth for Mobile
**Problem**: Original implementation used `supabase.auth.signInWithOAuth()` which doesn't work properly for React Native mobile apps.

**Fix**: Created dedicated `GoogleOAuthService` using `expo-auth-session`
- Proper mobile OAuth flow with authorization code exchange
- Platform-specific client ID handling (iOS/Android)
- Automatic token exchange with Supabase
- Proper error handling and cancellation support

### 3. Auth Race Conditions and "Auth session missing" Error
**Problem**: Complex auth initialization with cache helpers causing race conditions and session mismatches.

**Fix**: Simplified, robust auth context (`auth-context-improved.tsx`)
- Prevents multiple initializations with ref guards
- Proper cleanup and timeout handling
- Simplified session management without complex caching
- Clear initialization states

## 🛠️ New Auth System Architecture

### Core Files

1. **`lib/auth-context-improved.tsx`** - Main auth context (simplified and robust)
2. **`lib/services/google-oauth.ts`** - Mobile-specific Google OAuth implementation
3. **`components/ui/GuestProgressWidget.tsx`** - Fixed guest session loading
4. **`app/auth/test-improved-auth.tsx`** - Test component demonstrating usage

### Key Improvements

- **Race Condition Prevention**: Single initialization with proper guards
- **Platform-Aware OAuth**: Different flows for web vs mobile
- **Proper Error Handling**: Clear error states and user feedback
- **Guest Session Support**: Fixed array conversion for offline sessions
- **Timeout Protection**: Prevents infinite loading states

## 🚀 Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```bash
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id  
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id

# Supabase Configuration (existing)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Google OAuth Setup

#### Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select your project
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Web client**: For development/testing
   - **iOS client**: Bundle ID: `com.civicsense.app`
   - **Android client**: Package name: `com.civicsense.app`

#### Supabase Dashboard
1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth client ID and secret
4. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3. App Configuration
The `app.config.ts` already includes:
```typescript
scheme: 'civicsense', // Required for OAuth redirects
```

### 4. Required Dependencies
Already installed:
- `expo-auth-session`
- `expo-web-browser` 
- `expo-linking`

## 📱 Usage Examples

### Using the Improved Auth Context

```typescript
import { useAuth } from '../lib/auth-context-improved';

function MyComponent() {
  const { 
    user, 
    profile, 
    loading, 
    initialized,
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOut 
  } = useAuth();

  // Wait for initialization
  if (!initialized) {
    return <LoadingSpinner />;
  }

  // Check auth state
  if (!user) {
    return <SignInForm />;
  }

  // User is authenticated
  return <AuthenticatedContent />;
}
```

### Google Sign-In Implementation

```typescript
const handleGoogleSignIn = async () => {
  try {
    const { error, cancelled } = await signInWithGoogle();
    
    if (cancelled) {
      // User cancelled the flow
      return;
    }
    
    if (error) {
      Alert.alert('Sign In Failed', error.message);
      return;
    }
    
    // Success! User is now signed in
    console.log('✅ Google sign-in successful');
    
  } catch (error) {
    Alert.alert('Error', 'An unexpected error occurred');
  }
};
```

### Guest Session Handling (Fixed)

```typescript
// The GuestProgressWidget now properly handles sessions
import { GuestProgressWidget } from '../components/ui/GuestProgressWidget';

function HomeScreen() {
  const { user } = useAuth();
  const { getOrCreateGuestToken } = useGuestAccess();

  // Only show for non-authenticated users
  if (user) return <AuthenticatedHome />;

  return (
    <View>
      <GuestProgressWidget 
        guestToken={getOrCreateGuestToken()}
        onSignupPress={() => router.push('/auth/signup')}
      />
    </View>
  );
}
```

## 🧪 Testing the Fixes

### Test Component
Navigate to `/auth/test-improved-auth` to test:
- ✅ Auth initialization without race conditions
- ✅ Google OAuth flow (mobile-specific)
- ✅ Email/password authentication
- ✅ Proper loading and error states
- ✅ Guest session compatibility

### Expected Behavior
1. **Fast Initialization**: Auth loads quickly without timeouts
2. **No Console Errors**: No "sessions.filter" or "session missing" errors
3. **Working Google OAuth**: Proper redirect flow on mobile
4. **Guest Sessions**: Progress tracking works for non-authenticated users

## 🔄 Migration from Old Auth

### If you want to switch to the improved auth:

1. **Replace import** in your app root:
```typescript
// ❌ Old
import { AuthProvider } from '../lib/auth-context';

// ✅ New  
import { AuthProvider } from '../lib/auth-context-improved';
```

2. **Update components** using auth:
```typescript
// All the same API, just more reliable:
const { user, loading, signInWithGoogle } = useAuth();

// New: Check initialization state
const { user, loading, initialized } = useAuth();
if (!initialized) return <Loading />;
```

3. **Test thoroughly** with the test component first

## 🚨 Important Notes

### Google OAuth Requirements
- **iOS**: Requires proper Bundle ID configuration
- **Android**: Requires proper package name and SHA-1 fingerprint
- **Redirect URLs**: Must match exactly in Google Console and Supabase

### Environment Variables
- Don't commit `.env` files with actual credentials
- Use different client IDs for development vs production
- Web client ID may work for general testing

### Error Handling
The new system provides better error messages:
- `GOOGLE_OAUTH_ERROR`: Issues with Google flow
- `SUPABASE_AUTH_ERROR`: Issues with Supabase integration
- `INITIALIZATION_TIMEOUT`: Auth took too long to initialize

## 🎯 Next Steps

1. **Test in Development**: Use the test component to verify all flows work
2. **Configure Production**: Set up production Google OAuth credentials  
3. **Update Components**: Gradually migrate to improved auth context
4. **Monitor Logs**: Watch for any remaining auth-related errors

## 🐛 Troubleshooting

### Still getting "sessions.filter" error?
- Ensure `GuestProgressWidget.tsx` has the fixed `loadAllGuestSessions` method
- Check that `OfflineSessionManager` is properly imported

### Google OAuth not working?
- Verify client IDs are correct for your platform
- Check redirect URI matches app scheme (`civicsense://`)
- Ensure Google+ API is enabled in Google Cloud Console

### Auth still not initializing?
- Check Supabase credentials in environment variables
- Verify network connectivity
- Look for console errors during initialization

---

**✅ These fixes resolve the major auth issues and provide a robust foundation for CivicSense mobile authentication.** 