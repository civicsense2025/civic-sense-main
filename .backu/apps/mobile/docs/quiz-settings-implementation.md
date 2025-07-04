# Quiz Settings Implementation Guide

This guide shows how to implement the new aesthetic and compact quiz settings throughout your CivicSense mobile app.

## 🎨 Design Principles

The new settings system follows these principles:
- **Thumb-First Design**: All controls are optimized for one-handed use
- **Progressive Disclosure**: Basic settings visible, advanced settings in modal
- **Visual Hierarchy**: Important settings are more prominent
- **Instant Feedback**: Changes reflected immediately with smooth animations

## 📦 Components Available

### 1. `QuizSettingsPanel` - Full Modal Experience
The main settings modal with all customization options.

```tsx
import { QuizSettingsPanel, type QuizSettings } from '@/components/quiz/QuizSettingsPanel';

const [settings, setSettings] = useState<QuizSettings>({
  questionCount: 10,
  timeLimit: 30,
  showExplanations: true,
  difficulty: 'normal',
  hints: true,
  autoAdvance: false,
});

<QuizSettingsPanel
  visible={settingsVisible}
  settings={settings}
  onSettingsChange={setSettings}
  onClose={() => setSettingsVisible(false)}
  mode="practice"
/>
```

### 2. `SettingsChip` - Compact Summary Button
Perfect for quiz preparation screens where space is limited.

```tsx
import { SettingsChip } from '@/components/quiz/QuizSettingsPanel';

<SettingsChip
  settings={settings}
  onPress={() => setSettingsVisible(true)}
  style={{ alignSelf: 'flex-start' }}
/>
```

### 3. `SettingsStrip` - Inline Quick Controls
Ideal for active quiz headers or tight spaces.

```tsx
import { SettingsStrip } from '@/components/quiz/QuizSettingsPanel';

<SettingsStrip
  settings={settings}
  onSettingsChange={setSettings}
  compact={true}
/>
```

## 🔄 Integration Steps

### Step 1: Update Quiz Preparation Screens

Replace existing settings UI with the new compact components:

```tsx
// app/quiz/[topicId]/index.tsx
import { SettingsChip, QuizSettingsPanel } from '@/components/quiz/QuizSettingsPanel';

export default function TopicQuizScreen() {
  const [settings, setSettings] = useState<QuizSettings>({
    questionCount: 10,
    timeLimit: 30,
    showExplanations: true,
    difficulty: 'normal',
    hints: true,
    autoAdvance: false,
  });
  
  const handleStartQuiz = () => {
    // Pass settings as URL params
    const params = new URLSearchParams({
      questionCount: settings.questionCount.toString(),
      timeLimit: settings.timeLimit.toString(),
      showExplanations: settings.showExplanations.toString(),
      difficulty: settings.difficulty,
      hints: settings.hints.toString(),
      autoAdvance: settings.autoAdvance.toString(),
    });

    router.push(`/quiz-session/${topicId}?${params.toString()}`);
  };
  
  return (
    <View>
      {/* Topic information */}
      
      {/* Compact settings */}
      <SettingsChip
        settings={settings}
        onPress={() => setSettingsVisible(true)}
      />
      
      {/* Start button */}
      <TouchableOpacity onPress={handleStartQuiz}>
        <Text>Start Quiz</Text>
      </TouchableOpacity>
      
      {/* Full settings modal */}
      <QuizSettingsPanel
        visible={settingsVisible}
        settings={settings}
        onSettingsChange={setSettings}
        onClose={() => setSettingsVisible(false)}
        mode="practice"
      />
    </View>
  );
}
```

### Step 2: Update Quiz Session Headers

Add compact settings to active quiz sessions:

