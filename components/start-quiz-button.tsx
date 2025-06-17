import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { usePremium } from "@/hooks/usePremium"

interface StartQuizButtonProps {
  label: string
  disabled?: boolean
  onClick?: () => void
  variant?: "primary" | "outline"
  className?: string
  remainingQuizzes?: number
  showPulse?: boolean
  completed?: boolean
  isPartiallyCompleted?: boolean
}

// A large call-to-action button used for starting quizzes throughout the app.
// Modern Apple-esque design with high contrast and animated glow effect.
export function StartQuizButton({
  label,
  disabled = false,
  onClick,
  variant = "primary",
  className,
  remainingQuizzes,
  showPulse = false,
  completed = false,
  isPartiallyCompleted = false
}: StartQuizButtonProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isPremium, isPro } = usePremium();
  
  // Check for dark mode on mount and when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const baseClasses =
    "rounded-xl shadow-sm px-8 py-6 text-2xl font-light transition-all duration-200 flex items-center justify-center gap-2 relative z-10"

  const primaryStyles =
    "bg-blue-50 text-blue-900 hover:bg-blue-100 hover:text-blue-950 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 border border-blue-200 dark:border-blue-500"
  const outlineStyles =
    "border border-blue-300 dark:border-blue-400 text-blue-700 dark:text-blue-100 bg-transparent hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-800/50"
  const completedStyles =
    "border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 hover:bg-green-100 hover:text-green-950 dark:hover:bg-green-800/40"
  const partiallyCompletedStyles =
    "border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 hover:bg-amber-100 hover:text-amber-950 dark:hover:bg-amber-800/40"
  const disabledStyles = "opacity-40 cursor-not-allowed"

  // Choose style based on state
  let styleToUse = variant === "primary" ? primaryStyles : outlineStyles;
  if (completed) {
    styleToUse = completedStyles;
  } else if (isPartiallyCompleted) {
    styleToUse = partiallyCompletedStyles;
  }

  const combined = cn(
    baseClasses,
    styleToUse,
    disabled && disabledStyles,
    className,
  )

  // Breathing glow animation variants
  const glowVariants = {
    initial: {
      opacity: 0.5,
      scale: 0.95,
    },
    animate: {
      opacity: [0.5, 0.8, 0.5],
      scale: [0.95, 1.05, 0.95],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }
    }
  }

  // Determine the glow color based on detected theme
  const glowColor = isDarkMode
    ? "rgba(147, 197, 253, 0.2)" // Dark mode glow
    : "rgba(96, 165, 250, 0.3)";  // Light mode glow

  // Determine tooltip text based on state
  const getTooltipText = () => {
    if (isPartiallyCompleted) {
      return "Continue where you left off";
    }
    
    if (completed) {
      return "You've already completed this quiz";
    }
    
    if (isPremium || isPro) {
      return "Premium members have unlimited access to quizzes";
    }
    
    if (remainingQuizzes !== undefined) {
      if (remainingQuizzes === 0) {
        return "You have no quizzes remaining today";
      } else if (remainingQuizzes === 1) {
        return "You have 1 quiz remaining today";
      } else {
        return `You have ${remainingQuizzes} quizzes remaining today`;
      }
    }
    
    return undefined;
  };

  return (
    <div className="relative inline-block">
      {/* Animated glow effect */}
      {showPulse && (
        <motion.div
          variants={glowVariants}
          initial="initial"
          animate="animate"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '0.75rem', // rounded-xl
            zIndex: 0,
            background: glowColor,
            filter: 'blur(16px)'
          }}
        />
      )}
      
      <Button
        disabled={disabled}
        onClick={onClick}
        className={combined}
        variant="ghost"
        size="lg"
        title={getTooltipText()}
      >
        <span>{label}</span>
        <ArrowRight className="h-5 w-5 ml-1 transition-transform group-hover:translate-x-0.5" />
        {completed && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
        {isPartiallyCompleted && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            <span className="text-xs font-bold">⏸</span>
          </div>
        )}
        {remainingQuizzes !== undefined && !completed && !isPartiallyCompleted && !(isPremium || isPro) && (
          <div className="absolute -top-2 -right-2 bg-blue-600 dark:bg-blue-400 text-white dark:text-blue-950 rounded-full w-6 h-6 text-xs flex items-center justify-center font-medium z-20">
            {remainingQuizzes}
          </div>
        )}
      </Button>
    </div>
  )
} 