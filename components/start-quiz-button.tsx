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
// Modern Apple-esque design with clean aesthetics.
export function StartQuizButton({
  label,
  disabled = false,
  onClick,
  variant = "primary",
  className,
}: StartQuizButtonProps) {
  const baseClasses =
    "rounded-xl shadow-sm px-8 py-4 text-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"

  const primaryStyles =
    "bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
  const outlineStyles =
    "border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
  const disabledStyles = "opacity-40 cursor-not-allowed"

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
      <ArrowRight className="h-5 w-5 ml-1 transition-transform group-hover:translate-x-0.5" />
    </Button>
  )
} 