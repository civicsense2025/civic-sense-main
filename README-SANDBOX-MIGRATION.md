# CivicSense Sandbox Migration Guide

*Step-by-step guide for migrating existing demo pages to the new sandbox system*

## Overview

This guide helps you migrate existing demo and test pages from the main app directory to the organized sandbox system. The sandbox provides better organization, consistent styling, and excludes demo content from version control.

## Migration Checklist

### Pre-Migration Setup
- [x] Sandbox directory created (`/app/sandbox/`)
- [x] Sandbox layout implemented
- [x] Sandbox index page created
- [x] `.gitignore` updated to exclude sandbox
- [x] Cursor rules documentation created

### Pages to Migrate

#### Demo Pages (Stable)
- [ ] `admin-content-demo` → `sandbox/admin-content`
- [ ] `donation-demo` → `sandbox/donation`
- [ ] `learning-pods-demo` → `sandbox/learning-pods`
- [ ] `news-ticker-demo` → `sandbox/news-ticker`
- [ ] `npc-demo` → `sandbox/npc`
- [ ] `survey-demo` → `sandbox/survey`

#### Test Pages (Experimental)
- [ ] `test-ai-extraction` → `sandbox/test/ai-extraction`
- [ ] `test-analytics` → `sandbox/test/analytics`
- [ ] `test-educational-access` → `sandbox/test/educational-access`
- [ ] `test-gift-analytics` → `sandbox/test/gift-analytics`
- [ ] `test-jsonb-translation` → `sandbox/test/jsonb-translation`
- [ ] `test-localStorage-fix` → `sandbox/test/localStorage-fix`
- [ ] `test-media-bias-analysis` → `sandbox/test/media-bias-analysis`
- [ ] `test-multiplayer` → `sandbox/test/multiplayer`
- [ ] `test-multiplayer-debug` → `sandbox/test/multiplayer-debug`
- [ ] `test-multiplayer-modes` → `sandbox/test/multiplayer-modes`
- [ ] `test-npc-integration` → `sandbox/test/npc-integration`
- [ ] `test-room-management` → `sandbox/test/room-management`
- [ ] `test-source-maintenance` → `sandbox/test/source-maintenance`
- [ ] `test-stripe` → `sandbox/test/stripe`
- [ ] `test-toast` → `sandbox/test/toast`
- [ ] `test-translation` → `sandbox/test/translation`
- [ ] `test-tts` → `sandbox/test/tts`

## Migration Steps

### Step 1: Move Page Content

```bash
# Example: Migrating donation-demo
mkdir -p app/sandbox/donation
cp app/donation-demo/page.tsx app/sandbox/donation/page.tsx

# For test pages
mkdir -p app/sandbox/test/ai-extraction
cp app/test-ai-extraction/page.tsx app/sandbox/test/ai-extraction/page.tsx
```

### Step 2: Update Page Structure

**Before (Original Demo):**
```typescript
// app/donation-demo/page.tsx
export default function DonationDemo() {
  return (
    <div>
      <h1>Donation Demo</h1>
      {/* Demo content */}
    </div>
  )
}
```

**After (Sandbox Structure):**
```typescript
// app/sandbox/donation/page.tsx
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function DonationSandbox() {
  return (
    <Container className="py-8">
      {/* Sandbox Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-bold">🧪 Donation System Demo</h1>
          <Badge className="bg-green-100 text-green-800">Stable</Badge>
          <Badge variant="outline">Payments</Badge>
        </div>
        <p className="text-gray-600 mb-4">
          Testing Stripe integration and donation flow functionality.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('http://localhost:6006/?path=/story/payments-donation--default', '_blank')}
          >
            📖 View in Storybook
          </Button>
        </div>
      </div>

      {/* Original demo content wrapped in cards */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Donation Flow</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Your original demo content here */}
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
```

### Step 3: Update Sandbox Index

Add each migrated page to the appropriate array in `app/sandbox/page.tsx`:

