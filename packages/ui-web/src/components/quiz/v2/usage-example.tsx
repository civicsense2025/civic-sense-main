"use client"

import { useState, useCallback } from "react"
import { QuizEngineV2 } from "./engine/quiz-engine-v2"
import { QuizResultsModern } from "./quiz-results-modern"
import { useQuizAnalytics } from "@civicsense/shared/hooks/use-quiz-analytics"
import type { QuizResults } from "@civicsense/shared/lib/types/quiz"
import type { TopicMetadata } from "@civicsense/shared/lib/quiz-data"

interface QuizWithModernResultsProps {
  topic: TopicMetadata
  questions: any[]
  gameMode?: string
  onComplete?: (results: QuizResults) => void
}

export function QuizWithModernResults({
  topic,
  questions,
  gameMode = 'standard',
  onComplete
}: QuizWithModernResultsProps) {
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const analytics = useQuizAnalytics()

  const handleQuizStart = useCallback((attemptId: string) => {
    setQuizAttemptId(attemptId)
    // Initialize analytics session
    analytics.trackQuizStart(topic.topic_id, attemptId, gameMode)
  }, [analytics, topic.topic_id, gameMode])

  const handleQuizComplete = useCallback(async (results: QuizResults) => {
    setQuizResults(results)
    setShowResults(true)
    
    // Track completion analytics
    analytics.trackQuizCompleted(results)
    
    // Update response time metrics if available
    if (quizAttemptId && results.questions) {
      const questionResponseTimes = results.questions.map((q, index) => ({
        questionId: q.id || `q_${index}`,
        timeSpent: q.timeSpent || 0
      }))
      
      await analytics.updateResponseTimeMetrics(quizAttemptId, questionResponseTimes)
    }
    
    // Call parent completion handler
    onComplete?.(results)
  }, [analytics, quizAttemptId, onComplete])

  const handleRetake = useCallback(() => {
    setQuizResults(null)
    setShowResults(false)
    setQuizAttemptId(null)
    analytics.endSession()
  }, [analytics])

  const handleContinue = useCallback(() => {
    analytics.endSession()
    // Navigate to next topic or dashboard
    // This would typically use router.push() or onComplete callback
  }, [analytics])

  if (showResults && quizResults) {
    return (
      <QuizResultsModern
        results={quizResults}
        topic={topic}
        gameMode={gameMode}
        onRetake={handleRetake}
        onContinue={handleContinue}
        showSocialShare={true}
        quizAttemptId={quizAttemptId || undefined}
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8"
      />
    )
  }

  return (
    <QuizEngineV2
      questions={questions}
      topicId={topic.topic_id}
      currentTopic={{
        topic_id: topic.topic_id,
        topic_title: topic.topic_title,
        emoji: topic.emoji,
        date: topic.date,
        description: topic.description,
        categories: topic.categories,
        difficulty: topic.difficulty === "beginner" ? "easy" : 
                   topic.difficulty === "intermediate" ? "medium" : 
                   topic.difficulty === "advanced" ? "hard" : "medium",
        is_published: true
      }}
      gameMode={gameMode as any}
      onComplete={handleQuizComplete}
      onStart={handleQuizStart}
      analytics={analytics}
      className="min-h-screen"
    />
  )
}

// Example of enhanced topic filtering usage
export function TopicDiscoveryExample() {
  const [topics, setTopics] = useState([])
  const [filters, setFilters] = useState({
    difficulty: 'all',
    subject_area: 'all',
    civic_impact: 'all',
    time_estimate: 'all'
  })

  // This would typically be a hook or API call
  const loadTopicsWithFilters = useCallback(async () => {
    const query = supabase
      .from('topic_discovery')
      .select('*')
      .eq('is_active', true)

    if (filters.difficulty !== 'all') {
      query.eq('difficulty_level', filters.difficulty)
    }

    if (filters.subject_area !== 'all') {
      query.contains('subject_areas', [filters.subject_area])
    }

    if (filters.civic_impact !== 'all') {
      const impactRange = filters.civic_impact === 'high' ? [70, 100] : 
                         filters.civic_impact === 'medium' ? [40, 69] : [0, 39]
      query.gte('civic_impact_score', impactRange[0])
      query.lte('civic_impact_score', impactRange[1])
    }

    if (filters.time_estimate !== 'all') {
      const timeRange = filters.time_estimate === 'quick' ? [0, 5] :
                       filters.time_estimate === 'medium' ? [6, 15] : [16, 60]
      query.gte('estimated_completion_minutes', timeRange[0])
      query.lte('estimated_completion_minutes', timeRange[1])
    }

    const { data } = await query.order('civic_effectiveness_score', { ascending: false })
    setTopics(data || [])
  }, [filters])

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select 
          value={filters.difficulty} 
          onChange={e => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
        >
          <option value="all">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <select 
          value={filters.subject_area} 
          onChange={e => setFilters(prev => ({ ...prev, subject_area: e.target.value }))}
        >
          <option value="all">All Subjects</option>
          <option value="government">Government</option>
          <option value="constitution">Constitution</option>
          <option value="elections">Elections</option>
          <option value="policy">Policy</option>
        </select>

        <select 
          value={filters.civic_impact} 
          onChange={e => setFilters(prev => ({ ...prev, civic_impact: e.target.value }))}
        >
          <option value="all">All Impact Levels</option>
          <option value="high">High Impact (70+)</option>
          <option value="medium">Medium Impact (40-69)</option>
          <option value="low">Low Impact (0-39)</option>
        </select>

        <select 
          value={filters.time_estimate} 
          onChange={e => setFilters(prev => ({ ...prev, time_estimate: e.target.value }))}
        >
          <option value="all">Any Duration</option>
          <option value="quick">Quick (≤5min)</option>
          <option value="medium">Medium (6-15min)</option>
          <option value="long">Long (16+min)</option>
        </select>
      </div>

      {/* Topic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic: any) => (
          <div key={topic.topic_id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{topic.topic_title}</h3>
              <span className="text-2xl">{topic.emoji}</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Difficulty:</span>
                <span className="capitalize">{topic.actual_difficulty || topic.difficulty_level}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Estimated Time:</span>
                <span>{topic.estimated_completion_minutes}min</span>
              </div>
              
              <div className="flex justify-between">
                <span>Civic Impact:</span>
                <span>{topic.civic_effectiveness_score}/100</span>
              </div>
              
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span>{Math.round(topic.completion_rate)}%</span>
              </div>
            </div>
            
            <button 
              className="mt-4 w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
              onClick={() => {/* Navigate to quiz */}}
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 