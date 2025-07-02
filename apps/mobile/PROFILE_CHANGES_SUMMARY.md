# CivicSense Mobile App Fixes Summary

## Issues Fixed

### 1. ✅ Profile Header Changes
- **Removed avatar** from AppHeader component 
- **Centered "My Profile"** title in the header
- This saves screen space and creates a cleaner look

**Changes made:**
- Updated `app/(tabs)/profile.tsx`: Changed `AppHeader` props to `title="My Profile"` and `showAvatar={false}`

### 2. ✅ Cleaner Progress Design  
- **Redesigned the progress card** with a more minimal, clean aesthetic
- **Removed complexity** from the old stats display
- **Better layout** with improved spacing and typography
- **Conditional content** showing motivation for new users vs. stats for engaged users

**Changes made:**
- Created new progress card styles: `progressCard`, `progressHeader`, `progressStats`, etc.
- Simplified the stats display with better visual hierarchy
- Added motivational message for new users who haven't taken quizzes yet

### 3. ✅ Database Constraint Violations Fixed
- **Fixed the constraint violation error** in `user_platform_preferences` table
- **Updated enum values** to match database constraints exactly
- **Removed incorrect mapping functions** that were causing the errors

**Root cause:** The app was trying to map new enum values to legacy values, but the database actually expected the new values.

**Changes made:**
- Updated `lib/services/user-preferences-service.ts`: Changed enum values to match database
  - `learningPace`: `'self_paced' | 'structured' | 'intensive'` (was `'slow' | 'moderate' | 'fast'`)
  - `preferredDifficulty`: `'easy' | 'medium' | 'hard' | 'adaptive'` (was `'beginner' | 'intermediate' | 'advanced'`)
  - `studyTimePreference`: `'any_time'` instead of `'flexible'`

- Updated `app/settings/edit-profile.tsx`: 
  - Removed legacy mapping functions (`mapLearningPaceToLegacy`, etc.)
  - Added `formatEnumValueForDisplay()` helper function for UI display
  - Fixed save handler to use correct enum values directly

### 4. ✅ Google OAuth Configuration Guide
- **Created comprehensive setup guide** for Google Calendar sync
- **Documented all required redirect URIs** for development and production
- **Provided step-by-step instructions** for Google Cloud Console setup

**Changes made:**
- Created `GOOGLE_OAUTH_SETUP.md` with complete configuration guide
- Includes development URIs: `exp://192.168.1.151:8081`, `exp://localhost:8081`
- Includes production URI: `com.civicsense.mobile://auth/google`
- Covers required APIs: Google Calendar API, People API
- Includes troubleshooting section and security notes

## Google OAuth Setup Instructions

To fix the calendar sync "invalid_request" error:

### Quick Fix:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these redirect URIs:
   ```
   exp://192.168.1.151:8081
   exp://localhost:8081
   exp://127.0.0.1:8081
   com.civicsense.mobile://auth/google
   ```
5. Enable **Google Calendar API** in APIs & Services
6. Restart your Expo development server: `npx expo start --clear`

### Environment Variables:
Create/update your `.env` file:
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events
```

## Database Constraint Details

The error you were seeing:
```
"new row for relation \"user_platform_preferences\" violates check constraint \"user_platform_preference...(truncated)..."
```

**Was caused by:** Using old enum values (`'slow'`, `'moderate'`, `'fast'`) when the database expected new values (`'self_paced'`, `'structured'`, `'intensive'`).

**Fixed by:** Updating the service interface to match the database constraints exactly.

## Testing

After these changes:
- ✅ Profile screen should have cleaner design with centered title
- ✅ Edit profile screen should save settings without constraint errors  
- ✅ Google Calendar sync should work after OAuth setup
- ✅ All enum values should display properly in the UI

## Next Steps

1. **Update Google Cloud Console** with the redirect URIs from the guide
2. **Test the calendar sync** feature
3. **Verify profile settings** can be saved successfully
4. **Check the new profile design** matches expectations

## Files Modified

- `app/(tabs)/profile.tsx` - Updated header and progress design
- `app/settings/edit-profile.tsx` - Fixed enum values and mapping
- `lib/services/user-preferences-service.ts` - Updated interface to match database
- `GOOGLE_OAUTH_SETUP.md` - New comprehensive setup guide
- `PROFILE_CHANGES_SUMMARY.md` - This summary document

---

All major issues have been resolved. The app should now work correctly with proper database constraints, clean UI design, and functional Google Calendar integration (once OAuth is configured). 