"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { dataService } from "@/lib/data-service"
import type { TopicMetadata } from "@/lib/quiz-data"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Award, Calendar, TrendingUp, Target, BookOpen } from "lucide-react"
import { useCanonicalCategories } from "@/lib/hooks/useCanonicalCategories"
import { cn } from "@/lib/utils"

interface LearningProgressModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LearningProgressModal({ isOpen, onClose }: LearningProgressModalProps) {
  const { user } = useAuth()
  const { normalise, getCategoryInfo } = useCanonicalCategories()
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())
  const [streak, setStreak] = useState(0)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)
  const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; completed: number }>>({})
  const [topicsData, setTopicsData] = useState<Record<string, TopicMetadata>>({})
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)

  // Load topics data
  useEffect(() => {
    const loadTopics = async () => {
      try {
        setIsLoadingTopics(true)
        const topics = await dataService.getAllTopics()
        setTopicsData(topics)
      } catch (error) {
        console.error('Error loading topics:', error)
        setTopicsData({})
      } finally {
        setIsLoadingTopics(false)
      }
    }

    if (user && isOpen) {
      loadTopics()
    }
  }, [user, isOpen])

  useEffect(() => {
    if (!user) return

    // Load completed topics from localStorage
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    if (savedCompleted) {
      setCompletedTopics(new Set(JSON.parse(savedCompleted)))
    }

    // Load streak data
    const savedStreak = localStorage.getItem("civicAppStreak")
    const savedLastActivity = localStorage.getItem("civicAppLastActivity")

    if (savedStreak) {
      setStreak(Number.parseInt(savedStreak, 10))
    }

    if (savedLastActivity) {
      setLastActivity(new Date(savedLastActivity))
    }
  }, [user])

  // Calculate category stats when topics data and completed topics change
  useEffect(() => {
    if (!isLoadingTopics && Object.keys(topicsData).length > 0) {
      const stats: Record<string, { total: number; completed: number }> = {}

      Object.values(topicsData).forEach((topic) => {
        // Normalize the topic categories to canonical names
        const canonicalCategories = normalise(topic.categories)
        
        canonicalCategories.forEach((category: string) => {
          if (!stats[category]) {
            stats[category] = { total: 0, completed: 0 }
          }
          stats[category].total += 1

          if (completedTopics.has(topic.topic_id)) {
            stats[category].completed += 1
          }
        })
      })

      setCategoryStats(stats)
    }
  }, [topicsData, completedTopics, isLoadingTopics, normalise])

  if (!user) {
    return null
  }

  const totalTopics = Object.keys(topicsData).length
  const completedCount = completedTopics.size
  const completionPercentage = Math.round((completedCount / totalTopics) * 100) || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span>Your Learning Progress</span>
          </DialogTitle>
          <DialogDescription>
            Track your civic education journey and achievements
          </DialogDescription>
        </DialogHeader>

        {isLoadingTopics ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border">
                <div className="flex items-center justify-between">
                  <Target className="h-8 w-8 text-blue-600" />
                  <span className="text-3xl font-bold text-blue-600">{completionPercentage}%</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Overall Progress</h3>
                  <Progress value={completionPercentage} className="h-3 mt-2" />
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {completedCount} of {totalTopics} topics completed
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border">
                <div className="flex items-center justify-between">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <span className="text-3xl font-bold text-orange-600">{streak}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">Current Streak</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {streak > 0 ? "Keep the momentum going!" : "Start your learning streak today!"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border">
                <div className="flex items-center justify-between">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    {lastActivity ? new Intl.DateTimeFormat('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }).format(lastActivity) : "None"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Last Activity</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {lastActivity ? "Great job staying active!" : "Ready to start learning?"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border">
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-purple-600" />
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Achievement Level</h3>
                  <p className="text-lg font-bold text-purple-600">
                    {completionPercentage >= 75 ? "Civic Expert" : 
                     completionPercentage >= 50 ? "Civic Scholar" : 
                     completionPercentage >= 25 ? "Civic Student" : "Civic Beginner"}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Keep learning to advance!
                  </p>
                </div>
              </div>
            </div>

            {/* Category Progress */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Progress by Category
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(categoryStats)
                  .sort(([, a], [, b]) => (b.completed / b.total) - (a.completed / a.total))
                  .map(([category, stats]) => {
                    const percentage = Math.round((stats.completed / stats.total) * 100) || 0
                    return (
                      <div
                        key={category}
                        className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getCategoryInfo(category)?.emoji || '📚'}</span>
                            <span className="font-medium text-sm">{category}</span>
                          </div>
                          <span className="text-sm font-bold">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2 mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {stats.completed} of {stats.total} completed
                        </p>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Achievements Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={cn(
                  "p-4 border rounded-lg transition-all",
                  completedCount >= 1 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-800/50"
                )}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="font-medium">First Quiz</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Complete your first civic quiz</p>
                  {completedCount >= 1 && <p className="text-xs text-green-600 mt-1">✓ Achieved!</p>}
                </div>

                <div className={cn(
                  "p-4 border rounded-lg transition-all",
                  streak >= 3 ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" : "bg-gray-50 dark:bg-gray-800/50"
                )}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <span className="font-medium">Hot Streak</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Maintain a 3-day learning streak</p>
                  {streak >= 3 && <p className="text-xs text-orange-600 mt-1">✓ Achieved!</p>}
                </div>

                <div className={cn(
                  "p-4 border rounded-lg transition-all",
                  completionPercentage >= 50 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-800/50"
                )}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🎓</span>
                    <span className="font-medium">Civic Scholar</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Complete 50% of all topics</p>
                  {completionPercentage >= 50 && <p className="text-xs text-blue-600 mt-1">✓ Achieved!</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 