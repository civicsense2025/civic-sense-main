// Export all TypeScript types and interfaces
export * from './collections'
export * from './skills'
export * from './incentives'

// Export lesson-steps with explicit naming to avoid conflicts
export type { LessonStep as LessonStepType } from './lesson-steps'

// Export lib/types - rename conflicting types to avoid collisions
export type {
  BookmarkCollection,
  Bookmark,
  BookmarkSnippet,
  ContentType,
  BookmarkSearchFilters,
  CreateBookmarkRequest,
  CreateSnippetRequest,
  CreateCollectionRequest as CreateBookmarkCollectionRequest
} from '../lib/types/bookmarks'

export * from '../lib/types/quiz'
export * from '../lib/types/user'
export * from '../lib/types/supabase'
export * from '../lib/types/key-takeaways'
export * from '../lib/types/premium'

// Note: .d.ts files are automatically included by TypeScript
// They don't need explicit exports but are available for import 