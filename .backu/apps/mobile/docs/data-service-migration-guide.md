# CivicSense Mobile Data Service Migration Guide

## 🎯 Goal: Consolidate Scattered Database Operations

You have **multiple data service files** doing similar things with inconsistent patterns. This guide will help you migrate to a single, standardized approach.

## 📋 Current State Analysis

### Existing Files to Consolidate:
- `lib/database.ts` (1449 lines) - Main database operations
- `lib/quiz-data-service.ts` (213 lines) - Quiz-specific operations  
- `lib/data-service.ts` (19k lines) - Another data service attempt
- `lib/content-service.ts` (5k lines) - Content operations
- `lib/cache-service.ts` - Caching utilities
- `lib/standardized-data-service.ts` (882 lines) - **TARGET SERVICE** ✅

### Key Problems Identified:
1. **Field Mapping Inconsistencies**: `topic_title` vs `title`, `topic_id` vs `id`
2. **Questions-Topics Relationship Complexity**: Hard to connect questions to topics consistently
3. **No Standardized Error Handling**: Different error patterns across files
4. **Duplicate Functions**: Multiple functions doing the same thing with slight variations
5. **No Caching Strategy**: Some files cache, others don't

## 🔄 Migration Strategy

### Phase 1: Update Current Components to Use Standardized Service

Replace all current database imports with the standardized service:

```typescript
// ❌ OLD - Multiple inconsistent imports
import { 
  getCategoriesWithTopics, 
  getQuestionsFromDeck, 
  getQuestionTopics,
  getUserProgress 
} from '../lib/database';
import { loadQuizData } from '../lib/quiz-data-service';

// ✅ NEW - Single standardized import
import { 
  fetchCategories, 
  fetchQuestions, 
  fetchTopics,
  fetchUserProgress,
  standardDataService 
} from '../lib/standardized-data-service';
```

### Phase 2: Standardized Response Handling

All functions now return a consistent response shape:

```typescript
// ✅ NEW - Consistent response handling
const response = await fetchCategories();
if (response.error) {
  console.error('Failed to fetch categories:', response.error.message);
  // Handle error with built-in retry logic
  return;
}

const categories = response.data; // Always guaranteed shape
const metadata = response.metadata; // Caching info, count, etc.
```

### Phase 3: Field Mapping Standardization  

The standardized service resolves field inconsistencies:

```typescript
// ✅ NEW - Consistent field access
const topics = await fetchTopics();
topics.data?.forEach(topic => {
  console.log(topic.id);     // Always available
  console.log(topic.title);  // Always available  
  console.log(topic.topic_id); // Also available for compatibility
  console.log(topic.topic_title); // Also available for compatibility
});
```

## 🔧 Component Migration Examples

### 1. HomeScreen Migration

```typescript
// ❌ OLD - app/(tabs)/index.tsx
const loadData = async () => {
  try {
    const categoriesData = await getCategoriesWithTopics();
    setCategories(categoriesData);
    
    if (user) {
      const progressData = await getUserProgress(user.id);
      setUserProgress(progressData);
    }
  } catch (error) {
    console.error('Error loading home data:', error);
  }
};

// ✅ NEW - Standardized approach
const loadData = async () => {
  try {
    const [categoriesResponse, progressResponse] = await Promise.all([
      fetchCategories({ useCache: true }),
      user ? fetchUserProgress(user.id, { useCache: true }) : Promise.resolve({ data: [], error: null })
    ]);

    if (categoriesResponse.error) {
      console.error('Categories error:', categoriesResponse.error);
      // Show user-friendly error, potentially retry
      return;
    }

    if (progressResponse.error) {
      console.error('Progress error:', progressResponse.error);
      // Continue without progress data
    }

    setCategories(categoriesResponse.data || []);
    setUserProgress(progressResponse.data || []);
  } catch (error) {
    console.error('Unexpected error loading home data:', error);
  }
};
```

### 2. Quiz Session Migration

```typescript
// ❌ OLD - app/quiz-session/[id]/_layout.tsx
const loadQuestions = async () => {
  try {
    const questionsData = await getQuestionsFromDeck(id, getQuestionCount());
    setQuestions(questionsData);
  } catch (error) {
    console.error('Error loading questions:', error);
    Alert.alert('Error', 'Failed to load quiz questions. Please try again.');
  }
};

// ✅ NEW - Standardized approach with better error handling
const loadQuestions = async () => {
  try {
    const response = await fetchQuestions(id, { 
      limit: getQuestionCount(),
      randomize: mode === 'speed_round',
      includeTopicInfo: true,
      useCache: true 
    });

    if (response.error) {
      if (response.error.retryable) {
        // Show retry option
        Alert.alert(
          'Loading Questions Failed', 
          response.error.message,
          [
            { text: 'Retry', onPress: loadQuestions },
            { text: 'Back', onPress: () => router.back() }
          ]
        );
      } else {
        Alert.alert('Error', 'Questions not available for this topic.');
        router.back();
      }
      return;
    }

    setQuestions(response.data || []);
    console.log(`✅ Loaded ${response.metadata?.count} questions`);
  } catch (error) {
    console.error('Unexpected error loading questions:', error);
    Alert.alert('Error', 'Failed to load quiz questions. Please try again.');
  }
};
```

