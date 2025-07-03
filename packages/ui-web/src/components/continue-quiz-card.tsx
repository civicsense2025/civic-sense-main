"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "../../utils"

interface ContinueQuizCardProps {
  attemptId: string
  topicId: string
  title: string
  description?: string
  emoji?: string
  progress?: number
  onDismiss?: (attemptId: string, topicId: string, title: string) => void
  className?: string
}

export function ContinueQuizCard({
  attemptId,
  topicId,
  title,
  description,
  emoji = "📚",
  progress,
  onDismiss,
  className
}: ContinueQuizCardProps) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on dismiss button
    const target = e.target as HTMLElement
    if (target.closest('[data-dismiss-button]')) {
      return
    }
    router.push(`/quiz/${topicId}?continue=true`)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss?.(attemptId, topicId, title)
  }

  return (
    <div
      className={cn(
        "group relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 shadow-sm cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Emoji */}
      <span className="text-2xl mr-3 flex-shrink-0">{emoji}</span>
      
      {/* Content */}
      <div className="flex-1 min-w-0 mr-2">
        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
          {title}
        </div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {description}
          </div>
        )}
        {progress !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-0.5">
              <div 
                className="bg-slate-900 dark:bg-white h-0.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-light">{progress}%</span>
          </div>
        )}
      </div>
      
      {/* Action buttons - only visible on hover */}
      <div className="flex items-center gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
        <span className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-full text-sm font-light transition">
          Continue
        </span>
        <button
          data-dismiss-button
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={handleDismiss}
          title="Hide from continue list"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
} 