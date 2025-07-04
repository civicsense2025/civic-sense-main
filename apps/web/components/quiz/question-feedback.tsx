"use client"

import { useState, useEffect } from "react"
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { ThumbsUp, ThumbsDown, Flag, MessageSquare, AlertTriangle } from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'
import { useAuth } from "@/lib/auth"
import { questionFeedbackOperations } from '@civicsense/business-logic/database'
import { useToast } from "../../components/ui"

interface QuestionFeedbackProps {
  questionId: string // This will be the question number as string
  questionText: string
  topicId: string // Add topicId prop
  className?: string
}

interface FeedbackStats {
  thumbs_up_count: number
  thumbs_down_count: number
  total_ratings: number
  rating_percentage: number | null
  total_reports: number
}

interface UserFeedback {
  rating?: 'up' | 'down'
  hasReported: boolean
}

const REPORT_REASONS = [
  { value: 'incorrect_answer', label: 'Incorrect Answer', description: 'The correct answer is wrong' },
  { value: 'unclear_question', label: 'Unclear Question', description: 'The question is confusing or ambiguous' },
  { value: 'outdated_information', label: 'Outdated Information', description: 'The information is no longer current' },
  { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Content is offensive or inappropriate' },
  { value: 'technical_error', label: 'Technical Error', description: 'There\'s a technical issue with the question' },
  { value: 'poor_explanation', label: 'Poor Explanation', description: 'The explanation is unclear or unhelpful' },
  { value: 'broken_source_link', label: 'Broken Source Link', description: 'One or more source links don\'t work' },
  { value: 'other', label: 'Other', description: 'Something else is wrong' }
]

export function QuestionFeedback({ questionId, questionText, topicId, className }: QuestionFeedbackProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [userFeedback, setUserFeedback] = useState<UserFeedback>({ hasReported: false })
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Load feedback data
  useEffect(() => {
    if (!questionId) {
      console.warn('QuestionFeedback: No questionId provided')
      return
    }

    if (typeof questionId !== 'string' || questionId.trim() === '') {
      console.warn('QuestionFeedback: Invalid questionId:', questionId)
      return
    }

    const loadFeedbackData = async () => {
      try {
        console.log('Loading feedback data for question:', questionId, 'topic:', topicId)
        
        // Convert questionId to number for the database lookup
        const questionNumber = parseInt(questionId, 10)
        if (isNaN(questionNumber)) {
          console.error('Invalid question number:', questionId)
          return
        }
        
        // Load stats using topic ID and question number
        const statsData = await questionFeedbackOperations.getQuestionStatsByNumber(topicId, questionNumber)
        console.log('Stats data received:', statsData)
        
        if (statsData) {
          setStats({
            thumbs_up_count: statsData.thumbs_up_count || 0,
            thumbs_down_count: statsData.thumbs_down_count || 0,
            total_ratings: statsData.total_ratings || 0,
            rating_percentage: statsData.rating_percentage,
            total_reports: statsData.total_reports || 0
          })
        } else {
          // Set default stats if no data exists
          setStats({
            thumbs_up_count: 0,
            thumbs_down_count: 0,
            total_ratings: 0,
            rating_percentage: null,
            total_reports: 0
          })
        }

        // Load user's feedback if logged in
        if (user) {
          console.log('Loading user feedback for user:', user.id)
          const userFeedbackData = await questionFeedbackOperations.getUserFeedbackByNumber(topicId, questionNumber, user.id)
          console.log('User feedback data received:', userFeedbackData)
          
          const rating = userFeedbackData.find(f => f.feedback_type === 'rating')
          const report = userFeedbackData.find(f => f.feedback_type === 'report')
          
          setUserFeedback({
            rating: rating?.rating as 'up' | 'down' | undefined,
            hasReported: !!report
          })
        }
      } catch (error) {
        console.error('Error loading feedback data:', error)
        // Log more detailed error information
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        } else {
          console.error('Unknown error type:', typeof error, error)
        }
        
        // Set default values on error to prevent component from breaking
        setStats({
          thumbs_up_count: 0,
          thumbs_down_count: 0,
          total_ratings: 0,
          rating_percentage: null,
          total_reports: 0
        })
        setUserFeedback({ hasReported: false })
      }
    }

    loadFeedbackData()
  }, [questionId, user])

  const handleRating = async (rating: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate questions.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Convert questionId to number for the database lookup
      const questionNumber = parseInt(questionId, 10)
      if (isNaN(questionNumber)) {
        console.error('Invalid question number:', questionId)
        return
      }
      
      // If user already rated the same way, remove the rating
      if (userFeedback.rating === rating) {
        await questionFeedbackOperations.deleteFeedbackByNumber(topicId, questionNumber, user.id, 'rating')
        setUserFeedback(prev => ({ ...prev, rating: undefined }))
        
        // Update stats optimistically
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            [rating === 'up' ? 'thumbs_up_count' : 'thumbs_down_count']: Math.max(0, prev[rating === 'up' ? 'thumbs_up_count' : 'thumbs_down_count'] - 1),
            total_ratings: Math.max(0, prev.total_ratings - 1)
          } : null)
        }
        
        toast({
          title: "Rating removed",
          description: "Your rating has been removed."
        })
      } else {
        // Submit new rating
        await questionFeedbackOperations.submitRatingByNumber(topicId, questionNumber, user.id, rating)
        const oldRating = userFeedback.rating
        setUserFeedback(prev => ({ ...prev, rating }))
        
        // Update stats optimistically
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            thumbs_up_count: prev.thumbs_up_count + (rating === 'up' ? 1 : 0) - (oldRating === 'up' ? 1 : 0),
            thumbs_down_count: prev.thumbs_down_count + (rating === 'down' ? 1 : 0) - (oldRating === 'down' ? 1 : 0),
            total_ratings: prev.total_ratings + (oldRating ? 0 : 1)
          } : null)
        }
        
        toast({
          title: "Rating submitted",
          description: `You gave this question a thumbs ${rating}.`
        })
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Rating error message:', error.message)
      }
      
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReport = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to report questions.",
        variant: "destructive"
      })
      return
    }

    if (!reportReason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for reporting this question.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Convert questionId to number for the database lookup
      const questionNumber = parseInt(questionId, 10)
      if (isNaN(questionNumber)) {
        console.error('Invalid question number:', questionId)
        return
      }
      
      await questionFeedbackOperations.submitReportByNumber(
        topicId,
        questionNumber, 
        user.id, 
        reportReason, 
        reportDetails.trim() || undefined
      )
      
      setUserFeedback(prev => ({ ...prev, hasReported: true }))
      setIsReportDialogOpen(false)
      setReportReason("")
      setReportDetails("")
      
      // Update stats optimistically
      if (stats) {
        setStats(prev => prev ? { ...prev, total_reports: prev.total_reports + 1 } : null)
      }
      
      toast({
        title: "Report submitted",
        description: "Thank you for helping improve question quality. We'll review your report."
      })
    } catch (error) {
      console.error('Error submitting report:', error)
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Report error message:', error.message)
      }
      
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedReportReason = REPORT_REASONS.find(r => r.value === reportReason)

  return (
    <div className={cn("flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border", className)}>
      {/* Rating buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRating('up')}
          disabled={isSubmitting}
          className={cn(
            "flex items-center space-x-1 transition-all duration-200",
            userFeedback.rating === 'up' && "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30"
          )}
        >
          <ThumbsUp className={cn(
            "h-4 w-4 transition-all duration-200",
            userFeedback.rating === 'up' && "scale-110"
          )} />
          <span>{stats?.thumbs_up_count || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRating('down')}
          disabled={isSubmitting}
          className={cn(
            "flex items-center space-x-1 transition-all duration-200",
            userFeedback.rating === 'down' && "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30"
          )}
        >
          <ThumbsDown className={cn(
            "h-4 w-4 transition-all duration-200",
            userFeedback.rating === 'down' && "scale-110"
          )} />
          <span>{stats?.thumbs_down_count || 0}</span>
        </Button>

        {/* Stats toggle */}
        {stats && stats.total_ratings > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {stats.total_ratings} rating{stats.total_ratings !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {/* Report button */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={userFeedback.hasReported}
            className={cn(
              "flex items-center space-x-1 transition-all duration-200",
              userFeedback.hasReported && "text-orange-600 dark:text-orange-400"
            )}
          >
            <Flag className="h-4 w-4" />
            <span className="text-xs">
              {userFeedback.hasReported ? 'Reported' : 'Report'}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-slate-900 dark:text-slate-50">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Report Question Issue</span>
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Help us improve question quality by reporting issues. Your feedback is anonymous and helps other learners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-slate-900 dark:text-slate-50">What's wrong with this question?</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-1 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
                  {REPORT_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value} className="text-slate-900 dark:text-slate-50">
                      <div>
                        <div className="font-medium">{reason.label}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">{reason.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedReportReason && (
              <div>
                <Label htmlFor="details" className="text-slate-900 dark:text-slate-50">Additional details (optional)</Label>
                <Textarea
                  id="details"
                  value={reportDetails}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportDetails(e.target.value)}
                  placeholder={`Please provide more details about the ${selectedReportReason.label.toLowerCase()}...`}
                  className="mt-1 min-h-[80px] text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 border-slate-200 dark:border-slate-700"
                  maxLength={500}
                />
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {reportDetails.length}/500 characters
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              disabled={isSubmitting}
              className="text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expanded stats */}
      {showStats && stats && stats.total_ratings > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-10 animate-in slide-in-from-top-2 duration-200">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Positive rating:</span>
              <span className="font-medium">
                {stats.rating_percentage ? `${stats.rating_percentage}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total ratings:</span>
              <span className="font-medium">{stats.total_ratings}</span>
            </div>
            {stats.total_reports > 0 && (
              <div className="flex justify-between text-orange-600 dark:text-orange-400">
                <span>Reports:</span>
                <span className="font-medium">{stats.total_reports}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 