"use client"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Calendar, Lock, Star, Clock } from "lucide-react"
import { parseTopicDate } from "../../utils"
import { cn } from "../../utils"
import type { TopicMetadata } from "@civicsense/shared/lib/quiz-data"
import type { TopicAccessStatus } from "@civicsense/shared/hooks/use-topic-access"

interface TopicCardProps {
  topic: TopicMetadata
  accessStatus: TopicAccessStatus
  isCompleted: boolean
  onStartQuiz: () => void
  className?: string
}

export function TopicCard({
  topic,
  accessStatus,
  isCompleted,
  onStartQuiz,
  className
}: TopicCardProps) {
  const topicDate = parseTopicDate(topic.date)
  
  return (
    <div className={cn("w-full max-w-6xl mx-auto px-4 py-12", className)}>
      <div className="text-center space-y-8">
        {/* Emoji */}
        <div className="text-4xl sm:text-5xl md:text-6xl animate-in zoom-in duration-500">
          {topic.emoji || '📝'}
        </div>
        
        {/* Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight animate-in slide-in-from-bottom-4 duration-700">
          {topic.topic_title}
        </h2>
        
        {/* Date */}
        <div className="flex justify-center animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <Calendar className="h-4 w-4" />
            <span>
              {topicDate?.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
        
        {/* Badges */}
        {(topic.is_breaking || topic.is_featured || (topic.categories && topic.categories.length > 0)) && (
          <div className="flex flex-wrap gap-2 justify-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
            {topic.is_breaking && (
              <Badge className="bg-red-500 text-white font-bold text-sm px-3 py-1">
                🚨 Breaking
              </Badge>
            )}
            {topic.is_featured && !topic.is_breaking && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm px-3 py-1">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {topic.categories?.map((category) => (
              <Badge 
                key={category} 
                variant="secondary" 
                className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Description */}
        <div className="pt-4">
          <p className="text-base sm:text-lg md:text-xl font-light text-slate-800 dark:text-slate-300 max-w-5xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-300">
            {topic.description}
          </p>
        </div>
        
        {/* Action Button */}
        <div className="pt-8 animate-in slide-in-from-bottom-4 duration-700 delay-500">
          {accessStatus.accessible ? (
            <Button
              onClick={onStartQuiz}
              size="lg"
              className="px-12 py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white [&:hover]:text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              {isCompleted ? 'Read Again' : 'Read More'}
            </Button>
          ) : (
            <div className="space-y-4">
              <Button
                disabled
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg rounded-full opacity-70 cursor-not-allowed"
              >
                {accessStatus.reason === 'future_locked' ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Available {topicDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </>
                ) : accessStatus.reason.includes('guest') ? (
                  'Create Account to Continue'
                ) : accessStatus.reason === 'premium_required' ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Premium Content
                  </>
                ) : (
                  'Not Available'
                )}
              </Button>
              
              {/* Status badges */}
              <div className="flex justify-center gap-2 flex-wrap">
                {isCompleted && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    ✓ Completed
                  </Badge>
                )}
                {!accessStatus.accessible && accessStatus.reason === 'future_locked' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                )}
                {!accessStatus.accessible && accessStatus.reason === 'premium_required' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
                    <Lock className="h-3 w-3 mr-1" />
                    Premium Required
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 