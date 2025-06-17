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



export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { subscription, isPremium, isPro, isActive, hasFeatureAccess, refreshSubscription } = usePremium()
  const { trackEngagement } = useAnalytics()


  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [enhancedProgress, setEnhancedProgress] = useState<EnhancedUserProgress | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showAllAttempts, setShowAllAttempts] = useState(false)
  const [allAttempts, setAllAttempts] = useState<DashboardData['recentActivity']>([])

  // Add state for onboarding status
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false)

  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

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

  // Load comprehensive dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        
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
            
            // Also fetch all attempts without deduplication
            try {
              const allAttemptsPromise = enhancedQuizDatabase.getUserQuizAttempts(user.id)
              const allAttemptsData = await Promise.race([allAttemptsPromise, new Promise((_, reject) => 
                setTimeout(() => reject(new Error('All attempts timeout')), 5000)
              )])
              
              // Map to same format as recentActivity
              const formattedAllAttempts = (allAttemptsData as any[]).map((attempt: any) => ({
                attemptId: attempt.id,
                topicId: attempt.topicId,
                topicTitle: allTopics[attempt.topicId]?.topic_title || 'Unknown Topic',
                score: attempt.score,
                completedAt: attempt.completedAt,
                timeSpent: attempt.timeSpentSeconds,
                isPartial: attempt.isPartial
              })).slice(0, 50) // Limit to 50 to prevent performance issues
              
              setAllAttempts(formattedAllAttempts)
            } catch (allAttemptsError) {
              console.error('Failed to fetch all attempts:', allAttemptsError)
            }
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
        setIsLoading(false)
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
          console.error('Error fetching onboarding status:', error)
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
        console.error('Error checking onboarding status:', err)
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

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading your dashboard...</p>
        </div>
      </div>
    )
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



          {/* Recent activity - clean list */}
          {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white">Recent Activity</h2>
                <div className="flex items-center gap-2 text-sm">
                  <button 
                    className={`px-3 py-1 rounded-full ${!showAllAttempts ? 'bg-slate-100 dark:bg-slate-800' : 'text-slate-500'}`}
                    onClick={() => setShowAllAttempts(false)}
                  >
                    Unique Topics
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-full ${showAllAttempts ? 'bg-slate-100 dark:bg-slate-800' : 'text-slate-500'}`}
                    onClick={() => setShowAllAttempts(true)}
                  >
                    All Attempts ({allAttempts.length})
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {(showAllAttempts ? allAttempts : dashboardData.recentActivity).slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 px-3 -mx-3 rounded-md transition-all">
                    <Link
                      href={activity.attemptId ? `/results/${activity.attemptId}` : '#'}
                      className="flex-1 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      aria-disabled={!activity.attemptId}
                    >
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                          {activity.topicTitle}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
                            {new Date(activity.completedAt).toLocaleDateString()}
                          </p>
                          {activity.timeSpent && (
                            <p className="text-sm text-slate-500 dark:text-slate-500 font-light flex items-center">
                              <Clock className="h-3 w-3 mr-1 opacity-70" />
                              {Math.round(activity.timeSpent / 60)}m
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={cn(
                          "text-lg font-light",
                          activity.score >= 80 ? "text-green-600 dark:text-green-400" :
                          activity.score >= 60 ? "text-blue-600 dark:text-blue-400" :
                          "text-orange-600 dark:text-orange-400"
                        )}>
                          {activity.score}%
                        </span>
                      </div>
                      
                      {/* Add resume button for partial attempts */}
                      {activity.isPartial && (
                        <StartQuizButton
                          label="Resume"
                          onClick={() => router.push(`/quiz/${activity.topicId}`)}
                          isPartiallyCompleted={true}
                          variant="outline"
                          className="text-sm py-2 px-4 h-auto"
                        />
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="text-center py-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {showAllAttempts ? 
                      `${Math.min(allAttempts.length, 10)} of ${allAttempts.length} total attempts` : 
                      `${Math.min(dashboardData.recentActivity.length, 10)} unique topics of ${dashboardData.completedQuizzes} completed quizzes`
                    }
                    <span className="inline-flex items-center ml-1 cursor-help group relative">
                      <Info className="h-3 w-3 text-slate-400" />
                      <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-white dark:bg-slate-900 p-2 rounded shadow-lg text-xs text-left border border-slate-200 dark:border-slate-800 z-10">
                        Your total quiz count ({dashboardData.completedQuizzes}) includes all completed quizzes. 
                        "Unique Topics" shows only your most recent attempt for each topic, while "All Attempts" shows each individual quiz attempt.
                      </span>
                    </span>
                  </p>
                </div>
                
                {((showAllAttempts && allAttempts.length > 10) || (!showAllAttempts && dashboardData.recentActivity.length > 10)) && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    View More →
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">Recent Activity</h2>
              
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-4">
                <div className="text-4xl mb-2">📋</div>
                <h3 className="text-xl font-light text-slate-900 dark:text-white">No Activity Yet</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto font-light">
                  Complete your first quiz to see your activity history here.
                </p>
                <div className="pt-4">
                  <Button 
                    asChild
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 rounded-full px-6"
                  >
                    <Link href="/">Start a Quiz</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

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