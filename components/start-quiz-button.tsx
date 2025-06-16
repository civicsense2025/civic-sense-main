import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StartQuizButtonProps {
  label: string
  disabled?: boolean
  onClick?: () => void
  variant?: "primary" | "outline"
  className?: string
  remainingQuizzes?: number
  showPulse?: boolean
  completed?: boolean
}

// A large call-to-action button used for starting quizzes throughout the app.
// Modern Apple-esque design with high contrast and pulsing effect.
export function StartQuizButton({
  label,
  disabled = false,
  onClick,
  variant = "primary",
  className,
  remainingQuizzes,
  showPulse = false,
  completed = false
}: StartQuizButtonProps) {
  const baseClasses =
    "rounded-xl shadow-sm px-8 py-6 text-2xl font-light transition-all duration-200 flex items-center justify-center gap-2 relative"

  const primaryStyles =
    "bg-blue-50 text-blue-900 hover:bg-blue-100 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 border border-blue-200 dark:border-blue-500"
  const outlineStyles =
    "border border-blue-300 dark:border-blue-400 text-blue-700 dark:text-blue-100 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-800/50"
  const completedStyles =
    "border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-800/40"
  const disabledStyles = "opacity-40 cursor-not-allowed"
  const pulseStyles = showPulse ? "before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-blue-400 dark:before:border-blue-300 before:animate-pulse-glow" : ""

  const styleToUse = completed ? completedStyles : variant === "primary" ? primaryStyles : outlineStyles

  const combined = cn(
    baseClasses,
    styleToUse,
    disabled && disabledStyles,
    pulseStyles,
    className,
  )

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className={combined}
      variant="ghost"
      size="lg"
      title={completed ? "You've already completed this quiz" : remainingQuizzes !== undefined ? `${remainingQuizzes} quizzes remaining today` : undefined}
    >
      <span>{completed ? "Replay Quiz" : label}</span>
      {completed ? (
        <CheckCircle className="h-5 w-5 ml-1" />
      ) : (
        <ArrowRight className="h-5 w-5 ml-1 transition-transform group-hover:translate-x-0.5" />
      )}
      {remainingQuizzes !== undefined && !completed && (
        <div className="absolute -top-2 -right-2 bg-blue-600 dark:bg-blue-400 text-white dark:text-blue-950 rounded-full w-6 h-6 text-xs flex items-center justify-center font-medium">
          {remainingQuizzes}
        </div>
      )}
      {completed && (
        <div className="absolute -top-2 -right-2 bg-green-600 dark:bg-green-500 text-white dark:text-green-950 rounded-full px-2 py-0.5 text-xs flex items-center justify-center font-medium">
          Completed
        </div>
      )}
    </Button>
  )
} 