### 3. Topic Detail Migration

```typescript
// ❌ OLD - app/topic/[id].tsx
const loadTopicData = async () => {
  try {
    const topicsData = await getQuestionTopics();
    const topicData = topicsData.find(t => t.id === id);
    setTopic(topicData || null);

    if (topicData) {
      const questionsData = await getQuestionsFromDeck(id, 5);
      setQuestions(questionsData);
    }
  } catch (error) {
    console.error('Error loading topic data:', error);
  }
};

// ✅ NEW - Direct topic fetch with related data
const loadTopicData = async () => {
  try {
    const [topicResponse, questionsResponse] = await Promise.all([
      standardDataService.fetchTopicById(id, { includeMetadata: true }),
      fetchQuestions(id, { limit: 5, includeTopicInfo: true })
    ]);

    if (topicResponse.error) {
      console.error('Topic fetch error:', topicResponse.error);
      setTopic(null);
      return;
    }

    setTopic(topicResponse.data);

    if (questionsResponse.error) {
      console.warn('Questions preview error:', questionsResponse.error);
      setQuestions([]); // Continue without preview
    } else {
      setQuestions(questionsResponse.data || []);
    }
  } catch (error) {
    console.error('Error loading topic data:', error);
  }
};
```

## 🗂️ File-by-File Migration Plan

### Step 1: Update Import Statements

Replace all database imports across these files:

1. `app/(tabs)/index.tsx` ✅ 
2. `app/quiz-session/[id]/_layout.tsx` ✅
3. `app/topic/[id].tsx` ✅
4. `components/GameDeckBrowser.tsx`
5. `components/ui/DailyCardStack.tsx`
6. Any other components using old database functions

### Step 2: Update Function Calls

Replace function calls with standardized versions:

```typescript
// Migration mapping
getCategoriesWithTopics() → fetchCategories()
getQuestionTopics() → fetchTopics()
getQuestionsFromDeck() → fetchQuestions()
getUserProgress() → fetchUserProgress()
createGameSession() → standardDataService.createSession()
saveQuestionResponse() → standardDataService.saveResponse()
```

### Step 3: Add Error Handling

Wrap all data operations with proper error handling:

```typescript
// Template for error handling
const response = await fetchDataFunction();
if (response.error) {
  if (response.error.retryable) {
    // Show retry UI
  } else {
    // Show error message and fallback
  }
  return;
}

// Use response.data safely
const data = response.data;
```

### Step 4: Remove Old Files (After Migration)

Once migration is complete:
1. Archive `lib/database.ts` (keep for reference)
2. Remove `lib/quiz-data-service.ts`
3. Remove `lib/data-service.ts`  
4. Remove `lib/content-service.ts`
5. Keep `lib/standardized-data-service.ts` as the single source

## 🔍 Questions-Topics Relationship Fix

The standardized service specifically addresses your questions-topics issues:

### Before (Problematic):
```typescript
// Multiple approaches, inconsistent field mapping
const topics = await getQuestionTopics();
const topic = topics.find(t => t.topic_id === id || t.id === id); // Confusion!
const questions = await getQuestionsFromDeck(topic?.topic_id || topic?.id); // More confusion!
```

### After (Consistent):
```typescript
// Single source of truth, consistent field mapping
const topicResponse = await fetchTopicById(topicId);
const questionsResponse = await fetchQuestions(topicId);

// Always guaranteed field structure:
const topic = topicResponse.data; // Has both .id and .topic_id for compatibility
const questions = questionsResponse.data; // Always linked properly to topic_id
```

## 🎯 Benefits After Migration

1. **Consistent Field Access**: Always use `.id` and `.title`, with compatibility fields available
2. **Standardized Error Handling**: All operations return the same error structure
3. **Built-in Caching**: Smart caching with automatic invalidation
4. **Better TypeScript Support**: Strict typing with proper null handling
5. **Easier Testing**: Predictable response shapes
6. **Single Source of Truth**: One service to maintain instead of 4-5

## 🚀 Quick Start Migration

To get started immediately, update your most problematic component first:

1. **Pick the component with the most questions-topics issues**
2. **Replace imports** with standardized service
3. **Update function calls** to use new response format
4. **Add proper error handling**
5. **Test thoroughly** 
6. **Repeat for other components**

## 🔧 Need Help?

If you encounter issues during migration:
1. Check the response structure: `{ data, error, metadata }`
2. Verify field mapping: Use `.id` and `.title` for standardized access
3. Handle errors properly: Check `response.error` before using `response.data`
4. Use caching: Pass `{ useCache: true }` for frequently accessed data

The standardized service is designed to be a drop-in replacement that solves all the consistency issues while maintaining backward compatibility where needed. 