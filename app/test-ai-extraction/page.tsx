"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Brain, Loader2, CheckCircle, XCircle, 
  ExternalLink, User, Calendar, BookOpen,
  Sparkles, Globe, ArrowRight, Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ExtractionResult {
  success: boolean
  analysis: any
  civic_content_saved: {
    question_topics: { created: number, existing: number }
    public_figures: { created: number, existing: number }
    events: { created: number, existing: number }
  }
  insights: {
    overall_bias: string
    primary_concern: string
    civic_action: string
    share_message: string
  }
}

export default function TestAIExtractionPage() {
  const { toast } = useToast()
  const [articleUrl, setArticleUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sampleUrls = [
    "https://www.politico.com/news/2024/01/15/congress-budget-deal",
    "https://www.reuters.com/world/us/supreme-court-hears-case",
    "https://apnews.com/article/election-voting-rights",
    "https://www.npr.org/2024/01/15/climate-policy-update"
  ]

  const handleAnalyze = async () => {
    if (!articleUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter an article URL to analyze",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      // For demo purposes, we'll need organization_id and source_metadata_id
      // In production, these would be determined from the article URL
      const response = await fetch('/api/analyze-article-bias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleUrl: articleUrl.trim(),
          organizationId: 'demo-org-id', // Would be determined from URL domain
          sourceMetadataId: 'demo-source-id' // Would be created from article metadata
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Analysis failed')
      }

      const data: ExtractionResult = await response.json()
      setResult(data)
      
      toast({
        title: "Analysis Complete!",
        description: "Civic education content has been extracted and saved",
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Analysis error:', err)
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getTotalExtracted = (saved: ExtractionResult['civic_content_saved']) => {
    return saved.question_topics.created + saved.public_figures.created + saved.events.created
  }

  const getTotalExisting = (saved: ExtractionResult['civic_content_saved']) => {
    return saved.question_topics.existing + saved.public_figures.existing + saved.events.existing
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      <main className="w-full py-8">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                AI Content Extraction Test
              </h1>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Test the AI-powered extraction of civic education content from news articles
            </p>
          </div>

          {/* Input Section */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Article Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Article URL
                </label>
                <Input
                  placeholder="https://example.com/article"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  className="border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Try these sample URLs:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleUrls.map((url, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setArticleUrl(url)}
                      className="justify-start text-left h-auto p-3 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{url}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !articleUrl.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Article...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract Civic Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                      Analysis Failed
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-6">
              {/* Success Header */}
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-medium text-green-800 dark:text-green-200">
                        Content Successfully Extracted!
                      </h3>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        {getTotalExtracted(result.civic_content_saved)} new items created, {getTotalExisting(result.civic_content_saved)} existing items found
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extraction Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      Question Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Created:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          {result.civic_content_saved.question_topics.created}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Existing:</span>
                        <Badge variant="outline">
                          {result.civic_content_saved.question_topics.existing}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-purple-500" />
                      Public Figures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Created:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          {result.civic_content_saved.public_figures.created}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Existing:</span>
                        <Badge variant="outline">
                          {result.civic_content_saved.public_figures.existing}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-green-500" />
                      Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Created:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          {result.civic_content_saved.events.created}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Existing:</span>
                        <Badge variant="outline">
                          {result.civic_content_saved.events.existing}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Analysis Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                        Bias Assessment
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Overall bias: <span className="font-medium">{result.insights.overall_bias}</span>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Primary concern: <span className="font-medium">{result.insights.primary_concern}</span>
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                        Civic Action
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {result.insights.civic_action}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Next Steps
                      </h3>
                      <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                        <li>• Review extracted content in the <a href="/admin/ai-content" className="underline">admin panel</a></li>
                        <li>• Approve or reject public figures and topics</li>
                        <li>• Generate quiz questions from new topics</li>
                        <li>• Monitor bias analysis accuracy</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* How It Works */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>How AI Content Extraction Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Article Analysis
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI reads the full article and identifies bias, manipulation techniques, and factual claims
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Content Extraction
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Extracts question topics, public figures, and important events for civic education
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Database Integration
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Saves new content to the database with proper deduplication and source tracking
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
} 