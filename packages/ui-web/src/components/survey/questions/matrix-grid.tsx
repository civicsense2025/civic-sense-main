"use client"

import { Button } from "../ui/button"
import { cn } from "@civicsense/shared/lib/utils"

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
    <div className={cn("space-y-8", className)} data-audio-content="true">
      {/* Enhanced Scale Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2" data-question-content="true">
              {scale.labels.min}
            </div>
            <div className="w-12 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full mx-auto shadow-sm"></div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2" data-question-content="true">
              {scale.labels.max}
            </div>
            <div className="w-12 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full mx-auto shadow-sm"></div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Matrix Items */}
      <div className="space-y-6">
        {items.map((item, index) => {
          const isRated = values[item] !== undefined
          return (
            <div 
              key={index} 
              className={cn(
                "relative p-6 rounded-2xl border-2 transition-all duration-300",
                "bg-white dark:bg-slate-800/50 hover:shadow-lg hover:shadow-blue-600/10",
                isRated 
                  ? "border-blue-300 dark:border-blue-600 shadow-md shadow-blue-600/10" 
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700"
              )}
            >
              {/* Item completion indicator */}
              {isRated && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed" data-question-content="true">
                    {item}
                  </h4>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mt-3"></div>
                </div>
                
                <div className="flex justify-center space-x-3">
                  {scaleRange.map((value) => {
                    const isSelected = values[item] === value
                    const position = (value - scale.min) / (scale.max - scale.min)
                    return (
                      <Button
                        key={value}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateValue(item, value)}
                        className={cn(
                          "w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 border-2 relative",
                          "hover:scale-110 hover:shadow-lg focus-visible:scale-110",
                          isSelected 
                            ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30 scale-110 ring-2 ring-blue-600/30" 
                            : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        )}
                        style={{
                          backgroundImage: isSelected ? undefined : `linear-gradient(45deg, ${position < 0.5 ? '#ef4444' : '#10b981'} 0%, ${position < 0.5 ? '#f97316' : '#059669'} 100%)`,
                          backgroundClip: isSelected ? undefined : 'text',
                          WebkitBackgroundClip: isSelected ? undefined : 'text',
                          color: isSelected ? undefined : 'transparent'
                        }}
                      >
                        <span className={isSelected ? "text-white" : "bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-100 bg-clip-text text-transparent font-bold"}>
                          {value}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                      </Button>
                    )
                  })}
                </div>
                
                {values[item] && (
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/20 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Rated: {values[item]}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Enhanced Progress indicator */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-950/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center text-base mb-3">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Progress: {Object.keys(values).length} of {items.length} items completed
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round((Object.keys(values).length / items.length) * 100)}%
            </span>
            {Object.keys(values).length === items.length && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${(Object.keys(values).length / items.length) * 100}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 