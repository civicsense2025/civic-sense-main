# Gluestack UI Integration - CivicSense Mobile App

## Overview

This document outlines the integration of Gluestack UI components into the CivicSense mobile app. Due to package compatibility issues with Gluestack UI v2, we've implemented a hybrid approach using React Native primitives with Gluestack UI/NativeWind styling principles.

## Architecture

### Hybrid Approach
- **React Native Components**: Core functionality using TouchableOpacity, View, Text, TextInput
- **CivicSense Styling**: Custom design tokens aligned with CivicSense brand
- **NativeWind Support**: Tailwind CSS utilities for rapid styling
- **Gluestack UI Principles**: Component API design following Gluestack UI patterns

## Installation

### Packages Installed
```bash
npm install @gluestack-ui/provider @gluestack-ui/config @gluestack-ui/button @gluestack-ui/input @gluestack-ui/avatar @gluestack-ui/icon @gluestack-ui/pressable @gluestack-ui/progress @gluestack-ui/spinner @gluestack-ui/toast @gluestack-ui/checkbox @gluestack-ui/switch @gluestack-ui/tabs @gluestack-ui/overlay @gluestack-ui/tooltip @gluestack-ui/transitions nativewind --legacy-peer-deps
```

### Configuration Files

#### `tailwind.config.js`
```javascript
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'civic-blue': '#3B82F6',
        'civic-green': '#10B981', 
        'civic-gold': '#F59E0B',
        'civic-gray': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display': ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

#### `metro.config.js`
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { 
  input: './global.css',
  inlineRem: 16,
});
```

#### `global.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CivicSense Component Classes */
.btn-civic-primary {
  background-color: #3B82F6;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
}

.card-civic {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

## Components

### CivicButton

A customizable button component with CivicSense branding.

#### Props
```typescript
interface CivicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}
```

#### Usage
```typescript
import { CivicButton } from '../components/gluestack/CivicButton';

<CivicButton
  title="Get Started"
  variant="primary"
  size="lg"
  onPress={() => console.log('Button pressed')}
/>
```

#### Variants
- **primary**: CivicSense blue background (#3B82F6)
- **secondary**: CivicSense green background (#10B981)
- **outline**: Transparent background with colored border
- **ghost**: Transparent background with colored text

### CivicCard

A flexible card component for content containers.

#### Props
```typescript
interface CivicCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}
```

#### Usage
```typescript
import { CivicCard } from '../components/gluestack/CivicCard';

<CivicCard variant="elevated" padding="lg">
  <Text>Card content goes here</Text>
</CivicCard>
```

#### Variants
- **default**: Basic card with subtle shadow
- **elevated**: Enhanced shadow for prominence
- **outlined**: Border instead of shadow
- **ghost**: Transparent background

### CivicInput

A comprehensive input component with validation support.

#### Props
```typescript
interface CivicInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### Usage
```typescript
import { CivicInput } from '../components/gluestack/CivicInput';

<CivicInput
  label="Email Address"
  placeholder="Enter your email"
  variant="filled"
  size="lg"
  isRequired
  error="Please enter a valid email"
/>
```

## Design Tokens

### Colors
```typescript
const civicTokens = {
  colors: {
    primary: '#3B82F6',      // Authority Blue
    secondary: '#10B981',    // Empowerment Green
    gold: '#F59E0B',         // Insight Gold
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
};
```

## Testing

### Test Component
A comprehensive test component (`TestComponent.tsx`) demonstrates all components:

```typescript
import { TestComponent } from '../components/gluestack/TestComponent';

// Add to any screen for testing
<TestComponent />
```

### Features Tested
- Button variants and sizes
- Card variants and padding options
- Input variants, validation states, and accessibility
- Color scheme consistency
- Responsive behavior

## Known Issues & Limitations

### Gluestack UI v2 Compatibility
- Direct Gluestack UI component imports not working
- Provider integration incomplete due to package structure changes
- Falling back to React Native primitives with Gluestack UI styling

### NativeWind Integration
- CSS `@apply` directives not supported in current Metro setup
- Using standard CSS classes instead
- Tailwind utilities work for basic styling

### Workarounds Implemented
1. **Component Structure**: Using React Native primitives instead of Gluestack UI components
2. **Styling**: Custom StyleSheet with design tokens instead of styled components
3. **Theming**: Manual theme implementation instead of Gluestack UI provider

## Future Improvements

### Phase 1: Core Components
- [ ] CivicAvatar component
- [ ] CivicBadge component
- [ ] CivicProgressBar component
- [ ] CivicSpinner component

### Phase 2: Advanced Components
- [ ] CivicModal component
- [ ] CivicToast component
- [ ] CivicTabs component
- [ ] CivicCheckbox component

### Phase 3: Integration
- [ ] Resolve Gluestack UI v2 compatibility
- [ ] Implement proper provider integration
- [ ] Add theme switching support
- [ ] Optimize bundle size

## Best Practices

### Component Usage
1. **Consistency**: Always use CivicSense design tokens
2. **Accessibility**: Include proper accessibility props
3. **Performance**: Use React.memo for expensive components
4. **Testing**: Test components in isolation and integration

### Styling Guidelines
1. **Colors**: Use civic-* color classes or design tokens
2. **Spacing**: Use consistent spacing scale (xs, sm, md, lg, xl)
3. **Typography**: Follow iOS Human Interface Guidelines
4. **Responsive**: Test on multiple screen sizes

### Code Organization
```
components/
├── gluestack/
│   ├── CivicButton.tsx
│   ├── CivicCard.tsx
│   ├── CivicInput.tsx
│   └── TestComponent.tsx
├── atoms/
├── molecules/
└── ui/
```

## Conclusion

The Gluestack UI integration provides a solid foundation for consistent, accessible, and performant UI components in the CivicSense mobile app. While we encountered compatibility issues with Gluestack UI v2, the hybrid approach maintains the benefits of component-based design while ensuring reliability and maintainability.

The implementation successfully delivers:
- ✅ Consistent CivicSense branding
- ✅ Reusable component library
- ✅ TypeScript support
- ✅ iOS-compliant design
- ✅ Accessibility features
- ✅ Performance optimization

For questions or contributions, refer to the component files in `components/gluestack/` and the test component for usage examples. 