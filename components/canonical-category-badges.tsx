"use client"

import { Badge } from "@/components/ui/badge"
import { useCanonicalCategories } from "@/lib/hooks/useCanonicalCategories"
import { cn } from "@/lib/utils"
import { Tag } from "lucide-react"

interface CanonicalCategoryBadgesProps {
  rawCategories: string[]
  maxVisible?: number
  className?: string
  badgeClassName?: string
  showCount?: boolean
}

export function CanonicalCategoryBadges({ 
  rawCategories, 
  maxVisible = 3, 
  className,
  badgeClassName,
  showCount = true
}: CanonicalCategoryBadgesProps) {
  const { normalise, getCategoryInfo, isLoading } = useCanonicalCategories()
  
  if (isLoading) {
    return (
      <div className={cn("flex flex-wrap gap-1", className)}>
        {Array.from({ length: Math.min(maxVisible, 3) }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        ))}
      </div>
    )
  }

  const canonicalCategories = normalise(rawCategories)
  const visibleCategories = canonicalCategories.slice(0, maxVisible)
  const remainingCount = canonicalCategories.length - maxVisible

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleCategories.map((category, index) => {
        const categoryInfo = getCategoryInfo(category)
        return (
          <Badge 
            key={category} 
            variant="outline" 
            className={cn(
              "text-xs transition-all duration-300",
              badgeClassName
            )}
          >
            <span className="mr-1">{categoryInfo?.emoji || '📚'}</span> 
            {category}
          </Badge>
        )
      })}
      {showCount && remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs transition-all duration-300",
            badgeClassName
          )}
        >
          <Tag className="w-3 h-3 mr-1" />
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
} 