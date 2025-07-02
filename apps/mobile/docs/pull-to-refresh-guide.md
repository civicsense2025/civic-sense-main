# Pull-to-Refresh System Guide

## Overview

The CivicSense mobile app now includes a comprehensive pull-to-refresh system that integrates with our existing caching infrastructure. This system works anywhere below the app header and provides consistent, efficient data refreshing across all screens.

## Architecture

### Core Components

1. **RefreshService** (`lib/services/refresh-service.ts`)
   - Centralized refresh logic
   - Integrates with React Query cache
   - Manages content cache clearing
   - Handles user-specific data refresh

2. **useRefresh Hook** (`lib/hooks/useRefresh.ts`)
   - React hook for easy component integration
   - Provides specialized hooks for different screen types
   - Manages refresh state and progress

3. **EnhancedRefreshControl** (`components/ui/EnhancedRefreshControl.tsx`)
   - Drop-in replacement for React Native's RefreshControl
   - Pre-configured variants for different screen types
   - Consistent theming and behavior

## Quick Start

### Basic Usage

Replace existing `RefreshControl` with our enhanced version:

```tsx
import { HomeRefreshControl } from '../../components/ui/EnhancedRefreshControl';

// In your ScrollView/FlatList
<ScrollView
  refreshControl={
    <HomeRefreshControl 
      onRefreshComplete={(success, errors) => {
        if (!success && errors) {
          console.warn('Refresh errors:', errors);
        }
      }}
    />
  }
>
  {/* Your content */}
</ScrollView>
```

### Custom Refresh Logic

If you need custom refresh behavior:

```tsx
import { EnhancedRefreshControl } from '../../components/ui/EnhancedRefreshControl';

const handleCustomRefresh = async () => {
  // Your custom refresh logic
  await loadSpecificData();
  await updateLocalState();
};

<ScrollView
  refreshControl={
    <EnhancedRefreshControl 
      onCustomRefresh={handleCustomRefresh}
      refreshOptions={{
        sections: ['categories', 'userProgress'],
        minRefreshDelay: 1500,
      }}
    />
  }
>
```

## Pre-built Refresh Controls

### HomeRefreshControl
- **Use for**: Home/dashboard screens
- **Refreshes**: Categories, daily content, user progress
- **Delay**: 2 seconds between refreshes

```tsx
import { HomeRefreshControl } from '../../components/ui/EnhancedRefreshControl';

<HomeRefreshControl 
  onRefreshComplete={(success) => {
    if (success) {
      // Handle successful refresh
    }
  }}
/>
```

### QuizRefreshControl
- **Use for**: Quiz listing and quiz-related screens
- **Refreshes**: Categories, topics, questions
- **Delay**: 1.5 seconds between refreshes

```tsx
import { QuizRefreshControl } from '../../components/ui/EnhancedRefreshControl';

<QuizRefreshControl />
```

### ProfileRefreshControl
- **Use for**: Profile, saved items, stats screens
- **Refreshes**: User progress, bookmarks, stats, achievements
- **Delay**: 1 second between refreshes

```tsx
import { ProfileRefreshControl } from '../../components/ui/EnhancedRefreshControl';

<ProfileRefreshControl />
```

### QuickRefreshControl
- **Use for**: Simple content updates
- **Refreshes**: Daily content only
- **Delay**: 800ms between refreshes

```tsx
import { QuickRefreshControl } from '../../components/ui/EnhancedRefreshControl';

<QuickRefreshControl />
```

### GlobalRefreshControl
- **Use for**: Settings or admin screens requiring full refresh
- **Refreshes**: All sections
- **Delay**: 5 seconds between refreshes
- **Features**: Progress logging enabled

```tsx
import { GlobalRefreshControl } from '../../components/ui/EnhancedRefreshControl';

<GlobalRefreshControl />
```

## Using the Hook Directly

For more control, use the hook directly:

