# Event Tracking Implementation Examples

This document provides practical examples of how to integrate Statsig event tracking into your CivicSense components.

## 🎯 Quick Start Examples

### 1. Quiz Component Integration

```typescript
// components/quiz/quiz-engine.tsx
import { useAnalytics } from '@/utils/analytics'
import { useEffect, useState } from 'react'

export function QuizEngine({ quizData }: { quizData: any }) {
  const { trackQuiz, trackGameification } = useAnalytics()
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [activeBoosts, setActiveBoosts] = useState<string[]>([])

  // Track quiz start
  useEffect(() => {
    if (quizData) {
      const now = Date.now()
      setStartTime(now)
      
      trackQuiz.started({
        quiz_category: quizData.category,
        quiz_difficulty: quizData.difficulty,
        user_level: quizData.userLevel || 1,
        active_boosts: activeBoosts,
        streak_count: quizData.userStreak || 0
      })
    }
  }, [quizData, trackQuiz, activeBoosts])

  const handleAnswerSubmit = (questionId: string, isCorrect: boolean, responseTime: number) => {
    // Track individual question answer
    trackQuiz.questionAnswered({
      question_id: questionId,
      question_category: quizData.category,
      answer_correct: isCorrect,
      response_time_seconds: responseTime / 1000,
      attempt_number: 1,
      hint_used: false, // Track if hint was used
      boost_active: activeBoosts[0] || null,
      confidence_level: 3 // Could be from user input
    })

    if (isCorrect) {
      setScore(prev => prev + 1)
    }
  }

  const handleQuizComplete = () => {
    if (!startTime) return

    const totalTime = (Date.now() - startTime) / 1000
    const scorePercentage = (score / quizData.questions.length) * 100

    trackQuiz.completed({
      quiz_id: quizData.id,
      score_percentage: scorePercentage,
      total_questions: quizData.questions.length,
      correct_answers: score,
      total_time_seconds: totalTime,
      boosts_used: activeBoosts,
      xp_earned: calculateXPEarned(scorePercentage),
      streak_maintained: scorePercentage >= 60, // Your streak logic
      new_level_reached: false // Check if user leveled up
    })
  }

  const handleBoostActivation = (boostType: string) => {
    setActiveBoosts(prev => [...prev, boostType])
    
    trackGameification.boostActivated({
      boost_type: boostType,
      activation_context: currentQuestion === 0 ? 'quiz_start' : 'mid_quiz',
      user_performance_before: score / (currentQuestion || 1),
      remaining_uses: getBoostRemainingUses(boostType)
    })
  }

  // ... rest of component
}
```

### 2. Authentication Integration

```typescript
// components/auth/auth-provider.tsx
import { useAnalytics } from '@/utils/analytics'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { trackAuth } = useAnalytics()
  // ... existing auth logic

  const handleLogin = async (method: 'google' | 'email') => {
    try {
      // ... existing login logic
      
      // Track successful login
      trackAuth.userLogin(
        method,
        getPreviousSessionDuration(), // Implement this function
        getDaysSinceLastLogin() // Implement this function
      )
    } catch (error) {
      // Handle login error
    }
  }

  const handleRegistration = async (method: 'google' | 'email', source?: string) => {
    try {
      // ... existing registration logic
      
      // Track successful registration
      trackAuth.userRegistered(method, source)
    } catch (error) {
      // Handle registration error
    }
  }

  // ... rest of component
}
```

### 3. Boost System Integration

```typescript
// components/quiz/boost-command-bar.tsx
import { useAnalytics } from '@/utils/analytics'

export function BoostCommandBar({ userXP, userLevel }: { userXP: number, userLevel: number }) {
  const { trackGameification } = useAnalytics()

  const handleBoostPurchase = async (boostType: string, cost: number) => {
    try {
      // ... existing purchase logic
      
      trackGameification.boostPurchased({
        boost_type: boostType,
        boost_cost_xp: cost,
        user_xp_before: userXP,
        user_level: userLevel,
        purchase_context: 'browse' // or determine context
      })
    } catch (error) {
      // Handle purchase error
    }
  }

  // ... rest of component
}
```

