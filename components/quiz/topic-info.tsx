"use client"

import type { TopicMetadata } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface TopicInfoProps {
  topicData: TopicMetadata
  onStartQuiz: () => void
}

export function TopicInfo({ topicData, onStartQuiz }: TopicInfoProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">{topicData.topic_title}</h2>
        <p className="mb-6 text-slate-700 dark:text-slate-300">{topicData.description}</p>

        <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-primary mr-2">🔍</span> Why This Matters To You
          </h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{ __html: topicData.why_this_matters }}
          />
        </div>
      </div>

      <div className="mt-auto">
        <Button onClick={onStartQuiz} className="w-full rounded-xl">
          Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
