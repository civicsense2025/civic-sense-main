"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAnalytics } from "@/utils/analytics"
import { useAuth } from "@/components/auth/auth-provider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

interface FeedbackDialogProps {
  trigger?: React.ReactNode
  contextType?: "general" | "quiz" | "content" | "account"
  contextId?: string
  autoOpen?: boolean
  onClose?: () => void
}

export function FeedbackDialog({
  trigger,
  contextType = "general",
  contextId,
  autoOpen = false,
  onClose
}: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [feedbackType, setFeedbackType] = useState<string>("suggestion")
  const [rating, setRating] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { trackEngagement } = useAnalytics()

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide some feedback before submitting.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Track the feedback submission event
      trackEngagement.feedbackSubmitted({
        feedback_type: feedbackType,
        context_type: contextType,
        context_id: contextId || "none",
        rating: rating,
        has_contact_info: !!email,
        feedback_length: feedbackText.length
      })

      // Submit to API
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id || null,
          userEmail: email || user?.email || null,
          feedbackType,
          contextType,
          contextId,
          rating,
          feedbackText,
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          path: window.location.pathname
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your input and will use it to improve CivicSense.",
      })

      // Reset form
      setFeedbackText("")
      setEmail("")
      setRating(null)
      setIsOpen(false)
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Something went wrong",
        description: "Your feedback couldn't be submitted. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">Share your feedback</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Help us improve CivicSense by sharing your thoughts and suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type" className="text-slate-900 dark:text-slate-50">Feedback type</Label>
            <RadioGroup 
              value={feedbackType} 
              onValueChange={setFeedbackType}
              className="flex flex-wrap gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suggestion" id="suggestion" />
                <Label htmlFor="suggestion" className="text-slate-800 dark:text-slate-200">Suggestion</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="issue" id="issue" />
                <Label htmlFor="issue" className="text-slate-800 dark:text-slate-200">Issue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="content" id="content" />
                <Label htmlFor="content" className="text-slate-800 dark:text-slate-200">Content</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="praise" id="praise" />
                <Label htmlFor="praise" className="text-slate-800 dark:text-slate-200">Praise</Label>
              </div>
            </RadioGroup>
          </div>

          {(contextType === "quiz" || contextType === "content") && (
            <div className="space-y-2">
              <Label htmlFor="rating" className="text-slate-900 dark:text-slate-50">How would you rate this {contextType}?</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={rating === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRating(value)}
                    className={cn(
                      "w-10 h-10",
                      rating === value ? "bg-blue-600 text-white" : "text-slate-800 dark:text-slate-200"
                    )}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-slate-900 dark:text-slate-50">Your feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px] text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="feedback-email" className="flex items-center gap-1 text-slate-900 dark:text-slate-50">
                Email <span className="text-xs text-slate-500 dark:text-slate-400">(optional)</span>
              </Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            className="bg-white text-slate-900 dark:bg-white dark:text-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-200 font-medium"
          >
            Cancel
          </Button>
          <Button 
            onClick={async () => {
              await handleSubmit()
            }} 
            disabled={isSubmitting}
            className="bg-slate-900 text-white dark:bg-slate-900 dark:text-white hover:bg-slate-800 dark:hover:bg-slate-800 font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 