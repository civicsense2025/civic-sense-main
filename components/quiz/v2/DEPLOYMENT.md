# CivicSense Quiz Engine V2 - Production Deployment Guide

## 🎯 Deployment Strategy: Gradual Rollout for Democratic Impact

This guide ensures the safe deployment of Quiz Engine V2 while maintaining **100% uptime** for civic education and preserving all user progress.

## 📋 Pre-Deployment Checklist

### ✅ Database Migrations
```bash
# 1. Apply V2 analytics migrations
supabase migration up

# 2. Verify new tables exist
psql -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%analytics%';"

# 3. Test analytics functions
psql -c "SELECT public.log_quiz_event('quiz_started', 'engagement', 'test-user', null, 'test-session', 'test-topic');"
```

### ✅ Environment Configuration
```bash
# Required environment variables for V2
NEXT_PUBLIC_QUIZ_ENGINE_VERSION=v2
QUIZ_V2_ANALYTICS_ENABLED=true
QUIZ_V2_PLUGIN_MODE=production
```

### ✅ Feature Flags
```typescript
// In your feature flag service
const featureFlags = {
  'quiz-engine-v2': {
    enabled: true,
    rollout: 10, // Start with 10% of users
    environments: ['production']
  },
  'quiz-v2-analytics': {
    enabled: true,
    rollout: 100 // Analytics for all users
  }
}
```

## 🌊 Rollout Phases

### Phase 1: Silent Launch (Week 1)
**Goal**: Verify V2 engine works in production without user impact

```typescript
// Update app/quiz/[topicId]/play/page.tsx
export default function QuizPlayPage({ params, searchParams }: QuizPlayPageProps) {
  const { topicId } = params
  
  // Phase 1: Only use V2 for specific test topics
  const testTopics = ['constitutional-rights-test', 'democracy-basics-v2']
  const isTestTopic = testTopics.includes(topicId)
  
  // Use V2 for test topics or explicit v=v2 parameter
  const useV2Engine = isTestTopic || searchParams?.v === 'v2'
  
  return (
    <Suspense fallback={<QuizLoadingScreen onComplete={() => {}} />}>
      {useV2Engine ? (
        <QuizPlayClientV2 topicId={topicId} searchParams={convertedParams} />
      ) : (
        <QuizPlayClientV1 topicId={topicId} searchParams={convertedParams} />
      )}
    </Suspense>
  )
}
```

**Monitoring Phase 1:**
- ✅ V2 engine loads without errors
- ✅ Progress storage works correctly
- ✅ Quiz completion saves to database
- ✅ Analytics events populate
- ✅ No performance degradation

### Phase 2: Controlled Rollout (Week 2)
**Goal**: Gradually increase V2 usage based on user segments

```typescript
// Feature flag implementation
import { useFeatureFlag } from '@/hooks/useFeatureFlag'

export default function QuizPlayPage({ params, searchParams }: QuizPlayPageProps) {
  const { topicId } = params
  const { user } = useAuth()
  
  // Get feature flag with user-based rollout
  const useV2Engine = useFeatureFlag('quiz-engine-v2', {
    userId: user?.id,
    defaultValue: false,
    // Gradual rollout: Premium users first, then general population
    rolloutStrategy: 'premium_first'
  })
  
  // Explicit version override
  if (searchParams?.v === 'v1') return <QuizPlayClientV1 {...props} />
  if (searchParams?.v === 'v2') return <QuizPlayClientV2 {...props} />
  
  return useV2Engine ? <QuizPlayClientV2 {...props} /> : <QuizPlayClientV1 {...props} />
}
```

**Phase 2 Rollout Schedule:**
- Day 1-2: Premium users (5% of traffic)
- Day 3-4: Educators and power users (15% of traffic)  
- Day 5-7: General population (50% of traffic)

### Phase 3: Full Deployment (Week 3)
**Goal**: Complete migration to V2 with V1 as fallback

