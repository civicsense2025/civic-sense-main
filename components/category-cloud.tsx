"use client"

import { Button } from "@/components/ui/button"
import { type CategoryType } from "@/lib/quiz-data"
import { useCanonicalCategories } from "@/lib/hooks/useCanonicalCategories"
import { cn } from "@/lib/utils"

interface CategoryCloudProps {
  onSelectCategory: (category: CategoryType | null) => void
  selectedCategory: CategoryType | null
  className?: string
}

export function CategoryCloud({ onSelectCategory, selectedCategory, className }: CategoryCloudProps) {
  const { getCanonicalCategories, isLoading, error } = useCanonicalCategories()
  const categories = getCanonicalCategories()

  if (isLoading) {
    return (
      <div className={cn("mb-6", className)}>
        <h2 className="text-lg font-semibold mb-3 text-center">Topic Categories</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="animate-pulse">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("mb-6", className)}>
        <h2 className="text-lg font-semibold mb-3 text-center">Topic Categories</h2>
        <div className="text-center text-sm text-muted-foreground">
          Failed to load categories. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <div className={cn("mb-6", className)}>
      <h2 className="text-lg font-semibold mb-3 text-center">Topic Categories</h2>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => onSelectCategory(null)}
        >
          All Topics
        </Button>
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full",
              selectedCategory === category.name && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            onClick={() => onSelectCategory(category.name as CategoryType)}
          >
            <span className="mr-1">{category.emoji}</span> {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
