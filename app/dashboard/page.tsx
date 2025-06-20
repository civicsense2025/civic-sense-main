"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { DashboardStats } from "@/components/dashboard-stats"
import { UserMenu } from "@/components/auth/user-menu"
import { useRouter } from "next/navigation"

import { PremiumAnalytics } from "@/components/premium-analytics"
import { PremiumSubscriptionCard } from "@/components/premium-subscription-card"
import { PremiumFeaturesShowcase } from "@/components/premium-features-showcase"
import { PremiumDataTeaser } from "@/components/premium-data-teaser"
import { AIDeckCreator } from "@/components/ai-deck-creator"

import { LearningObjectivesCard } from "@/components/learning-objectives-card"
import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, BarChart3, BookOpen, Settings, 
  TrendingUp, Target, Calendar, Users,
  Sparkles, Star, Shield, Zap, Trophy,
  Clock, CheckCircle, XCircle, ArrowRight,
  Brain, Award, Flame, Activity, Plus,
  Filter, Search, Shuffle, Play, Info, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { dataService } from "@/lib/data-service"
import { enhancedProgressOperations, type EnhancedUserProgress, type Achievement } from "@/lib/enhanced-gamification"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import Link from "next/link"
import { useAnalytics } from "@/utils/analytics"
import { EnhancedProgressDashboard } from "@/components/enhanced-progress-dashboard"
import { StartQuizButton } from "@/components/start-quiz-button"
import { supabase } from '@/lib/supabase'
import { DailyCardStack } from '@/components/daily-card-stack'
import { PremiumUpgradeCard } from '@/components/premium-upgrade-card'
import { Header } from "@/components/header"
import { ContinueLearning } from "@/components/continue-learning"
import { RecommendedTopics } from "@/components/recommended-topics"
import { EnhancedRecentActivity } from "@/components/enhanced-recent-activity"
import { GiftCreditsDashboard } from "@/components/gift-credits-dashboard"
import { LearningPodsDashboard } from "@/components/learning-pods-dashboard"
import { SurveysDashboard } from "@/components/surveys-dashboard"
import { AuthDialog } from '@/components/auth/auth-dialog'
import { FeedbackButton } from '@/components/feedback'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface DashboardData {
  totalQuizzes: number
  completedQuizzes: number
  averageScore: number
  currentStreak: number
  totalXP: number
  currentLevel: number
  recentActivity: Array<{
    attemptId?: string
    topicId: string
    topicTitle: string
    score: number
    completedAt: string
    timeSpent?: number
    isPartial?: boolean
  }>
  categoryProgress: Record<string, {
    completed: number
    total: number
    averageScore: number
  }>
  weeklyProgress: Array<{
    date: string
    quizzesCompleted: number
    xpGained: number
  }>
  achievements: Achievement[]
}

// Dashboard Stats Skeleton
function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Weekly Progress Chart Skeleton
function WeeklyProgressSkeleton() {
  // Use static heights to prevent hydration mismatch
  const staticHeights = [80, 120, 60, 100, 90, 110, 70]
  
  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart area */}
          <div className="h-64 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-end justify-center p-4">
            <div className="flex items-end gap-2 w-full max-w-md">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="flex-1 rounded-t-sm" 
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
      </CardContent>
    </Card>
  )
}

