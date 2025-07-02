# Database Enum Values Alignment Fix

## Issue
The mobile app was encountering database constraint violations when trying to save user platform preferences. The error was:

```
"new row for relation \"user_platform_preferences\" violates check constraint \"user_platform_preference...(truncated)..."
```

## Root Cause
The mobile app services were using different enum values than what the database constraints expected:

### Database Constraints (from `supabase/migrations/010_onboarding_system.sql`):
- `learning_pace`: `'self_paced', 'structured', 'intensive'`
- `preferred_difficulty`: `'easy', 'medium', 'hard', 'adaptive'`  
- `study_time_preference`: `'morning', 'afternoon', 'evening', 'any_time'`

### Mobile App Values (before fix):
- `learningPace`: `'slow', 'moderate', 'fast'`
- `preferredDifficulty`: `'beginner', 'intermediate', 'advanced'`
- `studyTimePreference`: `'morning', 'afternoon', 'evening', 'flexible'`

## Files Updated

### 1. UserPreferencesService (`apps/mobile/lib/services/user-preferences-service.ts`)
- Updated `LearningPreferences` interface enum values
- Updated default values to match database constraints
- Updated time calculation logic for new pace values

### 2. Edit Profile Screen (`apps/mobile/app/settings/edit-profile.tsx`)
- Updated `PlatformPreferences` interface
- Updated default state values
- Updated UI segment controls to use correct enum values
- Updated display text formatting for `any_time` -> "Any time"

### 3. Onboarding Screen (`apps/mobile/app/onboarding/index.tsx`)
- Updated `OnboardingData` interface difficulty and pace values

### 4. PersonalizationService (`apps/mobile/lib/services/personalization-service.ts`)
- Updated `PersonalizationSettings` interface
- Updated difficulty mapping logic
- Updated default fallback values

## Enum Value Mappings

| Field | Old Value | New Value | UI Display |
|-------|-----------|-----------|------------|
| learningPace | 'slow' | 'self_paced' | "Self Paced" |
| learningPace | 'moderate' | 'structured' | "Structured" |
| learningPace | 'fast' | 'intensive' | "Intensive" |
| preferredDifficulty | 'beginner' | 'easy' | "Easy" |
| preferredDifficulty | 'intermediate' | 'medium' | "Medium" |
| preferredDifficulty | 'advanced' | 'hard' | "Hard" |
| preferredDifficulty | - | 'adaptive' | "Adaptive" |
| studyTimePreference | 'flexible' | 'any_time' | "Any time" |

## Verification
After these changes, the mobile app should successfully save user preferences without database constraint violations. The onboarding flow and edit profile screens should work correctly with the new enum values.

## Future Considerations
- Always check database constraints before implementing enum values in the mobile app
- Consider using the database types file (`lib/database.types.ts`) as the source of truth for enum values
- Implement validation on the client side to prevent constraint violations 