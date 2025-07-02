"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Star } from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"

interface StarRatingProps {
  questionId: string
  maxStars?: number
  value?: number
  onChange: (value: number) => void
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StarRating({ 
  questionId, 
  maxStars = 5, 
  value = 0, 
  onChange, 
  size = "md",
  className 
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)
  
  const starSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  }
  
  const buttonSizes = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3"
  }
  
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="flex justify-center space-x-2">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1
          const isActive = starValue <= (hoverValue || value)
          
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoverValue(starValue)}
              onMouseLeave={() => setHoverValue(0)}
              className={cn(
                "transition-all duration-200 transform hover:scale-110",
                buttonSizes[size]
              )}
            >
              <Star 
                className={cn(
                  "transition-all duration-200",
                  starSizes[size],
                  isActive 
                    ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" 
                    : "text-slate-300 dark:text-slate-600 hover:text-yellow-300"
                )}
              />
            </Button>
          )
        })}
      </div>
      
      {value > 0 && (
        <div className="text-center">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {value} out of {maxStars} stars
          </span>
        </div>
      )}
    </div>
  )
} 