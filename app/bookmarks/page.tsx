"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SnippetCard } from '@/components/bookmarks/snippet-card'
import { SimpleBookmarkButton } from '@/components/bookmarks/simple-bookmark-button'
import { useToast } from '@/components/ui/use-toast'
import type { Bookmark, BookmarkSnippet, BookmarkSearchFilters, ContentType } from '@/lib/types/bookmarks'

export default function BookmarksPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [snippets, setSnippets] = useState<BookmarkSnippet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all')
  const [activeTab, setActiveTab] = useState('bookmarks')

  // Load bookmarks
  useEffect(() => {
    if (!user) return

    const loadBookmarks = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set('query', searchQuery)
        if (contentTypeFilter !== 'all') params.set('content_types', contentTypeFilter)

        const response = await fetch(`/api/bookmarks?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setBookmarks(data.data.bookmarks || [])
        } else {
          throw new Error('Failed to load bookmarks')
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error)
        toast({
          title: 'Error',
          description: 'Failed to load bookmarks',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadBookmarks()
  }, [user, searchQuery, contentTypeFilter, toast])

  // Load snippets separately
  useEffect(() => {
    if (!user || activeTab !== 'snippets') return

    const loadSnippets = async () => {
      setLoading(true)
      try {
        // For now, we'll need to implement a snippets endpoint
        // This is a placeholder
        setSnippets([])
      } catch (error) {
        console.error('Error loading snippets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSnippets()
  }, [user, activeTab])

  const handleBookmarkDeleted = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    toast({
      title: 'Bookmark removed',
      description: 'The bookmark has been removed successfully'
    })
  }

  const getContentTypeIcon = (contentType: ContentType) => {
    switch (contentType) {
      case 'quiz': return '🧠'
      case 'article': return '📄'
      case 'glossary': return '📚'
      case 'figure': return '👤'
      case 'custom': return '🔖'
      default: return '📎'
    }
  }

  const contentTypes: { value: ContentType | 'all', label: string }[] = [
    { value: 'all', label: 'All Content' },
    { value: 'quiz', label: 'Quiz Questions' },
    { value: 'article', label: 'Articles' },
    { value: 'glossary', label: 'Glossary Terms' },
    { value: 'figure', label: 'Public Figures' },
    { value: 'custom', label: 'Custom' }
  ]

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-light text-slate-900 mb-4">Your Bookmarks</h1>
          <p className="text-slate-600 mb-8">Sign in to view your saved content</p>
          <Button>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-slate-900 dark:text-slate-100 mb-2">
          Your Bookmarks
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your saved content and highlights
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Input
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={contentTypeFilter}
          onChange={(e) => setContentTypeFilter(e.target.value as ContentType | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          {contentTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bookmarks">Bookmarks ({bookmarks.length})</TabsTrigger>
          <TabsTrigger value="snippets">Highlights ({snippets.length})</TabsTrigger>
        </TabsList>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery || contentTypeFilter !== 'all' 
                  ? 'No bookmarks match your filters'
                  : 'You haven\'t bookmarked any content yet'
                }
              </p>
              {!searchQuery && contentTypeFilter === 'all' && (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Start exploring content and click the bookmark icon to save items here
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getContentTypeIcon(bookmark.content_type)}</span>
                        <Badge className="text-xs">
                          {bookmark.content_type}
                        </Badge>
                        {bookmark.is_favorite && (
                          <span className="text-red-500">❤️</span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        {bookmark.title}
                      </h3>
                      
                      {bookmark.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                          {bookmark.description}
                        </p>
                      )}
                      
                      {bookmark.tags && bookmark.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {bookmark.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Saved {new Date(bookmark.created_at).toLocaleDateString()}
                        </span>
                        {bookmark.access_count > 0 && (
                          <span>Viewed {bookmark.access_count} times</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <SimpleBookmarkButton
                        contentType={bookmark.content_type}
                        contentId={bookmark.content_id}
                        title={bookmark.title}
                        description={bookmark.description}
                        onBookmarkChange={(isBookmarked) => {
                          if (!isBookmarked) {
                            handleBookmarkDeleted(bookmark.id)
                          }
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Snippets Tab */}
        <TabsContent value="snippets">
          {snippets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                You haven't saved any text highlights yet
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Select text on articles and other content to create highlights
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {snippets.map((snippet) => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 