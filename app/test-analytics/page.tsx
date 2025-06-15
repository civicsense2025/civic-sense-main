"use client"

import { useState } from "react"
import { useAnalytics } from "@/utils/analytics"
import { AnalyticsDebugPanel } from "@/components/analytics-debug-panel"
import { StatsigTest } from "@/components/statsig-test"
import { StatsigDebug } from "@/components/statsig-debug"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Zap, Eye, MousePointer } from "lucide-react"

export default function TestAnalyticsPage() {
  const { trackAuth, trackQuiz, trackGameification, trackEngagement, trackFeature } = useAnalytics()
  const [eventCounts, setEventCounts] = useState({
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  })

  const incrementCounter = (priority: 'high' | 'medium' | 'low') => {
    setEventCounts(prev => ({
      ...prev,
      [priority]: prev[priority] + 1,
      total: prev.total + 1
    }))
  }

  const testHighPriorityEvents = () => {
    console.log('🔴 Testing HIGH priority events (always tracked)')
    trackAuth.userLogin({ login_method: 'email', source: 'direct' })
    trackQuiz.quizCompleted({
      quiz_id: 'test-quiz-123',
      quiz_category: 'constitution',
      score_percentage: 85,
      total_questions: 10,
      correct_answers: 8,
      total_time_seconds: 180,
      user_level: 5,
      active_boosts: [],
      streak_count: 3
    })
    trackGameification.achievementUnlocked({
      achievement_type: 'streak_master',
      achievement_category: 'quiz',
      total_achievements: 15
    })
    incrementCounter('high')
  }

  const testMediumPriorityEvents = () => {
    console.log('🟡 Testing MEDIUM priority events (30% sampling)')
    for (let i = 0; i < 10; i++) {
      trackQuiz.quizStarted({
        quiz_id: `test-quiz-${i}`,
        quiz_category: 'local_civics',
        quiz_difficulty: 'intermediate',
        user_level: 3,
        active_boosts: [],
        streak_count: 1
      })
      trackEngagement.pageView('test-page', 'direct')
      trackGameification.boostActivated({
        boost_type: 'double_xp',
        user_level: 3,
        activation_context: 'pre_quiz'
      })
    }
    incrementCounter('medium')
  }

  const testLowPriorityEvents = () => {
    console.log('🟢 Testing LOW priority events (10% sampling)')
    for (let i = 0; i < 20; i++) {
      trackQuiz.questionAnswered({
        question_id: `test-q-${i}`,
        question_category: 'government_basics',
        answer_correct: Math.random() > 0.5,
        response_time_seconds: Math.floor(Math.random() * 30) + 5,
        hint_used: Math.random() > 0.7,
        confidence_level: Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5
      })
      trackQuiz.hintUsed(`test-q-${i}`, 'manual', true)
      trackFeature.featureFirstUse('test-feature', true, 4)
    }
    incrementCounter('low')
  }

  const resetCounters = () => {
    setEventCounts({ high: 0, medium: 0, low: 0, total: 0 })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Analytics Sampling Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test the event sampling system to optimize your 2M Statsig events
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Statsig Debug Panel */}
          <StatsigDebug />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Statsig Integration Test */}
            <div>
              <StatsigTest />
            </div>
          
          {/* Test Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Event Testing
                </CardTitle>
                <CardDescription>
                  Fire different priority events and see sampling in action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* High Priority */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="font-medium">High Priority Events</span>
                      <Badge variant="outline" className="text-xs">100% tracked</Badge>
                    </div>
                    <Badge variant="secondary">{eventCounts.high}</Badge>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                    User registration, quiz completion, achievements - always tracked
                  </p>
                  <Button onClick={testHighPriorityEvents} size="sm" className="w-full">
                    Fire 3 High Priority Events
                  </Button>
                </div>

                {/* Medium Priority */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="font-medium">Medium Priority Events</span>
                      <Badge variant="outline" className="text-xs">30% sampled</Badge>
                    </div>
                    <Badge variant="secondary">{eventCounts.medium}</Badge>
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">
                    Quiz starts, page views, boost activations - 30% sampling
                  </p>
                  <Button onClick={testMediumPriorityEvents} variant="outline" size="sm" className="w-full">
                    Fire 30 Medium Priority Events
                  </Button>
                </div>

                {/* Low Priority */}
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="font-medium">Low Priority Events</span>
                      <Badge variant="outline" className="text-xs">10% sampled</Badge>
                    </div>
                    <Badge variant="secondary">{eventCounts.low}</Badge>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                    Question answers, hints, interactions - 10% sampling
                  </p>
                  <Button onClick={testLowPriorityEvents} variant="outline" size="sm" className="w-full">
                    Fire 60 Low Priority Events
                  </Button>
                </div>

                {/* Controls */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={resetCounters} variant="ghost" size="sm" className="flex-1">
                    Reset Counters
                  </Button>
                  <Button 
                    onClick={() => console.log('Check browser console for sampling logs')} 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Expected Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expected Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span><strong>High Priority:</strong> All 3 events should be tracked</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span><strong>Medium Priority:</strong> ~9 of 30 events tracked (30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span><strong>Low Priority:</strong> ~6 of 60 events tracked (10%)</span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  💡 Check the browser console to see which events were skipped due to sampling
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Analytics Debug Panel */}
            <div className="lg:col-span-1">
              <AnalyticsDebugPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 