```typescript
// For stable demos
const demos = [
  // ... existing demos
  {
    title: 'Donation Demo',
    description: 'Stripe integration and donation flow testing',
    path: '/sandbox/donation',
    category: 'Payments',
    status: 'stable'
  }
]

// For experimental tests  
const tests = [
  // ... existing tests
  {
    title: 'AI Content Extraction',
    description: 'Test AI-powered content extraction from articles',
    path: '/sandbox/test/ai-extraction',
    category: 'AI',
    status: 'experimental'
  }
]
```

### Step 4: Update Navigation Links

Find and update any internal links that point to old demo pages:

```typescript
// Before
<Link href="/donation-demo">View Donation Demo</Link>

// After  
<Link href="/sandbox/donation">View Donation Demo</Link>
```

### Step 5: Clean Up Original Pages

After confirming the sandbox version works correctly:

```bash
# Remove original demo directories
rm -rf app/donation-demo
rm -rf app/test-ai-extraction
# ... etc
```

## Category Guidelines

### Demo Categories (Stable Features)
- **Admin** - Administrative tools and interfaces
- **AI** - AI-powered features and integrations
- **Analytics** - Data visualization and reporting
- **Auth** - Authentication and authorization
- **Content** - Content management and display
- **Forms** - Form components and validation
- **Games** - Quiz games and multiplayer features
- **Payments** - Stripe integration and billing
- **Social** - Social features and collaboration

### Test Categories (Experimental Features)
- **Storage** - Data persistence and caching
- **UI** - User interface components
- **i18n** - Internationalization and translation
- **Accessibility** - Accessibility features and testing

## Sandbox Page Template

Use this template for consistent sandbox page structure:

```typescript
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function YourSandboxPage() {
  return (
    <Container className="py-8">
      {/* Header with metadata */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-bold">🧪 Your Feature Name</h1>
          <Badge className="bg-green-100 text-green-800">Stable</Badge>
          <Badge variant="outline">Category</Badge>
        </div>
        <p className="text-gray-600 mb-4">
          Brief description of what this demo tests or demonstrates.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('http://localhost:6006/?path=/story/your-story', '_blank')}
          >
            📖 View in Storybook
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh Test
          </Button>
        </div>
      </div>

      {/* Test scenarios organized in cards */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Primary Use Case</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Your demo content */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Edge Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Edge case testing */}
          </CardContent>
        </Card>
      </div>

      {/* Development notes */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Development Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Testing status and known issues</li>
            <li>Next steps for development</li>
            <li>Performance considerations</li>
          </ul>
        </CardContent>
      </Card>
    </Container>
  )
}
```

## Testing Migration

### Verify Each Migration
1. **Page loads correctly** in sandbox
2. **All functionality works** as expected  
3. **Styling is consistent** with sandbox layout
4. **Links are updated** throughout the app
5. **Original page can be safely deleted**

### Common Issues

**Import errors:**
- Update relative imports when moving files
- Ensure all dependencies are still accessible

**Styling breaks:**  
- Wrap content in `<Container>` component
- Use sandbox card structure for organization
- Apply consistent spacing with `py-8`, `mb-8`, etc.

**Navigation issues:**
- Update internal links to point to sandbox paths
- Check for hardcoded URLs in components

## Benefits of Migration

### Organization
- All demos/tests in one location
- Consistent navigation and discoverability
- Clear categorization and status tracking

### Development
- Excluded from version control (no demo pollution)
- Consistent styling and layout
- Easy comparison between different components

### Maintenance  
- Centralized demo management
- Clear development workflow
- Better integration with Storybook

## Next Steps

After completing migration:

1. **Create Storybook stories** for reusable components
2. **Set up automated visual regression testing**
3. **Document component APIs** in Storybook
4. **Add accessibility testing** to sandbox pages
5. **Implement performance monitoring** for heavy components

## Getting Help

- **Sandbox structure questions**: See `app/sandbox/example/page.tsx`
- **Styling issues**: Check sandbox layout in `app/sandbox/layout.tsx`
- **Development workflow**: Review `.cursor/rules/sandbox-storybook-integration.md`
- **Component patterns**: Examine existing UI components in `components/ui/`

---

**Remember**: The goal is to create a clean, organized development environment that doesn't pollute the main application while providing comprehensive testing capabilities. 