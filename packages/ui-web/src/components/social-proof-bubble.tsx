"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { TrendingUp, TrendingDown, Users, Clock, Target } from 'lucide-react'
import type { QuestionStats, AssessmentQuestionStats } from '@civicsense/shared/lib/question-stats'

interface SocialProofBubbleProps {
  questionId: string
  assessmentType?: 'onboarding' | 'civics_test'
  showDelay?: number // Delay before showing in ms
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center' | 'inline'
  variant?: 'minimal' | 'compact' | 'detailed' // minimal = simple text line, compact = card, detailed = full analytics
  onStatsLoaded?: (stats: QuestionStats | AssessmentQuestionStats) => void
  className?: string
}

interface SocialProofStatsProps {
  stats: QuestionStats | AssessmentQuestionStats
  variant: 'minimal' | 'compact' | 'detailed'
}

function SocialProofStats({ stats, variant }: SocialProofStatsProps) {
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
          <span className="mr-1">{stats.emoji}</span>
          {stats.accuracyRate}% of {stats.totalAttempts.toLocaleString()} people get this right
        </p>
      </motion.div>
    )
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card className="w-full max-w-xs sm:max-w-sm lg:w-72 shadow-xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{stats.emoji}</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Question Stats
                </span>
              </div>
              <Badge 
                variant="outline"
                className={`text-xs ${
                  stats.difficultyLevel === 'expert' ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-300' :
                  stats.difficultyLevel === 'hard' ? 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300' :
                  stats.difficultyLevel === 'medium' ? 'border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300' :
                  'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300'
                }`}
              >
                {stats.difficultyLevel}
              </Badge>
            </div>
            
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {stats.socialProofMessage}
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{stats.totalAttempts.toLocaleString()} attempts</span>
              </div>
              {stats.averageTimeSpent && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{stats.averageTimeSpent}s avg</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Detailed variant
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="w-80 shadow-2xl border-0 bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-900/95 dark:to-slate-800/95 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{stats.emoji}</div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Question Analytics</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time data</p>
              </div>
            </div>
            <Badge 
              variant="outline"
              className={`${
                stats.difficultyLevel === 'expert' ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950' :
                stats.difficultyLevel === 'hard' ? 'border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-950' :
                stats.difficultyLevel === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950' :
                'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950'
              }`}
            >
              {stats.difficultyLevel}
            </Badge>
          </div>
          
          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {stats.socialProofMessage}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">Success Rate</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {stats.accuracyRate}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {stats.correctAttempts} correct
              </div>
            </div>
            
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                <Users className="w-3 h-3" />
                <span className="text-xs font-medium">Total Attempts</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {stats.totalAttempts.toLocaleString()}
              </div>
              {stats.averageTimeSpent && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {stats.averageTimeSpent}s avg time
                </div>
              )}
            </div>
          </div>
          
          {stats.mostCommonWrongAnswer && (
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 mb-1">
                <TrendingDown className="w-3 h-3" />
                <span className="text-xs font-medium">Common Mistake</span>
              </div>
              <div className="text-xs text-red-700 dark:text-red-300">
                Many choose: "{stats.mostCommonWrongAnswer}"
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SocialProofBubble({
  questionId,
  assessmentType,
  showDelay = 2000,
  position = 'top-right',
  variant = 'minimal',
  onStatsLoaded,
  className = ''
}: SocialProofBubbleProps) {
  // Disabled for now to avoid 404 errors - returning null
  return null

  // Keeping the original implementation commented for future use:
  /*
  const [stats, setStats] = useState<QuestionStats | AssessmentQuestionStats | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const fetchStats = async () => {
      if (!questionId) return

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (assessmentType) {
          params.set('assessment_type', assessmentType)
        }

        const response = await fetch(`/api/question-stats/${questionId}?${params.toString()}`)
        
        if (!response.ok) {
          // If it's a 404, that just means no stats are available yet (which is normal)
          if (response.status === 404) {
            setStats(null)
            return
          }
          throw new Error('Failed to fetch question stats')
        }

        const data = await response.json()
        
        if (data.stats) {
          setStats(data.stats)
          onStatsLoaded?.(data.stats)
          
          // Show bubble after delay
          timeoutId = setTimeout(() => {
            setIsVisible(true)
          }, showDelay)
        }
      } catch (err) {
        console.error('Error fetching question stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [questionId, assessmentType, showDelay, onStatsLoaded])

  // Don't render anything if no stats or still loading
  if (!stats || !isVisible || isLoading || error) {
    return null
  }

  const containerClasses = `${positionClasses[position]} ${className} z-10`

  return (
    <div className={containerClasses}>
      <AnimatePresence>
        {variant === 'minimal' && <MinimalBubble stats={stats} />}
        {variant === 'compact' && <CompactCard stats={stats} />}
        {variant === 'detailed' && <DetailedCard stats={stats} />}
      </AnimatePresence>
    </div>
  )
  */
}

// Hook for easier integration
export function useSocialProofStats(questionId: string, assessmentType?: 'onboarding' | 'civics_test') {
  // Disabled for now to avoid 404 errors
  return { stats: null, isLoading: false, error: null }

  // Keeping the original implementation commented for future use:
  /*
  const [stats, setStats] = useState<QuestionStats | AssessmentQuestionStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!questionId) return

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (assessmentType) {
          params.set('assessment_type', assessmentType)
        }

        const response = await fetch(`/api/question-stats/${questionId}?${params.toString()}`)
        
        if (!response.ok) {
          // If it's a 404, that just means no stats are available yet (which is normal)
          if (response.status === 404) {
            setStats(null)
            return
          }
          throw new Error('Failed to fetch question stats')
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (err) {
        console.error('Error fetching question stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [questionId, assessmentType])

  return { stats, isLoading, error }
  */
}

// Inline social proof component for embedding in question text
export function InlineSocialProof({ stats, className = '' }: { stats: QuestionStats, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 text-sm ${className}`}
    >
      <span>{stats.emoji}</span>
      <span className="text-slate-600 dark:text-slate-400">
        {stats.accuracyRate}% success rate
      </span>
      {stats.difficultyLevel === 'expert' && (
        <Badge variant="outline" className="text-xs border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
          Expert
        </Badge>
      )}
    </motion.div>
  )
} 