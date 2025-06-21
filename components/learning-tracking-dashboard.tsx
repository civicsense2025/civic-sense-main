import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Target, X, Star, TrendingUp, ArrowUpRight, Bookmark as BookmarkIcon, Trash2 } from "lucide-react"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { bookmarkOperations } from "@/lib/bookmarks"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Bookmark } from "@/lib/types/bookmarks"

interface QuizResult {
  id: string
  topicId: string
  topicTitle: string
  score: number
  completedAt: string
  timeSpent: number
}

interface SavedTakeaway {
  id: string
  topicId: string
  topicTitle: string
  content: string
  savedAt: string
}

export function LearningTrackingDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [savedTakeaways, setSavedTakeaways] = useState<SavedTakeaway[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'quiz-results' | 'bookmarks'>('quiz-results')

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Get recent activity and transform into results
        const recentActivity = await enhancedQuizDatabase.getRecentActivity(user.id, 10)
        const results = recentActivity
          .filter(activity => activity.activityType === 'quiz')
          .map(activity => ({
            id: activity.attemptId || '',
            topicId: activity.topicId,
            topicTitle: activity.topicTitle,
            score: activity.score,
            completedAt: activity.completedAt,
            timeSpent: activity.timeSpent || 0
          }))

        // Get saved takeaways from bookmarks
        const bookmarksData = await bookmarkOperations.getUserBookmarks(user.id, { tags: ['key-takeaways'] })
        const takeaways = bookmarksData.bookmarks.map((bookmark: Bookmark) => ({
          id: bookmark.id,
          topicId: bookmark.content_id || '',
          topicTitle: bookmark.title.replace('Quiz Topic: ', ''),
          content: bookmark.description || '',
          savedAt: bookmark.created_at
        }))

        setQuizResults(results)
        setSavedTakeaways(takeaways)
      } catch (error) {
        console.error('Error loading learning activity:', error)
        toast({
          title: 'Error loading activity',
          description: 'Please try again later',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  const handleDeleteTakeaway = async (takeawayId: string) => {
    if (!user) return
    try {
      await bookmarkOperations.deleteBookmark(takeawayId, user.id)
      setSavedTakeaways(prev => prev.filter(t => t.id !== takeawayId))
      toast({
        title: 'Takeaway deleted',
        description: 'The takeaway has been removed from your bookmarks'
      })
    } catch (error) {
      console.error('Error deleting takeaway:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete takeaway. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/20 rounded-full flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-light text-slate-900 dark:text-white">
          Learning Activity
        </h2>
      </div>

      <Tabs 
        defaultValue="quiz-results" 
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="quiz-results" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Quiz Results
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex items-center gap-2">
            <BookmarkIcon className="w-4 h-4" />
            Bookmarks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quiz-results" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : quizResults.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">
                  No Quiz Results Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                  Complete your first quiz to start tracking your learning progress
                </p>
                <Button asChild>
                  <Link href="/">Start a Quiz</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {quizResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href={`/quiz/${result.topicId}`}
                        className="text-lg font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {result.topicTitle}
                      </Link>
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0">
                        {result.score}%
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Completed {formatDistanceToNow(new Date(result.completedAt))} ago • 
                      {Math.round(result.timeSpent / 60)} minutes
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : savedTakeaways.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">
                  No Saved Takeaways
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                  Save key takeaways from quizzes to review them later
                </p>
                <Button asChild>
                  <Link href="/">Explore Topics</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedTakeaways.map((takeaway) => (
                <Card key={takeaway.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href={`/quiz/${takeaway.topicId}`}
                        className="text-lg font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {takeaway.topicTitle}
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTakeaway(takeaway.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Saved {formatDistanceToNow(new Date(takeaway.savedAt))} ago
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm">
                      {takeaway.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 