# Enhanced Pull-to-Refresh Examples

## Quick Migration Examples

### Before: Basic RefreshControl

```tsx
import { RefreshControl, ScrollView } from 'react-native';

function OldHomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* content */}
    </ScrollView>
  );
}
```

### After: Enhanced with Visual Indicators

```tsx
import { HomeCivicScrollView } from '../../components/ui/CivicScrollView';

function NewHomeScreen() {
  return (
    <HomeCivicScrollView
      showProgress={true}
      onRefreshComplete={(success, errors) => {
        if (success) {
          console.log('✅ Home refresh completed successfully');
        } else {
          console.warn('⚠️ Refresh had errors:', errors);
        }
      }}
    >
      {/* content - same as before */}
    </HomeCivicScrollView>
  );
}
```

## Screen-Specific Examples

### Home Screen with Civic Indicators

```tsx
import { HomeCivicScrollView } from '../../components/ui/CivicScrollView';

export function HomeScreen() {
  return (
    <HomeCivicScrollView 
      showProgress={true}
      onRefreshComplete={(success) => {
        if (success) {
          // Optionally show success toast
        }
      }}
    >
      {/* Your existing home content */}
      <DailyCardStack />
      <CategoryGrid />
      <FeaturedContent />
    </HomeCivicScrollView>
  );
}
```

### Quiz Screen with Quick Refresh

```tsx
import { QuizCivicScrollView } from '../../components/ui/CivicScrollView';

export function QuizScreen() {
  return (
    <QuizCivicScrollView>
      {/* Quiz content */}
      <QuizCategories />
      <QuizTopics />
    </QuizCivicScrollView>
  );
}
```

### Profile Screen with Progress Tracking

```tsx
import { ProfileCivicScrollView } from '../../components/ui/CivicScrollView';

export function ProfileScreen() {
  return (
    <ProfileCivicScrollView 
      showProgress={true}
      onRefreshComplete={(success, errors) => {
        if (!success && errors) {
          // Handle specific errors
          if (errors.userProgress) {
            console.warn('Failed to refresh user progress');
          }
          if (errors.bookmarks) {
            console.warn('Failed to refresh bookmarks');
          }
        }
      }}
    >
      {/* Profile content */}
      <UserStats />
      <BookmarkedItems />
      <Achievements />
    </ProfileCivicScrollView>
  );
}
```

## Custom Configuration

### Custom Refresh Behavior

```tsx
import { CivicScrollView } from '../../components/ui/CivicScrollView';

export function CustomScreen() {
  const handleCustomRefresh = async () => {
    // Your custom refresh logic
    await loadSpecificData();
    await updateLocalState();
  };

  return (
    <CivicScrollView
      screenType="custom"
      refreshOptions={{
        onCustomRefresh: handleCustomRefresh,
        showProgress: true,
      }}
      refreshMessage="Updating democracy data..."
    >
      {/* Custom content */}
    </CivicScrollView>
  );
}
```

### Using with FlatList

```tsx
import { FlatList } from 'react-native';
import { QuizRefreshControl } from '../../components/ui/EnhancedRefreshControl';
import { QuizRefreshIndicator } from '../../components/ui/CivicRefreshIndicator';
import { useRefresh } from '../../lib/hooks/useRefresh';

export function QuizListScreen() {
  const { isRefreshing, quickRefresh, progress } = useRefresh({
    sections: ['categories', 'topics', 'questions'],
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Custom refresh indicator */}
      <QuizRefreshIndicator
        refreshing={isRefreshing}
        progress={progress.current}
        stage={progress.stage}
      />
      
      <FlatList
        data={quizData}
        renderItem={renderQuizItem}
        refreshControl={
          <QuizRefreshControl
            onRefreshComplete={(success) => {
              console.log('Quiz refresh completed:', success);
            }}
          />
        }
      />
    </View>
  );
}
```

### Advanced Custom Indicator

```tsx
import { CivicRefreshIndicator } from '../../components/ui/CivicRefreshIndicator';
import { useRefresh } from '../../lib/hooks/useRefresh';

export function AdvancedRefreshExample() {
  const { isRefreshing, progress, quickRefresh } = useRefresh({
    sections: ['categories', 'userProgress'],
    debugProgress: true,
  });

  return (
    <ScrollView
      refreshControl={
        <EnhancedRefreshControl
          refreshOptions={{
            sections: ['categories', 'userProgress'],
            minRefreshDelay: 2000,
          }}
        />
      }
    >
      {/* Custom refresh indicator with progress */}
      <CivicRefreshIndicator
        refreshing={isRefreshing}
        progress={progress.current}
        stage={progress.stage}
        message="Empowering democracy with fresh data..."
        showProgress={true}
      />
      
      {/* Your content */}
    </ScrollView>
  );
}
```

## Visual Features

### What Users See

1. **Pull-to-refresh gesture**: Standard iOS/Android pull behavior
2. **Civic-branded indicator**: Shows spinning refresh icon with democracy emoji
3. **Progress feedback**: Real-time progress bar and stage descriptions
4. **Smooth animations**: Scale and fade transitions
5. **Contextual messaging**: Different messages for different screen types

### Progress Stages

The system shows different stages during refresh:

- "Starting refresh..."
- "Clearing query cache..."
- "Refreshing content cache..."
- "Refreshing user progress..."
- "Refreshing bookmarks..."
- "Finalizing..."

### Visual Indicators

- 🔄 **Spinning icon**: Shows activity is in progress
- 🗳️ **Democracy emoji**: CivicSense branding
- **Progress bar**: Shows completion percentage
- **Status text**: Current operation description

## Performance Notes

- **Cooldown periods**: Prevents excessive refresh calls
- **Smart caching**: Only refreshes what's needed
- **Memory efficient**: Clears old data appropriately
- **Network aware**: Handles offline/poor connectivity

## Migration Checklist

- [ ] Replace `RefreshControl` with appropriate `*CivicScrollView`
- [ ] Remove manual refresh state management
- [ ] Add `onRefreshComplete` callback if needed
- [ ] Test pull-to-refresh on both iOS and Android
- [ ] Verify refresh indicators appear and animate properly
- [ ] Check console for refresh progress logs
- [ ] Test offline behavior 