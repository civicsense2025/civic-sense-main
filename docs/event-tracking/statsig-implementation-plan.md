# CivicSense Event Tracking Implementation Plan with Statsig

## Overview

This document outlines a comprehensive event tracking strategy for CivicSense using Statsig to measure user engagement, understand learning patterns, and optimize the civic education experience.

## 🎯 Strategic Goals

### Primary Objectives
1. **User Engagement**: Track how users interact with quizzes, boosts, and learning content
2. **Learning Effectiveness**: Measure knowledge retention and skill improvement
3. **Feature Adoption**: Monitor which features drive the most value
4. **User Journey**: Understand the path from onboarding to active civic engagement
5. **Product Growth**: Identify growth levers and optimization opportunities

### Key Questions to Answer
- Which quiz topics engage users most?
- How do game boosts affect learning outcomes?
- What drives daily streak maintenance?
- Where do users drop off in their learning journey?
- Which features correlate with long-term retention?

## 📊 Event Tracking Framework

### Event Categories

#### 1. **Authentication & Onboarding Events**
```typescript
// User Registration & Login
logEvent('user_registered', 1, {
  registration_method: 'google' | 'email',
  source: 'landing_page' | 'referral' | 'direct',
  timestamp: new Date().toISOString()
})

logEvent('user_login', 1, {
  login_method: 'google' | 'email',
  session_duration_previous: number, // minutes
  days_since_last_login: number
})

// Onboarding Flow
logEvent('onboarding_started', 1, {
  user_type: 'new' | 'returning',
  entry_point: string
})

logEvent('onboarding_completed', 1, {
  completion_time_seconds: number,
  steps_completed: number,
  steps_skipped: string[]
})
```

#### 2. **Quiz & Learning Events**
```typescript
// Quiz Lifecycle
logEvent('quiz_started', 1, {
  quiz_category: 'constitution' | 'current_events' | 'local_civics',
  quiz_difficulty: 'beginner' | 'intermediate' | 'advanced',
  user_level: number,
  active_boosts: string[],
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night',
  day_of_week: string,
  streak_count: number
})

logEvent('question_answered', 1, {
  question_id: string,
  question_category: string,
  answer_correct: boolean,
  response_time_seconds: number,
  attempt_number: number,
  hint_used: boolean,
  boost_active: string | null,
  confidence_level: 1 | 2 | 3 | 4 | 5
})

logEvent('quiz_completed', 1, {
  quiz_id: string,
  score_percentage: number,
  total_questions: number,
  correct_answers: number,
  total_time_seconds: number,
  boosts_used: string[],
  xp_earned: number,
  streak_maintained: boolean,
  new_level_reached: boolean
})

logEvent('quiz_abandoned', 1, {
  quiz_id: string,
  questions_answered: number,
  total_questions: number,
  abandonment_point: 'start' | 'middle' | 'near_end',
  time_spent_seconds: number,
  reason: 'timeout' | 'user_exit' | 'technical_issue'
})
```

#### 3. **Gamification & Boost Events**
```typescript
// Boost System
logEvent('boost_purchased', 1, {
  boost_type: string,
  boost_cost_xp: number,
  user_xp_before: number,
  user_level: number,
  purchase_context: 'pre_quiz' | 'mid_quiz' | 'post_quiz' | 'browse'
})

logEvent('boost_activated', 1, {
  boost_type: string,
  activation_context: 'quiz_start' | 'mid_quiz' | 'specific_question',
  user_performance_before: number, // recent average score
  remaining_uses: number
})

logEvent('boost_effect_measured', 1, {
  boost_type: string,
  performance_improvement: number, // percentage
  questions_affected: number,
  user_satisfaction: 1 | 2 | 3 | 4 | 5 // post-quiz rating
})

// Achievement System
logEvent('achievement_unlocked', 1, {
  achievement_type: string,
  achievement_category: 'quiz' | 'streak' | 'social' | 'learning',
  days_to_unlock: number,
  user_level: number,
  total_achievements: number
})

logEvent('level_up', 1, {
  new_level: number,
  xp_total: number,
  days_to_level_up: number,
  primary_activity: 'quiz' | 'daily_streak' | 'achievements'
})
```

#### 4. **Engagement & Retention Events**
```typescript
// Daily Engagement
logEvent('daily_streak_maintained', 1, {
  streak_count: number,
  activity_type: 'quiz' | 'reading' | 'discussion',
  time_since_last_activity_hours: number,
  streak_motivation: 'notification' | 'habit' | 'reminder' | 'social'
})

logEvent('daily_streak_broken', 1, {
  streak_count_lost: number,
  days_since_last_activity: number,
  last_activity_type: string,
  user_reaction: 'disappointed' | 'motivated' | 'indifferent'
})

// Content Consumption
logEvent('audio_content_played', 1, {
  content_type: 'quiz_question' | 'explanation' | 'hint',
  duration_seconds: number,
  completion_percentage: number,
  user_initiated: boolean,
  accessibility_feature: boolean
})

logEvent('content_shared', 1, {
  content_type: 'quiz_result' | 'achievement' | 'streak',
  share_platform: 'twitter' | 'facebook' | 'copy_link',
  content_score: number,
  user_level: number
})
```

