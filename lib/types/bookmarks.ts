// Bookmarking System Types
// =======================

export interface BookmarkCollection {
  id: string
  user_id: string
  name: string
  description?: string
  emoji: string
  color: string
  is_smart: boolean
  smart_criteria?: SmartCriteria
  is_public: boolean
  parent_collection_id?: string
  display_order: number
  created_at: string
  updated_at: string
  
  // UI helpers
  bookmark_count?: number
  snippet_count?: number
  children?: BookmarkCollection[]
}

export interface SmartCriteria {
  content_types?: ContentType[]
  tags?: string[]
  date_range?: {
    start: string
    end: string
  }
  categories?: string[]
  search_query?: string
}

export type ContentType = 'quiz' | 'article' | 'glossary' | 'figure' | 'custom'

export interface Bookmark {
  id: string
  user_id: string
  collection_id?: string
  
  // Content reference
  content_type: ContentType
  content_id?: string
  content_url?: string
  
  // Metadata
  title: string
  description?: string
  thumbnail_url?: string
  source_domain?: string
  
  // User customization
  user_notes?: string
  tags: string[]
  is_favorite: boolean
  
  // Tracking
  last_accessed_at?: string
  access_count: number
  
  created_at: string
  updated_at: string
  
  // Relations
  collection?: BookmarkCollection
  snippets?: BookmarkSnippet[]
}

export interface BookmarkSnippet {
  id: string
  user_id: string
  bookmark_id?: string
  collection_id?: string
  
  // Snippet content
  snippet_text: string
  full_context?: string
  
  // Location information
  source_url?: string
  source_title?: string
  source_type?: SnippetSourceType
  source_id?: string
  
  // Selection metadata
  selection_start?: number
  selection_end?: number
  paragraph_index?: number
  
  // User customization
  highlight_color: string
  user_notes?: string
  tags: string[]
  
  // AI-generated insights
  ai_summary?: string
  ai_tags?: string[]
  
  created_at: string
  updated_at: string
  
  // Relations
  bookmark?: Bookmark
  collection?: BookmarkCollection
}

export type SnippetSourceType = 
  | 'quiz_question' 
  | 'quiz_explanation' 
  | 'article' 
  | 'glossary' 
  | 'figure_bio'
  | 'custom'

export interface BookmarkTag {
  id: string
  user_id: string
  tag_name: string
  tag_slug: string
  color: string
  usage_count: number
  created_at: string
}

export interface SharedCollectionAccess {
  id: string
  collection_id: string
  shared_by_user_id: string
  shared_with_email?: string
  shared_with_user_id?: string
  permission_level: 'view' | 'edit'
  share_code: string
  expires_at?: string
  created_at: string
}

// Request/Response types
export interface CreateBookmarkRequest {
  content_type: ContentType
  content_id?: string
  content_url?: string
  title: string
  description?: string
  thumbnail_url?: string
  source_domain?: string
  collection_id?: string
  tags?: string[]
  user_notes?: string
}

export interface CreateSnippetRequest {
  snippet_text: string
  full_context?: string
  source_url?: string
  source_title?: string
  source_type?: SnippetSourceType
  source_id?: string
  selection_start?: number
  selection_end?: number
  paragraph_index?: number
  bookmark_id?: string
  collection_id?: string
  tags?: string[]
  user_notes?: string
  highlight_color?: string
}

export interface CreateCollectionRequest {
  name: string
  description?: string
  emoji?: string
  color?: string
  parent_collection_id?: string
  is_smart?: boolean
  smart_criteria?: SmartCriteria
}

export interface BookmarkSearchFilters {
  query?: string
  content_types?: ContentType[]
  tags?: string[]
  collection_id?: string
  is_favorite?: boolean
  date_range?: {
    start: string
    end: string
  }
}

export interface BookmarkAnalyticsEvent {
  bookmark_id?: string
  snippet_id?: string
  event_type: 'view' | 'share' | 'export' | 'note_added' | 'highlighted'
  event_data?: any
}

// UI Helper types
export interface HighlightSelection {
  text: string
  start: number
  end: number
  container: HTMLElement
  parentElement?: HTMLElement
  contextBefore?: string
  contextAfter?: string
}

export interface BookmarkButtonProps {
  content_type: ContentType
  content_id?: string
  title: string
  description?: string
  url?: string
  className?: string
  variant?: 'icon' | 'button' | 'menu'
  onBookmarked?: (bookmark: Bookmark) => void
}

export interface TextHighlighterProps {
  enabled?: boolean
  onHighlight?: (selection: HighlightSelection) => void
  highlightColor?: string
  className?: string
}

// Statistics types
export interface BookmarkStats {
  total_bookmarks: number
  total_snippets: number
  total_collections: number
  favorite_count: number
  most_used_tags: Array<{
    tag: string
    count: number
  }>
  content_type_breakdown: Record<ContentType, number>
  recent_activity: Array<{
    type: 'bookmark' | 'snippet'
    id: string
    title: string
    created_at: string
  }>
} 