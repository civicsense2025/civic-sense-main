"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

interface MultipleChoiceProps {
  questionId: string
  options: string[]
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function MultipleChoice({ questionId, options, value, onChange, className }: MultipleChoiceProps) {
  return (
    <RadioGroup
      value={value || ""}
      onValueChange={onChange}
      className={cn("space-y-4", className)}
      data-audio-content="true"
    >
      {options.map((option, index) => {
        const isSelected = value === option
        return (
          <div 
            key={index} 
            className={cn(
              "relative flex items-center space-x-4 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
              "hover:shadow-lg hover:shadow-blue-600/10 hover:-translate-y-0.5",
              isSelected 
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20 shadow-md shadow-blue-600/20" 
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-600"
            )}
          >
            {/* Custom selection indicator */}
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
              isSelected 
                ? "border-blue-600 bg-blue-600" 
                : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
            )}>
              {isSelected && (
                <div className="w-3 h-3 bg-white rounded-full animate-in zoom-in-50 duration-200" />
              )}
            </div>
            
            <RadioGroupItem 
              value={option} 
              id={`${questionId}-${index}`}
              className="sr-only" 
            />
            <Label 
              htmlFor={`${questionId}-${index}`} 
              className={cn(
                "flex-1 cursor-pointer transition-colors text-base leading-relaxed",
                isSelected 
                  ? "text-blue-900 dark:text-blue-100 font-medium" 
                  : "text-slate-700 dark:text-slate-200 font-light group-hover:text-slate-900 dark:group-hover:text-white"
              )}
              data-question-content="true"
            >
              {option}
            </Label>
            
            {/* Subtle selection indicator */}
            {isSelected && (
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-in zoom-in-50 duration-200" />
            )}
          </div>
        )
      })}
    </RadioGroup>
  )
} 