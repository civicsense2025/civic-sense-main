# CivicSense Mobile Style Guide

*Matching the sophisticated web app design aesthetic with WCAG compliance and Apple Human Interface Guidelines*

## Overview

The CivicSense mobile app uses a comprehensive design system that mirrors the web application's sophisticated styling from `globals.css`. This guide covers the enhanced theme system, components, and best practices for maintaining design consistency across platforms.

## Color System

### WCAG 2.2 AA Compliant Colors

Our color system is built on HSL values converted to hex for React Native compatibility, ensuring proper contrast ratios and accessibility compliance.

```typescript
import { useTheme } from '../lib/theme-context';

const Component = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.foreground }}>Primary text</Text>
      <Text style={{ color: theme.foregroundSecondary }}>Secondary text</Text>
    </View>
  );
};
```

### Color Tokens

#### Light Mode
- **Background**: `#FFFFFF` - Main background
- **Foreground**: `#020617` - Primary text
- **Primary**: `#3B82F6` - Brand blue (Authority Blue)
- **Secondary**: `#E2E8F0` - Subtle gray-blue
- **Accent**: `#0EA5E9` - Vibrant cyan
- **Success**: `#10B981` - Green for success states
- **Destructive**: `#EF4444` - Red for errors/destructive actions

#### Dark Mode
- **Background**: `#020617` - Dark background
- **Foreground**: `#F8FAFC` - Light text
- **Primary**: `#60A5FA` - Brighter blue for dark mode
- **Secondary**: `#1E293B` - Dark blue-gray
- **Accent**: `#0EA5E9` - Consistent cyan
- **Success**: `#10B981` - Consistent green
- **Destructive**: `#DC2626` - Darker red for dark mode

## Typography

### iOS Human Interface Guidelines Typography

```typescript
import { typography } from '../lib/theme';

// iOS-specific typography scale
const styles = StyleSheet.create({
  largeTitle: typography.largeTitle,     // 34px, weight 400
  title1: typography.title1,             // 28px, weight 400
  title2: typography.title2,             // 22px, weight 400
  title3: typography.title3,             // 20px, weight 400
  headline: typography.headline,         // 17px, weight 600
  body: typography.body,                 // 17px, weight 400
  callout: typography.callout,           // 16px, weight 400
  subhead: typography.subhead,           // 15px, weight 400
  footnote: typography.footnote,         // 13px, weight 400
  caption1: typography.caption1,         // 12px, weight 400
  caption2: typography.caption2,         // 11px, weight 400
});
```

### Web-Compatible Typography

```typescript
// Web-compatible sizes for consistency
const webStyles = StyleSheet.create({
  xs: typography.xs,         // 12px
  sm: typography.sm,         // 14px
  base: typography.base,     // 16px
  lg: typography.lg,         // 18px
  xl: typography.xl,         // 20px
  '2xl': typography['2xl'], // 24px
  '3xl': typography['3xl'], // 30px
  '4xl': typography['4xl'], // 36px
  '5xl': typography['5xl'], // 48px
  '6xl': typography['6xl'], // 60px
});
```

## Spacing System

### Apple-Inspired Spacing Scale

```typescript
import { spacing, getSpacing } from '../lib/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],           // 16px
    marginBottom: spacing[6],      // 24px
    gap: spacing[3],              // 12px
  },
  
  // Using utility function
  header: {
    paddingTop: getSpacing(8),    // 32px
    paddingHorizontal: getSpacing(6), // 24px
  },
});

// Available spacing values:
// spacing[1] = 4px   | spacing.xs = 4px
// spacing[2] = 8px   | spacing.sm = 8px
// spacing[3] = 12px  | spacing.md = 12px
// spacing[4] = 16px  | spacing.lg = 16px
// spacing[5] = 20px  | spacing.xl = 20px
// spacing[6] = 24px  | spacing['2xl'] = 24px
// spacing[8] = 32px  | spacing['3xl'] = 32px
// spacing[10] = 40px | spacing['4xl'] = 40px
// spacing[12] = 48px | spacing['5xl'] = 48px
// spacing[16] = 64px | spacing['6xl'] = 64px
// spacing[20] = 80px
// spacing[24] = 96px
```

