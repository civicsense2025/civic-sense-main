import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface StartQuizButtonProps {
  label: string
  disabled?: boolean
  onClick?: () => void
  variant?: "primary" | "outline"
  className?: string
}

// A large call-to-action button used for starting quizzes throughout the app.
// Consistent styling in both light & dark themes.
export function StartQuizButton({
  label,
  disabled = false,
  onClick,
  variant = "primary",
  className,
}: StartQuizButtonProps) {
  const baseClasses =
    "rounded-full shadow-xl px-12 py-6 text-2xl sm:text-3xl min-w-[260px] sm:min-w-[320px] font-bold transition-colors flex items-center justify-center gap-3" // gap for icon

  const primaryStyles =
    "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
  const outlineStyles =
    "border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950"
  const disabledStyles = "opacity-50 cursor-not-allowed"

  const combined = cn(
    baseClasses,
    variant === "primary" ? primaryStyles : outlineStyles,
    disabled && disabledStyles,
    className,
  )

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className={combined}
      variant="ghost"
      size="lg"
    >
      <span>{label}</span>
      <ArrowRight className="h-6 w-6" />
    </Button>
  )
} 