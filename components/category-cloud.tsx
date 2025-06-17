"use client"

import type { CategoryType } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface CategoryCloudProps {
  onSelectCategory: (category: CategoryType | null) => void
  selectedCategory: CategoryType | null
  className?: string
}

// Simple category mapping
const categoryInfo: Record<string, { emoji: string; name: string }> = {
  Government: { emoji: "🏛️", name: "Government" },
  Elections: { emoji: "🗳️", name: "Elections" },
  Economy: { emoji: "💰", name: "Economy" },
  "Foreign Policy": { emoji: "🌐", name: "Foreign Policy" },
  Justice: { emoji: "⚖️", name: "Justice" },
  "Civil Rights": { emoji: "✊", name: "Civil Rights" },
  Environment: { emoji: "🌱", name: "Environment" },
  "Local Issues": { emoji: "🏙️", name: "Local Issues" },
  "Constitutional Law": { emoji: "📜", name: "Constitutional Law" },
}

export function CategoryCloud({ onSelectCategory, selectedCategory, className }: CategoryCloudProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Apple-style section header */}
      <div className="text-center space-y-2">
        <h2 className="apple-headline">Explore Topics</h2>
        <p className="apple-subheadline max-w-2xl mx-auto">
          Choose a category to focus on or browse all topics
        </p>
      </div>

      {/* Apple-inspired category grid */}
      <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
        {/* Clear filter option with Apple styling */}
        {selectedCategory && (
          <Button
            onClick={() => onSelectCategory(null)}
            variant="outline"
            className="apple-button-secondary group inline-flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 hover:scale-105"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-mono font-medium">Clear Filter</span>
          </Button>
        )}

        {/* Category buttons with Apple design */}
        {Object.entries(categoryInfo).map(([key, category]) => {
          const isSelected = selectedCategory === key
          return (
            <Button
              key={key}
              onClick={() => onSelectCategory(key as CategoryType)}
              variant={isSelected ? "default" : "outline"}
              className={`
                group inline-flex items-center space-x-3 px-5 py-3 rounded-full
                transition-all duration-200 hover:scale-105 transform
                border backdrop-blur-sm
                ${isSelected
                  ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/60 dark:hover:border-slate-600/60'
                }
              `}
            >
              <span className="text-lg" role="img" aria-label={category.name}>
                {category.emoji}
              </span>
              <span className="text-sm font-mono font-medium">
                {category.name}
              </span>
            </Button>
          )
        })}
      </div>

      {/* Apple-style selected category indicator */}
      {selectedCategory && categoryInfo[selectedCategory] && (
        <div className="text-center apple-animate-in">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
            <span className="text-base">
              {categoryInfo[selectedCategory].emoji}
            </span>
            <span className="text-sm font-mono text-blue-700 dark:text-blue-300 font-medium">
              Filtering by {categoryInfo[selectedCategory].name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
