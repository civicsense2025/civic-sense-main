export interface BaseCollection {
  id: string
  title: string
  description: string
  slug: string
  itemCount: number
  created_at: string
  updated_at: string
  emoji?: string
  status?: 'draft' | 'published'
  estimated_minutes?: number
  difficulty_level?: number
  learning_objectives?: string[]
  categories?: string[]
}

export interface CollectionItem {
  id: string
  title: string
  description: string
  type: 'quiz' | 'article' | 'video'
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface UserCollectionProgress {
  completed_items: number
  total_items: number
  last_activity: string
  progress_percentage: number
}

export interface CollectionWithItems extends BaseCollection {
  items: CollectionItem[]
  progress?: UserCollectionProgress
}

export type Collection = BaseCollection | CollectionWithItems 