```typescript
export default function QuizPlayPage({ params, searchParams }: QuizPlayPageProps) {
  const { topicId } = params
  
  // V2 by default, V1 as explicit fallback
  const useV2Engine = searchParams?.v !== 'v1'
  
  return (
    <Suspense fallback={<QuizLoadingScreen onComplete={() => {}} />}>
      {useV2Engine ? (
        <QuizPlayClientV2 topicId={topicId} searchParams={convertedParams} />
      ) : (
        <QuizPlayClientV1 topicId={topicId} searchParams={convertedParams} />
      )}
    </Suspense>
  )
}
```

### Phase 4: V1 Deprecation (Week 4+)
**Goal**: Remove V1 code and complete migration

```typescript
// Final implementation - V2 only
export default function QuizPlayPage({ params, searchParams }: QuizPlayPageProps) {
  return <QuizPlayClientV2 topicId={params.topicId} searchParams={searchParams} />
}
```

## 📊 Monitoring & Success Metrics

### Technical Health Metrics
```typescript
// Key metrics to track during rollout
const deploymentMetrics = {
  // Performance
  pageLoadTime: '<2s', // Should remain under 2 seconds
  quizEngineInitTime: '<500ms',
  progressSaveLatency: '<100ms',
  
  // Reliability  
  errorRate: '<0.1%', // Less than 0.1% error rate
  progressLossIncidents: 0, // Zero progress loss tolerance
  quizCompletionSuccessRate: '>99%',
  
  // User Experience
  quizStartToFirstQuestion: '<1s',
  userSatisfactionScore: '>4.5', // Out of 5
  supportTicketIncrease: '<10%'
}
```

### Civic Impact Metrics (V2 Exclusive)
```sql
-- New analytics we can track with V2
SELECT 
  date_trunc('day', created_at) as date,
  AVG(civic_knowledge_score) as avg_civic_score,
  SUM(misconceptions_corrected) as total_misconceptions_corrected,
  SUM(uncomfortable_truths_revealed) as total_truths_revealed,
  SUM(action_steps_engaged) as total_actions_engaged,
  COUNT(DISTINCT user_id) as unique_learners
FROM analytics_events 
WHERE event_type = 'quiz_completed'
  AND created_at >= '2024-01-01'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;
```

### Rollback Triggers
**Immediate rollback if:**
- Error rate > 1%
- Quiz completion success rate < 95%
- User satisfaction score < 4.0
- Any progress loss incidents
- Performance degradation > 50%

## 🛡️ Safety Measures

### Progress Migration Safety
```typescript
// Enhanced progress adapter with safety checks
export class SafeProgressMigration {
  static async migrateFromV1ToV2(topicId: string, userId?: string) {
    try {
      // 1. Backup existing V1 progress
      const v1Progress = localStorage.getItem(`civicSenseQuizProgress_${topicId}`)
      if (v1Progress) {
        localStorage.setItem(`civicSenseQuizProgress_${topicId}_backup`, v1Progress)
      }
      
      // 2. Convert to V2 format
      const v2Progress = this.convertV1ToV2Progress(JSON.parse(v1Progress || '{}'))
      
      // 3. Validate conversion
      if (!this.validateV2Progress(v2Progress)) {
        throw new Error('Progress conversion validation failed')
      }
      
      // 4. Save V2 progress
      const adapter = new EnhancedProgressAdapter({ userId, topicId })
      await adapter.saveProgress(v2Progress)
      
      console.log('✅ Successfully migrated progress from V1 to V2')
    } catch (error) {
      console.error('❌ Progress migration failed:', error)
      // Keep V1 progress intact on failure
    }
  }
}
```

### Database Safety
```sql
-- Create backup of critical tables before migration
CREATE TABLE analytics_events_backup AS SELECT * FROM analytics_events;
CREATE TABLE user_quiz_attempts_backup AS SELECT * FROM user_quiz_attempts;

-- Verify foreign key constraints work
SELECT conname, confrelid::regclass, conrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f' 
  AND confrelid::regclass IN ('analytics_events'::regclass, 'user_quiz_attempts'::regclass);
```

