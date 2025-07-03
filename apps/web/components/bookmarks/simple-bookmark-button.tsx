// =============================================================================
// SIMPLE BOOKMARK BUTTON
// =============================================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/auth-provider'
import { useToast } from '@civicsense/ui-web'
import { Button, type ButtonProps } from './ui/button'
import { cn } from '@civicsense/business-logic/utils'
import type { ContentType, CreateBookmarkRequest } from '@civicsense/types/bookmarks'

export interface SimpleBookmarkButtonProps {
  /** Type of content being bookmarked */
  contentType: ContentType
  /** Unique identifier for the content */
  contentId?: string
  /** URL of the content */
  contentUrl?: string
  /** Title of the content */
  title: string
  /** Description of the content */
  description?: string
  /** Additional tags to apply */
  tags?: string[]
  /** Button variant */
  variant?: 'icon' | 'button'
  /** Additional CSS classes */
  className?: string
  /** Callback when bookmark is created/removed */
  onBookmarkChange?: (isBookmarked: boolean, bookmarkId?: string) => void
}

export function SimpleBookmarkButton({
  contentType,
  contentId,
  contentUrl,
  title,
  description,
  tags = [],
  variant = 'icon',
  className,
  onBookmarkChange
}: SimpleBookmarkButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if content is already bookmarked
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!user || (!contentId && !contentUrl)) {
        setIsChecking(false)
        return
      }

      try {
        const response = await fetch('/api/bookmarks/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: contentType,
            content_id: contentId,
            content_url: contentUrl
          })
        })

        if (response.ok) {
          const data = await response.json()
          setIsBookmarked(data.isBookmarked)
          setBookmarkId(data.bookmarkId || null)
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkBookmarkStatus()
  }, [user, contentType, contentId, contentUrl])

  const handleBookmarkToggle = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark content',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setIsBookmarked(false)
          setBookmarkId(null)
          onBookmarkChange?.(false)
          toast({
            title: 'Bookmark removed',
            description: 'Content removed from your bookmarks'
          })
        } else {
          throw new Error('Failed to remove bookmark')
        }
      } else {
        // Create bookmark
        const bookmarkData: CreateBookmarkRequest = {
          content_type: contentType,
          content_id: contentId,
          content_url: contentUrl,
          title,
          description,
          tags
        }

        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookmarkData)
        })

        if (response.ok) {
          const result = await response.json()
          setIsBookmarked(true)
          setBookmarkId(result.data.id)
          onBookmarkChange?.(true, result.data.id)
          toast({
            title: 'Bookmarked!',
            description: 'Content saved to your bookmarks'
          })
        } else {
          throw new Error('Failed to create bookmark')
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if still checking and user exists
  if (isChecking && user) {
    return null
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleBookmarkToggle}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
          isBookmarked 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isBookmarked ? '📖 Bookmarked' : '🔖 Bookmark'}
      </button>
    )
  }

  // Default icon variant
  return (
    <button
      onClick={handleBookmarkToggle}
      disabled={isLoading}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this content'}
      className={cn(
        'text-gray-500 hover:text-blue-500 transition-colors p-2 rounded',
        isBookmarked && 'text-blue-500',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isBookmarked ? '📖' : '🔖'}
    </button>
  )
} 