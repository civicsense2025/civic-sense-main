"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QuizEngine } from "./quiz/quiz-engine"
import { TopicInfo } from "./quiz/topic-info"
import { dataService } from "@/lib/data-service"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  topicId: string | null
  onGameComplete: (topicId: string) => void
}

export function GameModal({ isOpen, onClose, topicId, onGameComplete }: GameModalProps) {
  const [showQuiz, setShowQuiz] = useState(false)
  const [topicData, setTopicData] = useState<TopicMetadata | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load topic and questions data when topicId changes
  useEffect(() => {
    const loadData = async () => {
      if (!topicId) {
        setTopicData(null)
        setQuestions([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const [topicResult, questionsResult] = await Promise.all([
          dataService.getTopicById(topicId),
          dataService.getQuestionsByTopic(topicId)
        ])
        
        setTopicData(topicResult)
        setQuestions(questionsResult)
      } catch (error) {
        console.error('Error loading topic/questions:', error)
        setTopicData(null)
        setQuestions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [topicId])

  if (!topicId) return null

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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-center text-slate-600 dark:text-slate-400">Loading...</p>
            </div>
          ) : !topicData ? (
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
