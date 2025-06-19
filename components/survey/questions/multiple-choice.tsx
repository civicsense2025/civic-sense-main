"use client"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MultipleChoiceProps {
  questionId: string
  options: string[]
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function MultipleChoice({ questionId, options, value, onChange, className }: MultipleChoiceProps) {
  const radioGroupRef = useRef<HTMLDivElement>(null)
  const [otherText, setOtherText] = useState("")
  
  // Extract the actual option value and check if it's an "other" response
  const parseValue = (val: string) => {
    if (val?.startsWith('other:')) {
      return {
        isOther: true,
        optionValue: 'other',
        otherText: val.substring(6) // Remove 'other:' prefix
      }
    }
    return {
      isOther: false,
      optionValue: val,
      otherText: ''
    }
  }

  const { isOther: currentIsOther, optionValue: currentOption, otherText: currentOtherText } = parseValue(value || '')
  
  // Update local other text when value changes
  useEffect(() => {
    if (currentIsOther) {
      setOtherText(currentOtherText)
    } else {
      setOtherText("")
    }
  }, [currentIsOther, currentOtherText])

  const handleOptionChange = (option: string) => {
    const isOtherOption = option.toLowerCase().includes('other')
    
    if (isOtherOption) {
      // For other options, use the current other text or empty string
      onChange(otherText ? `other:${otherText}` : option)
    } else {
      onChange(option)
      setOtherText("") // Clear other text when selecting non-other option
    }
  }

  const handleOtherTextChange = (text: string) => {
    setOtherText(text)
    const otherOption = options.find(opt => opt.toLowerCase().includes('other'))
    if (otherOption) {
      onChange(text ? `other:${text}` : otherOption)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!radioGroupRef.current?.contains(e.target as Node)) return

      const currentIndex = currentOption ? options.findIndex(opt => 
        opt === currentOption || (opt.toLowerCase().includes('other') && currentIsOther)
      ) : -1

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
          handleOptionChange(options[nextIndex])
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
          handleOptionChange(options[prevIndex])
          break
        case ' ':
        case 'Enter':
          e.preventDefault()
          // Focus stays on current item, space/enter confirms selection
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const optionIndex = parseInt(e.key) - 1
          if (optionIndex < options.length) {
            e.preventDefault()
            handleOptionChange(options[optionIndex])
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [options, currentOption, currentIsOther])

  return (
    <div className="space-y-3">
      {/* Keyboard instructions - always visible */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/20 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs font-mono">1-{Math.min(options.length, 9)}</kbd>
          <span className="text-xs text-blue-700 dark:text-blue-300">Use number keys or</span>
          <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs font-mono">↑↓</kbd>
          <span className="text-xs text-blue-700 dark:text-blue-300">to select</span>
        </div>
      </div>

      <RadioGroup
        ref={radioGroupRef}
        value={currentOption || ""}
        onValueChange={handleOptionChange}
        className={cn("space-y-3", className)}
        data-audio-content="true"
        role="radiogroup"
        aria-labelledby={`${questionId}-legend`}
      >
        {options.map((option, index) => {
          const isSelected = option === currentOption || (option.toLowerCase().includes('other') && currentIsOther)
          const isOtherOption = option.toLowerCase().includes('other')
          const optionId = `${questionId}-option-${index}`
          const keyNumber = index + 1
          
          return (
            <div 
              key={index}
              className={cn(
                "relative group focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 rounded-2xl",
                "transition-all duration-300 transform hover:scale-[1.02]"
              )}
            >
              <label
                htmlFor={optionId}
                className={cn(
                  "flex items-center space-x-4 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                  "hover:shadow-lg hover:shadow-blue-600/10 hover:-translate-y-0.5",
                  "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20",
                  isSelected 
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20 shadow-md shadow-blue-600/20 scale-[1.02]" 
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-600"
                )}
                onClick={() => handleOptionChange(option)}
              >
                {/* Animated background gradient on hover */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/30 to-blue-50/0 dark:from-blue-950/0 dark:via-blue-950/30 dark:to-blue-950/0 opacity-0 transition-opacity duration-300",
                  !isSelected && "group-hover:opacity-100"
                )} />
                
                {/* Keyboard shortcut indicator - always visible and prominent */}
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all duration-200 shrink-0 font-mono text-sm font-bold relative z-10",
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg" 
                      : keyNumber <= 9
                      ? "border-blue-300 dark:border-blue-600 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                  aria-hidden="true"
                >
                  {keyNumber <= 9 ? keyNumber : '•'}
                </div>
                
                {/* Custom visual radio indicator */}
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 relative z-10",
                    isSelected 
                      ? "border-blue-600 bg-blue-600 shadow-lg" 
                      : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400 dark:group-hover:border-blue-500"
                  )}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <div className="w-3 h-3 bg-white rounded-full animate-in zoom-in-50 duration-200" />
                  )}
                </div>
                
                {/* Hidden radio input for proper form behavior */}
                <RadioGroupItem 
                  value={option} 
                  id={optionId}
                  className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                  tabIndex={isSelected ? 0 : -1}
                  aria-describedby={`${optionId}-description`}
                />
                
                {/* Option text */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div 
                    className={cn(
                      "text-base leading-relaxed transition-colors",
                      isSelected 
                        ? "text-blue-900 dark:text-blue-100 font-medium" 
                        : "text-slate-700 dark:text-slate-200 font-light group-hover:text-slate-900 dark:group-hover:text-white"
                    )}
                    data-question-content="true"
                  >
                    {option}
                  </div>
                  {/* Hidden description for screen readers */}
                  <div id={`${optionId}-description`} className="sr-only">
                    Option {index + 1} of {options.length}. Press number {index + 1} or use arrow keys to select.
                    {isOtherOption && " This option allows custom text input."}
                  </div>
                </div>
                
                {/* Selection indicator with micro animation */}
                {isSelected && (
                  <div className="relative z-10 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    <div className="text-xs text-blue-600 font-medium">Selected</div>
                  </div>
                )}
                
                {/* Sparkle animation on selection */}
                {isSelected && (
                  <div className="absolute top-2 right-2 text-blue-400 animate-in zoom-in-50 duration-500">
                    ✨
                  </div>
                )}
              </label>

              {/* Other text input field */}
              {isOtherOption && isSelected && (
                <div className="mt-3 ml-14 animate-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <Input
                      type="text"
                      value={otherText}
                      onChange={(e) => handleOtherTextChange(e.target.value)}
                      placeholder="Please specify..."
                      className={cn(
                        "w-full text-base p-4 border-2 rounded-xl transition-all duration-300",
                        "bg-white dark:bg-slate-800/50 backdrop-blur-sm",
                        "border-blue-200 dark:border-blue-700",
                        "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10",
                        "placeholder:text-blue-400 dark:placeholder:text-blue-500"
                      )}
                      aria-label={`Specify your answer for: ${option}`}
                    />
                    {otherText && (
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
        
        {/* Screen reader instructions */}
        <div className="sr-only" id={`${questionId}-instructions`}>
          Use arrow keys to navigate options, spacebar or enter to select, or press number keys 1-{Math.min(options.length, 9)} to select directly.
          {options.some(opt => opt.toLowerCase().includes('other')) && " Some options allow custom text input."}
        </div>
      </RadioGroup>

      {/* Witty encouragement */}
      {(currentOption || currentIsOther) && (
        <div className="text-center mt-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="inline-flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-full">
            <span>
              {currentIsOther && otherText ? "Thanks for sharing your thoughts!" : "Nice choice!"}
            </span>
            <span className="animate-bounce">
              {currentIsOther && otherText ? "💭" : "👍"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 