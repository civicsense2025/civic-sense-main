"use client"

import { Button } from "../ui/button"
import { cn } from "@civicsense/shared/lib/utils"

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
    <div className={cn("space-y-8", className)} data-audio-content="true">
      {labels && (
        <div className="flex justify-between items-center px-4">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-900 dark:text-white mb-1" data-question-content="true">
              {labels.min}
            </div>
            <div className="w-8 h-1 bg-red-200 dark:bg-red-800 rounded-full mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-slate-900 dark:text-white mb-1" data-question-content="true">
              {labels.max}
            </div>
            <div className="w-8 h-1 bg-green-200 dark:bg-green-800 rounded-full mx-auto"></div>
          </div>
        </div>
      )}
      
      <div className="relative">
        {/* Background progress bar */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-200 dark:bg-slate-700 rounded-full transform -translate-y-1/2 mx-8"></div>
        
        <div className="flex justify-center space-x-2 relative z-10">
          {range.map((number, index) => (
            <Button
              key={number}
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => onChange(number)}
              className={cn(
                "w-16 h-16 rounded-full font-bold text-lg transition-all duration-300 transform border-2 relative",
                "hover:scale-110 hover:shadow-lg focus-visible:scale-110 focus-visible:shadow-lg",
                value === number 
                  ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30 scale-115 ring-4 ring-blue-600/20" 
                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              )}
            >
              {number}
              {value === number && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </Button>
          ))}
        </div>
      </div>
      
      {value && (
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/20 px-4 py-2 rounded-full">
            <span className="text-lg font-medium text-blue-900 dark:text-blue-100">
              {value}
            </span>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              selected
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 