// =============================================================================
// BOOKMARK BUTTON COMPONENT
// =============================================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '../ui/use-toast'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Bookmark, BookmarkCheck, Heart, HeartOff } from 'lucide-react'
import { cn } from '@civicsense/shared/lib/utils'
import type { ContentType, CreateBookmarkRequest } from '@civicsense/shared/lib/types/bookmarks'

export interface BookmarkButtonProps {
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
  variant?: 'icon' | 'button' | 'favorite'
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Callback when bookmark is created/removed */
  onBookmarkChange?: (isBookmarked: boolean, bookmarkId?: string) => void
}

export function BookmarkButton({
  contentType,
  contentId,
  contentUrl,
  title,
  description,
  tags = [],
  variant = 'icon',
  size = 'default',
  className,
  onBookmarkChange
}: BookmarkButtonProps) {
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

  // Render different variants
  if (variant === 'favorite') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={size}
              onClick={handleBookmarkToggle}
              disabled={isLoading}
              className={cn(
                'text-gray-500 hover:text-red-500 transition-colors',
                isBookmarked && 'text-red-500',
                className
              )}
            >
              {isBookmarked ? (
                <Heart className="h-4 w-4 fill-current" />
              ) : (
                <HeartOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'button') {
    return (
      <Button
        variant={isBookmarked ? 'default' : 'outline'}
        size={size}
        onClick={handleBookmarkToggle}
        disabled={isLoading}
        className={className}
      >
        {isBookmarked ? (
          <>
            <BookmarkCheck className="h-4 w-4 mr-2" />
            Bookmarked
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmark
          </>
        )}
      </Button>
    )
  }

  // Default icon variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            onClick={handleBookmarkToggle}
            disabled={isLoading}
            className={cn(
              'text-gray-500 hover:text-blue-500 transition-colors',
              isBookmarked && 'text-blue-500',
              className
            )}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 fill-current" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isBookmarked ? 'Remove bookmark' : 'Bookmark this content'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 