#### 5. **Feature Adoption Events**
```typescript
// UI/UX Interactions
logEvent('feature_discovered', 1, {
  feature_name: string,
  discovery_method: 'tutorial' | 'exploration' | 'tooltip' | 'accident',
  time_to_discovery_days: number,
  user_experience_level: 1 | 2 | 3 | 4 | 5
})

logEvent('feature_first_use', 1, {
  feature_name: string,
  time_since_discovery_minutes: number,
  success: boolean,
  user_satisfaction: 1 | 2 | 3 | 4 | 5
})

// Settings & Preferences
logEvent('settings_changed', 1, {
  setting_category: 'notifications' | 'audio' | 'difficulty' | 'privacy',
  setting_name: string,
  old_value: string,
  new_value: string,
  change_reason: 'preference' | 'accessibility' | 'performance'
})
```

## 🔍 Data Analysis Framework

### Quantitative Metrics

#### Core KPIs
- **Daily Active Users (DAU)**: Users who complete at least one quiz per day
- **Weekly Active Users (WAU)**: Users active in quiz/learning activities
- **Monthly Active Users (MAU)**: All users with any engagement
- **User Retention**: 1-day, 7-day, 30-day retention rates
- **Session Duration**: Average time spent in learning activities
- **Quiz Completion Rate**: Percentage of started quizzes completed

#### Learning Effectiveness Metrics
- **Knowledge Retention**: Score improvement over time
- **Topic Mastery**: Performance by civic category
- **Learning Velocity**: Questions answered per session
- **Boost Effectiveness**: Performance lift with/without boosts
- **Streak Impact**: Performance correlation with streak length

#### Engagement Depth Metrics
- **Feature Adoption Rate**: Percentage of users trying new features
- **Boost Usage Patterns**: Which boosts are most effective
- **Content Preferences**: Most popular quiz categories
- **Time-of-Day Patterns**: When users are most active
- **Social Sharing**: Content virality and reach

### Qualitative Insights

#### User Behavior Patterns
```typescript
// Segment users by engagement level
const userSegments = {
  power_users: {
    criteria: 'daily_quizzes >= 3 AND streak_days >= 30',
    characteristics: ['high_boost_usage', 'social_sharing', 'advanced_topics']
  },
  regular_learners: {
    criteria: 'weekly_quizzes >= 3 AND retention_30d = true',
    characteristics: ['consistent_improvement', 'moderate_boost_usage']
  },
  casual_users: {
    criteria: 'monthly_quizzes >= 1 AND monthly_quizzes < 10',
    characteristics: ['basic_topics', 'low_boost_usage', 'irregular_pattern']
  },
  at_risk_users: {
    criteria: 'days_since_last_activity > 7',
    characteristics: ['declining_performance', 'low_completion_rate']
  }
}
```

#### Learning Journey Analysis
- **Onboarding Success Factors**: What drives completion vs. abandonment
- **Skill Progression Paths**: How users advance through difficulty levels
- **Motivation Triggers**: What brings users back after inactivity
- **Frustration Points**: Where users struggle or drop off
- **Success Celebrations**: What achievements drive continued engagement

## 📈 Business Intelligence & Projections

### Growth Projections

#### User Growth Model
```typescript
const growthProjections = {
  user_acquisition: {
    organic_growth: 'Based on sharing_events and referral_patterns',
    paid_acquisition: 'ROI analysis from source tracking',
    viral_coefficient: 'Calculated from share_events and new_user_source'
  },
  
  engagement_trends: {
    monthly_engagement_growth: 'Track DAU/MAU ratio trends',
    feature_adoption_curves: 'Time-to-adoption for new features',
    seasonal_patterns: 'Civic engagement correlation with events/elections'
  },
  
  revenue_potential: {
    premium_conversion: 'Based on boost_purchase patterns',
    engagement_correlation: 'High-engagement users vs. monetization',
    lifetime_value: 'Projected from retention and engagement metrics'
  }
}
```

#### Content Strategy Insights
- **Topic Demand**: Which civic topics drive highest engagement
- **Difficulty Optimization**: Ideal challenge progression curves
- **Content Gaps**: Underserved areas with high user interest
- **Seasonal Content**: Timing civic education with real-world events

### Feature Development Roadmap

