"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@civicsense/shared/hooks/usePremium"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { BarChart3, Lock, Eye, Crown } from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"
import { supabase } from "@civicsense/shared/lib/supabase"

interface PremiumDataTeaserProps {
  className?: string
  variant?: 'compact' | 'banner'
  onUpgradeClick?: () => void
}

interface DataStats {
  analyticsRecords: number
  progressSnapshots: number
  learningInsights: number
  dataAge: string
}

export function PremiumDataTeaser({ 
  className, 
  variant = 'compact',
  onUpgradeClick
}: PremiumDataTeaserProps) {
  const { user } = useAuth()
  const { hasFeatureAccess } = usePremium()
  const [dataStats, setDataStats] = useState<DataStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && !hasFeatureAccess('advanced_analytics')) {
      loadDataStats()
    }
  }, [user, hasFeatureAccess])

  const loadDataStats = async () => {
    if (!user) return

    try {
      // Get counts of data we're collecting
      const [analytics, progress, insights] = await Promise.all([
        supabase
          .from('user_quiz_analytics')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        supabase
          .from('user_progress_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        supabase
          .from('user_learning_insights')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ])

      // Get oldest data date
      const { data: oldestData } = await supabase
        .from('user_quiz_analytics')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      let dataAge = "Start taking quizzes"
      if (oldestData?.created_at) {
        const days = Math.ceil((Date.now() - new Date(oldestData.created_at).getTime()) / (1000 * 60 * 60 * 24))
        if (days < 7) dataAge = `${days} days of data`
        else if (days < 30) dataAge = `${Math.ceil(days / 7)} weeks of data`
        else dataAge = `${Math.ceil(days / 30)} months of data`
      }

      setDataStats({
        analyticsRecords: analytics.count || 0,
        progressSnapshots: progress.count || 0,
        learningInsights: insights.count || 0,
        dataAge
      })
    } catch (error) {
      console.error('Error loading data stats:', error)
      setDataStats({
        analyticsRecords: 0,
        progressSnapshots: 0,
        learningInsights: 0,
        dataAge: "Start taking quizzes"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show if user has access or no user
  if (!user || hasFeatureAccess('advanced_analytics')) return null

  // Don't show if no data yet for compact variant
  if (variant === 'compact' && (!dataStats || dataStats.analyticsRecords === 0)) return null

  if (variant === 'banner') {
    return (
      <div className={cn(
        "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <Lock className="h-3 w-3 text-slate-900 dark:text-slate-100 absolute -top-1 -right-1" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                {dataStats?.analyticsRecords || 0} analytics records waiting
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {dataStats?.dataAge || "Building your profile..."}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={onUpgradeClick}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
          >
            <Eye className="h-3 w-3 mr-1" />
            Unlock
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("border-dashed border-slate-300 dark:border-slate-600", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BarChart3 className="h-8 w-8 text-slate-400" />
              <Lock className="h-4 w-4 text-slate-900 dark:text-slate-100 absolute -top-1 -right-1" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-50">
                Your Analytics Are Ready
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {dataStats ? `${dataStats.dataAge} waiting for you` : "Building your profile..."}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={onUpgradeClick}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
          >
            <Crown className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 