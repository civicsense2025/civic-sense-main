# CivicSense Accessibility Guidelines

## Overview

This document establishes accessibility standards for CivicSense based on WCAG 2.2 Level AA compliance. Our goal is to ensure all users, including those with visual impairments, can effectively use our civic education platform.

## Text Contrast Requirements

### WCAG 2.2 Standards
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): Minimum 3.1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio for interactive elements

### Current Issues Identified

#### ❌ Problematic Color Combinations
1. **`text-slate-400` on light backgrounds**: ~2.8:1 ratio (FAILS)
2. **`text-slate-500` on light backgrounds**: ~3.2:1 ratio (FAILS for normal text)
3. **`text-muted-foreground` in light mode**: Often falls below 4.5:1
4. **Secondary text colors**: Many instances below minimum requirements

#### ❌ Specific Problem Areas
- Header subtitle text (`text-slate-600 dark:text-slate-400`)
- Card metadata (`text-slate-500 dark:text-slate-400`)
- Form labels and descriptions
- Disabled state text
- Icon-only buttons without sufficient contrast

## Approved Color Palette

### Light Mode (WCAG AA Compliant)
```css
/* Primary Text - 4.5:1+ contrast */
--text-primary: #0f172a;        /* slate-900 - 19.1:1 ratio */
--text-secondary: #334155;      /* slate-700 - 8.9:1 ratio */
--text-tertiary: #475569;       /* slate-600 - 6.4:1 ratio */

/* Interactive Elements - 3:1+ contrast */
--text-interactive: #1e40af;    /* blue-800 - 7.2:1 ratio */
--text-interactive-hover: #1d4ed8; /* blue-700 - 6.1:1 ratio */

/* Status Colors - 4.5:1+ contrast */
--text-success: #166534;        /* green-800 - 7.8:1 ratio */
--text-warning: #a16207;        /* yellow-700 - 5.2:1 ratio */
--text-error: #dc2626;          /* red-600 - 5.9:1 ratio */

/* Disabled/Placeholder - 3:1+ contrast minimum */
--text-disabled: #64748b;       /* slate-500 - 4.6:1 ratio */
```

### Dark Mode (WCAG AA Compliant)
```css
/* Primary Text - 4.5:1+ contrast */
--text-primary: #f8fafc;        /* slate-50 - 18.7:1 ratio */
--text-secondary: #e2e8f0;      /* slate-200 - 14.1:1 ratio */
--text-tertiary: #cbd5e1;       /* slate-300 - 10.8:1 ratio */

/* Interactive Elements - 3:1+ contrast */
--text-interactive: #60a5fa;    /* blue-400 - 6.8:1 ratio */
--text-interactive-hover: #3b82f6; /* blue-500 - 5.1:1 ratio */

/* Status Colors - 4.5:1+ contrast */
--text-success: #4ade80;        /* green-400 - 6.2:1 ratio */
--text-warning: #fbbf24;        /* yellow-400 - 8.1:1 ratio */
--text-error: #f87171;          /* red-400 - 5.4:1 ratio */

/* Disabled/Placeholder - 3:1+ contrast minimum */
--text-disabled: #94a3b8;       /* slate-400 - 4.9:1 ratio */
```

## Typography Scale

### Font Sizes (WCAG Compliant)
```css
/* Large Text (3:1 contrast minimum) */
--text-6xl: 3.75rem;    /* 60px - Headlines */
--text-5xl: 3rem;       /* 48px - Page titles */
--text-4xl: 2.25rem;    /* 36px - Section headers */
--text-3xl: 1.875rem;   /* 30px - Card titles */
--text-2xl: 1.5rem;     /* 24px - Subheadings */
--text-xl: 1.25rem;     /* 20px - Large body text */

/* Normal Text (4.5:1 contrast minimum) */
--text-lg: 1.125rem;    /* 18px - Emphasized body */
--text-base: 1rem;      /* 16px - Body text */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-xs: 0.75rem;     /* 12px - Captions (use sparingly) */
```

### Font Weight Guidelines
- **700+ (Bold)**: Headlines, important actions
- **600 (Semibold)**: Subheadings, emphasis
- **500 (Medium)**: Interactive elements
- **400 (Regular)**: Body text, descriptions

## Implementation Standards

