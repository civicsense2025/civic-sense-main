'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle, Eye, Link, Search, Zap } from 'lucide-react'

interface DuplicationWarning {
  content_type: string
  existing_content: {
    id: string
    title: string
    content: string
    type: string
  }
  similarity_score: number
  warning_level: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  suggested_action: string
}

interface AnalysisResult {
  relationships_found: number
  duplication_warnings: DuplicationWarning[]
  items_analyzed: number
}

export default function ContentRelationshipsPage() {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [duplicateCheck, setDuplicateCheck] = useState({
    type: 'question_topic',
    title: '',
    content: '',
    categories: ''
  })
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicationWarning[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCheckingDuplication, setIsCheckingDuplication] = useState(false)

  const runFullAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/admin/content-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_all' })
      })
      
      const data = await response.json()
      if (data.success) {
        setAnalysisResults(data.result)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const checkDuplication = async () => {
    if (!duplicateCheck.title || !duplicateCheck.content) return
    
    setIsCheckingDuplication(true)
    try {
      const response = await fetch('/api/admin/content-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_duplication',
          content: {
            type: duplicateCheck.type,
            title: duplicateCheck.title,
            content: duplicateCheck.content,
            categories: duplicateCheck.categories.split(',').map(c => c.trim()).filter(Boolean)
          }
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setDuplicateWarnings(data.warnings || [])
      }
    } catch (error) {
      console.error('Duplication check failed:', error)
    } finally {
      setIsCheckingDuplication(false)
    }
  }

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getWarningIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium': return <Eye className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Relationship AI Agent</h1>
        <p className="text-gray-600">
          Analyze content relationships and prevent duplication across your CivicSense knowledge base
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview & Analysis</TabsTrigger>
          <TabsTrigger value="duplication">Duplication Check</TabsTrigger>
          <TabsTrigger value="relationships">Content Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Items</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisResults?.items_analyzed || '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all content types
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relationships Found</CardTitle>
                <Link className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisResults?.relationships_found || '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Semantic connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duplicate Warnings</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisResults?.duplication_warnings?.length || '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Content needing review
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Run Full Content Analysis
              </CardTitle>
              <CardDescription>
                Analyze all content to find relationships and detect potential duplications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runFullAnalysis} 
                disabled={isAnalyzing}
                className="w-full md:w-auto"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </CardContent>
          </Card>

          {analysisResults?.duplication_warnings && analysisResults.duplication_warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Duplication Warnings</CardTitle>
                <CardDescription>
                  Content that may be too similar to existing items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.duplication_warnings.map((warning, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getWarningIcon(warning.warning_level)}
                          <span className="font-medium">{warning.existing_content.title}</span>
                        </div>
                        <Badge variant={getWarningColor(warning.warning_level) as any}>
                          {warning.similarity_score}% similar
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{warning.recommendation}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{warning.content_type}</Badge>
                        <Badge variant="outline">{warning.suggested_action}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="duplication">
          <Card>
            <CardHeader>
              <CardTitle>Check for Duplicate Content</CardTitle>
              <CardDescription>
                Test if new content would duplicate existing material before creating it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={duplicateCheck.type} onValueChange={(value) => 
                    setDuplicateCheck(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question_topic">Question Topic</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="glossary_term">Glossary Term</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="public_figure">Public Figure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categories">Categories (comma-separated)</Label>
                  <Input
                    id="categories"
                    value={duplicateCheck.categories}
                    onChange={(e) => setDuplicateCheck(prev => ({ ...prev, categories: e.target.value }))}
                    placeholder="government, policy, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={duplicateCheck.title}
                  onChange={(e) => setDuplicateCheck(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter the title of your proposed content"
                />
              </div>

              <div>
                <Label htmlFor="content">Content/Description</Label>
                <Textarea
                  id="content"
                  value={duplicateCheck.content}
                  onChange={(e) => setDuplicateCheck(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the full content or description"
                  rows={4}
                />
              </div>

              <Button 
                onClick={checkDuplication} 
                disabled={isCheckingDuplication || !duplicateCheck.title || !duplicateCheck.content}
                className="w-full md:w-auto"
              >
                {isCheckingDuplication ? 'Checking...' : 'Check for Duplicates'}
              </Button>

              {duplicateWarnings.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Duplication Analysis Results</h3>
                  <div className="space-y-4">
                    {duplicateWarnings.map((warning, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getWarningIcon(warning.warning_level)}
                            <span className="font-medium">{warning.existing_content.title}</span>
                          </div>
                          <Badge variant={getWarningColor(warning.warning_level) as any}>
                            {warning.similarity_score}% similar
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{warning.recommendation}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{warning.suggested_action}</Badge>
                          <Badge variant="outline">{warning.warning_level} priority</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {duplicateWarnings.length === 0 && duplicateCheck.title && duplicateCheck.content && !isCheckingDuplication && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-800">No significant duplications found!</span>
                  </div>
                  <p className="text-green-700 mt-2">
                    This content appears to be unique and can be safely created.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle>Content Relationships</CardTitle>
              <CardDescription>
                Semantic connections between your content pieces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Content relationship visualization and management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 