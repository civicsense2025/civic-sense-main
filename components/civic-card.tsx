"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Lock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TopicMetadata } from "@/lib/quiz-data"
import { CanonicalCategoryBadges } from "@/components/canonical-category-badges"
import { useState } from "react"

interface CivicCardProps {
  topic: TopicMetadata
  baseHeight: string
  onExploreGame: (topicId: string) => void
  isCompleted: boolean
  isLocked: boolean
}

export function CivicCard({ topic, baseHeight, onExploreGame, isCompleted, isLocked }: CivicCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardIsActuallyLocked = isLocked && !isCompleted // A completed card isn't functionally locked

  return (
    <Card
      className={cn(
        `w-full ${baseHeight} flex flex-col shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-lg border-slate-300 dark:border-slate-700 transition-all duration-500 rounded-2xl overflow-hidden cursor-pointer group`,
        isCompleted && "border-green-500 dark:border-green-400 opacity-90 dark:opacity-80",
        cardIsActuallyLocked && "opacity-50 dark:opacity-40 border-dashed border-slate-400 dark:border-slate-600",
        !cardIsActuallyLocked && "hover:scale-105 hover:shadow-2xl hover:border-primary/50",
        isHovered && !cardIsActuallyLocked && "scale-105 shadow-2xl border-primary/50",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !cardIsActuallyLocked && onExploreGame(topic.topic_id)}
    >
      <CardHeader className="pb-4 relative">
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500",
          isHovered && !cardIsActuallyLocked && "opacity-100"
        )} />
        
        <div className="flex justify-between items-start mb-2 relative z-10">
          <CardDescription className={cn(
            "text-sm font-medium text-muted-foreground flex items-center transition-all duration-300",
            isHovered && "text-primary"
          )}>
            <Calendar className="w-3 h-3 mr-1" />
            {topic.dayOfWeek}, {topic.date}
          </CardDescription>
          <div className="flex items-center space-x-2">
            {cardIsActuallyLocked && (
              <Lock className={cn(
                "w-6 h-6 text-slate-500 dark:text-slate-400 transition-all duration-300",
                isHovered && "scale-105"
              )} />
            )}
            {isCompleted && !cardIsActuallyLocked && (
              <CheckCircle2 className={cn(
                "w-7 h-7 text-green-600 dark:text-green-500 transition-all duration-300",
                isHovered && "scale-110"
              )} />
            )}
            <span 
              className={cn(
                "text-3xl transition-all duration-300",
                isHovered && !cardIsActuallyLocked && "scale-110 animate-bounce"
              )} 
              role="img" 
              aria-label="Topic icon"
            >
              {topic.emoji}
            </span>
          </div>
        </div>
        <CardTitle
          className={cn(
            "text-2xl font-bold leading-tight text-foreground transition-all duration-300",
            cardIsActuallyLocked && "text-slate-600 dark:text-slate-400",
            isHovered && !cardIsActuallyLocked && "text-primary",
          )}
        >
          {topic.topic_title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-3 relative">
        <p
          className={cn(
            "text-sm text-muted-foreground line-clamp-3 transition-all duration-300",
            cardIsActuallyLocked && "text-slate-500 dark:text-slate-500",
            isHovered && !cardIsActuallyLocked && "text-foreground",
          )}
        >
          {topic.description}
        </p>

        <CanonicalCategoryBadges
          rawCategories={topic.categories}
          maxVisible={3}
          className={cn(
            "mt-2 transition-all duration-300",
            isHovered && !cardIsActuallyLocked && "scale-105"
          )}
          badgeClassName={cn(
            "animate-in slide-in-from-left",
            isHovered && !cardIsActuallyLocked && "border-primary/50 bg-primary/5"
          )}
        />

        {/* Progress indicator for completed topics */}
        {isCompleted && (
          <div className="mt-3 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              <span className="font-medium">Quiz completed!</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="relative">
        <Button
          className={cn(
            "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl transition-all duration-300 group-hover:scale-105",
            isHovered && !cardIsActuallyLocked && !isCompleted && "shadow-lg",
            isCompleted && "bg-green-600 hover:bg-green-700",
          )}
          onClick={(e) => {
            e.stopPropagation()
            if (!cardIsActuallyLocked) {
              onExploreGame(topic.topic_id)
            }
          }}
          disabled={cardIsActuallyLocked}
        >
          {cardIsActuallyLocked ? (
            <>
              <Lock className="mr-2 h-4 w-4" /> Locked
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Review Quiz
            </>
          ) : (
            <>
              Play Quiz 
              <ArrowRight className={cn(
                "ml-2 h-4 w-4 transition-all duration-300",
                isHovered && "translate-x-1"
              )} />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
