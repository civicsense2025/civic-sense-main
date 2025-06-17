"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Crown, Star, Zap, Trophy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"
import type { Achievement } from "@/lib/enhanced-gamification"

// Type augmentation to fix framer-motion className issue
declare module "framer-motion" {
  interface AnimationProps {
    className?: string;
  }
}

interface AchievementNotificationProps {
  achievements: Achievement[]
  levelUpInfo?: { newLevel: number; xpGained: number }
  isOpen: boolean
  onClose: () => void
}

export function AchievementNotification({ 
  achievements, 
  levelUpInfo, 
  isOpen, 
  onClose 
}: AchievementNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const hasAchievements = achievements.length > 0
  const hasMilestones = achievements.some(a => a.isMilestone)

  useEffect(() => {
    if (isOpen && hasAchievements) {
      // Trigger confetti for achievements
      const triggerConfetti = () => {
        if (hasMilestones) {
          // Extra special confetti for milestones
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32']
          })
          
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { x: 0.2, y: 0.7 },
              colors: ['#9370DB', '#4169E1', '#00CED1']
            })
          }, 300)
          
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { x: 0.8, y: 0.7 },
              colors: ['#FF69B4', '#FF1493', '#DC143C']
            })
          }, 600)
        } else {
          // Regular confetti for normal achievements
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4F46E5', '#7C3AED', '#EC4899']
          })
        }
      }

      triggerConfetti()
    }
  }, [isOpen, hasAchievements, hasMilestones])

  useEffect(() => {
    if (isOpen && levelUpInfo) {
      // Show level up after achievements
      const timer = setTimeout(() => {
        setShowLevelUp(true)
      }, achievements.length * 2000 + 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, levelUpInfo, achievements.length])

  const nextAchievement = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (levelUpInfo && !showLevelUp) {
      setShowLevelUp(true)
    } else {
      onClose()
    }
  }

  const skipToEnd = () => {
    if (levelUpInfo) {
      setShowLevelUp(true)
      setCurrentIndex(achievements.length - 1)
    } else {
      onClose()
    }
  }

  const getAchievementCategory = (type: string) => {
    if (type.includes('first') || type.includes('quiz')) return 'Getting Started'
    if (type.includes('streak')) return 'Consistency'
    if (type.includes('quizzes_')) return 'Progress'
    if (type.includes('perfect') || type.includes('accuracy')) return 'Performance'
    if (type.includes('speed') || type.includes('lightning')) return 'Speed'
    if (type.includes('category_') || type.includes('master')) return 'Mastery'
    if (type.includes('sampler') || type.includes('rounded')) return 'Exploration'
    if (type.includes('bird') || type.includes('owl') || type.includes('weekend')) return 'Engagement'
    if (type.includes('day')) return 'Special Events'
    if (type.includes('level_')) return 'Leveling Up'
    return 'Achievement'
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Getting Started': return 'bg-green-500'
      case 'Consistency': return 'bg-orange-500'
      case 'Progress': return 'bg-blue-500'
      case 'Performance': return 'bg-purple-500'
      case 'Speed': return 'bg-yellow-500'
      case 'Mastery': return 'bg-red-500'
      case 'Exploration': return 'bg-teal-500'
      case 'Engagement': return 'bg-yellow-500'
      case 'Special Events': return 'bg-indigo-500'
      case 'Leveling Up': return 'bg-amber-500'
      default: return 'bg-gray-500'
    }
  }

  if (!isOpen || (!hasAchievements && !levelUpInfo)) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-md"
          >
          {/* Achievement Display */}
          {hasAchievements && !showLevelUp && (
            <Card className={cn(
              "relative overflow-hidden border-2 shadow-2xl",
              achievements[currentIndex]?.isMilestone 
                ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20" 
                : "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
            )}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500"></div>
              
              <CardContent className="p-8 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 h-8 w-8 p-0"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Achievement Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative mb-6"
                  {...({} as any)}
                >
                  <div className={cn(
                    "w-24 h-24 mx-auto rounded-full flex items-center justify-center text-6xl relative",
                    achievements[currentIndex]?.isMilestone 
                      ? "bg-yellow-100 dark:bg-yellow-900/30" 
                      : "bg-blue-100 dark:bg-blue-900/30"
                  )}>
                    {achievements[currentIndex]?.emoji}
                    {achievements[currentIndex]?.isMilestone && (
                      <div className="absolute -inset-2 bg-yellow-400/20 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  {achievements[currentIndex]?.isMilestone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -top-2 -right-2"
                      {...({} as any)}
                    >
                      <Badge className="bg-yellow-500 text-white border-0 shadow-lg">
                        <Crown className="h-3 w-3 mr-1" />
                        Milestone
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>

                {/* Achievement Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-white border-0 mb-3",
                        getCategoryColor(getAchievementCategory(achievements[currentIndex]?.type || ''))
                      )}
                    >
                      {getAchievementCategory(achievements[currentIndex]?.type || '')}
                    </Badge>
                    
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {achievements[currentIndex]?.title}
                    </h2>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {achievements[currentIndex]?.description}
                    </p>
                  </div>

                  {achievements[currentIndex]?.isMilestone && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">Major Achievement Unlocked!</span>
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Navigation */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-between mt-8"
                >
                  <div className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {achievements.length}
                    {levelUpInfo && " + Level Up!"}
                  </div>
                  
                  <div className="flex space-x-2">
                    {achievements.length > 1 && (
                      <Button variant="outline" size="sm" onClick={skipToEnd}>
                        Skip All
                      </Button>
                    )}
                    <Button onClick={nextAchievement} className="bg-blue-600 hover:bg-blue-700">
                      {currentIndex < achievements.length - 1 ? "Next" : 
                       levelUpInfo ? "Level Up!" : "Continue"}
                      <Zap className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          )}

          {/* Level Up Display */}
          {showLevelUp && levelUpInfo && (
                    <Card className="relative overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500"></div>
              
              <CardContent className="p-8 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 h-8 w-8 p-0"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Level Up Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="relative mb-6"
                >
                  <div className="w-24 h-24 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center relative">
                    <Crown className="h-12 w-12 text-purple-600" />
                    <div className="absolute -inset-2 bg-purple-400/20 rounded-full animate-pulse"></div>
                  </div>
                </motion.div>

                {/* Level Up Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <Badge className="bg-purple-500 text-white border-0 mb-3">
                      <Star className="h-3 w-3 mr-1" />
                      Level Up!
                    </Badge>
                    
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      Level {levelUpInfo.newLevel}
                    </h2>
                    
                    <p className="text-muted-foreground">
                      Congratulations! You've gained <span className="font-bold text-purple-600">{levelUpInfo.xpGained} XP</span> and reached a new level!
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center space-x-2 text-purple-600 dark:text-purple-400"
                  >
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">Keep up the great work!</span>
                    <Trophy className="h-4 w-4" />
                  </motion.div>
                </motion.div>

                {/* Continue Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8"
                >
                  <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
                    Continue Learning
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 