"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MatrixGridProps {
  questionId: string
  items: string[]
  scale: {
    min: number
    max: number
    labels: { min: string; max: string }
  }
  values?: Record<string, number>
  onChange: (values: Record<string, number>) => void
  className?: string
}

export function MatrixGrid({ 
  questionId, 
  items, 
  scale, 
  values = {}, 
  onChange, 
  className 
}: MatrixGridProps) {
  const scaleRange = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i)
  
  const updateValue = (item: string, value: number) => {
    const newValues = { ...values, [item]: value }
    onChange(newValues)
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Scale Header */}
      <div className="flex justify-between items-center px-4 mb-8">
        <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
          {scale.labels.min}
        </span>
        <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
          {scale.labels.max}
        </span>
      </div>
      
      {/* Matrix Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 pr-6">
                <h4 className="font-light text-slate-900 dark:text-white leading-relaxed">
                  {item}
                </h4>
              </div>
            </div>
            
            <div className="flex justify-center space-x-2">
              {scaleRange.map((value) => {
                const isSelected = values[item] === value
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateValue(item, value)}
                    className={cn(
                      "w-10 h-10 rounded-full font-medium transition-all duration-200",
                      isSelected 
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md scale-105" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    {value}
                  </Button>
                )
              })}
            </div>
            
            {values[item] && (
              <div className="text-center mt-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Rating: {values[item]}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Progress indicator */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Progress: {Object.keys(values).length} of {items.length} items rated
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {Math.round((Object.keys(values).length / items.length) * 100)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(values).length / items.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
} 