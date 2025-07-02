"use client"

import { useState } from "react"
import { FeedbackDialog, FeedbackButton } from "@civicsense/ui-web/components/feedback"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { MessageSquareText } from "lucide-react"

interface QuizFeedbackProps {
  quizId: string
  quizTitle: string
}

export function QuizFeedback({ quizId, quizTitle }: QuizFeedbackProps) {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            How was this quiz?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your feedback helps us improve our content.
          </p>
        </div>
        
        {/* Option 1: Using the FeedbackButton component */}
        <FeedbackButton
          label="Share Feedback"
          contextType="quiz"
          contextId={quizId}
          variant="outline"
          size="sm"
        />
        
        {/* Option 2: Using the FeedbackDialog component directly */}
        <FeedbackDialog
          contextType="quiz"
          contextId={quizId}
          autoOpen={showFeedbackDialog}
          onClose={() => setShowFeedbackDialog(false)}
          trigger={
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFeedbackDialog(true)}
              className="hidden" // Hidden to avoid duplicate buttons
            >
              <MessageSquareText className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          }
        />
      </div>
    </div>
  )
}

// Example of using the feedback button in a quiz results page
export function QuizResultsFeedback({ quizId, score }: { quizId: string, score: number }) {
  // Show feedback dialog automatically for very low scores
  const [showAutoFeedback, setShowAutoFeedback] = useState(score < 30)

  return (
    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <FeedbackDialog
        contextType="quiz"
        contextId={quizId}
        autoOpen={showAutoFeedback}
        onClose={() => setShowAutoFeedback(false)}
      />
      
      <div className="text-center">
        <h3 className="text-sm font-medium mb-2">
          {score < 50 
            ? "How can we improve this quiz?" 
            : "Did you enjoy this quiz?"}
        </h3>
        
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAutoFeedback(true)}
          >
            <MessageSquareText className="h-4 w-4 mr-2" />
            Share Feedback
          </Button>
        </div>
      </div>
    </div>
  )
} 