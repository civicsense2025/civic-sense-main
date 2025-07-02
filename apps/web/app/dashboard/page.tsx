"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { usePremium } from "@civicsense/shared/hooks/usePremium"
import { DashboardStats } from "@civicsense/ui-web/components/dashboard-stats"
import { UserMenu } from "@civicsense/ui-web/components/auth/user-menu"
import { useRouter } from "next/navigation"

import { PremiumAnalytics } from "@civicsense/ui-web/components/premium-analytics"
import { PremiumSubscriptionCard } from "@civicsense/ui-web/components/premium-subscription-card"
import { PremiumFeaturesShowcase } from "@civicsense/ui-web/components/premium-features-showcase"
import { PremiumDataTeaser } from "@civicsense/ui-web/components/premium-data-teaser"
import { AIDeckCreator } from "@civicsense/ui-web/components/ai-deck-creator"

import { LearningObjectivesCard } from "@civicsense/ui-web/components/learning-objectives-card"
import { Button } from "@civicsense/ui-web"

import { Badge } from "@civicsense/ui-web"
import { Progress } from "@civicsense/ui-web"
import { 
  Crown, BarChart3, BookOpen, Settings, 
  TrendingUp, Target, Calendar, Users,
  Sparkles, Star, Shield, Zap, Trophy,
  Clock, CheckCircle, XCircle, ArrowRight,
  Brain, Award, Flame, Activity, Plus,
  Filter, Search, Shuffle, Play, Info, X
} from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"
import { dataService } from "@civicsense/shared/lib/data-service"
import { enhancedProgressOperations, type EnhancedUserProgress, type Achievement } from "@civicsense/shared/lib/enhanced-gamification"
import { enhancedQuizDatabase } from "@civicsense/shared/lib/quiz-database"
import Link from "next/link"
import { useAnalytics } from "@civicsense/shared/utils/analytics"
import { EnhancedProgressDashboard } from "@civicsense/ui-web/components/enhanced-progress-dashboard"
import { StartQuizButton } from "@civicsense/ui-web/components/start-quiz-button"
import { supabase } from '@civicsense/shared/lib/supabase'
import { DailyCardStack } from '@civicsense/ui-web/components/daily-card-stack'
import { PremiumUpgradeCard } from '@civicsense/ui-web/components/premium-upgrade-card'
import { Header } from '@civicsense/ui-web'
import { ContinueLearning } from "@civicsense/ui-web/components/continue-learning"
import { RecommendedTopics } from "@civicsense/ui-web/components/recommended-topics"
import { EnhancedRecentActivity } from "@civicsense/ui-web/components/enhanced-recent-activity"
import { LearningPodsDashboard } from "@civicsense/ui-web/components/learning-pods-dashboard"
import { SurveysDashboard } from "@civicsense/ui-web/components/surveys-dashboard"
import { AuthDialog } from '@civicsense/ui-web'
import { FeedbackButton } from '@civicsense/ui-web/components/feedback'
import { Skeleton } from '@civicsense/ui-web'
import { Card, CardContent, CardHeader } from '@civicsense/ui-web'
import { LearningTrackingDashboard } from "@civicsense/ui-web/components/learning-tracking-dashboard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@civicsense/ui-web"
import { toast } from "@civicsense/ui-web"

interface DashboardData {
  totalTopics: number
  completedTopics: number
  averageScore: number
  timeLearning: number
  activeStreak: number
  level: number
  xp: number
}

interface ActivityData {
  topicId: string
  completedAt: string
  timeSpent: number
  score: number
}

// Dashboard Stats Skeleton - More minimal design
function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

// Weekly Progress Chart Skeleton
function WeeklyProgressSkeleton() {
  // Use static heights to prevent hydration mismatch
  const staticHeights = [80, 120, 60, 100, 90, 110, 70]
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      {/* Chart area */}
      <div className="h-64 flex items-end justify-center">
        <div className="flex items-end gap-3 w-full max-w-md">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t-lg" 
              style={{ height: `${staticHeights[i]}px` }}
            />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-sm" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-sm" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

// Recent Activity Skeleton - More minimal
function RecentActivitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-40" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Category Progress Skeleton
function CategoryProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>
      
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Complete Dashboard Loading Skeleton
function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      
      <main className="container py-8 space-y-16">
        {/* Header skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-10 w-80" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>

        {/* Stats overview */}
        <DashboardStatsSkeleton />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left column - Charts */}
          <div className="lg:col-span-2 space-y-12">
            <WeeklyProgressSkeleton />
            <CategoryProgressSkeleton />
          </div>

          {/* Right column - Activity */}
          <div className="space-y-12">
            <RecentActivitySkeleton />
          </div>
        </div>
      </main>
    </div>
  )
}