## Shadows and Elevation

### iOS-Style Shadows

```typescript
import { shadows } from '../lib/theme';

const styles = StyleSheet.create({
  card: {
    ...shadows.ios.card,          // Large card shadow
  },
  button: {
    ...shadows.ios.small,         // Subtle button shadow
  },
  modal: {
    ...shadows.ios.large,         // Prominent modal shadow
  },
  
  // Web-compatible shadows
  subtle: shadows.sm,             // Minimal shadow
  moderate: shadows.md,           // Standard shadow
  prominent: shadows.lg,          // Strong shadow
  dramatic: shadows.xl,           // Maximum shadow
});
```

## Component Usage

### Enhanced Card Component

```typescript
import { Card, ElevatedCard, OutlinedCard, GlassCard, MultiplayerCard } from '../components/ui/Card';

// Basic usage
<Card>
  <Text>Default card with subtle shadow</Text>
</Card>

// Variants
<ElevatedCard size="lg" onPress={() => {}}>
  <Text>Elevated card with press handling</Text>
</ElevatedCard>

<OutlinedCard variant="outlined">
  <Text>Outlined card with border</Text>
</OutlinedCard>

<GlassCard>
  <Text>Glass card with transparency</Text>
</GlassCard>

<MultiplayerCard>
  <Text>Multiplayer-themed card</Text>
</MultiplayerCard>
```

### Enhanced Button Component

```typescript
import { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  OutlinedButton, 
  GhostButton,
  DestructiveButton,
  SuccessButton 
} from '../components/Button';

// Primary button (default)
<PrimaryButton 
  title="Get Started" 
  onPress={handlePress}
  size="lg"
  fullWidth
/>

// Secondary button
<SecondaryButton 
  title="Learn More" 
  onPress={handlePress}
  icon={<Icon name="arrow-right" />}
  iconPosition="right"
/>

// Outlined button
<OutlinedButton 
  title="Cancel" 
  onPress={handleCancel}
  size="sm"
/>

// Ghost button
<GhostButton 
  title="Skip" 
  onPress={handleSkip}
/>

// Destructive action
<DestructiveButton 
  title="Delete Account" 
  onPress={handleDelete}
  loading={isDeleting}
/>

// Success action
<SuccessButton 
  title="Complete Quiz" 
  onPress={handleComplete}
/>
```

## Accessibility Features

### Minimum Touch Targets

All interactive elements meet iOS accessibility requirements:

```typescript
import { accessibility } from '../lib/theme';

const styles = StyleSheet.create({
  button: {
    minHeight: accessibility.minTouchTarget, // 44px minimum
    minWidth: accessibility.minTouchTarget,
  },
});
```

### Focus Management

```typescript
// Proper accessibility props
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Start Quiz"
  accessibilityHint="Begins the civic knowledge quiz"
  accessibilityRole="button"
  accessibilityState={{ disabled: false }}
>
  <Text>Start Quiz</Text>
</TouchableOpacity>
```

## Color Utilities

### Color Manipulation

```typescript
import { hexToRgba, darken, lighten } from '../lib/theme';

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: hexToRgba('#000000', 0.5), // Black with 50% opacity
  },
  hoverState: {
    backgroundColor: darken('#3B82F6', 10),     // Darken blue by 10%
  },
  lightVariant: {
    backgroundColor: lighten('#3B82F6', 20),    // Lighten blue by 20%
  },
});
```

## Animation Guidelines

### Apple-Inspired Timing

