"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PremiumGate } from "@/components/premium-gate"
import { 
  BarChart3, TrendingUp, Clock, Target, Brain, 
  Calendar, Zap, Award, Crown, Sparkles,
  ChevronRight, Activity, Users, Lightbulb,
  PieChart, LineChart, BarChart
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumAnalyticsProps {
  className?: string
}

interface AnalyticsData {
  weeklyProgress: Array<{
    week: string
    quizzes: number
    accuracy: number
    xp: number
  }>
  categoryPerformance: Array<{
    category: string
    accuracy: number
    timeSpent: number
    improvement: number
  }>
  learningPatterns: {
    bestTimeOfDay: string
    averageSessionLength: number
    preferredDifficulty: string
    streakPattern: string
  }
  predictiveInsights: Array<{
    insight: string
    confidence: number
    recommendation: string
  }>
}

export function PremiumAnalytics({ className }: PremiumAnalyticsProps) {
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user])

  const loadAnalyticsData = async () => {
    if (!hasFeatureAccess('advanced_analytics')) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // In a real implementation, this would fetch from your analytics API
      // For now, we'll use mock data
      const mockData: AnalyticsData = {
        weeklyProgress: [
          { week: "Week 1", quizzes: 5, accuracy: 78, xp: 450 },
          { week: "Week 2", quizzes: 8, accuracy: 82, xp: 720 },
          { week: "Week 3", quizzes: 6, accuracy: 85, xp: 540 },
          { week: "Week 4", quizzes: 10, accuracy: 88, xp: 900 },
        ],
        categoryPerformance: [
          { category: "Constitutional Law", accuracy: 92, timeSpent: 45, improvement: 15 },
          { category: "Voting Rights", accuracy: 85, timeSpent: 32, improvement: 8 },
          { category: "Civil Liberties", accuracy: 78, timeSpent: 28, improvement: -2 },
          { category: "Government Structure", accuracy: 88, timeSpent: 38, improvement: 12 },
        ],
        learningPatterns: {
          bestTimeOfDay: "Evening (7-9 PM)",
          averageSessionLength: 12,
          preferredDifficulty: "Intermediate",
          streakPattern: "Consistent weekday learner"
        },
        predictiveInsights: [
          {
            insight: "You perform 23% better on Constitutional Law topics",
            confidence: 87,
            recommendation: "Focus on expanding your Civil Liberties knowledge to balance your expertise"
          },
          {
            insight: "Your accuracy increases by 15% during evening sessions",
            confidence: 92,
            recommendation: "Schedule important study sessions between 7-9 PM for optimal performance"
          },
          {
            insight: "You're on track to reach Expert level in 3 categories this month",
            confidence: 78,
            recommendation: "Maintain current pace and consider setting a mastery goal"
          }
        ]
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePremiumFeatureClick = () => {
    if (!hasFeatureAccess('advanced_analytics')) {
      setShowPremiumGate(true)
    }
  }

  if (!user) return null

  if (!hasFeatureAccess('advanced_analytics')) {
    return (
      <>
        <Card className={cn("border-2 border-dashed border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/10 dark:to-amber-950/10", className)}>
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <BarChart3 className="h-16 w-16 mx-auto text-yellow-500/60" />
              <Crown className="h-6 w-6 absolute -top-1 -right-1 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
              Premium Analytics
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Unlock detailed learning analytics, performance insights, and personalized recommendations to accelerate your civic education journey.
            </p>
            <Button 
              onClick={handlePremiumFeatureClick}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
        
        <PremiumGate
          feature="advanced_analytics"
          isOpen={showPremiumGate}
          onClose={() => setShowPremiumGate(false)}
          title="Advanced Analytics"
          description="Get detailed insights into your learning patterns and performance"
        />
      </>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Analytics
          </h2>
          <p className="text-muted-foreground">Deep insights into your learning journey</p>
        </div>
        <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Weekly Quizzes</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.weeklyProgress[analyticsData.weeklyProgress.length - 1]?.quizzes || 0}
                </p>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Accuracy</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.weeklyProgress[analyticsData.weeklyProgress.length - 1]?.accuracy || 0}%
                </p>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">XP Earned</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.weeklyProgress[analyticsData.weeklyProgress.length - 1]?.xp || 0}
                </p>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium">Avg Session</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {analyticsData?.learningPatterns.averageSessionLength || 0}m
                </p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Weekly Progress Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.weeklyProgress.map((week, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">{week.week}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>{week.quizzes} quizzes</span>
                      <span>{week.accuracy}% accuracy</span>
                      <span className="text-yellow-600 font-medium">{week.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Your accuracy and improvement across different topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.categoryPerformance.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{category.accuracy}%</span>
                        <Badge variant={category.improvement > 0 ? "default" : "secondary"} className="text-xs">
                          {category.improvement > 0 ? "+" : ""}{category.improvement}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {category.timeSpent} minutes studied
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Learning Patterns</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Best Time of Day</span>
                  <p className="text-lg">{analyticsData?.learningPatterns.bestTimeOfDay}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Average Session</span>
                  <p className="text-lg">{analyticsData?.learningPatterns.averageSessionLength} minutes</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Preferred Difficulty</span>
                  <p className="text-lg">{analyticsData?.learningPatterns.preferredDifficulty}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Learning Style</span>
                  <p className="text-lg">{analyticsData?.learningPatterns.streakPattern}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Study Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Schedule sessions during your peak performance time
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Focus on weaker categories for balanced growth
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Maintain consistent daily practice for best results
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI-Powered Insights</span>
              </CardTitle>
              <CardDescription>Personalized recommendations based on your learning data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.predictiveInsights.map((insight, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{insight.insight}</p>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.recommendation}
                      </p>
                      <Progress value={insight.confidence} className="h-1" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 