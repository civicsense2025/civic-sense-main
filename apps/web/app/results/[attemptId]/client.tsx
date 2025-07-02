"use client"

import { enhancedQuizDatabase } from "@civicsense/shared/lib/quiz-database"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { QuizResults } from "@civicsense/ui-web/components/quiz/quiz-results"
import { Loader2, BookmarkPlus, Check } from "lucide-react"
import Link from "next/link"
import { bookmarkOperations } from "@civicsense/shared/lib/bookmarks"
import { useToast } from "@civicsense/ui-web"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@civicsense/ui-web"
import { Button } from "@civicsense/ui-web"
import type { ContentType } from "@civicsense/shared/lib/types/bookmarks"
import type { QuizQuestion } from "@civicsense/shared/lib/quiz-data"
import type { KeyTakeaways } from "@civicsense/shared/lib/types/key-takeaways"
import { createClient } from "@civicsense/shared/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@civicsense/ui-web"
import { HighlightColorPicker } from "@civicsense/ui-web/components/bookmarks/highlight-color-picker"

interface ResultsPageProps {
  params: {
    attemptId: string
  }
}

interface QuizState {
  topicId: string
  questions: QuizQuestion[]
  userAnswers: Array<{
    questionId: number
    answer: string
    isCorrect: boolean
    timeSpent: number
  }>
  keyTakeaways?: KeyTakeaways
}

export default function ResultsPageClient({ params }: ResultsPageProps) {
  const attemptId = params.attemptId
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<QuizState | null>(null)
  const [savedTakeaways, setSavedTakeaways] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const saveTakeaway = async (text: string, type: string, highlightColor: string = "#FEF08A") => {
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "Please log in to save takeaways",
        variant: "destructive"
      })
      return
    }

    try {
      // Create a bookmark for the topic
      const bookmark = await bookmarkOperations.createBookmark({
        content_type: 'quiz' as ContentType,
        content_id: state?.topicId,
        title: `Quiz Topic: ${state?.questions[0]?.category || 'Untitled'}`,
        description: 'Key takeaways from quiz topic',
        tags: ['quiz', 'key-takeaways', type]
      }, user.id)

      // Create a snippet for the takeaway
      await bookmarkOperations.createSnippet(
        bookmark.id,
        {
          snippet_text: text,
          source_type: 'annotation',
          user_notes: `Key takeaway (${type}) from quiz results`,
          highlight_color: highlightColor
        },
        user.id
      )

      setSavedTakeaways(prev => new Set([...prev, text]))
      toast({
        title: "Saved!",
        description: "Key takeaway saved to your bookmarks"
      })
    } catch (error) {
      console.error('Failed to save takeaway:', error)
      toast({
        title: "Error",
        description: "Failed to save takeaway",
        variant: "destructive"
      })
    }
  }

  const handleInteraction = (content: string, type: string, color: string) => saveTakeaway(content, type, color)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const details = await enhancedQuizDatabase.getQuizAttemptDetails(attemptId)
        if (!details.attempt) {
          setError('Quiz attempt not found')
          return
        }

        // Get key takeaways for the topic
        const { data: topic } = await supabase
          .from('question_topics')
          .select('key_takeaways')
          .eq('topic_id', details.attempt.topicId)
          .single()

        setState({
          topicId: details.attempt.topicId,
          questions: details.questions,
          userAnswers: details.userAnswers.map(a => ({
            questionId: a.questionNumber,
            answer: a.answer,
            isCorrect: a.isCorrect,
            timeSpent: a.timeSpent
          })),
          keyTakeaways: topic?.key_takeaways as KeyTakeaways | undefined
        })
      } catch (err) {
        setError('Failed to load quiz results')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [attemptId])

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  if (error || !state) {
    return <div className="text-red-500 p-4">{error || 'No results found'}</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <QuizResults 
        userAnswers={state.userAnswers}
        questions={state.questions}
        topicId={state.topicId}
        onFinish={() => router.push('/dashboard')}
      />
      
      {state.keyTakeaways ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Core Facts */}
          <Card>
            <CardHeader>
              <CardTitle>Core Facts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.keyTakeaways.core_facts.map((fact, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 p-4 bg-muted rounded-lg">
                    <p>{fact}</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={savedTakeaways.has(fact)}
                        >
                          {savedTakeaways.has(fact) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <BookmarkPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="end">
                        <HighlightColorPicker
                          onSelect={(c) => {
                            handleInteraction(fact, 'Core Fact', c)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uncomfortable Truths */}
          <Card>
            <CardHeader>
              <CardTitle>Uncomfortable Truths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.keyTakeaways.uncomfortable_truths.map((truth, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 p-4 bg-muted rounded-lg">
                    <p>{truth}</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={savedTakeaways.has(truth)}
                        >
                          {savedTakeaways.has(truth) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <BookmarkPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="end">
                        <HighlightColorPicker
                          onSelect={(c) => {
                            handleInteraction(truth, 'Uncomfortable Truth', c)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Power Dynamics */}
          <Card>
            <CardHeader>
              <CardTitle>Power Dynamics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.keyTakeaways.power_dynamics.map((dynamic, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 p-4 bg-muted rounded-lg">
                    <p>{dynamic}</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={savedTakeaways.has(dynamic)}
                        >
                          {savedTakeaways.has(dynamic) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <BookmarkPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="end">
                        <HighlightColorPicker
                          onSelect={(c) => {
                            handleInteraction(dynamic, 'Power Dynamic', c)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actionable Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Actionable Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.keyTakeaways.actionable_insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 p-4 bg-muted rounded-lg">
                    <p>{insight}</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={savedTakeaways.has(insight)}
                        >
                          {savedTakeaways.has(insight) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <BookmarkPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="end">
                        <HighlightColorPicker
                          onSelect={(c) => {
                            handleInteraction(insight, 'Actionable Insight', c)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Key Takeaways</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No key takeaways available for this topic yet. Check back later!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 