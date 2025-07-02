"use client"

import { useState, useRef, useEffect } from "react"
import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { cn } from "@civicsense/shared/lib/utils"

interface MultipleSelectProps {
  questionId: string
  options: string[]
  value?: string[]
  onChange: (value: string[]) => void
  maxSelections?: number
  className?: string
}

export function MultipleSelect({ 
  questionId, 
  options, 
  value = [], 
  onChange, 
  maxSelections,
  className 
}: MultipleSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({})

  // Parse value to separate normal options from other options with text
  const parseValues = (values: string[]) => {
    const parsed = values.map(val => {
      if (val.startsWith('other:')) {
        const parts = val.split(':')
        const optionName = parts[1] || 'other'
        const text = parts.slice(2).join(':') || ''
        return {
          type: 'other' as const,
          originalOption: options.find(opt => opt.toLowerCase().includes('other')) || optionName,
          text,
          value: val
        }
      }
      return {
        type: 'normal' as const,
        originalOption: val,
        text: '',
        value: val
      }
    })
    return parsed
  }

  const parsedValues = parseValues(value)
  const normalValues = parsedValues.filter(p => p.type === 'normal').map(p => p.originalOption)
  const otherValues = parsedValues.filter(p => p.type === 'other')

  // Update local other texts when value changes
  useEffect(() => {
    const newOtherTexts: Record<string, string> = {}
    otherValues.forEach(ov => {
      newOtherTexts[ov.originalOption] = ov.text
    })
    setOtherTexts(newOtherTexts)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent, option: string, index: number) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault()
        toggleOption(option)
        break
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        const nextIndex = index < options.length - 1 ? index + 1 : 0
        const nextElement = document.getElementById(`${questionId}-option-${nextIndex}`)
        nextElement?.focus()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        const prevIndex = index > 0 ? index - 1 : options.length - 1
        const prevElement = document.getElementById(`${questionId}-option-${prevIndex}`)
        prevElement?.focus()
        break
    }
  }

  // Handle number key shortcuts
  useEffect(() => {
    const handleNumberKeys = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return
      
      const key = e.key
      if (['1','2','3','4','5','6','7','8','9'].includes(key)) {
        const optionIndex = parseInt(key) - 1
        if (optionIndex < options.length) {
          e.preventDefault()
          toggleOption(options[optionIndex])
        }
      }
    }

    document.addEventListener('keydown', handleNumberKeys)
    return () => document.removeEventListener('keydown', handleNumberKeys)
  }, [options])

  const toggleOption = (option: string) => {
    const isOtherOption = option.toLowerCase().includes('other')
    const isCurrentlySelected = isOptionSelected(option)
    
    if (isOtherOption) {
      if (isCurrentlySelected) {
        // Remove the other option
        const newValue = value.filter(v => !v.startsWith(`other:${option}:`))
        onChange(newValue)
      } else {
        // Add the other option
        if (maxSelections && value.length >= maxSelections) return
        const otherText = otherTexts[option] || ''
        const newValue = [...value, otherText ? `other:${option}:${otherText}` : option]
        onChange(newValue)
      }
    } else {
      // Regular option
      if (isCurrentlySelected) {
        const newValue = value.filter(v => v !== option)
        onChange(newValue)
      } else {
        if (maxSelections && value.length >= maxSelections) return
        const newValue = [...value, option]
        onChange(newValue)
      }
    }
  }

  const isOptionSelected = (option: string) => {
    const isOtherOption = option.toLowerCase().includes('other')
    if (isOtherOption) {
      return value.some(v => v.startsWith(`other:${option}:`)) || value.includes(option)
    }
    return value.includes(option)
  }

  const handleOtherTextChange = (option: string, text: string) => {
    setOtherTexts(prev => ({ ...prev, [option]: text }))
    
    // Update the value array
    const newValue = value.filter(v => !v.startsWith(`other:${option}:`))
    if (text || value.includes(option)) {
      newValue.push(text ? `other:${option}:${text}` : option)
    }
    onChange(newValue)
  }

  const isAtMaxSelections = maxSelections && value.length >= maxSelections

  return (
    <div 
      ref={containerRef}
      className={cn("space-y-3", className)}
      role="group"
      aria-labelledby="current-question-title"
      aria-describedby="multiple-select-instructions"
    >
      {/* Keyboard instructions - always visible */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-purple-50 dark:bg-purple-950/20 px-4 py-2 rounded-full border border-purple-200 dark:border-purple-800">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs font-mono">1-{Math.min(options.length, 9)}</kbd>
          <span className="text-xs text-purple-700 dark:text-purple-300">or</span>
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs font-mono">Space</kbd>
          <span className="text-xs text-purple-700 dark:text-purple-300">to toggle • Multiple selections allowed</span>
        </div>
      </div>

      <div id="multiple-select-instructions" className="sr-only">
        Multiple selection question. Use arrow keys to navigate, space or enter to toggle selection.
        {maxSelections && ` Maximum ${maxSelections} selections allowed.`}
        {options.some(opt => opt.toLowerCase().includes('other')) && " Some options allow custom text input."}
      </div>
      
      {options.map((option, index) => {
        const isSelected = isOptionSelected(option)
        const isOtherOption = option.toLowerCase().includes('other')
        const optionId = `${questionId}-option-${index}`
        const keyNumber = index + 1
        const isDisabled = !isSelected && Boolean(isAtMaxSelections)
        
        return (
          <div key={index} className="space-y-3">
            <div 
              className={cn(
                "relative group focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 rounded-2xl",
                "transition-all duration-300 transform hover:scale-[1.02]",
                isDisabled && "opacity-60"
              )}
            >
              <label
                htmlFor={optionId}
                className={cn(
                  "flex items-center space-x-4 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                  "hover:shadow-lg hover:shadow-purple-600/10 hover:-translate-y-0.5",
                  "focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20",
                  isSelected 
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20 shadow-md shadow-purple-600/20 scale-[1.02]" 
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-600",
                  isDisabled && "cursor-not-allowed hover:scale-100 hover:shadow-none hover:translate-y-0"
                )}
                onClick={() => !isDisabled && toggleOption(option)}
              >
                {/* Animated background gradient on hover */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-purple-50/0 via-purple-50/30 to-purple-50/0 dark:from-purple-950/0 dark:via-purple-950/30 dark:to-purple-950/0 opacity-0 transition-opacity duration-300",
                  !isSelected && !isDisabled && "group-hover:opacity-100"
                )} />
                
                {/* Keyboard shortcut indicator - always visible and prominent */}
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all duration-200 shrink-0 font-mono text-sm font-bold relative z-10",
                    isSelected
                      ? "border-purple-600 bg-purple-600 text-white shadow-lg" 
                      : keyNumber <= 9 && !isDisabled
                      ? "border-purple-300 dark:border-purple-600 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                  aria-hidden="true"
                >
                  {keyNumber <= 9 ? keyNumber : '•'}
                </div>
                
                <Checkbox 
                  id={optionId}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => !isDisabled && toggleOption(option)}
                  onKeyDown={(e) => !isDisabled && handleKeyDown(e, option, index)}
                  className={cn(
                    "cursor-pointer relative z-10 transition-all duration-200",
                    isSelected && "data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  )}
                  aria-describedby={`${optionId}-description`}
                />
                
                {/* Option text */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div 
                    className={cn(
                      "text-base leading-relaxed transition-colors",
                      isSelected 
                        ? "text-purple-900 dark:text-purple-100 font-medium" 
                        : "text-slate-700 dark:text-slate-200 font-light group-hover:text-slate-900 dark:group-hover:text-white",
                      isDisabled && "text-slate-400 dark:text-slate-500"
                    )}
                    data-question-content="true"
                  >
                    {option}
                  </div>
                  <div id={`${optionId}-description`} className="sr-only">
                    Option {index + 1} of {options.length}. 
                    {isSelected ? 'Selected' : 'Not selected'}. 
                    Press space or enter to toggle.
                    {isDisabled && ' Maximum selections reached.'}
                    {isOtherOption && " This option allows custom text input."}
                  </div>
                </div>

                {/* Selection indicator with micro animation */}
                {isSelected && (
                  <div className="relative z-10 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                    <div className="text-xs text-purple-600 font-medium">Selected</div>
                  </div>
                )}
                
                {/* Sparkle animation on selection */}
                {isSelected && (
                  <div className="absolute top-2 right-2 text-purple-400 animate-in zoom-in-50 duration-500">
                    ✨
                  </div>
                )}

                {/* Max selections reached indicator */}
                {isDisabled && !isSelected && (
                  <div className="absolute top-2 right-2 text-slate-400 text-xs">
                    Max reached
                  </div>
                )}
              </label>
            </div>

            {/* Other text input field */}
            {isOtherOption && isSelected && (
              <div className="ml-14 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <Input
                    type="text"
                    value={otherTexts[option] || ''}
                    onChange={(e) => handleOtherTextChange(option, e.target.value)}
                    placeholder="Please specify..."
                    className={cn(
                      "w-full text-base p-4 border-2 rounded-xl transition-all duration-300",
                      "bg-white dark:bg-slate-800/50 backdrop-blur-sm",
                      "border-purple-200 dark:border-purple-700",
                      "focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10",
                      "placeholder:text-purple-400 dark:placeholder:text-purple-500"
                    )}
                    aria-label={`Specify your answer for: ${option}`}
                  />
                  {otherTexts[option] && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
      
      {/* Selection counter with delightful feedback */}
      <div className="flex items-center justify-center space-x-4 mt-6">
        <div 
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300",
            value.length > 0
              ? "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800"
              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
            value.length > 0 
              ? "bg-purple-600 text-white" 
              : "bg-slate-300 text-slate-600"
          )}>
            {value.length}
          </div>
          <span className={cn(
            "text-sm font-medium transition-colors",
            value.length > 0 
              ? "text-purple-700 dark:text-purple-300" 
              : "text-slate-600 dark:text-slate-400"
          )}>
            {value.length === 0 
              ? "None selected" 
              : value.length === 1 
              ? "1 selected" 
              : `${value.length} selected`}
          </span>
          {maxSelections && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {maxSelections} max
            </span>
          )}
        </div>
      </div>

      {/* Witty encouragement based on selection count */}
      {value.length > 0 && (
        <div className="text-center mt-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="inline-flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-3 py-1 rounded-full">
            <span>
              {value.length === 1 ? "Great start!" : 
               value.length === maxSelections ? "Perfect selection!" : 
               value.length > 3 ? "You're decisive!" : 
               "Good choices!"}
              {otherValues.length > 0 && " Thanks for the detailed input!"}
            </span>
            <span className="animate-bounce">
              {otherValues.length > 0 ? "💭" :
               value.length === 1 ? "🎯" :
               value.length === maxSelections ? "🎉" :
               value.length > 3 ? "⚡" : "👌"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 