"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Star,
  RefreshCw,
  TrendingUp,
  Eye,
  Share2,
  Bookmark,
  Filter,
  Search,
  ChevronDown,
  X
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { NewsQuizGenerator } from '@/components/admin/news-quiz-generator'
import { useToast } from '@/hooks/use-toast'
import {
  getOrCreateMediaOrganization,
  analyzeArticleBias,
  getMediaOrganizationByDomain,
  getBiasDimensions,
  formatBiasScore,
  getBiasColor,
  getCredibilityLevel,
  getArticleBiasAnalysis,
  BIAS_DIMENSIONS,
  type MediaOrganizationWithScores,
  type BiasDimension,
  type ArticleBiasAnalysis
} from '@/lib/media-bias-engine'
import { BiasAnalysisCard } from '@/components/news-ticker/bias-analysis-card'

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
  readTime?: number
  tags?: string[]
  engagement?: {
    views: number
    shares: number
    bookmarks: number
  }
  civicImpact?: {
    powerLevel: 'local' | 'state' | 'federal' | 'international'
    actionable: boolean
    urgency: 'low' | 'medium' | 'high' | 'critical'
  }
  organization?: MediaOrganizationWithScores
  database_id?: string | null
}

interface NewsFilters {
  search: string
  sources: string[]
  categories: string[]
  credibilityMin: number
  biasRating: string[]
  timeRange: '1h' | '6h' | '24h' | '7d' | 'all'
  sortBy: 'relevance' | 'date' | 'credibility' | 'engagement'
  civicImpact: string[]
}

