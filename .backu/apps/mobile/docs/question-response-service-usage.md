# Question Response Service Usage Guide

> **CivicSense Mission**: Every question response makes users harder to manipulate by building civic knowledge that reveals how power actually works.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Service Features](#service-features)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Database Tables Affected](#database-tables-affected)
6. [Spaced Repetition Algorithm](#spaced-repetition-algorithm)
7. [Examples](#examples)
8. [Best Practices](#best-practices)

---

## Overview

The `QuestionResponseService` is a comprehensive utility that handles all aspects of user question responses in the CivicSense mobile app. When a user answers any question, this service:

- **Records the response** in `user_question_responses`
- **Updates spaced repetition** memory in `user_question_memory`
- **Tracks assessment performance** in `user_assessment_questions` and `assessment_question_stats`
- **Collects feedback** in `question_feedback` and `question_feedback_stats`
- **Updates analytics** in `question_analytics`

## Service Features

### ✅ Core Tracking
- Response correctness and timing
- Assessment type classification
- Collection and topic association
- User confidence levels

### 🧠 Spaced Repetition
- Modified SM-2 algorithm optimized for civic education
- Adaptive review scheduling based on performance
- Mastery level calculation
- Confidence-based ease factor adjustments

### 📊 Assessment Analytics
- Performance tracking across different assessment types
- Aggregated statistics for question difficulty analysis
- User progress benchmarking

### 💬 Quality Feedback
- User feedback collection (clarity, bias, accuracy)
- Crowdsourced question quality improvement
- Automated flagging of problematic questions

---

## Basic Usage

### Import the Service

```typescript
import { 
  QuestionResponseService, 
  useQuestionResponse, 
  type QuestionResponseData 
} from '../lib/services/question-response-service';
```

### Record a Question Response

```typescript
// Using the React hook (recommended for components)
const { recordResponse } = useQuestionResponse();

const handleAnswerSubmit = async (selectedAnswer: string, isCorrect: boolean) => {
  const responseData: QuestionResponseData = {
    questionId: 'q_123',
    selectedAnswer,
    isCorrect,
    responseTimeMs: 5000,
    assessmentType: 'quiz',
    collectionId: 'constitutional_law',
    topicId: 'first_amendment',
    confidenceLevel: 4 // 1-5 scale
  };

  const result = await recordResponse(user.id, responseData);
  
  if (result.success) {
    console.log('Next review:', result.nextReviewDate);
    console.log('Mastery level:', result.masteryLevel);
  }
};
```

### Direct Service Usage (Non-React contexts)

```typescript
// Direct service call
const result = await QuestionResponseService.recordQuestionResponse(userId, responseData);
```

---

## Advanced Features

### 1. Spaced Repetition Integration

```typescript
// Get questions due for review
const { getReviewQuestions } = useQuestionResponse();

const reviewQuestions = await getReviewQuestions(user.id, 10);
// Returns: [{ questionId, masteryLevel, daysSinceLastReview }]

// Mark a question as a review attempt
const responseData: QuestionResponseData = {
  questionId: 'q_123',
  selectedAnswer: 'A',
  isCorrect: true,
  responseTimeMs: 3000,
  wasReview: true, // Important for spaced repetition
  confidenceLevel: 5
};
```

### 2. Feedback Collection

```typescript
const responseData: QuestionResponseData = {
  questionId: 'q_123',
  selectedAnswer: 'B',
  isCorrect: false,
  responseTimeMs: 8000,
  
  // Collect user feedback about question quality
  feedback: {
    clarityRating: 2, // 1-5 scale
    feedbackType: 'unclear',
    feedbackText: 'The wording is confusing and could be interpreted multiple ways'
  }
};
```

### 3. Assessment Type Tracking

```typescript
// Different assessment types for different analytics
const assessmentTypes = [
  'quiz',           // Regular learning quizzes
  'practice',       // Practice mode (no formal scoring)
  'civics_test',    // Official civics test preparation
  'daily_challenge' // Daily civic knowledge challenges
];

const responseData: QuestionResponseData = {
  questionId: 'q_123',
  selectedAnswer: 'C',
  isCorrect: true,
  responseTimeMs: 4500,
  assessmentType: 'civics_test', // Tracks formal assessment performance
  collectionId: 'citizenship_prep'
};
```

### 4. Mastery Analytics

```typescript
// Get user's overall mastery statistics
const { getMasteryStats } = useQuestionResponse();

const masteryStats = await getMasteryStats(user.id);
// Returns topic-wise mastery levels, weak areas, strengths
```

---

## Database Tables Affected

| Table | Purpose | What Gets Updated |
|-------|---------|-------------------|
| `user_question_responses` | Individual response records | Every response with full context |
| `user_question_memory` | Spaced repetition tracking | Review intervals, mastery levels, ease factors |
| `user_assessment_questions` | Assessment performance | Formal assessment responses only |
| `assessment_question_stats` | Aggregated assessment data | Question difficulty, average performance |
| `question_analytics` | Question-level analytics | Response patterns, timing data |
| `question_feedback` | User feedback on questions | Quality ratings and comments |
| `question_feedback_stats` | Aggregated feedback data | Average ratings, feedback counts |

---

## Spaced Repetition Algorithm

The service uses a modified SM-2 algorithm optimized for civic education:

### Key Features:
- **Confidence-based adjustments**: Higher confidence = longer intervals
- **Civic knowledge optimization**: Max 180-day intervals (civic info changes)
- **Mastery calculation**: Combines accuracy, speed, and consistency
- **Democratic focus**: Prioritizes retention of power structure knowledge

### Algorithm Details:

```typescript
// Interval calculation
if (isCorrect) {
  if (consecutiveCorrect === 0) interval = 1 day
  else if (consecutiveCorrect === 1) interval = 3 days  
  else interval = previousInterval * easeFactor
} else {
  interval = 1 day // Reset on wrong answer
}

// Ease factor adjustment
easeFactor += (confidenceLevel - 3) * 0.1
easeFactor = Math.max(1.3, easeFactor) // Minimum ease

// Mastery level (0-100)
mastery = (accuracy * 0.5) + (speed * 0.3) + (consistency * 0.2)
```

---

## Examples

### Example 1: Quiz Component Integration

```typescript
import React, { useState } from 'react';
import { useQuestionResponse } from '../lib/services/question-response-service';

export const CivicQuizQuestion = ({ question, onComplete }) => {
  const { recordResponse } = useQuestionResponse();
  const [startTime] = useState(Date.now());
  
  const handleAnswer = async (selectedAnswer: string, isCorrect: boolean) => {
    const result = await recordResponse(user.id, {
      questionId: question.id,
      selectedAnswer,
      isCorrect,
      responseTimeMs: Date.now() - startTime,
      assessmentType: 'quiz',
      collectionId: question.collectionId,
      topicId: question.topicId,
      confidenceLevel: userConfidence // from UI slider
    });
    
    if (result.shouldShowFeedback) {
      showCelebration(`🎉 ${result.masteryLevel}% mastery!`);
    }
    
    onComplete(result);
  };
  
  return (
    <QuestionComponent 
      question={question}
      onAnswer={handleAnswer}
    />
  );
};
```

### Example 2: Spaced Repetition Review Session

```typescript
export const ReviewSession = () => {
  const { getReviewQuestions, recordResponse } = useQuestionResponse();
  const [reviewQuestions, setReviewQuestions] = useState([]);
  
  useEffect(() => {
    loadReviewQuestions();
  }, []);
  
  const loadReviewQuestions = async () => {
    const questions = await getReviewQuestions(user.id, 10);
    setReviewQuestions(questions);
  };
  
  const handleReviewAnswer = async (questionId: string, isCorrect: boolean) => {
    await recordResponse(user.id, {
      questionId,
      selectedAnswer: userSelection,
      isCorrect,
      responseTimeMs: responseTime,
      wasReview: true, // Important for spaced repetition
      assessmentType: 'practice'
    });
    
    // Remove from review queue
    setReviewQuestions(prev => prev.filter(q => q.questionId !== questionId));
  };
  
  return (
    <ReviewInterface 
      questions={reviewQuestions}
      onAnswer={handleReviewAnswer}
    />
  );
};
```

### Example 3: Feedback Collection

```typescript
export const QuestionFeedbackModal = ({ questionId, onSubmit }) => {
  const [feedback, setFeedback] = useState({
    clarityRating: 3,
    feedbackType: 'unclear',
    feedbackText: ''
  });
  
  const handleSubmit = async () => {
    await recordResponse(user.id, {
      questionId,
      selectedAnswer: 'N/A', // Feedback-only submission
      isCorrect: false,
      responseTimeMs: 0,
      feedback
    });
    
    onSubmit();
  };
  
  return (
    <FeedbackForm 
      feedback={feedback}
      onChange={setFeedback}
      onSubmit={handleSubmit}
    />
  );
};
```

---

## Best Practices

### 1. Always Provide Context
```typescript
// ✅ Good - provides full context
const responseData = {
  questionId: 'q_123',
  selectedAnswer: 'A',
  isCorrect: true,
  responseTimeMs: 4500,
  assessmentType: 'civics_test',
  collectionId: 'constitutional_law',
  topicId: 'first_amendment',
  confidenceLevel: 4
};

// ❌ Bad - missing context
const responseData = {
  questionId: 'q_123',
  selectedAnswer: 'A',
  isCorrect: true,
  responseTimeMs: 4500
};
```

### 2. Handle Errors Gracefully
```typescript
const result = await recordResponse(user.id, responseData);

if (!result.success) {
  // Don't block user progress for tracking failures
  console.error('Failed to record response:', result.error);
  // Continue with quiz/assessment
  proceedToNextQuestion();
} else {
  // Use the tracking data to enhance UX
  showMasteryProgress(result.masteryLevel);
  scheduleNextReview(result.nextReviewDate);
}
```

### 3. Respect User Privacy
```typescript
// Only collect feedback when user explicitly provides it
if (userProvidedFeedback) {
  responseData.feedback = {
    clarityRating: userRating,
    feedbackType: userSelectedType,
    feedbackText: userComment
  };
}

// Don't infer sensitive information
// ❌ Don't do this:
// responseData.politicalAffiliation = inferFromAnswers(responses);
```

### 4. Optimize Performance
```typescript
// Batch multiple responses when possible
const responses = await Promise.allSettled([
  recordResponse(user.id, response1),
  recordResponse(user.id, response2),
  recordResponse(user.id, response3)
]);

// Handle partial failures gracefully
responses.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.error(`Response ${index} failed:`, result.reason);
  }
});
```

### 5. Democratic Mission Alignment
```typescript
// Use mastery levels to guide civic engagement
if (result.masteryLevel >= 80) {
  suggestCivicAction({
    type: 'contact_representative',
    topic: responseData.topicId,
    message: 'You know enough to make your voice heard!'
  });
}

// Connect learning to real-world impact
if (result.shouldShowFeedback) {
  showImpactMessage(
    'Your growing civic knowledge makes you harder to manipulate ' +
    'and more effective at holding power accountable.'
  );
}
```

---

## Error Handling

The service is designed to fail gracefully:

```typescript
// Service handles missing RPC functions
// Service continues if optional features fail
// Critical features (response recording) prioritized
// Detailed error logging for debugging

const result = await recordResponse(user.id, responseData);

// Always check success before using result data
if (result.success) {
  // Use result.masteryLevel, result.nextReviewDate, etc.
} else {
  // Log error but don't break user experience
  console.error('Response tracking failed:', result.error);
}
```

---

**Remember**: Every question response is an opportunity to advance democratic participation. The data we collect should empower users to engage more effectively with power structures, not just optimize for engagement metrics. 