```tsx
// app/quiz-session/[id]/_layout.tsx - Add to header
import { SettingsStrip } from '@/components/quiz/QuizSettingsPanel';

// In your quiz session component
const [quizSettings, setQuizSettings] = useState<QuizSettings>({
  // Initialize from URL params
  questionCount: parseInt(params.questionCount || '10'),
  timeLimit: parseInt(params.timeLimit || '30'),
  showExplanations: params.showExplanations === 'true',
  difficulty: (params.difficulty as 'easy' | 'normal' | 'hard') || 'normal',
  hints: params.hints === 'true',
  autoAdvance: params.autoAdvance === 'true',
});

// In your render:
<View style={styles.quizHeader}>
  {/* Progress bar */}
  
  {/* Quiz info row */}
  <View style={styles.headerRow}>
    <Text>{currentQuestion} of {totalQuestions}</Text>
    <Text>{timeRemaining}s</Text>
    <TouchableOpacity onPress={() => setSettingsVisible(true)}>
      <Ionicons name="settings-outline" />
    </TouchableOpacity>
  </View>
  
  {/* Compact settings strip - only in practice mode */}
  {mode === 'practice' && (
    <SettingsStrip
      settings={quizSettings}
      onSettingsChange={setQuizSettings}
      compact={true}
    />
  )}
</View>
```

### Step 3: Handle Settings in Quiz Logic

Update your quiz logic to use the settings:

```tsx
// Use settings throughout your quiz session
const timePerQuestion = quizSettings.timeLimit;
const shouldShowExplanations = quizSettings.showExplanations;
const allowHints = quizSettings.hints;
const autoAdvanceEnabled = quizSettings.autoAdvance;

// Apply settings to timer
useEffect(() => {
  setTimeRemaining(timePerQuestion);
}, [currentQuestionIndex, timePerQuestion]);

// Apply settings to explanations
const handleAnswerSubmit = (answer: string) => {
  // ... submit logic
  
  if (shouldShowExplanations) {
    setShowExplanation(true);
  }
  
  if (autoAdvanceEnabled) {
    setTimeout(() => {
      goToNextQuestion();
    }, 2000);
  }
};
```

## 🎯 Usage Patterns by Screen

### Quiz Preparation Screens
- **Primary**: `SettingsChip` for compact summary
- **Secondary**: Full `QuizSettingsPanel` modal for detailed customization

### Quiz Session Headers  
- **Primary**: `SettingsStrip` for quick adjustments
- **Secondary**: Minimal settings button for emergency changes

### Dashboard/Menu Screens
- **Primary**: `SettingsStrip` as part of quiz preview cards
- **Secondary**: Quick preset buttons

## ♿ Accessibility Features

All components include:
- Screen reader support with descriptive labels
- Touch targets ≥44pt as per iOS guidelines  
- High contrast mode compatibility
- Voice Control navigation support
- Dynamic Type scaling

## 🎨 Theming Integration

Components automatically adapt to your app's theme:

```tsx
const { theme } = useTheme();

// All components use theme colors:
// - theme.primary for active states
// - theme.card for backgrounds  
// - theme.border for separators
// - theme.foreground/foregroundSecondary for text
```

## 📱 Platform Optimizations

### iOS-Specific Features
- Native switch components with platform styling
- Haptic feedback on setting changes (coming soon)
- Dynamic Island integration for active quizzes (future)

### Android Adaptations
- Material Design 3 switch styling
- Proper focus management for keyboard navigation
- Accessibility service compatibility

## 🚀 Performance Considerations

- Settings changes are debounced to prevent excessive re-renders
- Modal animations use native driver for 60fps performance
- Component memoization prevents unnecessary updates
- Lazy loading for complex setting panels

## 🔧 Customization Options

You can customize the appearance by extending the base styles:

```tsx
<SettingsChip
  settings={settings}
  onPress={onPress}
  style={{
    backgroundColor: 'custom-color',
    borderRadius: 20,
    // Custom styling
  }}
/>
```

## 📊 Analytics Integration

Track settings usage for optimization:

```tsx
const handleSettingsChange = (newSettings: QuizSettings) => {
  setSettings(newSettings);
  
  // Track changes for analytics
  analytics.track('quiz_settings_changed', {
    questionCount: newSettings.questionCount,
    difficulty: newSettings.difficulty,
    timeLimit: newSettings.timeLimit,
  });
};
```

## 🐛 Testing Guidelines

### Unit Tests
- Test each component in isolation
- Verify accessibility properties
- Check theme integration

### Integration Tests  
- Test settings flow from preparation to quiz
- Verify URL parameter handling
- Check state persistence

### E2E Tests
- Full quiz flow with different settings
- Settings changes during active quiz
- Cross-platform compatibility

---

This implementation provides a modern, accessible, and space-efficient way to handle quiz settings throughout your CivicSense mobile app while maintaining the excellent user experience your users expect. 