# CivicSense Theming System & Component Guide

## Overview

The CivicSense platform now features a comprehensive theming system that aligns with our brand values of **Authority Blue**, **Action Red**, and **Truth White**. We've moved away from amber warning colors and created a consistent, accessible design system.

## Color System Changes

### ✅ What We Fixed
- **Removed amber warnings**: Warning colors now use CivicSense primary blue instead of amber
- **Consistent theming**: All components now use semantic color tokens
- **Improved hover states**: Buttons now have better visual feedback with transforms and shadows
- **Dark mode consistency**: Colors are properly adjusted for both light and dark themes

### Color Tokens

```css
/* Light Mode */
--primary: 217 91% 60%        /* CivicSense Authority Blue */
--accent: 199 89% 48%         /* Vibrant Cyan */
--success: 142 76% 36%        /* Green for success states */
--warning: 217 91% 60%        /* Uses primary blue, not amber */
--destructive: 0 84% 60%      /* Red for destructive actions */

/* Dark Mode - Automatically adjusted */
--primary: 217 91% 65%        /* Brighter blue for dark backgrounds */
--warning: 217 91% 65%        /* Consistent with primary */
```

## New Atomic Components

### Layout Components

#### Container
Provides consistent max-width and padding across the app.

```tsx
import { Container } from "@/components/ui"

// Basic usage
<Container>
  <h1>Page Content</h1>
</Container>

// With size and padding variants
<Container size="lg" padding="lg" as="section">
  <h2>Large container with extra padding</h2>
</Container>
```

#### Stack
Flexbox-based layout with consistent spacing.

```tsx
import { Stack } from "@/components/ui"

// Vertical stack (default)
<Stack spacing="lg">
  <h1>Title</h1>
  <p>Description</p>
  <Button>Action</Button>
</Stack>

// Horizontal stack
<Stack direction="row" spacing="md" align="center">
  <Icon variant="primary" size="sm" />
  <Text>With icon</Text>
</Stack>
```

#### Grid
CSS Grid with responsive columns and consistent spacing.

```tsx
import { Grid } from "@/components/ui"

// Responsive card grid
<Grid cols={3} gap="lg">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</Grid>

// Mobile-first responsive
<Grid cols={1} gap="md" className="md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</Grid>
```

### Typography Components

#### Text
Semantic text component with consistent styling.

```tsx
import { Text } from "@/components/ui"

// Basic usage
<Text>Regular body text</Text>

// With variants
<Text variant="muted" size="sm">
  Secondary information
</Text>

<Text as="h2" size="2xl" weight="bold" variant="primary">
  Primary Heading
</Text>
```

### Visual Components

#### Icon
Consistent icon styling with theme variants.

```tsx
import { Icon } from "@/components/ui"
import { CheckIcon } from "lucide-react"

<Icon variant="success" size="lg">
  <CheckIcon />
</Icon>

<Icon variant="primary" size="sm">
  <path d="..." /> {/* SVG path */}
</Icon>
```

## Updated Button Component

The Button component now has improved hover states and more variants:

```tsx
import { Button } from "@/components/ui"

// Enhanced button variants
<Button variant="default">Primary Action</Button>
<Button variant="success">Success Action</Button>
<Button variant="warning">Warning Action</Button> {/* Uses blue, not amber */}
<Button variant="accent">Accent Action</Button>

// Improved hover states with transforms
<Button variant="outline">
  Hover me! {/* Subtle lift and shadow */}
</Button>

// Size variants
<Button size="xl">Large Button</Button>
<Button size="icon-sm" variant="ghost">
  <Icon size="sm">...</Icon>
</Button>
```

## Theme-Aware Components

All components now automatically adapt to light/dark mode and use semantic tokens:

```tsx
// These automatically adapt to theme
<Card className="bg-card text-card-foreground border-border">
  <Text variant="muted">This text uses theme-aware muted color</Text>
  <Button variant="primary">This button uses theme-aware primary</Button>
</Card>
```

## Updated UserMenu

The UserMenu component has been updated to use proper theming:

```tsx
// Before: Hard-coded slate colors
className="text-slate-900 dark:text-white"

// After: Semantic theme tokens
className="text-foreground"

// Before: Blue hover states
className="hover:bg-blue-50 dark:hover:bg-blue-950/20"

// After: Theme-aware hover states
className="hover:bg-primary/10"
```