### 4. Streak Tracking Integration

```typescript
// components/daily-card-stack.tsx
import { useAnalytics } from '@/utils/analytics'

export function DailyCardStack() {
  const { trackEngagement } = useAnalytics()

  const handleDailyActivity = (activityType: 'quiz' | 'reading' | 'discussion') => {
    const currentStreak = getCurrentStreak() // Implement this
    const hoursSinceLastActivity = getHoursSinceLastActivity() // Implement this
    
    trackEngagement.streakMaintained({
      streak_count: currentStreak,
      activity_type: activityType,
      time_since_last_activity_hours: hoursSinceLastActivity,
      streak_motivation: determineMotivation() // 'notification' | 'habit' | etc.
    })
  }

  const handleStreakBroken = (lostStreak: number) => {
    trackEngagement.streakBroken({
      streak_count_lost: lostStreak,
      days_since_last_activity: getDaysSinceLastActivity(),
      last_activity_type: getLastActivityType(),
      user_reaction: 'disappointed' // Could be from user feedback
    })
  }

  // ... rest of component
}
```

### 5. Audio Controls Integration

```typescript
// components/global-audio-controls.tsx
import { useAnalytics } from '@/utils/analytics'

export function GlobalAudioControls() {
  const { trackEngagement } = useAnalytics()

  const handleAudioPlay = (contentType: 'quiz_question' | 'explanation' | 'hint', userInitiated: boolean) => {
    const startTime = Date.now()
    
    // Track when audio finishes or is stopped
    const handleAudioEnd = (completionPercentage: number) => {
      const duration = (Date.now() - startTime) / 1000
      
      trackEngagement.audioContentPlayed({
        content_type: contentType,
        duration_seconds: duration,
        completion_percentage: completionPercentage,
        user_initiated: userInitiated,
        accessibility_feature: isAccessibilityEnabled()
      })
    }

    return handleAudioEnd
  }

  // ... rest of component
}
```

## 📊 Advanced Implementation Patterns

### 1. Automatic Page Tracking

```typescript
// app/quiz/page.tsx
import { withPageTracking } from '@/utils/analytics'

function QuizPage() {
  return (
    <div>
      {/* Your quiz page content */}
    </div>
  )
}

// Automatically track page views
export default withPageTracking(QuizPage, 'quiz_page')
```

### 2. Error Boundary with Analytics

```typescript
// components/error-boundary.tsx
import React from 'react'
import { useAnalytics } from '@/utils/analytics'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Use analytics hook here via context or prop
    this.props.onError?.(error.toString(), errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }

    return this.props.children
  }
}

// Wrapper component to use hooks
export function AnalyticsErrorBoundary({ children }) {
  const { trackError } = useAnalytics()

  const handleError = (error: string, context: string) => {
    trackError('react_error_boundary', error, { context })
  }

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}
```

### 3. Feature Flag Integration with Analytics

```typescript
// components/feature-with-analytics.tsx
import { useFeatureFlag } from '@/components/providers/statsig-provider'
import { useAnalytics } from '@/utils/analytics'
import { useEffect } from 'react'

export function FeatureWithAnalytics({ featureName }: { featureName: string }) {
  const { isEnabled } = useFeatureFlag(featureName)
  const { trackFeatures } = useAnalytics()

  useEffect(() => {
    if (isEnabled) {
      // Track feature discovery
      trackFeatures.discovered({
        feature_name: featureName,
        discovery_method: 'automatic', // or determine how user found it
        time_to_discovery_days: 0, // Calculate based on user registration
        user_experience_level: 3 // Determine based on user activity
      })
    }
  }, [isEnabled, featureName, trackFeatures])

  const handleFeatureFirstUse = () => {
    trackFeatures.firstUse({
      feature_name: featureName,
      time_since_discovery_minutes: 0, // Calculate time since discovery
      success: true,
      user_satisfaction: 4 // Could be from user feedback
    })
  }

  if (!isEnabled) return null

  return (
    <div onClick={handleFeatureFirstUse}>
      {/* Feature content */}
    </div>
  )
}
```

