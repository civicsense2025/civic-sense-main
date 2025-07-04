# Collections API Integration for Mobile App

This guide shows how to properly fetch and use collections data in the React Native/Expo mobile app.

## ✅ The Problem We Solved

Previously, the mobile app was importing Next.js server-side modules (`next/server`) which don't exist in React Native environments, causing build errors like:

```
Unable to resolve module next/server from apps/mobile/app/api/collections/route.ts
```

## ✅ The Solution

We created mobile-specific API services that make HTTP requests to the web app's API endpoints.

## 🚀 Quick Start

### 1. Import the API Service and Hooks

```typescript
import CollectionsApiService from '@/lib/services/collections-api'
import { useCollections, useCollection, useFeaturedCollections } from '@/hooks/useCollections'
```

### 2. Set Your API Base URL

Create a `.env` file in your mobile app directory:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

For production:
```bash
EXPO_PUBLIC_API_BASE_URL=https://api.civicsense.com
```

### 3. Use in React Native Components

#### Fetch Featured Collections
```tsx
import { useFeaturedCollections } from '@/hooks/useCollections'

export function FeaturedCollectionsScreen() {
  const { collections, loading, error, refetch } = useFeaturedCollections()
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} onRetry={refetch} />
  
  return (
    <FlatList
      data={collections}
      renderItem={({ item }) => <CollectionCard collection={item} />}
    />
  )
}
```

#### Search Collections
```tsx
import { useCollections } from '@/hooks/useCollections'

export function SearchScreen() {
  const { collections, loading, searchCollections } = useCollections()
  
  const handleSearch = async (query: string) => {
    try {
      await searchCollections(query)
    } catch (error) {
      Alert.alert('Search failed', error.message)
    }
  }
  
  return (
    <View>
      <SearchInput onSearch={handleSearch} />
      <CollectionsList collections={collections} loading={loading} />
    </View>
  )
}
```

#### Individual Collection Details
```tsx
import { useCollection, useCollectionSteps } from '@/hooks/useCollections'

export function CollectionDetailScreen({ slug }: { slug: string }) {
  const { collection, loading: collectionLoading } = useCollection(slug)
  const { steps, loading: stepsLoading } = useCollectionSteps(slug)
  
  if (collectionLoading || stepsLoading) return <LoadingSpinner />
  
  return (
    <ScrollView>
      <CollectionHeader collection={collection} />
      <LessonStepsList steps={steps} />
    </ScrollView>
  )
}
```

#### Track Progress
```tsx
import { useCollectionProgress } from '@/hooks/useCollections'

export function LessonScreen({ slug }: { slug: string }) {
  const { progress, updateProgress, updateStepProgress } = useCollectionProgress(slug)
  
  const handleStepComplete = async (stepId: string) => {
    try {
      await updateStepProgress({
        step_id: stepId,
        status: 'completed',
        completion_percentage: 100,
        time_spent: 300 // 5 minutes
      })
    } catch (error) {
      Alert.alert('Failed to save progress', error.message)
    }
  }
  
  return (
    <LessonStepViewer 
      onStepComplete={handleStepComplete}
      progress={progress}
    />
  )
}
```

## 📚 Available API Methods

### CollectionsApiService (Direct API Calls)

```typescript
// Fetch collections with filtering
const result = await CollectionsApiService.getCollections({
  is_featured: true,
  difficulty_level: [1, 2],
  categories: ['Constitutional Law'],
  search: 'voting rights',
  limit: 20
})

// Get specific collection
const collection = await CollectionsApiService.getCollection('voting-rights-basics')

// Get lesson steps
const stepsResponse = await CollectionsApiService.getCollectionSteps('voting-rights-basics')

// Update progress
await CollectionsApiService.updateStepProgress('voting-rights-basics', {
  step_id: 'step-1',
  status: 'completed',
  completion_percentage: 100,
  score: 95
})
```

### React Hooks (Recommended)