```typescript
import { animations } from '../lib/theme';

// Animation durations
const fadeIn = {
  duration: animations.duration.fast,      // 200ms
  easing: animations.easing.easeOut,       // [0.4, 0.0, 0.2, 1]
};

const slideUp = {
  duration: animations.duration.normal,    // 300ms
  easing: animations.easing.spring,        // [0.175, 0.885, 0.32, 1.275]
};
```

## Best Practices

### 1. Consistent Theming

Always use theme values instead of hardcoded colors:

```typescript
// ✅ Good
const { theme } = useTheme();
<View style={{ backgroundColor: theme.card }}>

// ❌ Bad
<View style={{ backgroundColor: '#FFFFFF' }}>
```

### 2. Responsive Spacing

Use the spacing scale for consistent layouts:

```typescript
// ✅ Good
<View style={{ padding: spacing[4], margin: spacing[2] }}>

// ❌ Bad
<View style={{ padding: 16, margin: 8 }}>
```

### 3. Typography Hierarchy

Use the typography scale for consistent text sizing:

```typescript
// ✅ Good
<Text style={[typography.headline, { color: theme.foreground }]}>

// ❌ Bad
<Text style={{ fontSize: 17, fontWeight: '600' }}>
```

### 4. Accessibility First

Always include proper accessibility props:

```typescript
// ✅ Good
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Close modal"
  accessibilityRole="button"
>

// ❌ Bad
<TouchableOpacity onPress={close}>
```

### 5. Dark Mode Support

Test all components in both light and dark modes:

```typescript
const { theme, isDark } = useTheme();

// Conditional styling for dark mode
const dynamicStyles = {
  border: {
    borderColor: isDark ? theme.border : theme.foregroundMuted,
  },
};
```

## Component Style Presets

### Pre-configured Styles

```typescript
import { componentStyles } from '../lib/theme';

const styles = StyleSheet.create({
  card: {
    ...componentStyles.card,
    backgroundColor: theme.card,
  },
  primaryButton: {
    ...componentStyles.button.primary,
    backgroundColor: theme.primary,
  },
  input: {
    ...componentStyles.input,
    backgroundColor: theme.input,
    borderColor: theme.border,
  },
  modal: {
    ...componentStyles.modal,
    backgroundColor: theme.card,
  },
});
```

## Multiplayer Theme

### Special Multiplayer Styling

```typescript
const { theme } = useTheme();

const multiplayerStyles = StyleSheet.create({
  background: {
    backgroundColor: theme.multiplayerBg,
  },
  card: {
    backgroundColor: theme.multiplayerCard,
    borderColor: theme.multiplayerBorder,
  },
  accent: {
    backgroundColor: theme.multiplayerAccent,
  },
  accentLight: {
    backgroundColor: theme.multiplayerAccentLight,
  },
});
```

## Testing

### Theme Testing

```typescript
// Test both light and dark themes
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Button title="Toggle Theme" onPress={toggleTheme} />
    </View>
  );
};
```

### Accessibility Testing

- Test with VoiceOver (iOS) enabled
- Verify minimum touch target sizes (44x44px)
- Check color contrast ratios
- Test keyboard navigation
- Verify screen reader announcements

## Migration from Old Theme

### Updating Existing Components

```typescript
// Old theme usage
const oldStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
  },
});

// New theme usage
const newStyles = StyleSheet.create({
  container: {
    backgroundColor: theme.background,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.ios.card,
  },
});
```

### Color Mapping

| Old Color | New Color |
|-----------|-----------|
| `colors.primary` | `theme.primary` |
| `colors.white` | `theme.background` |
| `colors.neutral[900]` | `theme.foreground` |
| `colors.neutral[600]` | `theme.foregroundSecondary` |
| `colors.success` | `theme.success` |
| `colors.error` | `theme.destructive` |

This style guide ensures consistent, accessible, and beautiful design across the CivicSense mobile application while maintaining compatibility with the web app's sophisticated aesthetic. 