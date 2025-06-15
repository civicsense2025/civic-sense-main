# CivicSense Onboarding System Implementation

## Overview

The CivicSense onboarding system provides a comprehensive 6-step flow to personalize the user experience based on their civic interests, learning goals, and platform preferences. The system integrates with **existing categories and skills tables** rather than creating duplicates.

## System Architecture

### Database Integration

The onboarding system leverages your existing database structure:

- **`categories` table**: Already populated with civic categories (Government, Elections, Civil Rights, etc.)
- **`skills` table**: Contains specific civic skills linked to categories with difficulty levels and core skill indicators
- **New onboarding tables**: User preferences and progress tracking tables that reference the existing structure

### Database Schema

#### New Tables Created

1. **`user_onboarding_state`** - Tracks progress through onboarding flow
2. **`user_category_preferences`** - References existing `categories` table
3. **`user_skill_preferences`** - References existing `skills` table  
4. **`user_platform_preferences`** - Platform usage and accessibility settings
5. **`user_onboarding_assessment`** - Initial skills assessment results

#### Key Functions

- `get_onboarding_categories()` - Fetches categories from existing `categories` table with question counts
- `get_onboarding_skills(category_ids)` - Fetches skills from existing `skills` table, optionally filtered by categories
- `get_user_onboarding_progress(user_id)` - Returns comprehensive onboarding data with category and skill details
- `complete_onboarding_step(user_id, step, data)` - Progresses user through onboarding flow

### Component Structure

```
components/onboarding/
├── onboarding-flow.tsx           # Main flow orchestrator
└── steps/
    ├── welcome-step.tsx          # Introduction and value proposition
    ├── category-selection-step.tsx # Select civic categories (uses existing categories)
    ├── skill-selection-step.tsx  # Choose learning goals (uses existing skills)
    ├── preferences-step.tsx      # Platform settings
    ├── assessment-step.tsx       # Initial skills evaluation
    └── completion-step.tsx       # Success and next steps
```

### API Endpoints

- `GET /api/onboarding/categories` - Fetches available categories using `get_onboarding_categories()`
- `GET /api/onboarding/skills?category_ids=[]` - Fetches skills using `get_onboarding_skills()`

## Implementation Details

### Step 1: Welcome Step
- Value proposition and feature overview
- Estimated completion time
- Option to skip onboarding

### Step 2: Category Selection  
- Displays categories from existing `categories` table
- Interactive selection with interest level (1-5 scale)
- Shows question count per category
- Priority ranking system

### Step 3: Skill Selection
- Fetches skills from existing `skills` table
- Filtered by previously selected categories
- Shows core skills with special indicators
- Difficulty levels and descriptions
- Target mastery level and timeline preferences

### Step 4: Platform Preferences
- Learning preferences (quiz length, difficulty, pace)
- Notification settings (email, push, reminders)
- Accessibility options (font size, contrast, motion)
- Gamification preferences (streaks, leaderboards)
- Content preferences (explanations, sources, types)

### Step 5: Assessment (Placeholder)
- Initial skills evaluation
- Learning style assessment
- Knowledge gap identification

### Step 6: Completion
- Success celebration
- Personalization summary
- Next steps and feature tour

## Integration Points

### Authentication
- Uses existing `useAuth` hook
- References `auth.users` table
- Row Level Security policies

### Analytics  
- Integrates with Statsig for A/B testing
- Comprehensive event tracking:
  - `onboarding_step_started`
  - `onboarding_step_completed`
  - `onboarding_skipped`
  - `category_selected/deselected`
  - `skill_selected/deselected`
  - `onboarding_completed`

### Existing Skills System
- Leverages your comprehensive skills taxonomy
- Respects skill prerequisites and learning objectives
- Integrates with existing progress tracking
- Uses core skill indicators and difficulty levels

## Data Flow

1. **User starts onboarding** → Creates `user_onboarding_state`
2. **Selects categories** → Saves to `user_category_preferences` (references existing `categories`)
3. **Chooses skills** → Saves to `user_skill_preferences` (references existing `skills`)
4. **Sets preferences** → Saves to `user_platform_preferences`
5. **Completes assessment** → Saves to `user_onboarding_assessment`
6. **Finishes onboarding** → Updates state to completed

## Implementation Timeline

### Phase 1: Database Setup (Week 1)
- ✅ Run onboarding migration
- ✅ Verify existing categories and skills data
- ✅ Test database functions

### Phase 2: Core Components (Week 2)
- ✅ Implement main onboarding flow
- ✅ Build category and skill selection steps
- ✅ Create API endpoints

### Phase 3: Preferences & Assessment (Week 3)
- Complete preferences step implementation
- Build initial assessment component
- Add data persistence

### Phase 4: Integration & Polish (Week 4)
- Connect to existing auth and analytics
- Add error handling and loading states
- Implement skip functionality
- User testing and refinements

## Usage Example

```typescript
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';

function App() {
  return (
    <OnboardingFlow
      onComplete={(data) => {
        // Handle onboarding completion
        console.log('Onboarding completed:', data);
      }}
      onSkip={(reason) => {
        // Handle skip
        console.log('Onboarding skipped:', reason);
      }}
    />
  );
}
```

## Benefits of Using Existing Tables

1. **No Data Duplication**: Leverages existing civic categories and skills
2. **Consistency**: Uses same taxonomy across the entire application
3. **Maintenance**: Single source of truth for categories and skills
4. **Integration**: Seamless connection with existing quiz and progress systems
5. **Scalability**: Benefits from existing RLS policies and indexes

## Testing Strategy

1. **Unit Tests**: Individual step components
2. **Integration Tests**: Database functions and API endpoints
3. **User Acceptance Tests**: Full onboarding flow
4. **A/B Testing**: Compare completion rates with/without onboarding

## Success Metrics

- **Completion Rate**: % of users who finish onboarding
- **Category Selection**: Average categories selected per user
- **Skill Selection**: Average skills selected per user  
- **Time to Complete**: Median completion time
- **Engagement Impact**: Increased quiz completion rates post-onboarding
- **Retention**: 7-day and 30-day user retention after onboarding

## Future Enhancements

1. **Adaptive Assessment**: Dynamic skill evaluation based on performance
2. **Learning Path Recommendations**: AI-powered skill sequencing
3. **Social Onboarding**: Connect with friends or learning groups
4. **Progressive Disclosure**: Advanced features unlocked over time
5. **Localization**: Support for multiple languages and regions