### 4. Custom Hook for Quiz Analytics

```typescript
// hooks/use-quiz-analytics.ts
import { useAnalytics } from '@/utils/analytics'
import { useCallback, useRef } from 'react'

export function useQuizAnalytics() {
  const { trackQuiz, trackGameification } = useAnalytics()
  const startTimeRef = useRef<number | null>(null)
  const questionsAnsweredRef = useRef<number>(0)

  const startQuiz = useCallback((quizData: any) => {
    startTimeRef.current = Date.now()
    questionsAnsweredRef.current = 0
    
    trackQuiz.started({
      quiz_category: quizData.category,
      quiz_difficulty: quizData.difficulty,
      user_level: quizData.userLevel,
      active_boosts: quizData.activeBoosts || [],
      streak_count: quizData.streakCount || 0
    })
  }, [trackQuiz])

  const answerQuestion = useCallback((questionData: any) => {
    questionsAnsweredRef.current += 1
    trackQuiz.questionAnswered(questionData)
  }, [trackQuiz])

  const completeQuiz = useCallback((quizResults: any) => {
    if (!startTimeRef.current) return
    
    const totalTime = (Date.now() - startTimeRef.current) / 1000
    
    trackQuiz.completed({
      ...quizResults,
      total_time_seconds: totalTime
    })
  }, [trackQuiz])

  const abandonQuiz = useCallback((quizId: string, reason: string) => {
    if (!startTimeRef.current) return
    
    const timeSpent = (Date.now() - startTimeRef.current) / 1000
    const totalQuestions = 10 // or get from quiz data
    
    trackQuiz.abandoned({
      quiz_id: quizId,
      questions_answered: questionsAnsweredRef.current,
      total_questions: totalQuestions,
      abandonment_point: questionsAnsweredRef.current === 0 ? 'start' : 
                        questionsAnsweredRef.current < totalQuestions / 2 ? 'middle' : 'near_end',
      time_spent_seconds: timeSpent,
      reason: reason as any
    })
  }, [trackQuiz])

  return {
    startQuiz,
    answerQuestion,
    completeQuiz,
    abandonQuiz
  }
}
```

## 🚀 Getting Started Checklist

### Phase 1: Basic Implementation (Week 1)
- [ ] Add environment variables for Statsig
- [ ] Implement basic quiz tracking in `QuizEngine`
- [ ] Add authentication event tracking
- [ ] Test events are appearing in Statsig console

### Phase 2: Engagement Tracking (Week 2)
- [ ] Implement streak tracking in daily engagement
- [ ] Add boost purchase/activation tracking
- [ ] Implement audio content tracking
- [ ] Add page view tracking to major pages

### Phase 3: Advanced Features (Week 3)
- [ ] Implement error tracking with error boundaries
- [ ] Add feature discovery tracking
- [ ] Implement user settings change tracking
- [ ] Add custom validation for critical events

### Phase 4: Analytics & Insights (Week 4)
- [ ] Set up Statsig dashboards
- [ ] Create user segments based on behavior
- [ ] Implement A/B testing for key features
- [ ] Document insights and optimization opportunities

## 📈 Measuring Success

### Key Metrics to Track Weekly
1. **Event Volume**: Are all expected events being captured?
2. **Data Quality**: Are events structured correctly?
3. **User Engagement**: Are engagement metrics improving?
4. **Feature Adoption**: Which features are being discovered and used?

### Monthly Business Reviews
1. **User Retention**: How do different cohorts behave?
2. **Learning Effectiveness**: Are users improving over time?
3. **Feature Impact**: Which features drive the most engagement?
4. **Growth Opportunities**: What insights suggest new features?

This implementation approach will give you comprehensive visibility into how users interact with CivicSense, enabling data-driven decisions for product improvement and growth. 