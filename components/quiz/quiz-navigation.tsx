"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Home, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useQuizNavigation } from '@/hooks/useQuizNavigation'

interface QuizNavigationProps {
  topicId: string
  className?: string
  showKeyboardHints?: boolean
  compact?: boolean
  enableKeyboardShortcuts?: boolean
}

export function QuizNavigation({ 
  topicId, 
  className,
  showKeyboardHints = true,
  compact = false,
  enableKeyboardShortcuts = true
}: QuizNavigationProps) {
  const [showHints, setShowHints] = useState(false)
  const {
    previousTopic,
    nextTopic,
    hasPrevious,
    hasNext,
    navigateToPrevious,
    navigateToNext,
    navigateToHome,
    navigateToTopic,
    isLoading,
    error
  } = useQuizNavigation({ 
    topicId,
    enableKeyboardShortcuts 
  })

  // Show hints briefly when component mounts
  useEffect(() => {
    if (showKeyboardHints && (hasPrevious || hasNext)) {
      setShowHints(true)
      const timer = setTimeout(() => setShowHints(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showKeyboardHints, hasPrevious, hasNext])

  if (isLoading || error) {
    return null
  }

  if (!hasPrevious && !hasNext) {
    return null
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateStr
    }
  }

  const NavigationButton = ({ 
    topic, 
    direction, 
    onClick,
    icon 
  }: { 
    topic: any
    direction: 'previous' | 'next'
    onClick: () => void
    icon: React.ReactNode
  }) => (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "group h-auto py-3 px-4 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200",
        "border-2 hover:border-primary/20 rounded-lg",
        direction === 'previous' ? "flex-row" : "flex-row-reverse"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={cn("text-left", direction === 'next' && "text-right")}>
          <div className="text-xs text-muted-foreground mb-1">
            {direction === 'previous' ? 'Previous' : 'Next'}
          </div>
          <div className="font-medium text-sm line-clamp-1 max-w-[120px]">
            {topic.emoji} {topic.topic_title}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(topic.date)}
          </div>
        </div>
      </div>
    </Button>
  )

  return (
    <TooltipProvider>
      <div className={cn("fixed inset-y-0 z-30 pointer-events-none", className)}>
        {/* Previous Topic - Left Side (Older topics) */}
        {hasPrevious && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto">
            <Tooltip open={showHints}>
              <TooltipTrigger asChild>
                <NavigationButton
                  topic={previousTopic}
                  direction="previous"
                  onClick={navigateToPrevious}
                  icon={<ChevronLeft className="h-4 w-4" />}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>Older quiz</span>
                {showKeyboardHints && (
                  <div className="flex items-center gap-1 text-xs opacity-75">
                    <Keyboard className="w-3 h-3" />
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">←</kbd>
                    <span>or</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">H</kbd>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Next Topic - Right Side (Newer topics) */}
        {hasNext && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
            <Tooltip open={showHints}>
              <TooltipTrigger asChild>
                <NavigationButton
                  topic={nextTopic}
                  direction="next"
                  onClick={navigateToNext}
                  icon={<ChevronRight className="h-4 w-4" />}
                />
              </TooltipTrigger>
              <TooltipContent side="left" className="flex items-center gap-2">
                <span>Newer quiz</span>
                {showKeyboardHints && (
                  <div className="flex items-center gap-1 text-xs opacity-75">
                    <Keyboard className="w-3 h-3" />
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">→</kbd>
                    <span>or</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">L</kbd>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Keyboard Shortcuts Help - Bottom Right */}
        {showKeyboardHints && (hasPrevious || hasNext) && (
          <div className="absolute bottom-4 right-4 pointer-events-auto">
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard className="w-4 h-4" />
                  <span className="text-sm font-medium">Keyboard Navigation</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {hasPrevious && (
                    <div className="flex items-center justify-between gap-3">
                      <span>Older quiz</span>
                      <div className="flex gap-1">
                        <kbd className="px-1 py-0.5 bg-muted rounded">←</kbd>
                        <span>or</span>
                        <kbd className="px-1 py-0.5 bg-muted rounded">H</kbd>
                      </div>
                    </div>
                  )}
                  {hasNext && (
                    <div className="flex items-center justify-between gap-3">
                      <span>Newer quiz</span>
                      <div className="flex gap-1">
                        <kbd className="px-1 py-0.5 bg-muted rounded">→</kbd>
                        <span>or</span>
                        <kbd className="px-1 py-0.5 bg-muted rounded">L</kbd>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <span>Back to home</span>
                    <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
} 