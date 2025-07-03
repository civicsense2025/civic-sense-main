/**
 * CivicSense Bookmark Types
 * Types for managing user bookmarks and related functionality
 */

export interface Bookmark {
  id: string
  userId: string
  title: string
  url: string
  description?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  isFavorite: boolean
  category?: string
  sourceType: 'article' | 'video' | 'podcast' | 'other'
}

export interface BookmarkSearchFilters {
  tag?: string
  category?: string
  sourceType?: Bookmark['sourceType']
  favorite?: boolean
  query?: string
}

export interface BookmarkStats {
  total: number
  byCategory: Record<string, number>
  bySourceType: Record<Bookmark['sourceType'], number>
  favorites: number
  recentlyAdded: number
  topTags: Array<{ tag: string; count: number }>
} 