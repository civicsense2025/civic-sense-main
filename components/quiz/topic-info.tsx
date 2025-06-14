"use client"

import type { TopicMetadata } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface TopicInfoProps {
  topicData: TopicMetadata
  onStartQuiz: () => void
  requireAuth?: boolean
  onAuthRequired?: () => void
}

export function TopicInfo({ topicData, onStartQuiz, requireAuth = false, onAuthRequired }: TopicInfoProps) {
  return (
    <div className="flex flex-col h-full px-4 sm:px-8 py-8">
      <div className="mb-8">
        <div className="bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 rounded-2xl">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <span className="text-2xl mr-3">{topicData.emoji}</span> 
            Why This Matters
          </h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: topicData.why_this_matters }}
          />
        </div>
      </div>

      <div className="mt-auto">
        {requireAuth ? (
          <Button onClick={onAuthRequired} className="w-full py-3 sm:py-4 text-base font-medium rounded-full">
            Sign Up to Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onStartQuiz} className="w-full py-3 sm:py-4 text-base font-medium rounded-full">
            Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