### CSS Custom Properties (Updated)
```css
:root {
  /* WCAG AA Compliant Text Colors */
  --foreground: 15 23 42;           /* slate-900 */
  --foreground-secondary: 51 65 85; /* slate-700 */
  --foreground-tertiary: 71 85 105; /* slate-600 */
  --foreground-muted: 100 116 139;  /* slate-500 - Use only for large text */
  
  /* Interactive Colors */
  --primary: 30 64 175;             /* blue-800 */
  --primary-hover: 29 78 216;       /* blue-700 */
  
  /* Status Colors */
  --success: 22 101 52;             /* green-800 */
  --warning: 161 98 7;              /* yellow-700 */
  --destructive: 220 38 38;         /* red-600 */
}

.dark {
  /* WCAG AA Compliant Dark Mode */
  --foreground: 248 250 252;        /* slate-50 */
  --foreground-secondary: 226 232 240; /* slate-200 */
  --foreground-tertiary: 203 213 225;  /* slate-300 */
  --foreground-muted: 148 163 184;     /* slate-400 */
  
  /* Interactive Colors */
  --primary: 96 165 250;            /* blue-400 */
  --primary-hover: 59 130 246;      /* blue-500 */
  
  /* Status Colors */
  --success: 74 222 128;            /* green-400 */
  --warning: 251 191 36;            /* yellow-400 */
  --destructive: 248 113 113;       /* red-400 */
}
```

### Tailwind Class Replacements

#### ❌ Replace These Classes
```css
/* NEVER USE - Poor contrast */
.text-slate-400    /* 2.8:1 ratio in light mode */
.text-slate-500    /* 3.2:1 ratio - only for large text */
.text-gray-400     /* Similar poor contrast */
.text-gray-500     /* Similar poor contrast */

/* CONDITIONAL USE - Only for large text (18px+) */
.text-muted-foreground  /* Verify contrast in context */
```

#### ✅ Use These Instead
```css
/* Primary Text Hierarchy */
.text-slate-900 dark:text-slate-50     /* Primary headings */
.text-slate-800 dark:text-slate-100    /* Secondary headings */
.text-slate-700 dark:text-slate-200    /* Body text */
.text-slate-600 dark:text-slate-300    /* Supporting text (large only) */

/* Interactive Elements */
.text-blue-800 dark:text-blue-400      /* Links, buttons */
.text-blue-700 dark:text-blue-300      /* Hover states */

/* Status Indicators */
.text-green-800 dark:text-green-400    /* Success states */
.text-yellow-700 dark:text-yellow-400  /* Warning states */
.text-red-600 dark:text-red-400        /* Error states */
```

## Component-Specific Guidelines

### Cards
```tsx
// ✅ Accessible card text hierarchy
<Card>
  <CardHeader>
    <CardTitle className="text-slate-900 dark:text-slate-50">
      Primary Title
    </CardTitle>
    <CardDescription className="text-slate-700 dark:text-slate-200">
      Supporting description
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-slate-800 dark:text-slate-100">
      Main content
    </p>
    <p className="text-slate-600 dark:text-slate-300 text-lg">
      Metadata (large text only)
    </p>
  </CardContent>
</Card>
```

### Buttons
```tsx
// ✅ Accessible button states
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Primary Action
</Button>

<Button variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
  Secondary Action
</Button>
```

### Form Elements
```tsx
// ✅ Accessible form labels and descriptions
<Label className="text-slate-800 dark:text-slate-200 font-medium">
  Field Label
</Label>
<Input className="border-slate-300 dark:border-slate-600" />
<p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
  Helper text (minimum 14px)
</p>
```

## Testing Requirements

### Automated Testing
1. **Contrast Ratio Tools**:
   - WebAIM Contrast Checker
   - Colour Contrast Analyser
   - axe DevTools

2. **Required Checks**:
   - All text meets 4.5:1 minimum (normal text)
   - Large text meets 3:1 minimum
   - Interactive elements meet 3:1 minimum

### Manual Testing
1. **Screen Reader Testing**:
   - VoiceOver (macOS)
   - NVDA (Windows)
   - JAWS (Windows)

2. **Visual Testing**:
   - High contrast mode
   - 200% zoom level
   - Color blindness simulation

## Implementation Checklist

### Phase 1: Critical Fixes
- [ ] Replace all `text-slate-400` instances
- [ ] Replace all `text-slate-500` instances (except large text)
- [ ] Update `text-muted-foreground` usage
- [ ] Fix header and navigation text
- [ ] Update card metadata colors

### Phase 2: Component Updates
- [ ] Update all form components
- [ ] Fix button contrast ratios
- [ ] Update badge and status colors
- [ ] Review modal and dialog text
- [ ] Update table text hierarchy

### Phase 3: Validation
- [ ] Run automated accessibility tests
- [ ] Manual contrast ratio verification
- [ ] Screen reader testing
- [ ] User testing with visually impaired users

## Resources

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Standards
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/Understanding/)
- [Understanding Contrast Requirements](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)

---

**Last Updated**: January 2025  
**Next Review**: March 2025  
**Compliance Target**: WCAG 2.2 Level AA 