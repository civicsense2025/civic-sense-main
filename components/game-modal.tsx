"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QuizEngine } from "./quiz/quiz-engine"
import { TopicInfo } from "./quiz/topic-info"
import { questionsData, topicsData } from "@/lib/quiz-data"

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  topicId: string | null
  onGameComplete: (topicId: string) => void
}

export function GameModal({ isOpen, onClose, topicId, onGameComplete }: GameModalProps) {
  const [showQuiz, setShowQuiz] = useState(false)

  if (!topicId) return null

  const topicData = topicsData[topicId]
  // Make sure we handle the case where there are no questions for this topic
  const questions = questionsData[topicId] || []

  const handleQuizComplete = () => {
    onGameComplete(topicId)
    onClose()
    // Reset state for next time
    setShowQuiz(false)
  }

  const handleStartQuiz = () => {
    setShowQuiz(true)
  }

  const handleClose = () => {
    onClose()
    // Reset state for next time
    setShowQuiz(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-3xl" role="img" aria-label="Topic icon">
              {topicData?.emoji}
            </span>
            <DialogTitle className="text-xl">{topicData?.topic_title}</DialogTitle>
          </div>
          {topicData && !showQuiz && (
            <DialogDescription className="mt-2">Learn about this topic and test your knowledge</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-grow p-6 overflow-y-auto">
          {!topicData ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-center text-slate-600 dark:text-slate-400">Topic information not available.</p>
            </div>
          ) : !showQuiz ? (
            <TopicInfo topicData={topicData} onStartQuiz={handleStartQuiz} />
          ) : questions.length > 0 ? (
            <QuizEngine questions={questions} topicId={topicId} onComplete={handleQuizComplete} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-center text-slate-600 dark:text-slate-400">No questions available for this topic.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
