# TopicInfoScreen Component

A comprehensive mobile topic detail screen that provides rich information about quiz topics, including "why this matters" content and aggregated sources from all questions within the topic.

## Features

### 📖 "Why This Matters" Content
- Parses structured HTML content into organized blurbs with emojis
- Mobile-optimized card layout with proper typography
- Automatic content parsing for bullet points and structured text
- Fallback to raw content if parsing fails

### 📚 Sources & Citations Aggregation
- Automatically aggregates sources from all questions within a topic
- Deduplicates sources across multiple questions
- Shows which questions each source is used in
- Tappable source URLs that open in the browser
- Loading states while sources are being processed

### 🎨 Mobile-Optimized Design
- iOS design guidelines compliance
- Responsive design that works across device sizes
- Proper touch targets (44pt minimum)
- Smooth animations and transitions
- Comprehensive accessibility support

### 📱 Tabbed Interface
- Native mobile tab switching between "Why This Matters" and "Sources"
- Source count badge on the Sources tab
- Smooth tab transitions with proper iOS styling

## Usage

### As a Screen Route
The component automatically integrates with Expo Router when placed at `/topic/[id].tsx`:

```typescript
import React from 'react';
import { TopicInfoScreen } from '../../components/ui/TopicInfoScreen';

export default function TopicDetailScreen() {
  return <TopicInfoScreen />;
}
```

### As a Component with Props
```typescript
import { TopicInfoScreen } from '../components/ui/TopicInfoScreen';

<TopicInfoScreen 
  topicId="topic-123"
  showStartButton={true}
  onStartQuiz={() => {
    // Custom quiz start handler
    router.push(`/quiz-session/${topicId}?mode=practice`);
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `topicId` | `string` | Route param | ID of the topic to display |
| `showStartButton` | `boolean` | `true` | Whether to show the "Start Quiz" button |
| `onStartQuiz` | `function` | Auto-navigation | Custom handler for quiz start |

## Data Requirements

The component expects topics to have:
- `why_this_matters`: HTML content explaining topic importance
- `emoji`: Display emoji for the topic
- `title`: Topic title
- `description`: Optional topic description
- Associated questions with `sources` arrays

## Integration

### Quiz Screen Integration
The quiz listing screen now navigates to topic detail screens instead of directly starting quizzes:

```typescript
const handleStartQuiz = (topic: StandardTopic) => {
  const topicId = topic.topic_id || topic.id;
  // Navigate to topic detail screen first
  router.push(`/topic/${topicId}`);
};
```

### Data Service Updates
Enhanced the standardized data service to include:
- `why_this_matters` field in StandardTopic interface
- `emoji` field for topic display
- Proper source aggregation from questions

## Responsive Design

The component adapts to different screen sizes:
- **Mobile (< 768px)**: Single column, compact spacing
- **Small (768px - 1024px)**: Improved typography, larger touch targets
- **Medium+ (> 1024px)**: Enhanced layouts with optimal content width

## Loading States

- **Topic Loading**: Full-screen spinner while topic data loads
- **Sources Loading**: Inline spinner in sources tab while questions load
- **Error States**: Comprehensive error handling with retry buttons

## Accessibility

- Proper semantic markup with roles and labels
- iOS VoiceOver compatibility
- High contrast color support
- Large touch targets (44pt minimum)
- Screen reader announcements for dynamic content

## Performance

- Intelligent caching of topic and question data
- Lazy loading of sources (only when tab is accessed)
- Optimized re-renders with proper memoization
- Efficient source deduplication algorithms

## Error Handling

- Network error recovery with retry mechanisms
- Graceful fallbacks for missing content
- Clear error messages for users
- Automatic retry on transient failures

This component transforms the basic topic listing into a rich, educational experience that helps users understand why each civic topic matters before they start learning about it. 