## 🔧 Deployment Commands

### Development Deployment
```bash
# 1. Build with V2 enabled
QUIZ_ENGINE_VERSION=v2 npm run build

# 2. Run tests
npm run test:e2e -- --grep "quiz.*v2"

# 3. Deploy to staging
vercel deploy --target staging

# 4. Smoke test V2 engine
curl -I https://staging.civicsense.com/quiz/constitutional-rights/play?v=v2
```

### Production Deployment
```bash
# 1. Create deployment branch
git checkout -b deploy/quiz-engine-v2
git push origin deploy/quiz-engine-v2

# 2. Deploy with feature flag
QUIZ_V2_ROLLOUT_PERCENTAGE=10 vercel deploy --prod

# 3. Monitor metrics for 30 minutes
# 4. Increase rollout if metrics are healthy
QUIZ_V2_ROLLOUT_PERCENTAGE=50 vercel deploy --prod

# 5. Complete rollout
QUIZ_V2_ROLLOUT_PERCENTAGE=100 vercel deploy --prod
```

## 🚨 Incident Response

### Quick Rollback Procedure
```bash
# Emergency rollback to V1
git revert <v2-deployment-commit>
QUIZ_ENGINE_VERSION=v1 vercel deploy --prod

# Or use feature flag
# Set quiz-engine-v2 rollout to 0% in feature flag dashboard
```

### Common Issues & Solutions

#### Issue: V2 Engine Not Loading
```typescript
// Debug in browser console
console.log('Game mode registry:', gameModeRegistry.getAll())
console.log('Available plugins:', Object.keys(gameModeRegistry.plugins))

// Check for plugin registration errors
if (gameModeRegistry.getAll().length === 0) {
  console.error('No game mode plugins registered!')
}
```

#### Issue: Progress Not Restoring
```typescript
// Debug progress storage
const adapter = new EnhancedProgressAdapter({ userId, topicId })
const progress = await adapter.loadProgress()
console.log('Stored progress:', progress)

// Check localStorage
console.log('V1 progress:', localStorage.getItem(`civicSenseQuizProgress_${topicId}`))
console.log('V2 progress:', localStorage.getItem(`enhanced-progress-quiz-${topicId}`))
```

#### Issue: Analytics Events Not Saving
```sql
-- Check analytics events table
SELECT COUNT(*) FROM analytics_events WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check for constraint violations
SELECT * FROM pg_stat_activity WHERE state = 'active' AND query LIKE '%analytics_events%';
```

## 📈 Success Criteria

### Week 1 Goals
- ✅ Zero critical errors
- ✅ All test topics working with V2
- ✅ Analytics pipeline functioning
- ✅ Progress storage 100% reliable

### Month 1 Goals  
- ✅ 100% user migration to V2
- ✅ V1 code removed from codebase
- ✅ 25% improvement in civic learning metrics
- ✅ New game modes deployed (Practice, Assessment)

### Quarter 1 Goals
- ✅ All 9 game modes live in production
- ✅ 50% increase in quiz completion rates
- ✅ Enhanced civic impact analytics dashboard
- ✅ Mobile app using same V2 plugin system

## 🎊 Post-Deployment Celebration

When V2 is fully deployed, we'll have achieved:

🏛️ **Democratic Impact**: Measurable civic learning improvements
⚡ **Technical Excellence**: Modern, maintainable, extensible quiz system  
🚀 **Scalability**: Plugin architecture ready for future civic learning modes
📊 **Analytics**: Deep insights into how citizens learn about democracy
🔒 **Reliability**: Zero progress loss, 100% uptime for civic education

**This deployment represents a significant advancement in CivicSense's mission to transform passive observers into confident, informed participants in democracy.**

---

*Remember: Every successful quiz completion is a citizen better equipped to hold power accountable. Deploy with care, monitor with vigilance, and celebrate the democratic impact.* 