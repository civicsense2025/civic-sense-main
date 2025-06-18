"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/auth/auth-provider'
import { usePremium } from '@/hooks/usePremium'
import { AIDeckBuilder } from '@/lib/ai-deck-builder'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Pause, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Newspaper,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Settings,
  User,
  Globe,
  Shield,
  Star
} from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage?: string
  publishedAt: string
  source: {
    id: string | null
    name: string
  }
  category?: string
  content?: string
  relevanceScore?: number
  credibilityScore?: number
  biasRating?: string
  domain?: string
  author?: string
}

interface NewsTickerProps {
  className?: string
  sources?: string[]
  categories?: string[]
  autoScroll?: boolean
  scrollSpeed?: number
  maxArticles?: number
}

const aiDeckBuilder = new AIDeckBuilder()

// Helper function to format dates
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    // Format as "MMM DD, YYYY" (e.g., "Jan 15, 2024")
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return null
  }
}

// Helper function to get relative time
function getRelativeTime(dateString: string | null): string | null {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  } catch {
    return null
  }
}

// Get credibility badge color based on score
function getCredibilityBadge(score?: number) {
  if (!score) return null
  
  if (score >= 90) return { variant: 'default' as const, icon: Shield, text: 'Highly Credible', color: 'text-green-600' }
  if (score >= 80) return { variant: 'secondary' as const, icon: Shield, text: 'Credible', color: 'text-blue-600' }
  if (score >= 70) return { variant: 'outline' as const, icon: Shield, text: 'Mixed', color: 'text-yellow-600' }
  return { variant: 'destructive' as const, icon: AlertCircle, text: 'Low Credibility', color: 'text-red-600' }
}

