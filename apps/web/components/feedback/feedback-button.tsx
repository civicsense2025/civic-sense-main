import React from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeedbackButtonProps {
  onClick?: () => void
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      <span>Feedback</span>
    </Button>
  )
} 