## Responsive Design Patterns

### Mobile-First Approach
All new components use mobile-first responsive design:

```tsx
// Container with responsive padding
<Container 
  padding="sm"        // px-4 sm:px-6
  className="md:px-8" // Override for larger screens
>

// Stack that becomes horizontal on larger screens
<Stack 
  direction="column" 
  className="md:flex-row"
  spacing="md"
>
```

### Accessibility Features

All components include proper accessibility:

```tsx
// Focus states use theme-aware colors
<Button className="focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Accessible Button
</Button>

// Icon components include proper ARIA
<Icon aria-hidden="true">...</Icon>

// Text components support semantic HTML
<Text as="h1" size="4xl">Accessible Heading</Text>
```

## Component Import Patterns

### Single Component Import
```tsx
import { Button } from "@/components/ui/button"
import { Stack } from "@/components/ui/stack"
```

### Multiple Component Import
```tsx
import { 
  Button, 
  Card, 
  Stack, 
  Text, 
  Container 
} from "@/components/ui"
```

## Best Practices

### 1. Use Semantic Variants
```tsx
// ✅ Good - Semantic meaning
<Button variant="destructive">Delete</Button>
<Text variant="muted">Secondary info</Text>

// ❌ Bad - Hard-coded colors
<Button className="bg-red-500">Delete</Button>
<Text className="text-gray-500">Secondary info</Text>
```

### 2. Leverage Layout Components
```tsx
// ✅ Good - Consistent spacing
<Stack spacing="lg">
  <Text size="2xl" weight="bold">Title</Text>
  <Text variant="muted">Description</Text>
  <Button>Action</Button>
</Stack>

// ❌ Bad - Inconsistent margins
<div>
  <h1 className="text-2xl font-bold mb-4">Title</h1>
  <p className="text-gray-600 mb-6">Description</p>
  <Button>Action</Button>
</div>
```

### 3. Compose Complex Layouts
```tsx
// ✅ Good - Composable layout
<Container size="lg">
  <Stack spacing="xl">
    <Stack spacing="md">
      <Text as="h1" size="4xl" weight="bold">
        Page Title
      </Text>
      <Text variant="muted" size="lg">
        Page description
      </Text>
    </Stack>
    
    <Grid cols={2} gap="lg">
      <Card>Content 1</Card>
      <Card>Content 2</Card>
    </Grid>
  </Stack>
</Container>
```

## Theme Customization

To extend the theme, modify the CSS variables in `app/globals.css`:

```css
:root {
  /* Add custom colors */
  --custom-brand: 210 100% 50%;
  --custom-brand-foreground: 0 0% 100%;
}

.dark {
  /* Dark mode variants */
  --custom-brand: 210 100% 60%;
}
```

Then extend the Tailwind config:

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'custom-brand': {
        DEFAULT: "hsl(var(--custom-brand))",
        foreground: "hsl(var(--custom-brand-foreground))",
      }
    }
  }
}
```

## Migration Guide

### Updating Existing Components

1. **Replace hard-coded colors** with semantic variants
2. **Use new layout components** instead of custom flex/grid CSS
3. **Update hover states** to use new transform-based interactions
4. **Remove amber warnings** and use primary blue variants

### Example Migration

```tsx
// Before
<div className="flex flex-col space-y-4 max-w-4xl mx-auto px-6">
  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
    Title
  </h1>
  <p className="text-gray-600 dark:text-gray-400">
    Description
  </p>
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
    Action
  </button>
</div>

// After
<Container size="xl">
  <Stack spacing="md">
    <Text as="h1" size="3xl" weight="bold">
      Title
    </Text>
    <Text variant="muted">
      Description
    </Text>
    <Button variant="primary">
      Action
    </Button>
  </Stack>
</Container>
```

## Conclusion

The new CivicSense theming system provides:

- **Consistent colors** aligned with brand values
- **Better accessibility** with proper focus states and semantic colors  
- **Responsive design** patterns that work across devices
- **Developer experience** improvements with atomic, composable components
- **No more amber warnings** - everything uses appropriate CivicSense brand colors

All components are designed to work together harmoniously while maintaining the bold, direct personality that makes CivicSense effective civic education. 