// Get bias badge color based on rating
function getBiasBadge(rating?: string) {
  if (!rating || rating === 'unknown') return null
  
  const biasMap: Record<string, { color: string, text: string }> = {
    'left': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Left Leaning' },
    'center-left': { color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300', text: 'Center-Left' },
    'center': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', text: 'Center' },
    'center-right': { color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300', text: 'Center-Right' },
    'right': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Right Leaning' },
  }
  
  return biasMap[rating] || null
}

// Compact News Article Card (styled like SourceMetadataCard with CivicSense design)
function CompactNewsCard({ article, onClick }: { article: NewsArticle, onClick: () => void }) {
  const credibilityBadge = getCredibilityBadge(article.credibilityScore)
  const biasBadge = getBiasBadge(article.biasRating)
  const relativeTime = getRelativeTime(article.publishedAt)
  
  return (
    <div
      className="flex-shrink-0 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-4 transition-all duration-200 min-w-[360px] max-w-[360px] border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 bg-white dark:bg-gray-800"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Article thumbnail/favicon area */}
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          {article.urlToImage ? (
            <img
              src={article.urlToImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Newspaper className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          {/* Source and time header */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              {article.source.name}
            </Badge>
            {relativeTime && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {relativeTime}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h4 className="font-semibold text-sm leading-tight text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
            {article.title}
          </h4>
          
          {/* Description */}
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mb-3">
            {article.description}
          </p>
          
          {/* Author if available */}
          {article.author && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              <User className="w-3 h-3 mr-1" />
              <span className="font-medium">By {article.author}</span>
            </div>
          )}
          
          {/* Metadata badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Category badge */}
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {article.category || 'News'}
              </Badge>
              
              {/* Credibility badge */}
              {credibilityBadge && (
                <Badge variant={credibilityBadge.variant} className="text-xs px-2 py-0.5">
                  <credibilityBadge.icon className="w-3 h-3 mr-1" />
                  {article.credibilityScore}
                </Badge>
              )}
              
              {/* Bias badge */}
              {biasBadge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${biasBadge.color}`}>
                  {biasBadge.text}
                </span>
              )}
            </div>
          </div>
          
          {/* Footer with domain and AI quiz hint */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{article.domain || new URL(article.url).hostname}</span>
            </div>
            
            {/* AI Quiz indicator */}
            <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-medium opacity-70 group-hover:opacity-100 transition-opacity">
              <Sparkles className="h-3 w-3" />
              <span>Quiz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mock news sources for demo - in production, these would come from actual news APIs
const MOCK_NEWS_SOURCES = [
  { id: 'reuters', name: 'Reuters', category: 'general' },
  { id: 'ap-news', name: 'Associated Press', category: 'general' },
  { id: 'politico', name: 'Politico', category: 'politics' },
  { id: 'npr', name: 'NPR', category: 'politics' },
  { id: 'cnn', name: 'CNN', category: 'general' },
  { id: 'bbc-news', name: 'BBC News', category: 'world' }
]

export function NewsTicker({ 
  className, 
  sources = ['reuters', 'ap-news', 'politico'], 
  categories = ['politics', 'government'],
  autoScroll = true,
  scrollSpeed = 50,
  maxArticles = 20
}: NewsTickerProps) {
  const { user } = useAuth()
  const { hasFeatureAccess } = usePremium()
  
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScrolling, setIsScrolling] = useState(autoScroll)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'analyzing' | 'generating' | 'complete' | 'error'>('idle')
  const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newsSource, setNewsSource] = useState<string | null>(null)
  
  const tickerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch news data from API
  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          sources: sources.join(','),
          categories: categories.join(','),
          maxArticles: maxArticles.toString()
        })
        
        const response = await fetch(`/api/news/headlines?${params}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.status}`)
        }
        
        const data = await response.json()
        const articlesData = data.articles || []
        
        // Enhance articles with domain extraction for display
        const enhancedArticles = articlesData.map((article: NewsArticle) => ({
          ...article,
          domain: article.domain || new URL(article.url).hostname.replace('www.', '')
        }))
        
        setArticles(enhancedArticles)
        setNewsSource(data.source || null)
        
        // Show informational message about news source
        if (data.source && data.message) {
          console.log(`📰 News Ticker using ${data.source}:`, data.message)
          
          // Show special badge for OpenAI-generated content
          if (data.source.includes('openai')) {
            console.log('✨ Live news powered by OpenAI web search')
          }
        }
      } catch (err) {
        setError('Failed to load news articles')
        console.error('Error loading news:', err)
        
        // Fallback to basic mock data
        const fallbackArticles: NewsArticle[] = [
          {
            id: 'fallback-1',
            title: 'Unable to Load Live News - Demo Mode',
            description: 'The news ticker is currently in demo mode. Please check your network connection or news API configuration.',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: { id: 'system', name: 'CivicSense' },
            category: 'system',
            content: 'This is a fallback message displayed when news cannot be loaded.',
            domain: 'civicsense.org'
          }
        ]
        setArticles(fallbackArticles)
      } finally {
        setIsLoading(false)
      }
    }

    loadNews()
  }, [sources, categories, maxArticles])

  // Auto-scroll functionality
  useEffect(() => {
    if (isScrolling && tickerRef.current) {
      intervalRef.current = setInterval(() => {
        if (tickerRef.current) {
          tickerRef.current.scrollLeft += 1
          
          // Reset scroll when reaching the end
          if (tickerRef.current.scrollLeft >= tickerRef.current.scrollWidth - tickerRef.current.clientWidth) {
            tickerRef.current.scrollLeft = 0
          }
        }
      }, scrollSpeed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isScrolling, scrollSpeed])

  const toggleScrolling = () => {
    setIsScrolling(!isScrolling)
  }

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article)
    setGenerationStatus('idle')
    setGeneratedQuizId(null)
  }

  const generateQuizFromArticle = async () => {
    if (!selectedArticle || !user) return

    if (!hasFeatureAccess('custom_decks')) {
      setError('AI quiz generation requires a Premium subscription')
      return
    }

    setIsGeneratingQuiz(true)
    setGenerationStatus('analyzing')
    setError(null)

    try {
      // Step 1: Analyze the article content
      setGenerationStatus('analyzing')
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate analysis

      // Step 2: Generate quiz content using existing AI system
      setGenerationStatus('generating')
      
      const deckRequest = {
        name: `News Quiz: ${selectedArticle.title.substring(0, 50)}...`,
        description: `AI-generated quiz based on: ${selectedArticle.description}`,
        targetQuestionCount: 10,
        categories: [selectedArticle.category || 'Current Events'],
        difficultyRange: [2, 4] as [number, number],
        learningObjective: 'Understand current events and their civic implications',
        timeConstraint: 15,
        focusAreas: ['Current Events', 'Policy Analysis', 'Government'],
        newsContext: {
          title: selectedArticle.title,
          content: selectedArticle.content || selectedArticle.description,
          source: selectedArticle.source.name,
          publishedAt: selectedArticle.publishedAt,
          credibilityScore: selectedArticle.credibilityScore,
          biasRating: selectedArticle.biasRating
        }
      }

      // Use the existing AI deck builder but with news content
      const aiDeck = await aiDeckBuilder.generateAIEnhancedDeck(user.id, deckRequest)
      
      // In a real implementation, you would save this as a question_topic and generate actual questions
      setGeneratedQuizId('mock-quiz-id-' + Date.now())
      setGenerationStatus('complete')
      
    } catch (err) {
      console.error('Error generating quiz:', err)
      setError('Failed to generate quiz. Please try again.')
      setGenerationStatus('error')
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("border-gray-200 dark:border-gray-700 shadow-sm", className)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Loading latest politics news...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && articles.length === 0) {
    return (
      <Card className={cn("border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20", className)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-3 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* News Ticker Header */}
      <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Live Politics Ticker</span>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                  {articles.length} articles
                </Badge>
                {newsSource?.includes('openai') && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white text-xs font-medium shadow-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                )}
                {newsSource?.includes('rss') && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium shadow-sm">
                    <Globe className="h-3 w-3 mr-1" />
                    Live RSS
                  </Badge>
                )}
              </div>
            </CardTitle>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleScrolling}
                className="flex items-center space-x-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {isScrolling ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span className="font-medium">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="font-medium">Play</span>
                  </>
                )}
              </Button>
              
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Subtitle with source info */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Real-time US politics news from vetted sources • Updated continuously</span>
          </p>
        </CardHeader>

        {/* Scrolling Ticker */}
        <CardContent className="p-0 pb-6">
          <div 
            ref={tickerRef}
            className="flex space-x-6 overflow-x-auto scrollbar-hide py-4 px-6 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-950/30"
            style={{ scrollBehavior: 'smooth' }}
          >
            {articles.map((article) => (
              <Dialog key={article.id}>
                <DialogTrigger asChild>
                  <div>
                    <CompactNewsCard 
                      article={article} 
                      onClick={() => handleArticleClick(article)} 
                    />
                  </div>
                </DialogTrigger>

                {/* Article Detail Dialog - Enhanced with metadata */}
                <DialogContent className="max-w-3xl max-h-[85vh] border-gray-200 dark:border-gray-700">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-left leading-tight text-xl font-bold text-gray-900 dark:text-gray-100 pr-8">
                      {article.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="max-h-[65vh] overflow-y-auto">
                    <div className="space-y-6">
                      {/* Enhanced article metadata */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 font-medium">
                            {article.source.name}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {getRelativeTime(article.publishedAt)}
                          </span>
                          {/* Credibility indicator */}
                          {article.credibilityScore && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <Shield className="w-3 h-3 mr-1" />
                              {article.credibilityScore}% credible
                            </Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 dark:hover:bg-blue-950">
                          <a href={article.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Read Full Article
                          </a>
                        </Button>
                      </div>

                      {/* Author and bias information */}
                      {(article.author || article.biasRating) && (
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 px-4">
                          {article.author && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              <span className="font-medium">By {article.author}</span>
                            </div>
                          )}
                          {article.biasRating && getBiasBadge(article.biasRating) && (
                            <div className="flex items-center">
                              <span className={`text-sm px-3 py-1 rounded-full font-medium ${getBiasBadge(article.biasRating)?.color}`}>
                                {getBiasBadge(article.biasRating)?.text}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator className="border-gray-200 dark:border-gray-700" />

                      {/* Article description */}
                      <div className="px-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                          {article.description}
                        </p>
                      </div>

                      {/* AI Quiz Generation Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mx-4">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI Quiz Generator</h4>
                              <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white text-xs font-medium mt-1">
                                Premium Feature
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Transform this news article into an interactive civic education quiz with AI-generated questions that test understanding of political processes and implications.
                          </p>

                          {/* Generation Status */}
                          {generationStatus !== 'idle' && (
                            <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-3">
                                {generationStatus === 'analyzing' && (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    <span className="text-sm font-medium">Analyzing article content...</span>
                                  </>
                                )}
                                {generationStatus === 'generating' && (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                                    <span className="text-sm font-medium">Generating civic education questions...</span>
                                  </>
                                )}
                                {generationStatus === 'complete' && (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium">Quiz generated successfully!</span>
                                  </>
                                )}
                                {generationStatus === 'error' && (
                                  <>
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium">Generation failed. Please try again.</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            {generationStatus === 'complete' && generatedQuizId ? (
                              <Button size="sm" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Start Quiz
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={generateQuizFromArticle}
                                disabled={isGeneratingQuiz || !hasFeatureAccess('custom_decks')}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium disabled:opacity-50"
                              >
                                {isGeneratingQuiz ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Quiz
                                  </>
                                )}
                              </Button>
                            )}
                            
                            <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              ~10 min
                            </Button>
                          </div>

                          {!hasFeatureAccess('custom_decks') && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              AI quiz generation requires a Premium subscription. 
                              <Button variant="link" className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400 underline ml-1 font-medium">
                                Upgrade now
                              </Button>
                            </p>
                          )}

                          {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg border border-red-200 dark:border-red-800">
                              {error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 