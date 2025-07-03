"use client"

import { Slider } from './ui/slider'
import { cn } from '@civicsense/business-logic/utils'

interface SliderInputProps {
  questionId: string
  min?: number
  max?: number
  step?: number
  value?: number
  onChange: (value: number) => void
  labels?: { min: string; max: string }
  showValue?: boolean
  unit?: string
  className?: string
}

export function SliderInput({ 
  questionId, 
  min = 0, 
  max = 100, 
  step = 1,
  value = min, 
  onChange, 
  labels,
  showValue = true,
  unit = "",
  className 
}: SliderInputProps) {
  const handleChange = (values: number[]) => {
    onChange(values[0])
  }
  
  const percentage = ((value - min) / (max - min)) * 100
  
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
      
      <div className="px-3 space-y-4">
        <div className="relative">
          <Slider
            value={[value]}
            onValueChange={handleChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
          
          {/* Custom thumb indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `${percentage}%` }}
          >
            <div className="w-6 h-6 bg-blue-600 rounded-full shadow-lg border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        
        {showValue && (
          <div className="text-center space-y-2">
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {value}{unit}
            </div>
            {(min !== 0 || max !== 100) && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Range: {min}{unit} - {max}{unit}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Quick selection buttons for common values */}
      {(max - min) <= 10 && step === 1 && (
        <div className="flex justify-center space-x-2 pt-4">
          {Array.from({ length: Math.min(5, max - min + 1) }, (_, i) => {
            const quickValue = min + Math.floor(((max - min) / 4) * i)
            return (
              <button
                key={quickValue}
                type="button"
                onClick={() => onChange(quickValue)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm transition-all duration-200",
                  value === quickValue
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {quickValue}{unit}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
} 