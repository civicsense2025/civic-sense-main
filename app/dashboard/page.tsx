"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { topicsData } from "@/lib/quiz-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Award, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { getCategoryEmoji } from "@/lib/quiz-data"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [streak, setStreak] = useState(0)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)
  const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; completed: number }>>({})

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
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

    // Calculate category stats
    const stats: Record<string, { total: number; completed: number }> = {}

    Object.values(topicsData).forEach((topic) => {
      topic.categories.forEach((category) => {
        if (!stats[category]) {
          stats[category] = { total: 0, completed: 0 }
        }
        stats[category].total += 1

        if (savedCompleted && JSON.parse(savedCompleted).includes(topic.topic_id)) {
          stats[category].completed += 1
        }
      })
    })

    setCategoryStats(stats)
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalTopics = Object.keys(topicsData).length
  const completedCount = completedTopics.size
  const completionPercentage = Math.round((completedCount / totalTopics) * 100) || 0

  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Your Learning Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl">{completionPercentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalTopics} topics completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Streak</CardDescription>
            <CardTitle className="text-2xl">{streak} days</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Calendar className="h-8 w-8 text-primary mr-2" />
            <p className="text-sm text-muted-foreground">
              {streak > 0 ? "Keep it up!" : "Start your learning streak today!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Activity</CardDescription>
            <CardTitle className="text-2xl">
              {lastActivity ? new Intl.DateTimeFormat().format(lastActivity) : "No activity yet"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <CheckCircle className="h-8 w-8 text-primary mr-2" />
            <p className="text-sm text-muted-foreground">
              {lastActivity ? "Keep the momentum going!" : "Complete your first quiz!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Achievement</CardDescription>
            <CardTitle className="text-2xl">{completionPercentage >= 50 ? "Civic Scholar" : "Civic Learner"}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Award className="h-8 w-8 text-primary mr-2" />
            <p className="text-sm text-muted-foreground">
              {completionPercentage >= 50 ? "You're becoming an expert!" : "Keep learning to earn achievements!"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="topics" className="mt-6">
        <TabsList>
          <TabsTrigger value="topics">Completed Topics</TabsTrigger>
          <TabsTrigger value="categories">Category Progress</TabsTrigger>
        </TabsList>
        <TabsContent value="topics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Completed Topics</CardTitle>
              <CardDescription>Track your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              {completedCount > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from(completedTopics).map((topicId) => {
                    const topic = topicsData[topicId]
                    if (!topic) return null
                    return (
                      <div
                        key={topicId}
                        className="flex items-start p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="mr-3 mt-0.5 text-2xl">{topic.emoji}</div>
                        <div>
                          <h3 className="font-medium">{topic.topic_title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{topic.date}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't completed any topics yet.</p>
                  <p className="mt-2">Start learning to see your progress here!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Progress</CardTitle>
              <CardDescription>See how you're doing across different civic topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([category, stats]) => {
                  const percentage = Math.round((stats.completed / stats.total) * 100) || 0
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="mr-2">{getCategoryEmoji(category)}</span>
                          <span className="font-medium">{category}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {stats.completed}/{stats.total} topics
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  )
}
