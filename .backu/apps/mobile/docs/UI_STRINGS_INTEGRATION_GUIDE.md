# UI Strings Integration Guide

## Overview

This guide explains how to integrate the UI strings system into CivicSense mobile app components for consistent internationalization (i18n) support.

## Quick Start

### 1. Import the UI Strings Hook

```tsx
import useUIStrings from '../../lib/hooks/useUIStrings';

const MyComponent = () => {
  const { uiStrings, currentLanguage, setUILanguage } = useUIStrings();
  // ... rest of your component
};
```

### 2. Replace Hardcoded Text

**Before:**
```tsx
<Text>Loading...</Text>
<TouchableOpacity accessibilityLabel="Refresh news">
  <Text>Refresh</Text>
</TouchableOpacity>
```

**After:**
```tsx
<Text>{uiStrings.status.loading}</Text>
<TouchableOpacity accessibilityLabel={uiStrings.actions.refresh}>
  <Text>{uiStrings.actions.refresh}</Text>
</TouchableOpacity>
```

### 3. Handle Alerts and Confirmations

**Before:**
```tsx
Alert.alert('Error', 'Something went wrong');
```

**After:**
```tsx
Alert.alert(uiStrings.status.error, uiStrings.errors.unknownError);
```

## Available UI String Categories

### Navigation
- `uiStrings.navigation.back`
- `uiStrings.navigation.close`
- `uiStrings.navigation.menu`
- `uiStrings.navigation.home`

### Actions
- `uiStrings.actions.save`
- `uiStrings.actions.cancel`
- `uiStrings.actions.refresh`
- `uiStrings.actions.tryAgain`

### Status Messages
- `uiStrings.status.loading`
- `uiStrings.status.saving`
- `uiStrings.status.success`
- `uiStrings.status.error`

### Errors
- `uiStrings.errors.networkError`
- `uiStrings.errors.loadingFailed`
- `uiStrings.errors.savingFailed`

### Translation
- `uiStrings.translation.selectLanguage`
- `uiStrings.translation.helpTranslate`
- `uiStrings.translation.original`

### Accessibility
- `uiStrings.accessibility.skipToContent`
- `uiStrings.accessibility.languageSelector`
- `uiStrings.accessibility.bookmark`

## Integration Examples

### Example 1: Simple Button Component

```tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from '../atoms/Text';
import useUIStrings from '../../lib/hooks/useUIStrings';

interface RefreshButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onPress, isLoading }) => {
  const { uiStrings } = useUIStrings();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      accessibilityLabel={uiStrings.actions.refresh}
    >
      <Text>
        {isLoading ? uiStrings.status.loading : uiStrings.actions.refresh}
      </Text>
    </TouchableOpacity>
  );
};
```

### Example 2: Loading State Component

```tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '../atoms/Text';
import useUIStrings from '../../lib/hooks/useUIStrings';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  const { uiStrings } = useUIStrings();
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>
        {message || uiStrings.status.loading}
      </Text>
    </View>
  );
};
```

### Example 3: Error Handling

```tsx
import React from 'react';
import { Alert } from 'react-native';
import useUIStrings from '../../lib/hooks/useUIStrings';

export const useErrorHandler = () => {
  const { uiStrings } = useUIStrings();
  
  const showNetworkError = () => {
    Alert.alert(
      uiStrings.status.error,
      uiStrings.errors.networkError,
      [
        { text: uiStrings.actions.ok },
        { text: uiStrings.actions.tryAgain, onPress: () => {/* retry logic */} }
      ]
    );
  };
  
  const showGenericError = (customMessage?: string) => {
    Alert.alert(
      uiStrings.status.error,
      customMessage || uiStrings.errors.unknownError
    );
  };
  
  return { showNetworkError, showGenericError };
};
```

### Example 4: Language Switching

```tsx
import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Text } from '../atoms/Text';
import useUIStrings from '../../lib/hooks/useUIStrings';

export const LanguageSwitcher: React.FC = () => {
  const { uiStrings, currentLanguage, setUILanguage } = useUIStrings();
  
  const handleLanguageSwitch = (langCode: string) => {
    Alert.alert(
      uiStrings.translation.selectLanguage,
      `Switch to ${langCode.toUpperCase()}?`,
      [
        { text: uiStrings.actions.cancel, style: 'cancel' },
        {
          text: uiStrings.actions.confirm,
          onPress: () => {
            setUILanguage(langCode);
            Alert.alert(
              uiStrings.status.success,
              uiStrings.translation.languagePreferenceSaved
            );
          }
        }
      ]
    );
  };
  
  return (
    <TouchableOpacity
      onPress={() => handleLanguageSwitch('es')}
      accessibilityLabel={uiStrings.accessibility.languageSelector}
    >
      <Text>{currentLanguage.toUpperCase()}</Text>
    </TouchableOpacity>
  );
};
```

## Best Practices

### 1. Always Use UI Strings for User-Facing Text
❌ **Don't:**
```tsx
<Text>Settings</Text>
<Button title="Save Changes" />
Alert.alert('Error', 'Failed to save');
```

