"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Bookmark as BookmarkIcon, Clock, ExternalLink, Star, Tags, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../../utils'
import type { Bookmark } from '@civicsense/shared/src/lib/types/bookmarks'

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onDelete?: (bookmarkId: string) => void
  onFavoriteToggle?: (bookmarkId: string) => void
  className?: string
}

export function BookmarkList({ bookmarks, onDelete, onFavoriteToggle, className }: BookmarkListProps) {
  if (!bookmarks?.length) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-8">
        <BookmarkIcon className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No bookmarks yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Start bookmarking content to see it here
        </p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="group relative">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="line-clamp-2">
                  {bookmark.content_url ? (
                    <a
                      href={bookmark.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-2"
                    >
                      {bookmark.title}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    bookmark.title
                  )}
                </CardTitle>
                {bookmark.description && (
                  <CardDescription className="mt-2 line-clamp-2">
                    {bookmark.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onFavoriteToggle && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onFavoriteToggle(bookmark.id)}
                    className={cn(
                      'text-slate-500 hover:text-yellow-500',
                      bookmark.is_favorite && 'text-yellow-500'
                    )}
                  >
                    <Star className={cn('h-4 w-4', bookmark.is_favorite && 'fill-current')} />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(bookmark.id)}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
              </Badge>
              {bookmark.tags?.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Tags className="h-3 w-3" />
                  {bookmark.tags.length} {bookmark.tags.length === 1 ? 'tag' : 'tags'}
                </Badge>
              )}
              {bookmark.collection && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {bookmark.collection.name}
                </Badge>
              )}
            </div>
          </CardContent>
          {bookmark.user_notes && (
            <CardFooter>
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                {bookmark.user_notes}
              </p>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
} 