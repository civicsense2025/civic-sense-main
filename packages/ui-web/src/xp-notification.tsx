"use client"

import { useEffect, useState } from "react"
import { Badge } from "../ui/badge"
import { Zap, Star } from "lucide-react"
import { cn } from "../../utils"

interface XPNotificationProps {
  xpGained: number
  show: boolean
  onComplete?: () => void
  className?: string
}

export function XPNotification({ xpGained, show, onComplete, className }: XPNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animatedXP, setAnimatedXP] = useState(0)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      
      // Animate XP counter
      const duration = 1000
      const steps = 30
      const increment = xpGained / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= xpGained) {
          setAnimatedXP(xpGained)
          clearInterval(timer)
        } else {
          setAnimatedXP(Math.round(current))
        }
      }, duration / steps)

      // Auto-hide after animation
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          onComplete?.()
        }, 300)
      }, 3000)

      return () => {
        clearInterval(timer)
        clearTimeout(hideTimer)
      }
    }
  }, [show, xpGained, onComplete])

  if (!show) return null

  return (
    <div className={cn(
      "fixed top-20 right-4 z-50 transition-all duration-300",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      className
    )}>
      <Badge 
        variant="default" 
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-2 text-lg font-bold shadow-lg animate-bounce"
      >
        <Zap className="h-5 w-5 mr-2 animate-pulse" />
        +{animatedXP} XP
        <Star className="h-4 w-4 ml-2" />
      </Badge>
    </div>
  )
} 