```typescript
// Featured collections
const { collections, loading, error, refetch } = useFeaturedCollections()

// All collections with filtering
const { 
  collections, 
  loading, 
  error, 
  total, 
  refetch, 
  searchCollections 
} = useCollections({ is_featured: true })

// Individual collection
const { collection, loading, error, refetch } = useCollection(slug)

// Collection lesson steps
const { steps, loading, error, total_steps, refetch } = useCollectionSteps(slug)

// Progress tracking
const { 
  progress, 
  loading, 
  error, 
  updating, 
  updateProgress, 
  updateStepProgress 
} = useCollectionProgress(slug)
```

## 🔧 Configuration

### API Base URL Configuration

The API service automatically configures the base URL from environment variables:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'
```

### Authentication (TODO)

Currently, the API service includes placeholder for authentication:

```typescript
// TODO: Add authentication token when available
// const token = await getStoredAuthToken()
// if (token) {
//   headers.Authorization = `Bearer ${token}`
// }
```

### Error Handling

All API calls include proper error handling:

```typescript
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}
```

## 📱 Mobile-Optimized Features

### Mobile-Specific Collections
```typescript
// Get collections optimized for mobile
const mobileCollections = await CollectionsApiService.getCollections({
  mobile_optimized: true,
  limit: 10
})
```

### Mobile-Friendly Utility Functions
```typescript
import { formatMobileEstimatedTime, getMobileProgressColor } from '@/types/collections'

// "Quick read", "5 min read", "1h+ lesson"
const timeText = formatMobileEstimatedTime(collection.estimated_minutes)

// Returns color codes for progress visualization
const progressColor = getMobileProgressColor(progress.progress_percentage)
```

## 🎯 Complete Example Component

See [`apps/mobile/components/collections/collections-list-screen.tsx`](./components/collections/collections-list-screen.tsx) for a complete implementation that demonstrates:

- ✅ Fetching featured collections
- ✅ Search functionality  
- ✅ Difficulty filtering
- ✅ Progress tracking
- ✅ Error handling
- ✅ Loading states
- ✅ Pull-to-refresh
- ✅ Mobile-optimized UI

## 🚀 API Endpoints

The mobile app makes HTTP requests to these web app endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/collections` | List collections with filtering |
| `GET` | `/api/collections/[slug]` | Get specific collection |
| `GET` | `/api/collections/[slug]/steps` | Get lesson steps |
| `POST` | `/api/collections/[slug]/steps/progress` | Update lesson progress |
| `GET` | `/api/collections/[slug]/progress` | Get collection progress |
| `POST` | `/api/collections/[slug]/progress` | Update collection progress |

## ⚠️ Important Notes

1. **Never import Next.js modules** in the mobile app - they don't exist in React Native
2. **Always use HTTP requests** to communicate with the web app APIs
3. **Handle offline scenarios** - implement proper error handling for network issues
4. **Respect mobile data usage** - use appropriate caching and pagination
5. **Test on real devices** - emulators may not catch all networking issues

## 🔍 Troubleshooting

### Build Errors

If you see errors like `Unable to resolve module next/server`:
- ✅ Check that you're not importing Next.js modules in mobile code
- ✅ Use the CollectionsApiService instead of direct API route imports
- ✅ Ensure all imports use `@/` paths that resolve to mobile app directories

### Network Errors

If API calls fail:
- ✅ Check your `EXPO_PUBLIC_API_BASE_URL` environment variable
- ✅ Ensure the web app is running and accessible
- ✅ Check network connectivity in development/testing
- ✅ Verify API endpoints are working in the web app

### Type Errors

If TypeScript complains about missing types:
- ✅ Ensure all type files are copied to `apps/mobile/types/`
- ✅ Check import paths use `@/types/` prefix
- ✅ Verify tsconfig.json includes proper path mapping

## 🎓 Best Practices

1. **Use hooks over direct API calls** for consistent state management
2. **Implement proper loading states** for better UX
3. **Handle errors gracefully** with user-friendly messages
4. **Cache data appropriately** to reduce network requests
5. **Test with slow/unreliable networks** to ensure robustness
6. **Use TypeScript** for better developer experience and fewer bugs

---

**Result**: Your mobile app can now properly fetch collections and lessons from the CivicSense API without any Next.js dependency issues! 🎉 