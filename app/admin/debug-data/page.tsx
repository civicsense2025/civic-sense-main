'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-provider'

interface DiagnosticResult {
  database_health: {
    topics_count: number | null
    questions_count: number | null
    topics_count_error: any
    questions_count_error: any
  }
  sample_data: {
    topics: any[]
    questions: any[]
    topics_error: any
    questions_error: any
  }
  relationship_test: {
    topic: any
    questions: any[]
    error: any
  } | null
  potential_issues: {
    no_topics: boolean
    no_questions: boolean
    count_mismatch: boolean
    relationship_broken: boolean
  }
}

interface GovInfoTestResult {
  success: boolean
  message: string
  validation?: any
  testSearch?: any
  error?: string
}

export default function DebugDataPage() {
  const { user } = useAuth()
  const isAdmin = true // Simplified for debugging - middleware should protect this route
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null)
  const [govInfoResult, setGovInfoResult] = useState<GovInfoTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGovInfoLoading, setIsGovInfoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/debug-questions')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Diagnostics failed')
      }
      
      setDiagnostics(result.diagnostics)
    } catch (err) {
      console.error('Diagnostics error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const testGovInfoAPI = async () => {
    try {
      setIsGovInfoLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/govinfo/test')
      const result = await response.json()
      
      setGovInfoResult(result)
      
      if (!result.success) {
        console.error('GovInfo API test failed:', result.message)
      }
    } catch (err) {
      console.error('GovInfo API test error:', err)
      setGovInfoResult({
        success: false,
        message: 'Test request failed',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setIsGovInfoLoading(false)
    }
  }

  const runClientDiagnostics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Test direct queries
      console.log('Testing direct database queries...')
      
      // Get topics count
      const { count: topicsCount, error: topicsCountError } = await supabase
        .from('question_topics')
        .select('*', { count: 'exact', head: true })
      
      // Get questions count  
      const { count: questionsCount, error: questionsCountError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        
      // Get sample data
      const { data: sampleTopics, error: sampleTopicsError } = await supabase
        .from('question_topics')
        .select('id, topic_id, topic_title')
        .limit(3)
        
      const { data: sampleQuestions, error: sampleQuestionsError } = await supabase
        .from('questions')
        .select('id, topic_id, question, question_number')
        .limit(3)
        
      // Test relationship
      let relationshipTest = null
      if (sampleTopics && sampleTopics.length > 0) {
        const firstTopic = sampleTopics[0]
        const { data: relatedQuestions, error: relationshipError } = await supabase
          .from('questions')
          .select('id, question, question_number')
          .eq('topic_id', firstTopic.topic_id)
          .limit(3)
          
        relationshipTest = {
          topic: firstTopic,
          questions: relatedQuestions || [],
          error: relationshipError
        }
      }
      
      const clientDiagnostics: DiagnosticResult = {
        database_health: {
          topics_count: topicsCount,
          questions_count: questionsCount,
          topics_count_error: topicsCountError,
          questions_count_error: questionsCountError
        },
        sample_data: {
          topics: sampleTopics || [],
          questions: sampleQuestions || [],
          topics_error: sampleTopicsError,
          questions_error: sampleQuestionsError
        },
        relationship_test: relationshipTest,
        potential_issues: {
          no_topics: topicsCount === 0,
          no_questions: questionsCount === 0,
          count_mismatch: questionsCount === 1000,
          relationship_broken: relationshipTest ? relationshipTest.questions.length === 0 : false
        }
      }
      
      setDiagnostics(clientDiagnostics)
      
    } catch (err) {
      console.error('Client diagnostics error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center space-y-4">
            <div className="text-6xl">🚫</div>
            <h2 className="text-xl font-extralight text-slate-900 dark:text-white">Access Denied</h2>
            <p className="text-slate-600 dark:text-slate-400 font-light">Admin only</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 lg:p-12 rounded-3xl border border-white/20">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🔬</div>
                  <div>
                    <h1 className="text-3xl font-extralight text-slate-900 dark:text-white tracking-tight">
                      Database Diagnostics
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 font-light mt-2">
                      Debug questions and topics data issues
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <Button 
                  onClick={testGovInfoAPI}
                  disabled={isGovInfoLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-light rounded-2xl px-6 py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isGovInfoLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🏛️</span>
                      Test GovInfo API
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={runDiagnostics}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-light rounded-2xl px-6 py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🖥️</span>
                      Server Diagnostics
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={runClientDiagnostics}
                  disabled={isLoading}
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600 font-light rounded-2xl px-6 py-3 h-auto transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-transparent mr-2"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💻</span>
                      Client Diagnostics
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
            <Card className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-red-200/50 dark:border-red-800/50 rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-red-600 dark:text-red-400 font-light">
                  <span className="text-2xl">❌</span>
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 font-light">{error}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* GovInfo API Test Results */}
        {govInfoResult && (
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              govInfoResult.success 
                ? 'from-green-500/10 via-emerald-500/10 to-green-500/10' 
                : 'from-red-500/10 via-pink-500/10 to-red-500/10'
            } rounded-3xl blur-xl`}></div>
            <Card className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20 rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className={`flex items-center gap-3 font-light ${
                  govInfoResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <span className="text-2xl">{govInfoResult.success ? '✅' : '❌'}</span>
                  GovInfo API Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-2xl border ${
                  govInfoResult.success 
                    ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/50'
                    : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/50'
                }`}>
                  <p className={`font-light ${
                    govInfoResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {govInfoResult.message}
                  </p>
                  {govInfoResult.error && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-light">
                      Error: {govInfoResult.error}
                    </p>
                  )}
                </div>
                
                {govInfoResult.validation && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">Validation Details:</span>
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
                      <pre className="text-sm text-slate-600 dark:text-slate-400 font-mono overflow-auto">
                        {JSON.stringify(govInfoResult.validation, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {govInfoResult.testSearch && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">Search Test Results:</span>
                      <span className="text-sm font-light text-slate-600 dark:text-slate-400">
                        Found {govInfoResult.testSearch.found} packages
                      </span>
                    </div>
                    {govInfoResult.testSearch.sample && (
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-slate-900 dark:text-white">Sample Package:</span>
                            <span className="font-light text-slate-600 dark:text-slate-400">
                              {govInfoResult.testSearch.sample.title || govInfoResult.testSearch.sample.packageId}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-slate-900 dark:text-white">Package ID:</span>
                            <span className="font-light text-slate-600 dark:text-slate-400 font-mono">
                              {govInfoResult.testSearch.sample.packageId}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Database Diagnostics Results */}
        {diagnostics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Database Health */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-green-500/5 rounded-3xl blur-xl"></div>
              <Card className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20 rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 font-light">
                    <span className="text-2xl">🏥</span>
                    Database Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 dark:text-white">Topics Count:</span>
                      <span className="text-lg font-light">{diagnostics.database_health.topics_count ?? '❌'}</span>
                    </div>
                    {diagnostics.database_health.topics_count_error && (
                      <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                        <p className="text-red-600 dark:text-red-400 text-sm font-light">
                          Error: {JSON.stringify(diagnostics.database_health.topics_count_error)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 dark:text-white">Questions Count:</span>
                      <span className="text-lg font-light">{diagnostics.database_health.questions_count ?? '❌'}</span>
                    </div>
                    {diagnostics.database_health.questions_count_error && (
                      <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                        <p className="text-red-600 dark:text-red-400 text-sm font-light">
                          Error: {JSON.stringify(diagnostics.database_health.questions_count_error)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Potential Issues */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-yellow-500/5 rounded-3xl blur-xl"></div>
              <Card className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20 rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 font-light">
                    <span className="text-2xl">⚠️</span>
                    Potential Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="flex items-center gap-2">
                      <span>{diagnostics.potential_issues.no_topics ? '❌' : '✅'}</span>
                      <span className="font-light">No Topics</span>
                    </span>
                    <span className={`font-medium ${diagnostics.potential_issues.no_topics ? 'text-red-600' : 'text-green-600'}`}>
                      {diagnostics.potential_issues.no_topics ? 'YES' : 'NO'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="flex items-center gap-2">
                      <span>{diagnostics.potential_issues.no_questions ? '❌' : '✅'}</span>
                      <span className="font-light">No Questions</span>
                    </span>
                    <span className={`font-medium ${diagnostics.potential_issues.no_questions ? 'text-red-600' : 'text-green-600'}`}>
                      {diagnostics.potential_issues.no_questions ? 'YES' : 'NO'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="flex items-center gap-2">
                      <span>{diagnostics.potential_issues.count_mismatch ? '⚠️' : '✅'}</span>
                      <span className="font-light">Count at 1000 limit</span>
                    </span>
                    <span className={`font-medium ${diagnostics.potential_issues.count_mismatch ? 'text-yellow-600' : 'text-green-600'}`}>
                      {diagnostics.potential_issues.count_mismatch ? 'YES' : 'NO'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="flex items-center gap-2">
                      <span>{diagnostics.potential_issues.relationship_broken ? '❌' : '✅'}</span>
                      <span className="font-light">Relationship broken</span>
                    </span>
                    <span className={`font-medium ${diagnostics.potential_issues.relationship_broken ? 'text-red-600' : 'text-green-600'}`}>
                      {diagnostics.potential_issues.relationship_broken ? 'YES' : 'NO'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sample Topics */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-xl"></div>
              <Card className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20 rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 font-light">
                    <span className="text-2xl">📝</span>
                    Sample Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnostics.sample_data.topics_error ? (
                    <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                      <p className="text-red-600 dark:text-red-400 font-light">
                        Error: {JSON.stringify(diagnostics.sample_data.topics_error)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {diagnostics.sample_data.topics.map((topic, index) => (
                        <div key={index} className="p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">ID:</span>
                              <span className="font-light text-slate-600 dark:text-slate-400">{topic.topic_id}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">Title:</span>
                              <span className="font-light text-slate-600 dark:text-slate-400">{topic.topic_title}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sample Questions */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5 rounded-3xl blur-xl"></div>
              <Card className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20 rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 font-light">
                    <span className="text-2xl">❓</span>
                    Sample Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnostics.sample_data.questions_error ? (
                    <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                      <p className="text-red-600 dark:text-red-400 font-light">
                        Error: {JSON.stringify(diagnostics.sample_data.questions_error)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {diagnostics.sample_data.questions.map((question, index) => (
                        <div key={index} className="p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">Topic ID:</span>
                              <span className="font-light text-slate-600 dark:text-slate-400">{question.topic_id}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">Question:</span>
                              <span className="font-light text-slate-600 dark:text-slate-400">
                                {question.question?.substring(0, 100)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-white">Number:</span>
                              <span className="font-light text-slate-600 dark:text-slate-400">{question.question_number}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Relationship Test */}
            {diagnostics.relationship_test && (
              <div className="relative md:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-purple-500/5 rounded-3xl blur-xl"></div>
                <Card className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20 rounded-3xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 font-light">
                      <span className="text-2xl">🔗</span>
                      Relationship Test
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">Test Topic:</span>
                          <span className="font-light text-slate-600 dark:text-slate-400">
                            {diagnostics.relationship_test.topic.topic_title} ({diagnostics.relationship_test.topic.topic_id})
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 dark:text-white">Related Questions Found:</span>
                          <span className="text-lg font-light">{diagnostics.relationship_test.questions.length}</span>
                        </div>
                        
                        {diagnostics.relationship_test.error && (
                          <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                            <p className="text-red-600 dark:text-red-400 font-light">
                              Error: {JSON.stringify(diagnostics.relationship_test.error)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {diagnostics.relationship_test.questions.length > 0 && (
                        <div className="space-y-3">
                          {diagnostics.relationship_test.questions.map((question, index) => (
                            <div key={index} className="p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30">
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  #{question.question_number}:
                                </span>
                                <span className="font-light text-slate-600 dark:text-slate-400">
                                  {question.question?.substring(0, 100)}...
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 