#### Data-Driven Development
```typescript
const featurePrioritization = {
  high_impact: {
    criteria: 'high_usage_intent AND low_technical_complexity',
    examples: ['Social learning features', 'Advanced boost types', 'Personalized difficulty']
  },
  
  engagement_boosters: {
    criteria: 'correlation_with_retention > 0.3',
    examples: ['Group challenges', 'Real-time civic events', 'Achievement sharing']
  },
  
  retention_focused: {
    criteria: 'reduces_churn_rate OR increases_comeback_rate',
    examples: ['Smart notifications', 'Comeback bonuses', 'Adaptive difficulty']
  }
}
```

## 🛠 Implementation Guidelines

### Phase 1: Core Event Implementation (Week 1-2)
1. **Authentication Events**: Track registration and login patterns
2. **Basic Quiz Events**: Track quiz starts, completions, and performance
3. **Engagement Events**: Track daily active usage and streaks

### Phase 2: Gamification Tracking (Week 3-4)
1. **Boost System Events**: Track boost purchases, usage, and effectiveness
2. **Achievement Events**: Track unlocks and progression
3. **Social Events**: Track sharing and community features

### Phase 3: Advanced Analytics (Week 5-6)
1. **User Journey Mapping**: Track complete user flows
2. **Feature Adoption**: Track discovery and usage of new features
3. **Performance Correlation**: Connect events to learning outcomes

### Phase 4: Business Intelligence (Week 7-8)
1. **Cohort Analysis**: Track user groups over time
2. **Predictive Models**: Build churn prediction and engagement scoring
3. **A/B Testing Framework**: Use Statsig experiments for feature testing

## 🔧 Technical Implementation

### Event Helper Functions
```typescript
// utils/analytics.ts
import { useStatsig } from '@/components/providers/statsig-provider'
import { useAuth } from '@/components/auth/auth-provider'

export const useAnalytics = () => {
  const { logEvent } = useStatsig()
  const { user } = useAuth()

  const trackQuizEvent = (eventName: string, quizData: any) => {
    logEvent(eventName, 1, {
      ...quizData,
      user_id: user?.id,
      user_level: user?.level || 1,
      timestamp: new Date().toISOString(),
      session_id: getSessionId()
    })
  }

  const trackEngagement = (action: string, context: any) => {
    logEvent('user_engagement', 1, {
      action,
      context,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    })
  }

  return { trackQuizEvent, trackEngagement }
}
```

### Event Validation Schema
```typescript
// schemas/events.ts
import { z } from 'zod'

export const QuizEventSchema = z.object({
  quiz_id: z.string(),
  category: z.enum(['constitution', 'current_events', 'local_civics']),
  score: z.number().min(0).max(100),
  duration_seconds: z.number().positive(),
  boosts_used: z.array(z.string()),
  user_level: z.number().positive()
})

export const validateEvent = (eventName: string, data: any) => {
  // Implement validation logic based on event type
  return true // or throw validation error
}
```

## 📊 Dashboard & Reporting

### Key Dashboards to Build

1. **User Engagement Dashboard**
   - DAU/WAU/MAU trends
   - Session duration and frequency
   - Feature adoption rates

2. **Learning Effectiveness Dashboard**
   - Score improvement trends
   - Topic mastery progression
   - Boost effectiveness analysis

3. **Business Intelligence Dashboard**
   - User cohort analysis
   - Churn prediction scores
   - Revenue correlation metrics

4. **Product Development Dashboard**
   - Feature usage analytics
   - A/B test results
   - User feedback correlation

## 🎯 Success Metrics & Goals

### Short-term Goals (1-3 months)
- **Implementation**: 95% event capture rate
- **Data Quality**: <1% event loss or corruption
- **Dashboard Usage**: Team checking dashboards 3x/week

### Medium-term Goals (3-6 months)
- **User Insights**: Identify top 3 engagement drivers
- **Feature Optimization**: 20% improvement in core feature adoption
- **Retention**: 15% improvement in 30-day retention

### Long-term Goals (6-12 months)
- **Predictive Analytics**: Build accurate churn prediction model
- **Personalization**: Implement data-driven content recommendations
- **Growth**: Use insights to drive 50% increase in user engagement

## 🚀 Next Steps

1. **Review and Approve**: Stakeholder alignment on tracking strategy
2. **Technical Setup**: Implement core event tracking infrastructure
3. **Data Validation**: Ensure accurate event capture and processing
4. **Dashboard Creation**: Build initial analytics dashboards
5. **Team Training**: Enable team to use analytics for decision-making
6. **Iterative Improvement**: Continuously refine based on insights gained

This comprehensive tracking strategy will transform CivicSense from a feature-driven to a data-driven civic education platform, enabling evidence-based decisions that improve user learning outcomes and engagement. 