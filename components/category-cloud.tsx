"use client"
import { Button } from "@/components/ui/button"
import { allCategories, type CategoryType } from "@/lib/quiz-data"
import { cn } from "@/lib/utils"

interface CategoryCloudProps {
  onSelectCategory: (category: CategoryType | null) => void
  selectedCategory: CategoryType | null
  className?: string
}

export function CategoryCloud({ onSelectCategory, selectedCategory, className }: CategoryCloudProps) {
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
        {allCategories.map((category) => (
          <Button
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full",
              selectedCategory === category.name && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            onClick={() => onSelectCategory(category.name)}
          >
            <span className="mr-1">{category.emoji}</span> {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