```tsx
import { useHomeRefresh } from '../../lib/hooks/useRefresh';

export function MyScreen() {
  const { isRefreshing, quickRefresh, canRefresh, progress } = useHomeRefresh();

  const handleManualRefresh = async () => {
    if (!canRefresh) return;
    
    const result = await quickRefresh();
    if (result.success) {
      // Handle success
    }
  };

  return (
    <View>
      <Button 
        title="Refresh" 
        onPress={handleManualRefresh}
        disabled={!canRefresh}
      />
      {isRefreshing && (
        <Text>Refreshing... {Math.round(progress.current * 100)}%</Text>
      )}
    </View>
  );
}
```

## Advanced Configuration

### Custom Sections

Define exactly what data to refresh:

```tsx
import { useRefresh } from '../../lib/hooks/useRefresh';

const { quickRefresh } = useRefresh({
  sections: ['categories', 'userProgress', 'bookmarks'],
  minRefreshDelay: 2000,
  debugProgress: true,
});
```

### Progress Tracking

Monitor refresh progress:

```tsx
const { progress, isRefreshing } = useRefresh({
  debugProgress: true, // Console logging
});

// progress.current: 0-1 (percentage)
// progress.stage: Current operation description
```

## Migration Guide

### From Standard RefreshControl

**Before:**
```tsx
import { RefreshControl } from 'react-native';

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.primary}
    />
  }
>
```

**After:**
```tsx
import { HomeRefreshControl } from '../../components/ui/EnhancedRefreshControl';

<ScrollView
  refreshControl={
    <HomeRefreshControl 
      onCustomRefresh={onRefresh} // Optional: use your existing logic
    />
  }
>
```

### From Custom Refresh Logic

**Before:**
```tsx
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  try {
    await loadData();
    await clearCache();
  } finally {
    setRefreshing(false);
  }
};
```

**After:**
```tsx
import { useRefresh } from '../../lib/hooks/useRefresh';

const { quickRefresh } = useRefresh({
  sections: ['categories', 'topics'],
});

// The hook handles all state management automatically
```

## Refresh Sections Reference

| Section | Description | Use Cases |
|---------|-------------|-----------|
| `categories` | Quiz categories and metadata | Home, Quiz screens |
| `topics` | Quiz topics within categories | Quiz, Topic screens |
| `questions` | Quiz questions and content | Quiz details, Practice |
| `userProgress` | User completion and scores | Profile, Progress screens |
| `bookmarks` | Saved content and snippets | Saved, Bookmarks screens |
| `stats` | User statistics and analytics | Profile, Stats screens |
| `dailyContent` | Daily featured content | Home, Daily screens |
| `achievements` | User badges and achievements | Profile, Achievement screens |

## Performance Considerations

1. **Cooldown Periods**: Each refresh type has a minimum delay to prevent excessive API calls
2. **Smart Caching**: Only refreshes what's necessary based on the screen context
3. **Background Processing**: Uses React Query for efficient cache management
4. **Memory Efficient**: Clears old data appropriately to prevent memory bloat

## Troubleshooting

### Common Issues

**Refresh not working:**
- Check if `RefreshService.initialize(queryClient)` is called in app layout
- Ensure network connectivity
- Check console for error messages

**Too frequent refreshes:**
- Respect the `minRefreshDelay` setting
- Use appropriate refresh control for your screen type

**Missing data after refresh:**
- Verify the correct sections are included in your refresh configuration
- Check network responses in debug console

### Debug Mode

Enable debug logging:

```tsx
const { quickRefresh } = useRefresh({
  debugProgress: true,
});
```

This will log refresh progress and timing information to help diagnose issues.

## Best Practices

1. **Use appropriate refresh controls** for each screen type
2. **Don't override defaults** unless you have specific requirements
3. **Handle errors gracefully** with `onRefreshComplete` callback
4. **Respect cooldown periods** to avoid overwhelming the API
5. **Test on slow networks** to ensure good user experience
6. **Monitor console output** during development for debugging

## Examples

See the following files for implementation examples:
- `app/(tabs)/index.tsx` - Home screen implementation
- `app/(tabs)/quiz.tsx` - Quiz screen implementation  
- `app/(tabs)/profile.tsx` - Profile screen implementation
- `app/(tabs)/saved.tsx` - Saved items implementation

## Support

For questions or issues with the pull-to-refresh system, check the console logs first as they provide detailed information about refresh operations and any errors that occur. 