// Unauthenticated state component
function UnauthenticatedDashboard() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header onSignInClick={() => setShowAuthDialog(true)} />
      
      <main className="container py-16">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-light text-slate-900 dark:text-white tracking-tight">
              Welcome to CivicSense
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Sign in to track your civic knowledge and create custom learning experiences
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAuthDialog(true)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium rounded-full px-8 py-4 h-auto text-lg"
          >
            Sign In to Continue
          </Button>
        </div>
      </main>
      
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onAuthSuccess={() => setShowAuthDialog(false)}
        initialMode="sign-in"
      />
    </div>
  )
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { subscription, isPremium, isPro, isActive, hasFeatureAccess, refreshSubscription } = usePremium()
  const { trackEngagement } = useAnalytics()

  // Handle admin access error messages from middleware
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error) {
      let title = "Access Error"
      let description = "An error occurred"
      
      switch (error) {
        case 'admin_access_denied':
          title = "Admin Access Denied"
          description = "You don't have admin permissions to access the admin panel"
          break
        case 'admin_check_failed':
          title = "Admin Check Failed"
          description = "Could not verify admin permissions. Please try again later."
          break
        case 'admin_check_error':
          title = "System Error"
          description = "A system error occurred while checking admin access"
          break
      }
      
      toast({
        title,
        description,
        variant: "destructive"
      })
      
      // Clean up the URL
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('error')
      window.history.replaceState({}, '', cleanUrl.toString())
    }
  }, [])

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalTopics: 0,
    completedTopics: 0,
    averageScore: 0,
    timeLearning: 0,
    activeStreak: 0,
    level: 1,
    xp: 0
  })
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [enhancedProgress, setEnhancedProgress] = useState<EnhancedUserProgress | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [dateRange, setDateRange] = useState('7') // '7', '30', '90' days
  const [topicFilter, setTopicFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')

  // Add state for onboarding status
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(true)

  // Track dashboard page view
  useEffect(() => {
    if (user) {
      trackEngagement.pageView('dashboard')
    }
  }, [user, trackEngagement])

  // Debug subscription status
  useEffect(() => {
    if (user && subscription !== undefined) {
      const debugData = {
        hasSubscription: !!subscription,
        subscriptionTier: subscription?.subscription_tier,
        subscriptionStatus: subscription?.subscription_status,
        isActive,
        isPremium,
        isPro,
        customDecksAccess: hasFeatureAccess('custom_decks'),
        analyticsAccess: hasFeatureAccess('advanced_analytics'),
        timestamp: new Date().toISOString()
      }
      console.log('🔍 Debug Subscription Status:', debugData)
      setDebugInfo(debugData)
    }
  }, [user, subscription, isActive, isPremium, isPro, hasFeatureAccess])

  // Load comprehensive dashboard data - only when user is authenticated
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        setIsDataLoading(true)
        // Get user's activity data with filters
        const response = await fetch(`/api/user/activity?days=${dateRange}&topic=${topicFilter}&difficulty=${difficultyFilter}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load activity data')
        }

        const recentActivity = data.activities as ActivityData[]
        
        // Calculate total time learning this week
        const now = new Date()
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - parseInt(dateRange))
        
        const weeklyTimeSpent = recentActivity
          .filter(activity => new Date(activity.completedAt) >= weekStart)
          .reduce((total: number, activity: ActivityData) => total + (activity.timeSpent || 0), 0)
        
        // Calculate other metrics
        const completedTopics = new Set(recentActivity.map(a => a.topicId)).size
        const averageScore = recentActivity.length > 0
          ? recentActivity.reduce((sum: number, a: ActivityData) => sum + a.score, 0) / recentActivity.length
          : 0

        // Get user progress data
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('current_streak')
          .eq('user_id', user.id)
          .single()

        // Get total topics count from database
        const { count: totalTopics } = await supabase
          .from('question_topics')
          .select('*', { count: 'exact', head: true })

        setDashboardData({
          totalTopics: totalTopics || 0,
          completedTopics,
          averageScore,
          timeLearning: Math.round(weeklyTimeSpent / 60), // Convert to minutes
          activeStreak: progressData?.current_streak || 0,
          level: Math.floor(completedTopics / 5) + 1,
          xp: completedTopics * 100
        })
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast({
          title: "Error loading data",
          description: "Please try again later.",
          variant: "destructive"
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    loadDashboardData()
  }, [user, dateRange, topicFilter, difficultyFilter])

  // Add useEffect to check onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('user_onboarding_state')
          .select('is_completed, current_step, skip_reason')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (error) {
          console.warn('Onboarding status check failed (table may not exist):', error)
          // Assume onboarding is complete if we can't check
          setOnboardingComplete(true)
          setShowOnboardingBanner(false)
          return
        }
        
        // If no onboarding record exists, or it exists but is not completed
        if (!data || !data.is_completed) {
          setOnboardingComplete(false)
          setShowOnboardingBanner(true)
        } else {
          setOnboardingComplete(true)
          setShowOnboardingBanner(false)
        }
      } catch (err) {
        console.warn('Error checking onboarding status (assuming complete):', err)
        // Assume onboarding is complete if we can't check
        setOnboardingComplete(true)
        setShowOnboardingBanner(false)
      }
    }
    
    checkOnboardingStatus()
  }, [user])

  const handleResumeOnboarding = () => {
    router.push('/onboarding')
  }

  const dismissOnboardingBanner = () => {
    setShowOnboardingBanner(false)
  }

  // Handle authentication states properly
  if (authLoading) {
    return <DashboardLoadingSkeleton />
  }

  if (!user) {
    return <UnauthenticatedDashboard />
  }

  // Show loading skeleton while dashboard data is loading
  if (isDataLoading || !dashboardData) {
    return <DashboardLoadingSkeleton />
  }

  const completionPercentage = Math.round((dashboardData.completedTopics / dashboardData.totalTopics) * 100) || 0

  const getTierBadge = () => {
    if (!subscription) return null
    
    const tier = subscription.subscription_tier
    const colors = {
      free: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      premium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      pro: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    }

    return (
      <Badge className={`${colors[tier as keyof typeof colors]} font-medium border-0`}>
        {tier === 'free' ? 'Free' : tier === 'premium' ? 'Premium' : 'Pro'}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="container py-8 space-y-16">
        {/* Welcome Message and Progress - More minimal */}
        <div className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user.user_metadata?.full_name || 'Tán Ho'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-light">
                {dashboardData.completedTopics} of {dashboardData.totalTopics} topics completed
              </p>
            </div>
            
            {/* Filters - More minimal */}
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36 border-0 bg-white dark:bg-slate-900 shadow-sm">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-36 border-0 bg-white dark:bg-slate-900 shadow-sm">
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="civics">Civics</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="economics">Economics</SelectItem>
                </SelectContent>
              </Select>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-36 border-0 bg-white dark:bg-slate-900 shadow-sm">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Progress bar - More minimal */}
          <div className="space-y-3">
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Completely redesigned to be minimal */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {dashboardData.completedTopics}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Topics completed
            </div>
            <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
          </div>
          
          <div className="space-y-3">
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {dashboardData.averageScore > 0 ? `${Math.round(dashboardData.averageScore)}%` : 'NaN%'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Average score
            </div>
            <div className="h-1 w-12 bg-green-500 rounded-full"></div>
          </div>
          
          <div className="space-y-3">
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {dashboardData.timeLearning}m
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Time learning<br />this week
            </div>
            <div className="h-1 w-12 bg-purple-500 rounded-full"></div>
          </div>
          
          <div className="space-y-3">
            <div className="text-3xl font-light text-slate-900 dark:text-white">
              {dashboardData.activeStreak}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Day streak
            </div>
            <div className="h-1 w-12 bg-orange-500 rounded-full"></div>
          </div>
        </div>

        {/* Content sections with more spacing */}
        <div className="space-y-16">
          {/* Continue Learning - Most important for retention */}
          <section>
            <ContinueLearning userId={user.id} />
          </section>

          {/* Recommended Topics */}
          <section>
            <RecommendedTopics userId={user.id} />
          </section>

          {/* Learning Activity */}
          <section>
            <LearningTrackingDashboard />
          </section>

          {/* Available Surveys */}
          <section>
            <SurveysDashboard />
          </section>
        </div>
      </main>
    </div>
  )
} 