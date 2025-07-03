"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@civicsense/ui-web/src/components/ui/use-toast'
import { BookmarkList } from '@civicsense/ui-web/src/components/bookmarks/bookmark-list'
import { BookmarkFilters } from '@civicsense/ui-web/src/components/bookmarks/bookmark-filters'
import { BookmarkStats } from '@civicsense/ui-web/src/components/bookmarks/bookmark-stats'
import type { Bookmark, BookmarkSearchFilters, BookmarkStats as BookmarkStatsType } from '@civicsense/shared/src/lib/types/bookmarks'

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<BookmarkStatsType | null>(null)
  const [filters, setFilters] = useState<BookmarkSearchFilters>({})
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadBookmarks()
    loadStats()
    loadTags()
  }, [])

  const loadBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks?' + new URLSearchParams(filters as any))
      if (!response.ok) throw new Error('Failed to load bookmarks')
      const data = await response.json()
      setBookmarks(data.data)
      setTotal(data.total)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bookmarks',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/bookmarks/stats')
      if (!response.ok) throw new Error('Failed to load bookmark stats')
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error loading bookmark stats:', error)
    }
  }

  const loadTags = async () => {
    try {
      const response = await fetch('/api/bookmarks/tags')
      if (!response.ok) throw new Error('Failed to load bookmark tags')
      const data = await response.json()
      setAvailableTags(data.data)
    } catch (error) {
      console.error('Error loading bookmark tags:', error)
    }
  }

  const handleDelete = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete bookmark')
      
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
      loadStats()
      toast({
        title: 'Success',
        description: 'Bookmark deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete bookmark',
        variant: 'destructive',
      })
    }
  }

  const handleFavoriteToggle = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}/favorite`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to toggle favorite')
      const { data: updatedBookmark } = await response.json()
      
      setBookmarks(prev => prev.map(b => b.id === bookmarkId ? updatedBookmark : b))
      loadStats()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      })
    }
  }

  const handleFiltersChange = (newFilters: BookmarkSearchFilters) => {
    setFilters(newFilters)
    loadBookmarks()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Bookmarks</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {total} bookmark{total !== 1 ? 's' : ''}
        </p>
      </div>

      {stats && <BookmarkStats stats={stats} className="mb-8" />}

      <BookmarkFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableTags={availableTags}
        className="mb-8"
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : bookmarks.length > 0 ? (
        <BookmarkList
          bookmarks={bookmarks}
          onDelete={handleDelete}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No bookmarks found</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {Object.keys(filters).length > 0
              ? 'Try adjusting your filters'
              : 'Start bookmarking content to see it here'}
          </p>
        </div>
      )}
    </div>
  )
} 