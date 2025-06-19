"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Clock, ArrowRight, X } from 'lucide-react'
import { pendingUserAttribution } from '@/lib/pending-user-attribution'
import { motion, AnimatePresence } from 'framer-motion'

interface PendingDataNotificationProps {
  onSignUpClick?: () => void
  className?: string
}

export function PendingDataNotification({ onSignUpClick, className }: PendingDataNotificationProps) {
  const [pendingSummary, setPendingSummary] = useState<{
    hasData: boolean
    totalXP: number
    assessmentCount: number
    quizCount: number
    daysSinceCreated: number
  } | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check for pending data on mount
    const summary = pendingUserAttribution.getPendingSummary()
    setPendingSummary(summary)

    // Check if user has previously dismissed this notification
    try {
      const dismissed = localStorage.getItem('civicSense_pendingDataDismissed')
      if (dismissed) {
        const dismissedDate = new Date(dismissed)
        const daysSinceDismissed = Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Show again if it's been more than 1 day since dismissal
        if (daysSinceDismissed < 1) {
          setIsDismissed(true)
        }
      }
    } catch (error) {
      // If there's an error reading localStorage, just show the notification
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      localStorage.setItem('civicSense_pendingDataDismissed', new Date().toISOString())
    } catch (error) {
      // Handle localStorage error gracefully
    }
  }

  const handleSignUpClick = () => {
    if (onSignUpClick) {
      onSignUpClick()
    }
  }

  // Don't show if no pending data, already dismissed, or if data is too old
  if (!pendingSummary?.hasData || isDismissed || pendingSummary.daysSinceCreated > 7) {
    return null
  }

  const totalItems = pendingSummary.assessmentCount + pendingSummary.quizCount

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    You have progress waiting!
                  </h3>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Your recent quiz activity is ready to be saved to your account.
                </p>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className="bg-yellow-600 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    {pendingSummary.totalXP} XP
                  </Badge>
                  
                  {totalItems > 0 && (
                    <Badge variant="outline" className="border-yellow-300 text-yellow-700 dark:text-yellow-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {totalItems} completed
                    </Badge>
                  )}
                  
                  {pendingSummary.daysSinceCreated > 0 && (
                    <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-300">
                      {pendingSummary.daysSinceCreated} day{pendingSummary.daysSinceCreated !== 1 ? 's' : ''} ago
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleSignUpClick}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium group"
                  >
                    Sign up to save progress
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleDismiss}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Remind me later
                  </Button>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="ml-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to easily get pending data status
export function usePendingDataStatus() {
  const [pendingSummary, setPendingSummary] = useState<{
    hasData: boolean
    totalXP: number
    assessmentCount: number
    quizCount: number
    daysSinceCreated: number
  } | null>(null)

  useEffect(() => {
    const updateSummary = () => {
      const summary = pendingUserAttribution.getPendingSummary()
      setPendingSummary(summary)
    }

    // Initial load only - no continuous polling
    updateSummary()

    // Remove continuous polling to prevent unnecessary server load
    // Only update when component mounts or when explicitly triggered
    
  }, [])

  return pendingSummary
} 