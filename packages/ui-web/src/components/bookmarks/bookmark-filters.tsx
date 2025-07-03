"use client"

import React from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Search, Filter, Star } from 'lucide-react'
import { cn } from '../../utils'
import type { BookmarkSearchFilters, ContentType } from '@civicsense/shared/src/lib/types/bookmarks'

interface BookmarkFiltersProps {
  filters: BookmarkSearchFilters
  onFiltersChange: (filters: BookmarkSearchFilters) => void
  availableTags?: string[]
  className?: string
}

const contentTypeOptions: { label: string; value: ContentType }[] = [
  { label: 'Quiz', value: 'quiz' },
  { label: 'Article', value: 'article' },
  { label: 'Glossary', value: 'glossary' },
  { label: 'Figure', value: 'figure' },
  { label: 'Collection', value: 'collection' },
  { label: 'Custom', value: 'custom' }
]

export function BookmarkFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  className
}: BookmarkFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, query: e.target.value })
  }

  const handleContentTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      content_types: value ? [value as ContentType] : undefined
    })
  }

  const handleTagChange = (value: string) => {
    onFiltersChange({
      ...filters,
      tags: value ? [value] : undefined
    })
  }

  const handleFavoriteChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      is_favorite: checked || undefined
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              placeholder="Search bookmarks..."
              value={filters.query || ''}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Label className="text-sm font-medium">Filters:</Label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Select
            value={filters.content_types?.[0] || ''}
            onValueChange={handleContentTypeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {contentTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availableTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={filters.tags?.[0] || ''} onValueChange={handleTagChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="favorite"
            checked={filters.is_favorite || false}
            onCheckedChange={handleFavoriteChange}
          />
          <Label htmlFor="favorite" className="flex items-center gap-1 text-sm font-medium">
            <Star className="h-4 w-4" />
            Favorites only
          </Label>
        </div>
      </div>
    </div>
  )
} 