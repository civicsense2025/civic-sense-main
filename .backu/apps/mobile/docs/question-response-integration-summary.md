# QuestionResponseService Integration Summary

*Optimized question response tracking with robust fallbacks and schema compatibility*

## 🎯 Overview

The question response system has been optimized to work with both existing and new database schema, providing robust spaced repetition tracking and progress storage without breaking existing functionality.

## 🗃️ Database Schema Changes

### Enhanced Tables

#### `user_question_responses`
**New columns added (compatible with existing):**
- `user_id` - Direct user reference (not just through attempt_id)
- `selected_answer` - Alias for `user_answer` for service compatibility
- `response_time_ms` - Millisecond precision timing
- `assessment_type` - Quiz type categorization
- `topic_id` - Direct topic association
- `confidence_level` - User confidence (1-5 scale)
- `was_review` - Spaced repetition flag
- `updated_at` - Timestamp tracking

#### `user_question_memory`
**New columns added (compatible with existing):**
- `review_interval` - Alias for `interval_days`
- `ease_factor` - Alias for `easiness_factor` 
- `mastery_level` - 0-100 mastery score
- `average_response_time` - Performance tracking
- `last_confidence_level` - Latest confidence rating
- `last_attempt_date` - Last attempt timestamp
- `updated_at` - Timestamp tracking

### Database Functions

#### `upsert_user_question_response()`
Optimized function for inserting question responses with:
- Automatic attempt_id generation if not provided
- Dual column population (old + new fields)
- Conflict resolution for duplicate responses
- Performance optimized with single operation

#### `upsert_user_question_memory()`
Advanced spaced repetition algorithm implementation:
- Calculates next review intervals using SM-2 algorithm
- Updates mastery levels based on performance
- Handles confidence-based ease factor adjustments
- Returns calculated metrics for immediate use

## 🔧 Service Architecture

### Multi-Layer Fallback Strategy

```typescript
// 1. Try optimized RPC function
const result = await supabase.rpc('upsert_user_question_response', params);

// 2. If RPC fails, try enhanced direct insert
if (error) {
  await supabase.from('user_question_responses').insert(enhancedRecord);
}

// 3. If enhanced fails, use base schema
if (columnError) {
  await supabase.from('user_question_responses').insert(baseRecord);
}
```

### Key Service Methods

#### `recordQuestionResponse(userId, responseData)`
**Main entry point that:**
- Records the question response
- Updates spaced repetition memory
- Calculates mastery levels
- Returns next review date
- Handles partial failures gracefully

#### Response Data Interface
```typescript
interface QuestionResponseData {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  assessmentType?: 'quiz' | 'practice' | 'civics_test' | 'daily_challenge';
  topicId?: string;
  attemptId?: string;
  confidenceLevel?: number; // 1-5 scale
  wasReview?: boolean;
}
```

## 🎮 Usage in Quiz Components

### Basic Integration
```typescript
import { useQuestionResponse } from '@/lib/services/question-response-service';

const { recordResponse } = useQuestionResponse();

const handleAnswerSubmit = async (answer: string, isCorrect: boolean) => {
  const result = await recordResponse(userId, {
    questionId: question.id,
    selectedAnswer: answer,
    isCorrect,
    responseTimeMs: Date.now() - startTime,
    assessmentType: 'quiz',
    topicId: currentTopic.id,
    confidenceLevel: userConfidence
  });

  if (result.success) {
    console.log(`Mastery level: ${result.masteryLevel}`);
    console.log(`Next review: ${result.nextReviewDate}`);
  }
};
```

### Integration with Progress Storage
```typescript
// The service works alongside existing progress storage
const progressManager = createQuizTypeProgress(userId, guestToken, sessionId);

// Save quiz state
progressManager.save(currentQuizState);

// Record individual responses
await recordResponse(userId, responseData);

// Clear progress on completion
progressManager.clear();
```

## 📊 Spaced Repetition Algorithm

### SM-2 Based Implementation
- **Interval 1**: 1 day (first correct answer)
- **Interval 2**: 6 days (second correct answer)  
- **Interval N**: Previous interval × ease factor
- **Ease Factor**: Adjusted by confidence level (-0.2 to +0.2)
- **Failed Reviews**: Reset to 1 day interval

### Mastery Level Calculation
```typescript
masteryLevel = (accuracy × 0.6) + (consistency × 0.3) + (speed × 0.1)
```

Where:
- **Accuracy**: (correct answers / total attempts) × 100
- **Consistency**: (consecutive correct / 5) × 100  
- **Speed**: Bonus for responses under 15 seconds

## 🛡️ Error Handling & Resilience

### Graceful Degradation
- Service never fails completely - always returns a result
- Missing columns are handled with fallbacks
- RPC function failures fall back to direct operations
- Partial failures are logged but don't block user progress

### Performance Monitoring
```typescript
interface QuestionResponseResult {
  success: boolean;
  masteryLevel: number;
  nextReviewDate: Date;
  successfulOperations: number; // Out of totalOperations
  totalOperations: number;
  error?: string;
}
```

## 🔄 Migration Strategy

### Safe Deployment Process
1. **Migration adds new columns** without affecting existing data
2. **Service tries new features first**, falls back to existing functionality
3. **Data syncing** populates new columns from existing data
4. **Backward compatibility** maintained throughout

### Rollback Safety
- All new columns are nullable/have defaults
- Old column data is preserved and synced
- Service works with or without new schema features
- No breaking changes to existing quiz flows

## ✅ Testing & Validation

### Verification Steps
```sql
-- Verify schema migration
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_question_responses' ORDER BY column_name;

-- Test RPC functions
SELECT public.upsert_user_question_response(
  auth.uid()::uuid,
  'test_question',
  'test_answer', 
  true,
  5000,
  'practice'
);
```

### Component Testing
- Test question response recording in isolation
- Verify progress storage integration
- Test spaced repetition calculations
- Validate error handling with schema mismatches

## 🎯 Key Benefits

✅ **Robust Spaced Repetition** - Advanced SM-2 algorithm with confidence adjustments  
✅ **Schema Compatibility** - Works with existing and new database structures  
✅ **Performance Optimized** - RPC functions with direct fallbacks  
✅ **Error Resilient** - Graceful degradation without user impact  
✅ **Progress Preservation** - Never lose user quiz progress  
✅ **Flexible Integration** - Works with all quiz types and components  

## 🚀 Next Steps

1. **Deploy migration** to add new schema columns
2. **Test service integration** with existing quiz components  
3. **Monitor performance** and error rates
4. **Optimize based on usage patterns**
5. **Extend to other assessment types** as needed

---

*This system ensures users never lose progress while providing advanced spaced repetition and mastery tracking capabilities.*

*Last updated: January 2025 - CivicSense Mobile App v2.0* 