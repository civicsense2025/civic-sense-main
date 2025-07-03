"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@civicsense/ui-web/src/components/ui/use-toast'
import { BookmarkList, BookmarkFilters, BookmarkStats } from '@civicsense/ui-web/src/components/bookmarks'
import type { Bookmark, BookmarkSearchFilters, BookmarkStats as BookmarkStatsType } from '@civicsense/shared/src/lib/types/bookmarks'

export default function BookmarksPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<BookmarkStatsType | null>(null)
  const [filters, setFilters] = useState<BookmarkSearchFilters>({})
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    loadBookmarks()
    loadStats()
    loadTags()
  }, [user])

  useEffect(() => {
    if (!user) return
    loadBookmarks()
  }, [filters, user])

  const loadBookmarks = async () => {
    if (!user) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.query) params.append('query', filters.query)
      if (filters.content_types) params.append('content_types', filters.content_types.join(','))
      if (filters.tags) params.append('tags', filters.tags.join(','))
      if (filters.is_favorite !== undefined) params.append('is_favorite', String(filters.is_favorite))

      const response = await fetch(`/api/bookmarks?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch bookmarks')

      const data = await response.json()
      setBookmarks(data.data.bookmarks)
      setTotal(data.data.total)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bookmarks. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/bookmarks/stats')
      if (!response.ok) throw new Error('Failed to fetch bookmark stats')

      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error loading bookmark stats:', error)
    }
  }

  const loadTags = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/bookmarks/tags')
      if (!response.ok) throw new Error('Failed to fetch bookmark tags')

      const data = await response.json()
      setAvailableTags(data.data.map((tag: { tag_name: string }) => tag.tag_name))
    } catch (error) {
      console.error('Error loading bookmark tags:', error)
    }
  }

  const handleDelete = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete bookmark')

      toast({
        title: 'Success',
        description: 'Bookmark deleted successfully'
      })

      loadBookmarks()
      loadStats()
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete bookmark. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleFavoriteToggle = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}/favorite`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to toggle favorite')

      loadBookmarks()
      loadStats()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive'
      })
    }
  }

  if (!user) {
    return (
      <div className="container max-w-7xl py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your bookmarks</h1>
          <p className="text-slate-500">Please sign in to access your saved content.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Your Bookmarks</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {total} saved items
          </p>
        </div>

        {stats && <BookmarkStats stats={stats} className="mb-8" />}

        <BookmarkFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags}
          className="mb-8"
        />

        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-50" />
          </div>
        ) : (
          <BookmarkList
            bookmarks={bookmarks}
            onDelete={handleDelete}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}
      </div>
    </div>
  )
} 