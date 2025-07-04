import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { BookOpen, Clock, Target, X, Star, TrendingUp, ArrowUpRight, Bookmark as BookmarkIcon, Trash2 } from "lucide-react"
import { enhancedQuizDatabase } from '@civicsense/types/quizbase'
import { bookmarkOperations } from '@civicsense/business-logic/services/bookmarks'
import { useAuth } from "@/lib/auth"
import { useToast } from "../../components/ui"
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { cn } from '@civicsense/business-logic/utils'
import type { Bookmark } from '@civicsense/types/bookmarks'

interface QuizResult {
  id: string
  topicId: string
  topicTitle: string
  score: number
  completedAt: string
  timeSpent: number
  isCompleted: boolean
  progress?: number
  currentQuestionIndex?: number
  totalQuestions?: number
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
            timeSpent: activity.timeSpent || 0,
            isCompleted: !activity.isPartial,
            progress: activity.isPartial ? Math.round((activity.score / 100) * 100) : 100,
            currentQuestionIndex: undefined,
            totalQuestions: undefined
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
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 rounded-full flex items-center justify-center shadow-md shadow-blue-500/20 dark:shadow-blue-700/20">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
          Learning Activity
        </h2>
      </div>

      <Tabs 
        defaultValue="quiz-results" 
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'quiz-results' | 'bookmarks')}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-1"
      >
        <TabsList className="grid grid-cols-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-1 mb-4">
          <TabsTrigger 
            value="quiz-results" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-blue-700 rounded-md"
          >
            <Target className="w-4 h-4" />
            Quiz Results
          </TabsTrigger>
          <TabsTrigger 
            value="bookmarks" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-blue-700 rounded-md"
          >
            <BookmarkIcon className="w-4 h-4" />
            Bookmarks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quiz-results" className="space-y-4 px-4 pb-4">
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
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4 bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">📊</div>
                <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">
                  No Quiz Results Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                  Complete your first quiz to start tracking your learning progress
                </p>
                <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Link href="/">Start a Quiz</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {quizResults.map((result) => (
                <Card key={result.id} className="border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Link 
                        href={`/quiz/${result.topicId}`}
                        className="text-lg font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {result.topicTitle}
                      </Link>
                      <div className="flex items-center gap-2">
                        {!result.isCompleted && (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-0">
                            In Progress
                          </Badge>
                        )}
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
                          {result.isCompleted ? `${result.score}%` : `${result.progress || 0}% complete`}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress bar for incomplete attempts */}
                    {!result.isCompleted && result.progress !== undefined && (
                      <div className="mb-3">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${result.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {result.isCompleted ? 'Completed' : 'Started'} {formatDistanceToNow(new Date(result.completedAt))} ago
                        {result.timeSpent > 0 && ` • ${Math.round(result.timeSpent / 60)} minutes`}
                      </div>
                      
                      {/* Continue button for incomplete attempts */}
                      {!result.isCompleted && (
                        <Button
                          asChild
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-4 py-2 text-xs"
                        >
                          <Link href={`/quiz/${result.topicId}?continue=true&restore=progress`}>
                            Continue Quiz
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-4 px-4 pb-4">
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
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4 bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">📚</div>
                <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">
                  No Saved Takeaways
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light mb-6">
                  Save key takeaways from quizzes to review them later
                </p>
                <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Link href="/">Explore Topics</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedTakeaways.map((takeaway) => (
                <Card key={takeaway.id} className="border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href={`/quiz/${takeaway.topicId}`}
                        className="text-lg font-medium text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {takeaway.topicTitle}
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTakeaway(takeaway.id)}
                        className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Saved {formatDistanceToNow(new Date(takeaway.savedAt))} ago
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border-l-2 border-purple-400 dark:border-purple-500">
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