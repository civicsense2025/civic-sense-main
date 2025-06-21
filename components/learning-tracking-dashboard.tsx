import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, Brain, Target, Trophy, Star, 
  TrendingUp, Calendar, Clock, CheckCircle,
  BookmarkPlus, Check, Trash2
} from "lucide-react"
import { bookmarkOperations } from "@/lib/bookmarks"
import { useToast } from "@/components/ui/use-toast"
import type { ContentType, Bookmark, BookmarkSnippet } from "@/lib/types/bookmarks"
import type { KeyTakeaways } from "@/lib/types/key-takeaways"
import { createClient } from "@/lib/supabase/client"
import { enhancedQuizDatabase } from "@/lib/quiz-database"

interface SavedTakeaway {
  id: string
  text: string
  type: string
  topic_id: string
  topic_title: string
  created_at: string
}

interface QuizResult {
  id: string
  topic_id: string
  topic_title: string
  score: number
  total_questions: number
  correct_answers: number
  time_spent_seconds: number
  completed_at: string
  category_performance?: Record<string, { correct: number; total: number; avgTime: number }>
}

interface LearningTrackingDashboardProps {
  className?: string
}

export function LearningTrackingDashboard({ className }: LearningTrackingDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [savedTakeaways, setSavedTakeaways] = useState<SavedTakeaway[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('takeaways')

  useEffect(() => {
    if (user) {
      loadSavedTakeaways()
      loadQuizResults()
    }
  }, [user])

  const loadSavedTakeaways = async () => {
    if (!user) return

    try {
      // Get all bookmarks with 'key-takeaways' tag
      const { bookmarks } = await bookmarkOperations.getUserBookmarks(user.id, {
        tags: ['key-takeaways']
      })
      
      // Get snippets for each bookmark
      const takeaways: SavedTakeaway[] = []
      for (const bookmark of bookmarks) {
        const snippets = await bookmarkOperations.getBookmarkSnippets(bookmark.id, user.id)
        snippets.forEach((snippet: BookmarkSnippet) => {
          takeaways.push({
            id: snippet.id,
            text: snippet.snippet_text,
            type: bookmark.tags.find((t: string) => t !== 'key-takeaways' && t !== 'quiz') || 'General',
            topic_id: bookmark.content_id || '',
            topic_title: bookmark.title.replace('Quiz Topic: ', ''),
            created_at: snippet.created_at
          })
        })
      }

      setSavedTakeaways(takeaways.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    } catch (error) {
      console.error('Error loading saved takeaways:', error)
      toast({
        title: "Error",
        description: "Failed to load saved takeaways",
        variant: "destructive"
      })
    }
  }

  const loadQuizResults = async () => {
    if (!user) return

    try {
      const { data: results, error } = await enhancedQuizDatabase.getQuizAttempts(user.id)
      
      if (error) throw error

      setQuizResults(results.sort((a: QuizResult, b: QuizResult) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      ))
    } catch (error) {
      console.error('Error loading quiz results:', error)
      toast({
        title: "Error",
        description: "Failed to load quiz results",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTakeaway = async (takeawayId: string) => {
    if (!user) return

    try {
      await bookmarkOperations.deleteSnippet(takeawayId, user.id)
      setSavedTakeaways(prev => prev.filter(t => t.id !== takeawayId))
      toast({
        title: "Deleted",
        description: "Takeaway removed successfully"
      })
    } catch (error) {
      console.error('Error deleting takeaway:', error)
      toast({
        title: "Error",
        description: "Failed to delete takeaway",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
  }

  return (
    <div className={className}>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="takeaways">
            <BookOpen className="w-4 h-4 mr-2" />
            Saved Takeaways
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <Target className="w-4 h-4 mr-2" />
            Quiz Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="takeaways" className="space-y-4">
          {savedTakeaways.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No saved takeaways yet. Save key points while taking quizzes!</p>
              </CardContent>
            </Card>
          ) : (
            savedTakeaways.map(takeaway => (
              <Card key={takeaway.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {takeaway.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatDate(takeaway.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {takeaway.text}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        From: {takeaway.topic_title}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTakeaway(takeaway.id)}
                      className="text-slate-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : quizResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No quiz results yet. Start taking quizzes to track your progress!</p>
              </CardContent>
            </Card>
          ) : (
            quizResults.map(result => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {result.topic_title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {formatDate(result.completed_at)}
                        </p>
                      </div>
                      <Badge className={getScoreBadgeColor(result.score)}>
                        {result.score}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Questions</p>
                        <p className="font-medium">
                          {result.correct_answers}/{result.total_questions}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Time</p>
                        <p className="font-medium">
                          {formatTime(result.time_spent_seconds)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Avg Time</p>
                        <p className="font-medium">
                          {formatTime(result.time_spent_seconds / result.total_questions)}
                        </p>
                      </div>
                    </div>

                    {result.category_performance && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Category Performance
                        </p>
                        {Object.entries(result.category_performance).map(([category, perf]) => (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{category}</span>
                              <span>{Math.round((perf.correct / perf.total) * 100)}%</span>
                            </div>
                            <Progress 
                              value={(perf.correct / perf.total) * 100} 
                              className="h-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 