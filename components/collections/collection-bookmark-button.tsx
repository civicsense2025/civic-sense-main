"use client"

import React from 'react'
import { SimpleBookmarkButton } from '@/components/bookmarks/simple-bookmark-button'
import type { Collection } from '@/types/collections'

interface CollectionBookmarkButtonProps {
  collection: Collection
  className?: string
  variant?: 'icon' | 'button'
  onBookmarkChange?: (isBookmarked: boolean) => void
}

export function CollectionBookmarkButton({
  collection,
  className,
  variant = 'icon',
  onBookmarkChange
}: CollectionBookmarkButtonProps) {
  return (
    <SimpleBookmarkButton
      contentType="collection"
      contentId={collection.id}
      title={collection.title}
      description={collection.description}
      contentUrl={`/collections/${collection.slug}`}
      className={className}
      variant={variant}
      onBookmarkChange={onBookmarkChange}
    />
  )
} 