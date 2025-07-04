"use client"

import { Button, ButtonProps } from "@civicsense/ui-web"
import { FeedbackDialog } from "./feedback-dialog"
import { MessageSquareText } from "lucide-react"

interface FeedbackButtonProps extends Omit<ButtonProps, "children"> {
  label?: string
  contextType?: "general" | "quiz" | "content" | "account"
  contextId?: string
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
}

export function FeedbackButton({
  label = "Feedback",
  contextType = "general",
  contextId,
  variant = "outline",
  size = "sm",
  showIcon = true,
  ...props
}: FeedbackButtonProps) {
  return (
    <FeedbackDialog
      contextType={contextType}
      contextId={contextId}
      trigger={
        <Button variant={variant} size={size} {...props}>
          {showIcon && <MessageSquareText className="h-4 w-4 mr-2" />}
          {label}
        </Button>
      }
    />
  )
} 