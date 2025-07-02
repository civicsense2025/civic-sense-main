'use client'

import { useState, useEffect } from 'react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { Progress } from '@civicsense/ui-web/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@civicsense/ui-web/components/ui/tabs'
import { Loader2, AlertCircle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@civicsense/ui-web/components/ui/alert'

export default function TestMediaBiasAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topicAnalysis, setTopicAnalysis] = useState<any>(null)
  const [allTopicsAnalysis, setAllTopicsAnalysis] = useState<any>(null)
  const [selectedTopicId, setSelectedTopicId] = useState('2025-media-bias-detection-fundamentals')

  const testTopics = [
    { id: '2025-media-bias-detection-fundamentals', name: 'Media Bias Detection Fundamentals' },
    { id: '2025-04-08-approval-ratings-historic-drop', name: 'Presidential Approval Ratings' },
    { id: '2025-06-11-leavitt-auto-pen-investigation-dodge', name: 'Press Secretary Investigation' }
  ]

  async function analyzeTopic(topicId: string) {
    setLoading(true)
    setError(null)
    setTopicAnalysis(null)

    try {
      const response = await fetch(`/api/quiz/media-bias-analysis?topicId=${topicId}`)
      if (!response.ok) throw new Error('Failed to analyze topic')
      
      const data = await response.json()
      setTopicAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function analyzeAllTopics() {
    setLoading(true)
    setError(null)
    setAllTopicsAnalysis(null)

    try {
      const response = await fetch('/api/quiz/media-bias-analysis?all=true')
      if (!response.ok) throw new Error('Failed to analyze topics')
      
      const data = await response.json()
      setAllTopicsAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function getBiasColor(score: number, dimension: string): string {
    if (dimension === 'political_lean') {
      if (score < -66) return 'bg-blue-600'
      if (score < -33) return 'bg-blue-500'
      if (score < 33) return 'bg-gray-500'
      if (score < 66) return 'bg-red-500'
      return 'bg-red-600'
    }
    
    if (dimension === 'factual_accuracy') {
      if (score >= 90) return 'bg-green-600'
      if (score >= 75) return 'bg-green-500'
      if (score >= 60) return 'bg-yellow-500'
      return 'bg-red-500'
    }
    
    return 'bg-gray-500'
  }

  function getPoliticalLeanLabel(score: number): string {
    if (score < -66) return 'Far Left'
    if (score < -33) return 'Left'
    if (score < 33) return 'Center'
    if (score < 66) return 'Right'
    return 'Far Right'
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Media Bias Analysis Test</h1>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Test Page</AlertTitle>
        <AlertDescription>
          This page demonstrates the media bias analysis functionality for quiz topics.
          It analyzes the sources cited in quiz questions to assess political balance and diversity.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="single" className="mb-6">
        <TabsList>
          <TabsTrigger value="single">Single Topic Analysis</TabsTrigger>
          <TabsTrigger value="all">All Topics Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Single Topic</CardTitle>
              <CardDescription>
                Select a topic to analyze its source diversity and bias patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="flex-1 p-2 border rounded"
                >
                  {testTopics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={() => analyzeTopic(selectedTopicId)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Topic'
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {topicAnalysis && (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{topicAnalysis.totalQuestions}</div>
                        <p className="text-xs text-muted-foreground">Total Questions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{topicAnalysis.sourcedQuestions}</div>
                        <p className="text-xs text-muted-foreground">Questions with Sources</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{topicAnalysis.uniqueSources}</div>
                        <p className="text-xs text-muted-foreground">Unique Sources</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {topicAnalysis.diversityMetrics.politicalBalance.toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Political Balance</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Diversity Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Diversity Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Political Balance</span>
                          <span className="text-sm font-medium">
                            {topicAnalysis.diversityMetrics.politicalBalance.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={topicAnalysis.diversityMetrics.politicalBalance} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Average Factual Accuracy</span>
                          <span className="text-sm font-medium">
                            {topicAnalysis.diversityMetrics.factualAccuracyAvg.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={topicAnalysis.diversityMetrics.factualAccuracyAvg} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Political Diversity (Std Dev)</span>
                          <span className="text-sm font-medium">
                            {topicAnalysis.diversityMetrics.politicalDiversity.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Average Sensationalism</span>
                          <span className="text-sm font-medium">
                            {topicAnalysis.diversityMetrics.sensationalismAvg.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={topicAnalysis.diversityMetrics.sensationalismAvg} 
                          className="bg-orange-100"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Source Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Source Analysis</CardTitle>
                      <CardDescription>
                        Bias scores for sources cited in this topic
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {topicAnalysis.sourceAnalysis.map((source: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{source.name}</h4>
                                <p className="text-sm text-muted-foreground">{source.domain}</p>
                              </div>
                              {source.organization && (
                                <Badge variant="outline">
                                  {source.organization.organization_type}
                                </Badge>
                              )}
                            </div>
                            
                            {source.biasScores && (
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                {source.biasScores.political_lean !== undefined && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Political Lean</p>
                                    <Badge className={getBiasColor(source.biasScores.political_lean, 'political_lean')}>
                                      {getPoliticalLeanLabel(source.biasScores.political_lean)}
                                    </Badge>
                                  </div>
                                )}
                                {source.biasScores.factual_accuracy !== undefined && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Factual Accuracy</p>
                                    <Badge className={getBiasColor(source.biasScores.factual_accuracy, 'factual_accuracy')}>
                                      {source.biasScores.factual_accuracy}%
                                    </Badge>
                                  </div>
                                )}
                                {source.biasScores.sensationalism !== undefined && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Sensationalism</p>
                                    <Badge variant="outline">
                                      {source.biasScores.sensationalism}%
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {!source.organization && (
                              <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  No bias data available for this source
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {topicAnalysis.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Analyze All Topics</CardTitle>
              <CardDescription>
                Get an overview of source diversity across all quiz topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={analyzeAllTopics}
                disabled={loading}
                className="mb-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing All Topics...
                  </>
                ) : (
                  'Analyze All Topics'
                )}
              </Button>

              {allTopicsAnalysis && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Topics Analyzed</p>
                          <p className="text-2xl font-bold">{allTopicsAnalysis.totalTopics}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Political Balance</p>
                          <p className="text-2xl font-bold">
                            {allTopicsAnalysis.averageMetrics.politicalBalance.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Factual Accuracy</p>
                          <p className="text-2xl font-bold">
                            {allTopicsAnalysis.averageMetrics.factualAccuracyAvg.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Topics Needing Improvement */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Topics Needing Source Diversity Improvement</CardTitle>
                      <CardDescription>
                        Topics sorted by lowest diversity scores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {allTopicsAnalysis.topics.slice(0, 10).map((topic: any) => (
                          <div key={topic.topicId} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium">{topic.topicTitle}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {topic.sourcedQuestions}/{topic.totalQuestions} questions with sources • 
                                  {topic.uniqueSources} unique sources
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge 
                                  variant={topic.diversityMetrics.politicalBalance > 70 ? 'default' : 'destructive'}
                                >
                                  Balance: {topic.diversityMetrics.politicalBalance.toFixed(0)}%
                                </Badge>
                                <Badge 
                                  variant={topic.diversityMetrics.factualAccuracyAvg > 80 ? 'default' : 'secondary'}
                                >
                                  Accuracy: {topic.diversityMetrics.factualAccuracyAvg.toFixed(0)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">Top recommendation:</p>
                              <p className="text-sm">{topic.recommendations[0]}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 