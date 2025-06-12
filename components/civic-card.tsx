"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TopicMetadata } from "@/lib/quiz-data"
import { Badge } from "@/components/ui/badge"
import { getCategoryEmoji } from "@/lib/quiz-data"

interface CivicCardProps {
  topic: TopicMetadata
  baseHeight: string
  onExploreGame: (topicId: string) => void
  isCompleted: boolean
  isLocked: boolean
}

export function CivicCard({ topic, baseHeight, onExploreGame, isCompleted, isLocked }: CivicCardProps) {
  const cardIsActuallyLocked = isLocked && !isCompleted // A completed card isn't functionally locked

  return (
    <Card
      className={cn(
        `w-full ${baseHeight} flex flex-col shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-lg border-slate-300 dark:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden`,
        isCompleted && "border-green-500 dark:border-green-400 opacity-90 dark:opacity-80",
        cardIsActuallyLocked && "opacity-50 dark:opacity-40 border-dashed border-slate-400 dark:border-slate-600",
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <CardDescription className="text-sm font-medium text-muted-foreground">
            {topic.dayOfWeek}, {topic.date}
          </CardDescription>
          <div className="flex items-center space-x-2">
            {cardIsActuallyLocked && <Lock className="w-6 h-6 text-slate-500 dark:text-slate-400" />}
            {isCompleted && !cardIsActuallyLocked && (
              <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-500" />
            )}
            <span className="text-3xl" role="img" aria-label="Topic icon">
              {topic.emoji}
            </span>
          </div>
        </div>
        <CardTitle
          className={cn(
            "text-2xl font-bold leading-tight text-foreground",
            cardIsActuallyLocked && "text-slate-600 dark:text-slate-400",
          )}
        >
          {topic.topic_title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p
          className={cn(
            "text-sm text-muted-foreground line-clamp-3",
            cardIsActuallyLocked && "text-slate-500 dark:text-slate-500",
          )}
        >
          {topic.description}
        </p>

        <div className="flex flex-wrap gap-1 mt-2">
          {topic.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="outline" className="text-xs">
              <span className="mr-1">{getCategoryEmoji(category)}</span> {category}
            </Badge>
          ))}
          {topic.categories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{topic.categories.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl"
          onClick={() => onExploreGame(topic.topic_id)}
          disabled={cardIsActuallyLocked || isCompleted}
        >
          {cardIsActuallyLocked ? (
            <>
              <Lock className="mr-2 h-4 w-4" /> Locked
            </>
          ) : isCompleted ? (
            "Quiz Completed"
          ) : (
            <>
              Play Quiz <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