✅ **Do:**
```tsx
<Text>{uiStrings.navigation.settings}</Text>
<Button title={uiStrings.actions.save} />
Alert.alert(uiStrings.status.error, uiStrings.errors.savingFailed);
```

### 2. Use Accessibility Labels
❌ **Don't:**
```tsx
<TouchableOpacity onPress={handleBookmark}>
  <Icon name="bookmark" />
</TouchableOpacity>
```

✅ **Do:**
```tsx
<TouchableOpacity 
  onPress={handleBookmark}
  accessibilityLabel={uiStrings.accessibility.bookmark}
>
  <Icon name="bookmark" />
</TouchableOpacity>
```

### 3. Handle Dynamic Content Properly
❌ **Don't:**
```tsx
<Text>{`${items.length} items found`}</Text>
```

✅ **Do:**
```tsx
// Add to UI strings: itemsFound: "{count} items found"
<Text>{uiStrings.status.itemsFound.replace('{count}', items.length.toString())}</Text>
```

### 4. Use Consistent Error Messages
❌ **Don't:**
```tsx
catch (error) {
  Alert.alert('Oops!', 'Something went wrong');
}
```

✅ **Do:**
```tsx
catch (error) {
  Alert.alert(uiStrings.status.error, uiStrings.errors.unknownError);
}
```

## Adding New UI Strings

### 1. Add to Interface (ui-strings.ts)
```tsx
export interface UIStrings {
  // ... existing sections
  myNewSection: {
    welcomeMessage: string;
    confirmAction: string;
    successMessage: string;
  };
}
```

### 2. Add English Implementation
```tsx
export const uiStrings: UIStrings = {
  // ... existing sections
  myNewSection: {
    welcomeMessage: 'Welcome to CivicSense!',
    confirmAction: 'Are you sure you want to continue?',
    successMessage: 'Action completed successfully',
  },
};
```

### 3. Add to All Language Files
Update each language file (ui-strings-es.ts, ui-strings-zh.ts, etc.) with translations.

## Testing with Different Languages

### 1. Test Layout with Longer Text
Some languages have longer text. Test your layouts:

```tsx
// Test component by temporarily switching languages
const TestComponent = () => {
  const { setUILanguage } = useUIStrings();
  
  useEffect(() => {
    setUILanguage('es'); // Test with Spanish
  }, []);
  
  // ... your component
};
```

### 2. Test RTL Languages (Future)
When adding Arabic or Hebrew support:

```tsx
import { I18nManager } from 'react-native';

// Check if RTL
const isRTL = I18nManager.isRTL;
```

## Common Patterns

### Loading States
```tsx
{isLoading && <Text>{uiStrings.status.loading}</Text>}
{isSaving && <Text>{uiStrings.status.saving}</Text>}
{isConnecting && <Text>{uiStrings.status.connecting}</Text>}
```

### Error States
```tsx
{error && (
  <View>
    <Text>{uiStrings.status.error}</Text>
    <Text>{error.message || uiStrings.errors.unknownError}</Text>
    <Button title={uiStrings.actions.tryAgain} onPress={retry} />
  </View>
)}
```

### Form Validation
```tsx
if (!email) {
  return uiStrings.errors.requiredField;
}
if (!isValidEmail(email)) {
  return uiStrings.errors.invalidInput;
}
```

## Migration Checklist

When converting an existing component:

- [ ] Import `useUIStrings` hook
- [ ] Replace all hardcoded user-facing text
- [ ] Update accessibility labels
- [ ] Update Alert.alert messages
- [ ] Update loading/error states
- [ ] Update button titles and placeholders
- [ ] Test with different languages
- [ ] Verify layout doesn't break with longer text

## Component Examples

See these files for complete examples:
- `apps/mobile/components/examples/LocalizedComponent.tsx` - Complete example
- `apps/mobile/app/topic/[id].tsx` - Language selection modal integration
- `apps/mobile/components/ui/NewsTicker.tsx` - Converted existing component

## Contributing New Strings

1. **Identify the category** - Does it fit in an existing section?
2. **Add to interface** - Update the TypeScript interface
3. **Add English text** - Add to the default implementation
4. **Add translations** - Update all language files
5. **Test thoroughly** - Verify all languages work correctly

## FAQ

**Q: What if I need a string that doesn't exist?**
A: Add it to the UI strings following the steps above. Don't use hardcoded text as a temporary solution.

**Q: How do I handle pluralization?**
A: For now, use simple templates like "X items found". In the future, we may add proper pluralization support.

**Q: Can I use UI strings in StyleSheet?**
A: No, StyleSheet is static. Use inline styles with theme values for dynamic styling.

**Q: How do I test with different languages?**
A: Use the language selector in the app or temporarily call `setUILanguage('es')` in your component.

**Q: What about performance?**
A: The UI strings are loaded once and cached. Switching languages is instant after the initial load.

This system ensures CivicSense can scale to support multiple languages while maintaining consistency and accessibility across the entire app. 