interface NewsTickerProps {
  className?: string
  sources?: string[]
  categories?: string[]
  autoScroll?: boolean
  scrollSpeed?: number
  maxArticles?: number
  onArticleClick?: (article: NewsArticle) => void
  compact?: boolean
  showFilters?: boolean
  enableBookmarks?: boolean
  enableSharing?: boolean
  adminMode?: boolean
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

// Get bias indicator for compact display
function getBiasIndicator(organization?: MediaOrganizationWithScores, dimensionSlug?: string) {
  if (!organization?.bias_scores || organization.bias_scores.length === 0) return null
  
  const targetDimension = dimensionSlug || BIAS_DIMENSIONS.POLITICAL_LEAN
  const score = organization.bias_scores.find(s => s.dimension?.dimension_slug === targetDimension)
  
  if (!score?.dimension) return null
  
  return {
    score: score.current_score,
    label: formatBiasScore(score.current_score, score.dimension),
    color: getBiasColor(score.dimension, score.current_score),
    confidence: score.confidence_level
  }
}

// Enhanced article card with more metadata and actions
function EnhancedNewsCard({ 
  article, 
  onClick, 
  onBookmark, 
  onShare, 
  showAdminControls = false,
  dimensions 
}: { 
  article: NewsArticle
  onClick: () => void
  onBookmark?: (article: NewsArticle) => void
  onShare?: (article: NewsArticle) => void
  showAdminControls?: boolean
  dimensions?: BiasDimension[]
}) {
  const { toast } = useToast()
  const credibilityBadge = getCredibilityBadge(article.credibilityScore || article.organization?.transparency_score || undefined)
  const biasBadge = getBiasBadge(article.biasRating)
  const biasIndicator = getBiasIndicator(article.organization)
  const relativeTime = getRelativeTime(article.publishedAt)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ArticleBiasAnalysis | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsBookmarked(!isBookmarked)
    onBookmark?.(article)
    toast({
      title: isBookmarked ? "Bookmark removed" : "Article bookmarked",
      description: isBookmarked ? "Removed from your reading list" : "Added to your reading list"
    })
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url
      })
    } else {
      navigator.clipboard.writeText(article.url)
      toast({
        title: "Link copied",
        description: "Article URL copied to clipboard"
      })
    }
    onShare?.(article)
  }

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!article.organization || !article.database_id) {
      toast({
        title: "Unable to analyze",
        description: "Missing article metadata",
        variant: "destructive"
      })
      return
    }
    
    setIsAnalyzing(true)
    try {
      const result = await analyzeArticleBias(
        article.url, 
        article.organization.id, 
        article.database_id
      )
      
      if (result) {
        setAnalysis(result)
        setShowAnalysis(true)
        toast({
          title: "Analysis complete",
          description: "Here's what we found..."
        })
      } else {
        throw new Error("No analysis returned")
      }
    } catch (error) {
      console.error('Error analyzing article:', error)
      toast({
        title: "Analysis failed",
        description: "Could not analyze this article",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getCivicImpactBadge = (impact?: NewsArticle['civicImpact']) => {
    if (!impact) return null
    
    const colors = {
      local: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      state: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      federal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      international: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    
    const urgencyColors = {
      low: 'border-gray-300',
      medium: 'border-yellow-400',
      high: 'border-orange-400',
      critical: 'border-red-500'
    }
    
    return (
      <div className="flex items-center gap-1">
        <Badge 
          className={`text-xs px-2 py-0.5 ${colors[impact.powerLevel]} border ${urgencyColors[impact.urgency]}`}
        >
          {impact.powerLevel} • {impact.urgency}
        </Badge>
        {impact.actionable && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            <ArrowRight className="w-2 h-2 mr-1" />
            Action
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div 
      className="flex-shrink-0 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-4 transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 bg-white dark:bg-gray-800"
      style={{ 
        width: showAnalysis ? '600px' : '380px', 
        minWidth: showAnalysis ? '600px' : '380px', 
        maxWidth: showAnalysis ? '600px' : '380px',
        height: 'auto',
        minHeight: '300px'
      }}
      onClick={onClick}
    >
      {/* Enhanced thumbnail */}
      <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 relative mb-3">
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
            <Newspaper className="w-8 h-8" />
          </div>
        )}
        
        {/* Urgency indicator */}
        {article.civicImpact?.urgency === 'critical' && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Header with source and actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
            {article.source.name}
          </Badge>
          {/* Bias indicator */}
          {biasIndicator && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1"
                    style={{ 
                      borderColor: biasIndicator.color,
                      color: biasIndicator.color
                    }}
                  >
                    {biasIndicator.label.split(' ')[0]}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Political Lean: {biasIndicator.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Confidence: {(biasIndicator.confidence * 100).toFixed(0)}%
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {relativeTime && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {relativeTime}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleBookmark}
          >
            <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleShare}
          >
            <Share2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !article.organization}
            title="Analyze for bias"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Shield className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Title with reading time */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-sm leading-tight text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-3 flex-1">
          {article.title}
        </h4>
        {article.readTime && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
            {article.readTime}m
          </span>
        )}
      </div>
      
      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mb-3">
        {article.description}
      </p>

      {/* Civic impact indicator */}
      {article.civicImpact && (
        <div className="mb-3">
          {getCivicImpactBadge(article.civicImpact)}
        </div>
      )}
      
      {/* Author and engagement */}
      <div className="flex items-center justify-between mb-3">
        {article.author && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <User className="w-3 h-3 mr-1" />
            <span className="font-medium truncate max-w-[120px]">By {article.author}</span>
          </div>
        )}
        
        {article.engagement && (
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{article.engagement.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{article.engagement.shares}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Quality indicators */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {article.category || 'News'}
        </Badge>
        
        {credibilityBadge && (
          <Badge variant={credibilityBadge.variant} className="text-xs px-2 py-0.5">
            <credibilityBadge.icon className="w-3 h-3 mr-1" />
            {article.credibilityScore || article.organization?.transparency_score || 0}
          </Badge>
        )}
        
        {/* Legacy bias badge (if not using new system) */}
        {!biasIndicator && biasBadge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${biasBadge.color}`}>
            {biasBadge.text}
          </span>
        )}
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {article.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
              {tag}
            </Badge>
          ))}
          {article.tags.length > 3 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              +{article.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Globe className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{article.domain || new URL(article.url).hostname}</span>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-medium opacity-70 group-hover:opacity-100 transition-opacity">
          <Sparkles className="h-3 w-3" />
          <span>Quiz</span>
        </div>
      </div>
      
      {/* Admin controls */}
      {showAdminControls && (
        <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <NewsQuizGenerator article={article} />
        </div>
      )}
      
      {/* Bias Analysis */}
      {showAnalysis && analysis && dimensions && (
        <div className="mt-4">
          <BiasAnalysisCard 
            analysis={analysis} 
            dimensions={dimensions}
            onClose={() => setShowAnalysis(false)}
          />
        </div>
      )}
    </div>
  )
}

// Enhanced filters component
function NewsFilters({ 
  filters, 
  onFiltersChange, 
  availableSources, 
  availableCategories 
}: {
  filters: NewsFilters
  onFiltersChange: (filters: NewsFilters) => void
  availableSources: string[]
  availableCategories: string[]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Time Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select
                value={filters.timeRange}
                onValueChange={(value: NewsFilters['timeRange']) => 
                  onFiltersChange({ ...filters, timeRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last Week</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: NewsFilters['sortBy']) => 
                  onFiltersChange({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="credibility">Credibility</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Credibility Minimum */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Min Credibility: {filters.credibilityMin}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.credibilityMin}
                onChange={(e) => onFiltersChange({ ...filters, credibilityMin: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Civic Impact */}
            <div>
              <label className="text-sm font-medium mb-2 block">Civic Impact</label>
              <div className="space-y-2">
                {['local', 'state', 'federal', 'international'].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={level}
                      checked={filters.civicImpact.includes(level)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onFiltersChange({
                            ...filters,
                            civicImpact: [...filters.civicImpact, level]
                          })
                        } else {
                          onFiltersChange({
                            ...filters,
                            civicImpact: filters.civicImpact.filter(l => l !== level)
                          })
                        }
                      }}
                    />
                    <label htmlFor={level} className="text-sm capitalize">
                      {level}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active filters display */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onFiltersChange({ ...filters, search: '' })}
                />
              </Badge>
            )}
            {filters.credibilityMin > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Min Credibility: {filters.credibilityMin}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onFiltersChange({ ...filters, credibilityMin: 0 })}
                />
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Main component with all enhancements
export function NewsTicker({ 
  className, 
  sources = ['reuters', 'ap-news', 'politico'], 
  categories = ['politics', 'government'],
  autoScroll = true,
  scrollSpeed = 50,
  maxArticles = 20,
  onArticleClick,
  compact = false,
  showFilters = false,
  enableBookmarks = true,
  enableSharing = true,
  adminMode = false
}: NewsTickerProps) {
  const { user } = useAuth()
  const { hasFeatureAccess } = usePremium()
  const { toast } = useToast()
  
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScrolling, setIsScrolling] = useState(autoScroll)
  const [error, setError] = useState<string | null>(null)
  const [newsSource, setNewsSource] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dimensions, setDimensions] = useState<BiasDimension[]>([])
  const [filters, setFilters] = useState<NewsFilters>({
    search: '',
    sources: [],
    categories: [],
    credibilityMin: 0,
    biasRating: [],
    timeRange: '24h',
    sortBy: 'relevance',
    civicImpact: []
  })
  
  const tickerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load bias dimensions
  useEffect(() => {
    getBiasDimensions().then(setDimensions)
  }, [])

  // Helper function to calculate credibility score based on source reputation
  const calculateCredibilityScore = (sourceName: string): number => {
    const credibilityMap: Record<string, number> = {
      'Reuters': 95,
      'Associated Press': 95,
      'AP News': 95,
      'BBC': 90,
      'NPR': 88,
      'Politico': 85,
      'The Hill': 82,
      'Washington Post': 80,
      'New York Times': 80,
      'CNN': 75,
      'Fox News': 70,
      'NBC': 78,
      'Axios': 83,
      'USA Today': 75,
      'Rolling Stone': 72
    }
    
    // Find closest match
    for (const [source, score] of Object.entries(credibilityMap)) {
      if (sourceName.toLowerCase().includes(source.toLowerCase())) {
        return score
      }
    }
    
    return 70 // Default for unknown sources
  }

  // Enhanced news loading with bias information
  const loadNews = useCallback(async () => {
    const wasRefreshing = isRefreshing
    if (!wasRefreshing) setIsLoading(true)
    
    try {
      const params = new URLSearchParams({
        sources: sources.join(','),
        categories: categories.join(','),
        maxArticles: maxArticles.toString(),
        enhancedMetadata: 'true' // Request enhanced metadata
      })
      
      const response = await fetch(`/api/news/headlines?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`)
      }
      
      const data = await response.json()
      const articlesData = data.articles || []
      
      // Enhanced articles with additional metadata and bias info
      const enhancedArticles = await Promise.all(articlesData.map(async (article: NewsArticle) => {
        const domain = article.domain || new URL(article.url).hostname.replace('www.', '')
        
        // Try to get organization info
        let organization: MediaOrganizationWithScores | null = null
        try {
          organization = await getMediaOrganizationByDomain(domain)
        } catch (err) {
          console.error('Error fetching organization info:', err)
        }
        
        return {
          ...article,
          domain,
          readTime: estimateReadTime(article.description + ' ' + (article.content || '')),
          engagement: article.engagement || {
            views: Math.floor(Math.random() * 10000),
            shares: Math.floor(Math.random() * 500),
            bookmarks: Math.floor(Math.random() * 100)
          },
          civicImpact: article.civicImpact || generateCivicImpact(article.title + ' ' + article.description),
          organization,
          // Update credibility score from organization if available
          credibilityScore: article.credibilityScore || organization?.transparency_score || calculateCredibilityScore(article.source.name)
        }
      }))
      
      setArticles(enhancedArticles)
      setNewsSource(data.source || null)
      setError(null)
      
      toast({
        title: "News updated",
        description: `Loaded ${enhancedArticles.length} articles from ${data.source || 'multiple sources'}`
      })
      
    } catch (err) {
      setError('Failed to load news articles')
      console.error('Error loading news:', err)
      toast({
        title: "Error loading news",
        description: "Please check your connection and try again",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [sources, categories, maxArticles, isRefreshing, toast])

  // Filter articles based on current filters
  useEffect(() => {
    let filtered = [...articles]

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.description.toLowerCase().includes(searchTerm) ||
        article.source.name.toLowerCase().includes(searchTerm)
      )
    }

    // Credibility filter
    if (filters.credibilityMin > 0) {
      filtered = filtered.filter(article => 
        (article.credibilityScore || 0) >= filters.credibilityMin
      )
    }

    // Civic impact filter
    if (filters.civicImpact.length > 0) {
      filtered = filtered.filter(article => 
        article.civicImpact?.powerLevel && filters.civicImpact.includes(article.civicImpact.powerLevel)
      )
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date()
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }
      
      const cutoff = new Date(now.getTime() - timeRanges[filters.timeRange])
      filtered = filtered.filter(article => 
        new Date(article.publishedAt) >= cutoff
      )
    }

    // Sort articles
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case 'credibility':
          return (b.credibilityScore || 0) - (a.credibilityScore || 0)
        case 'engagement':
          return (b.engagement?.views || 0) - (a.engagement?.views || 0)
        case 'relevance':
        default:
          return (b.relevanceScore || 0) - (a.relevanceScore || 0)
      }
    })

    setFilteredArticles(filtered)
  }, [articles, filters])

  // Auto-scroll functionality
  useEffect(() => {
    if (isScrolling && tickerRef.current) {
      intervalRef.current = setInterval(() => {
        if (tickerRef.current) {
          tickerRef.current.scrollLeft += 1
          
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

  useEffect(() => {
    loadNews()
  }, [loadNews])

  // Helper functions
  const estimateReadTime = (text: string): number => {
    const wordsPerMinute = 200
    const words = text.split(' ').length
    return Math.ceil(words / wordsPerMinute)
  }

  const generateCivicImpact = (text: string): NewsArticle['civicImpact'] => {
    const lowerText = text.toLowerCase()
    
    let powerLevel: 'local' | 'state' | 'federal' | 'international' = 'local'
    if (lowerText.includes('federal') || lowerText.includes('congress') || lowerText.includes('supreme court')) {
      powerLevel = 'federal'
    } else if (lowerText.includes('state') || lowerText.includes('governor')) {
      powerLevel = 'state'
    } else if (lowerText.includes('international') || lowerText.includes('foreign')) {
      powerLevel = 'international'
    }

    const urgency: 'low' | 'medium' | 'high' | 'critical' = 
      lowerText.includes('urgent') || lowerText.includes('crisis') ? 'critical' :
      lowerText.includes('important') || lowerText.includes('significant') ? 'high' :
      lowerText.includes('concern') || lowerText.includes('issue') ? 'medium' : 'low'

    const actionable = lowerText.includes('vote') || lowerText.includes('contact') || 
                      lowerText.includes('petition') || lowerText.includes('action')

    return { powerLevel, urgency, actionable }
  }

  const handleBookmark = (article: NewsArticle) => {
    // Implement bookmark functionality
    console.log('Bookmarked:', article.title)
  }

  const handleShare = (article: NewsArticle) => {
    // Implement sharing analytics
    console.log('Shared:', article.title)
  }

  const handleArticleClick = (article: NewsArticle) => {
    onArticleClick?.(article)
  }

  const toggleScrolling = () => {
    setIsScrolling(!isScrolling)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadNews()
  }

  // Get unique sources and categories for filters
  const availableSources = [...new Set(articles.map(a => a.source.name))]
  const availableCategories = [...new Set(articles.map(a => a.category).filter((cat): cat is string => Boolean(cat)))]

  if (isLoading) {
    return (
      <Card className={cn("border-slate-200 dark:border-slate-700 shadow-sm", className)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Loading latest politics news...</span>
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

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Latest News</h3>
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">
            {filteredArticles.length} articles
          </Badge>
        </div>
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
          {filteredArticles.slice(0, 6).map((article) => (
            <EnhancedNewsCard
              key={article.id}
              article={article}
              onClick={() => handleArticleClick(article)}
              onBookmark={enableBookmarks ? handleBookmark : undefined}
              onShare={enableSharing ? handleShare : undefined}
              showAdminControls={adminMode}
              dimensions={dimensions}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Filters */}
        {showFilters && (
          <NewsFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableSources={availableSources}
            availableCategories={availableCategories}
          />
        )}

        {/* Main ticker */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Enhanced header */}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">Live Politics Ticker</span>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">
                    {filteredArticles.length} articles
                  </Badge>
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
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="font-medium">Refresh</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleScrolling}
                  className="flex items-center space-x-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
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
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Real-time US politics news from vetted sources • Updated continuously</span>
              {filters.search && (
                <Badge variant="secondary" className="ml-2">
                  Filtered by: {filters.search}
                </Badge>
              )}
            </p>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-0 pb-6">
            <div 
              ref={tickerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-6 bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-950/30"
              style={{ 
                scrollBehavior: 'smooth',
                minHeight: '400px'
              }}
            >
              {filteredArticles.map((article) => (
                <EnhancedNewsCard
                  key={article.id}
                  article={article}
                  onClick={() => handleArticleClick(article)}
                  onBookmark={enableBookmarks ? handleBookmark : undefined}
                  onShare={enableSharing ? handleShare : undefined}
                  showAdminControls={adminMode}
                  dimensions={dimensions}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Articles</p>
                <p className="text-2xl font-bold">{articles.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Avg Credibility</p>
                <p className="text-2xl font-bold">
                  {Math.round(articles.reduce((acc, a) => acc + (a.credibilityScore || 0), 0) / articles.length) || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">High Impact</p>
                <p className="text-2xl font-bold">
                  {articles.filter(a => a.civicImpact?.urgency === 'high' || a.civicImpact?.urgency === 'critical').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Actionable</p>
                <p className="text-2xl font-bold">
                  {articles.filter(a => a.civicImpact?.actionable).length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
} 