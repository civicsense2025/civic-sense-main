"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { dataService } from "@/lib/data-service"
import type { TopicMetadata } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { LearningProgressModal } from "./learning-progress-modal"

interface DashboardStatsProps {
  className?: string
  compact?: boolean
  collapsible?: boolean
}

export function DashboardStats({ className, compact = false, collapsible = false }: DashboardStatsProps) {
  const { user } = useAuth()
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())
  const [topicsData, setTopicsData] = useState<Record<string, TopicMetadata>>({})
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

    if (user) {
      loadTopics()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    // Load completed topics from localStorage
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    if (savedCompleted) {
      setCompletedTopics(new Set(JSON.parse(savedCompleted)))
    }
  }, [user])

  if (!user) {
    return null
  }

  if (isLoadingTopics) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalTopics = Object.keys(topicsData).length
  const completedCount = completedTopics.size
  const completionPercentage = Math.round((completedCount / totalTopics) * 100) || 0

  return (
    <>
      <div className={cn("flex items-center", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 hover:bg-accent/50 transition-all duration-200 hover:scale-105"
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Learning Progress</span>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalTopics} topics ({completionPercentage}%)
            </span>
          </div>
        </Button>
      </div>

      <LearningProgressModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
} 