// Recent Activity Skeleton
function RecentActivitySkeleton() {
  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Category Progress Skeleton
function CategoryProgressSkeleton() {
  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Complete Dashboard Loading Skeleton
function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      
      <main className="w-full py-8">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Header skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          {/* Stats overview */}
          <DashboardStatsSkeleton />

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Charts */}
            <div className="lg:col-span-2 space-y-8">
              <WeeklyProgressSkeleton />
              <CategoryProgressSkeleton />
            </div>

            {/* Right column - Activity */}
            <div className="space-y-8">
              <RecentActivitySkeleton />
              
              {/* Quick actions skeleton */}
              <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader>
                  <Skeleton className="h-6 w-28" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => setShowAuthDialog(true)} />
      
      <main className="w-full py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
              Welcome to CivicSense
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Sign in to track your civic knowledge and create custom learning experiences
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAuthDialog(true)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium rounded-full px-8 py-3 h-auto"
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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [enhancedProgress, setEnhancedProgress] = useState<EnhancedUserProgress | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Add state for onboarding status
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)

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
      if (!user) {
        return
      }
      
      try {
        setIsDataLoading(true)
        
        // Add timeout protection to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Dashboard loading timeout')), 10000) // 10 second timeout
        )
        
        // Load dashboard data with timeout protection
        const dashboardPromise = (async () => {
          // Load enhanced progress data with timeout protection
          let progress: EnhancedUserProgress | null = null
          try {
            const progressTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Progress timeout')), 5000)
            )
            const progressPromise = enhancedProgressOperations.getComprehensiveStats(user.id)
            progress = await Promise.race([progressPromise, progressTimeoutPromise]) as EnhancedUserProgress
          } catch (error) {
            console.error('Error loading enhanced progress (using fallback):', error)
            // Use fallback progress data
            progress = {
              totalQuizzesCompleted: 0,
              accuracyPercentage: 0,
              currentStreak: 0,
              totalXp: 0,
              currentLevel: 1
            } as EnhancedUserProgress
          }
          
          setEnhancedProgress(progress)
          
          // Load all topics for context
          const allTopics = await dataService.getAllTopics()
          const topicsArray = Object.values(allTopics)
          
          // Get recent activity from database with timeout protection
          let recentActivity: DashboardData['recentActivity'] = []
          try {
            const activityTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Activity timeout')), 5000) // Increased timeout
            )
            // Increase limit from 10 to 25 to fetch more recent activities
            const activityPromise = enhancedQuizDatabase.getRecentActivity(user.id, 25)
            const dbRecentActivity = await Promise.race([activityPromise, activityTimeoutPromise])
            recentActivity = dbRecentActivity as DashboardData['recentActivity']
            

          } catch (error) {
            console.error('Error loading recent activity from database (using localStorage fallback):', error)
            
            // Fallback to localStorage if database fails
            const recentActivityKey = `civicAppQuizResults_${user.id}_v1`
            const savedResults = localStorage.getItem(recentActivityKey)
            
            if (savedResults) {
              try {
                const results = JSON.parse(savedResults)
                recentActivity = results.slice(-10).map((result: any) => ({
                  topicId: result.topicId,
                  topicTitle: allTopics[result.topicId]?.topic_title || 'Unknown Topic',
                  score: Math.round((result.correctAnswers / result.totalQuestions) * 100),
                  completedAt: result.completedAt || new Date().toISOString(),
                  timeSpent: result.timeSpent,
                  isPartial: result.isPartial
                })).reverse()
              } catch (parseError) {
                console.error('Error parsing localStorage recent activity:', parseError)
                
                // If both database and localStorage fail, provide realistic placeholder data
                // so the UI doesn't look empty - helpful during testing and development
                if (process.env.NODE_ENV !== 'production') {
                  const dates = Array.from({length: 5}).map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    return d.toISOString()
                  })
                  
                  const demoTopics = [
                    { id: 'gov-101', title: 'Government 101' },
                    { id: 'voting-rights', title: 'Voting Rights' },
                    { id: 'civic-engagement', title: 'Civic Engagement' },
                    { id: 'media-literacy', title: 'Media Literacy' },
                    { id: 'constitutional-rights', title: 'Constitutional Rights' }
                  ]
                  
                  recentActivity = dates.map((date, i) => ({
                    topicId: demoTopics[i].id,
                    topicTitle: demoTopics[i].title,
                    score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
                    completedAt: date,
                    timeSpent: Math.floor(Math.random() * 300) + 300, // 5-10 min in seconds
                    isPartial: false
                  }))
                }
              }
            }
          }
          
          // Get completed topics from database with timeout protection
          let completedTopicIds: string[] = []
          try {
            const completedTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Completed topics timeout')), 3000)
            )
            const completedPromise = enhancedQuizDatabase.getCompletedTopics(user.id)
            completedTopicIds = await Promise.race([completedPromise, completedTimeoutPromise]) as string[]
          } catch (error) {
            console.error('Error loading completed topics from database (using localStorage fallback):', error)
            
            // Fallback to localStorage
            const completedTopicsKey = "civicAppCompletedTopics_v1"
            const savedCompleted = localStorage.getItem(completedTopicsKey)
            completedTopicIds = savedCompleted ? JSON.parse(savedCompleted) : []
          }
          
          // Calculate category progress
          const categoryProgress: DashboardData['categoryProgress'] = {}
          topicsArray.forEach(topic => {
            topic.categories.forEach(category => {
              if (!categoryProgress[category]) {
                categoryProgress[category] = { completed: 0, total: 0, averageScore: 0 }
              }
              categoryProgress[category].total++
              if (completedTopicIds.includes(topic.topic_id)) {
                categoryProgress[category].completed++
              }
            })
          })
          
          // Generate weekly progress (mock data for now - should come from DB)
          const weeklyProgress: DashboardData['weeklyProgress'] = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            
            // This should be calculated from actual quiz completion data
            const quizzesForDay = recentActivity.filter(activity => 
              activity.completedAt.startsWith(dateStr)
            ).length
            
            weeklyProgress.push({
              date: dateStr,
              quizzesCompleted: quizzesForDay,
              xpGained: quizzesForDay * 50 // Approximate XP per quiz
            })
          }
          
          const data: DashboardData = {
            totalQuizzes: topicsArray.length,
            completedQuizzes: progress?.totalQuizzesCompleted || completedTopicIds.length,
            averageScore: progress?.accuracyPercentage || 0,
            currentStreak: progress?.currentStreak || 0,
            totalXP: progress?.totalXp || 0,
            currentLevel: progress?.currentLevel || 1,
            recentActivity,
            categoryProgress,
            weeklyProgress,
            achievements: [] // We'll load achievements separately if needed
          }
          
          return data
        })()
        
        const data = await Promise.race([dashboardPromise, timeoutPromise]) as DashboardData
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading dashboard data (using fallback):', error)
        
        // Provide fallback dashboard data so user isn't stuck
        const fallbackData: DashboardData = {
          totalQuizzes: 100,
          completedQuizzes: 0,
          averageScore: 0,
          currentStreak: 0,
          totalXP: 0,
          currentLevel: 1,
          recentActivity: [],
          categoryProgress: {},
          weeklyProgress: [],
          achievements: []
        }
        setDashboardData(fallbackData)
      } finally {
        setIsDataLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

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

  const completionPercentage = Math.round((dashboardData.completedQuizzes / dashboardData.totalQuizzes) * 100) || 0

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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      <main className="w-full py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Onboarding banner - only show if not complete */}
          {showOnboardingBanner && (
            <div className="relative rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/40 p-6 overflow-hidden mb-4">
              <div className="absolute top-4 right-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full" 
                  onClick={dismissOnboardingBanner}
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="flex-shrink-0 bg-white dark:bg-slate-800 h-12 w-12 flex items-center justify-center rounded-full shadow-sm">
                  <Sparkles className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">Complete your personalized setup</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-light mb-4">
                    We noticed you haven't finished onboarding. Take a few minutes to personalize your learning experience.
                  </p>
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-full px-4 py-1 h-9"
                    onClick={handleResumeOnboarding}
                  >
                    Continue setup
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Clean header with lots of whitespace */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Track your civic knowledge and create custom learning experiences
            </p>
            <div className="flex justify-center pt-2">
              {getTierBadge()}
            </div>
          </div>

          {/* Main progress section - Apple style */}
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <div className="text-6xl font-light text-slate-900 dark:text-white">
                {completionPercentage}%
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                {dashboardData.completedQuizzes} of {dashboardData.totalQuizzes} topics completed
              </p>
            </div>
            
            {/* Clean progress bar */}
            <div className="max-w-md mx-auto">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                <div 
                  className="bg-slate-900 dark:bg-white h-1 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key stats - minimal design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-light text-slate-900 dark:text-white">
                {enhancedProgress?.currentLevel || 1}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Current Level</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                {enhancedProgress?.totalXp?.toLocaleString() || 0} XP earned
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-slate-900 dark:text-white">
                {dashboardData.currentStreak}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Day Streak</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Keep it going!
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-slate-900 dark:text-white">
                {Math.round(dashboardData.averageScore)}%
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Average Score</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Across all quizzes
              </p>
            </div>
          </div>

          {/* Continue Learning Section */}
          {user && <ContinueLearning userId={user.id} />}

          {/* Recommended Topics Section */}
          {user && <RecommendedTopics userId={user.id} />}

          {/* Enhanced Recent Activity */}
          {user && <EnhancedRecentActivity userId={user.id} />}

          {/* Available Surveys */}
          <SurveysDashboard />

          {/* Learning Pods Dashboard - temporarily hidden until ready for public use */}
          {/*
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
                Learning Pods
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                Collaborative learning with family, friends, and organizations
              </p>
            </div>
            <LearningPodsDashboard />
          </div>
          */}

          {/* Gift Credits Dashboard */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
                Gift CivicSense Access
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                Share the power of civic education with others
              </p>
            </div>
            <GiftCreditsDashboard />
          </div>

          {/* Premium features teaser */}
          <div className="text-center py-12 border-t border-slate-100 dark:border-slate-800">
            <PremiumDataTeaser 
              variant="banner"
            />
          </div>
        </div>
      </main>
    </div>
  )
} 