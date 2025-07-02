# Quiz Double Loading Fix

## Problem Summary

The quiz session was loading twice, causing conflicts and infinite loading states. The logs showed:

```
LOG  🎮 Mobile Quiz: Initial load triggered for: pentagon-dmsp-termination-2025
LOG  🎮 Mobile Quiz: Already loading, skipping duplicate request
```

## Root Causes

1. **Parameter Instability**: Search parameters were being re-parsed on every render due to dependency array issues
2. **State Race Conditions**: Using `useState` for initialization tracking created race conditions
3. **Multiple Effect Triggers**: The `useEffect` for loading was running multiple times with different parameter values
4. **Circular Dependencies**: The `loadQuizData` callback had circular dependencies causing re-creation

## Solutions Implemented

### 1. **Stabilized Search Parameters**
```typescript
// Before: Unstable dependency array
const searchParams = useMemo(() => {
  // ... parsing logic
}, [params]); // This caused re-creation on every render

// After: Stable dependency array
const searchParams = useMemo(() => {
  // ... parsing logic
}, [
  params.mode, 
  params.timeLimit, 
  params.showExplanations, 
  params.questionCount, 
  params.hints, 
  params.enableTranslation, 
  params.selectedLanguage, 
  params.topicTitle
]); // Only re-create when specific params change
```

### 2. **Ref-Based Initialization Tracking**
```typescript
// Before: State-based tracking (race conditions)
const [isInitialized, setIsInitialized] = useState(false);

// After: Ref-based tracking (no race conditions)
const initializationRef = useRef({
  isInitialized: false,
  currentQuizId: '',
  isLoading: false
});
```

### 3. **Enhanced Loading Guards**
```typescript
// Multiple checks to prevent duplicate loads:
if (initializationRef.current.isLoading) {
  console.log('🎮 Mobile Quiz: Already loading, skipping duplicate request');
  return;
}

if (questions.length > 0 && topic?.topic_id === quizId && initializationRef.current.currentQuizId === quizId) {
  console.log('🎮 Mobile Quiz: Questions already loaded for this quiz, skipping');
  return;
}
```

### 4. **Quiz ID Change Detection**
```typescript
// Reset initialization when quiz ID changes
useEffect(() => {
  if (quizId && quizId !== initializationRef.current.currentQuizId) {
    console.log('🎮 Mobile Quiz: Quiz ID changed, resetting initialization');
    initializationRef.current.isInitialized = false;
    initializationRef.current.isLoading = false;
    initializationRef.current.currentQuizId = quizId;
  }
}, [quizId]);
```

### 5. **Simplified Dependency Arrays**
```typescript
// Removed circular dependencies from loadQuizData callback
const loadQuizData = useCallback(async () => {
  // ... implementation
}, [quizId, searchParams.questionCount, searchParams.topicTitle]);

// Simplified useEffect dependencies
useEffect(() => {
  if (quizId && quizId !== 'unknown' && questions.length === 0 && !initializationRef.current.isInitialized) {
    console.log('🎮 Mobile Quiz: Initial load triggered for:', quizId);
    initializationRef.current.isInitialized = true;
    loadQuizData();
  }
}, [quizId, loadQuizData]); // Only essential dependencies
```

## Expected Results

After these fixes, the quiz should:

1. ✅ Load only once per quiz session
2. ✅ Handle parameter changes without re-loading
3. ✅ Prevent race conditions between multiple renders
4. ✅ Properly reset when navigating to different quizzes
5. ✅ Maintain stable performance without infinite loops

## Testing Verification

The fix should eliminate these log patterns:
- ❌ `Already loading, skipping duplicate request`
- ❌ Multiple `Initial load triggered` messages for the same quiz
- ❌ Parameter mismatches between loads

And show clean loading patterns:
- ✅ Single `Initial load triggered` per quiz
- ✅ Consistent parameters throughout the session
- ✅ Proper reset when quiz ID changes

## CivicSense Mission Alignment

This fix ensures that civic education content loads reliably and efficiently, preventing user frustration and maintaining engagement with democratic learning. Every technical improvement supports our mission to make citizens "harder to manipulate, more difficult to ignore, and impossible to fool." 