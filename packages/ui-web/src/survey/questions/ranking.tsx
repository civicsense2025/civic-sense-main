"use client"

import { useState, useRef } from "react"
import { Button } from "../ui/button"
import { cn } from "../../utils"
import { GripVertical, X, Plus } from "lucide-react"

interface RankingProps {
  questionId: string
  options: string[]
  value?: string[]
  onChange: (value: string[]) => void
  maxRankings?: number
  className?: string
}

export function Ranking({ 
  questionId, 
  options, 
  value = [], 
  onChange, 
  maxRankings,
  className 
}: RankingProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const maxItems = maxRankings || options.length
  const availableOptions = options.filter(option => !value.includes(option))

  const handleDragStart = (index: number) => {
    dragItem.current = index
    setDraggedIndex(index)
  }

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newValue = [...value]
      const draggedItem = newValue[dragItem.current]
      newValue.splice(dragItem.current, 1)
      newValue.splice(dragOverItem.current, 0, draggedItem)
      onChange(newValue)
    }
    
    dragItem.current = null
    dragOverItem.current = null
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const addOption = (option: string) => {
    if (value.length < maxItems) {
      onChange([...value, option])
    }
  }

  const removeOption = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const moveUp = (index: number) => {
    if (index > 0) {
      const newValue = [...value]
      const temp = newValue[index]
      newValue[index] = newValue[index - 1]
      newValue[index - 1] = temp
      onChange(newValue)
    }
  }

  const moveDown = (index: number) => {
    if (index < value.length - 1) {
      const newValue = [...value]
      const temp = newValue[index]
      newValue[index] = newValue[index + 1]
      newValue[index + 1] = temp
      onChange(newValue)
    }
  }

  return (
    <div className={cn("space-y-6", className)} data-audio-content="true">
      {/* Instructions */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-800">
          <GripVertical className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-700 dark:text-amber-300">Drag to reorder • 1 = most preferred</span>
          {maxRankings && (
            <span className="text-xs text-amber-600 dark:text-amber-400">• Max {maxRankings} items</span>
          )}
        </div>
      </div>

      {/* Ranked items */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <span>Your ranking:</span>
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(3, value.length))].map((_, i) => (
                <span key={i} className="text-amber-500">🏆</span>
              ))}
            </div>
          </h4>
          
          <div className="space-y-2">
            {value.map((item, index) => (
              <div
                key={item}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                className={cn(
                  "group flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-move",
                  "hover:shadow-lg hover:shadow-amber-600/10 hover:-translate-y-0.5 transform",
                  draggedIndex === index && "opacity-50 scale-95",
                  dragOverIndex === index && "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
                  index === 0 ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" :
                  index === 1 ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" :
                  index === 2 ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20" :
                  "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                )}
              >
                {/* Drag handle */}
                <div className="flex items-center space-x-2">
                  <GripVertical className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  
                  {/* Ranking number with special styling for top 3 */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-200",
                    index === 0 ? "bg-amber-500 border-amber-600 text-white shadow-lg" :
                    index === 1 ? "bg-orange-400 border-orange-500 text-white shadow-md" :
                    index === 2 ? "bg-yellow-400 border-yellow-500 text-white shadow-md" :
                    "bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  )}>
                    {index + 1}
                  </div>
                </div>
                
                {/* Item text */}
                <div className="flex-1 min-w-0">
                  <span className="text-base leading-relaxed text-slate-900 dark:text-white font-medium" data-question-content="true">
                    {item}
                  </span>
                </div>
                
                {/* Keyboard controls */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="w-8 h-8 p-0 hover:bg-amber-100"
                    aria-label="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveDown(index)}
                    disabled={index === value.length - 1}
                    className="w-8 h-8 p-0 hover:bg-amber-100"
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="w-8 h-8 p-0 hover:bg-red-100 text-red-500 hover:text-red-700"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Medal icons for top 3 */}
                {index < 3 && (
                  <div className="text-xl">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available options */}
      {availableOptions.length > 0 && value.length < maxItems && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Available options:</span>
            <span className="text-xs text-slate-500">Click to add to your ranking</span>
          </h4>
          
          <div className="grid gap-2">
            {availableOptions.map((option, index) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                onClick={() => addOption(option)}
                className={cn(
                  "justify-start p-4 text-left border-2 transition-all duration-300 transform hover:scale-[1.02]",
                  "hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20",
                  "group relative overflow-hidden"
                )}
              >
                {/* Keyboard shortcut hint */}
                <div className="flex items-center justify-center w-6 h-6 rounded border border-slate-300 dark:border-slate-600 text-xs font-mono mr-3 bg-slate-50 dark:bg-slate-800">
                  {index + 1}
                </div>
                
                <span className="flex-1" data-question-content="true">{option}</span>
                
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Progress and encouragement */}
      <div className="text-center space-y-3">
        <div className={cn(
          "inline-flex items-center space-x-3 px-4 py-2 rounded-full transition-all duration-300",
          value.length > 0 
            ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
            : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        )}>
          <span className={cn(
            "text-sm font-medium",
            value.length > 0 ? "text-amber-700 dark:text-amber-300" : "text-slate-600 dark:text-slate-400"
          )}>
            {value.length === 0 ? "Start by adding items to rank" :
             value.length === 1 ? "Great start! Add more items" :
             value.length === maxItems ? "Perfect ranking!" :
             `${value.length} of ${maxItems} items ranked`}
          </span>
          
          {value.length > 0 && (
            <span className="animate-bounce">
              {value.length === maxItems ? "🎯" : value.length >= 3 ? "🔥" : "👍"}
            </span>
          )}
        </div>

        {value.length === maxItems && (
          <div className="text-xs text-amber-600 dark:text-amber-400 animate-in fade-in-50 duration-500">
            Use drag & drop or arrow buttons to reorder your ranking
          </div>
        )}
      </div>
    </div>
  )
} 