"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ScaleRatingProps {
  questionId: string
  min?: number
  max?: number
  value?: number
  onChange: (value: number) => void
  labels?: { min: string; max: string }
  className?: string
}

export function ScaleRating({ 
  questionId, 
  min = 1, 
  max = 5, 
  value, 
  onChange, 
  labels,
  className 
}: ScaleRatingProps) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  
  return (
    <div className={cn("space-y-6", className)}>
      {labels && (
        <div className="flex justify-between items-center px-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
            {labels.min}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
            {labels.max}
          </span>
        </div>
      )}
      
      <div className="flex justify-center space-x-3">
        {range.map((number) => (
          <Button
            key={number}
            type="button"
            variant={value === number ? "default" : "outline"}
            size="lg"
            onClick={() => onChange(number)}
            className={cn(
              "w-14 h-14 rounded-full font-medium transition-all duration-300 transform hover:scale-105",
              value === number 
                ? "bg-blue-600 text-white hover:bg-blue-700 scale-110 shadow-lg shadow-blue-600/25" 
                : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            {number}
          </Button>
        ))}
      </div>
      
      {value && (
        <div className="text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Selected: {value}
          </span>
        </div>
      )}
    </div>
  )
} 