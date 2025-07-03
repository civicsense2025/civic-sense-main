"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '../../utils'
import { 
  Play, 
  Pause, 
  ExternalLink, 
  Clock, 
  Newspaper,
  AlertCircle,
  Loader2,
  RefreshCw,
  Globe
} from 'lucide-react'
import { useToast } from "../components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"

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
  domain?: string
  relevanceScore?: number
}

interface NewsTickerProps {
  className?: string
  sources?: string[]
  categories?: string[]
  autoScroll?: boolean
  scrollSpeed?: number
  maxArticles?: number
  onArticleClick?: (article: NewsArticle) => void
  showHeader?: boolean
  showControls?: boolean
  showStats?: boolean
  compact?: boolean
  titleLineLimit?: number
}

// Helper function to diversify sources (avoid consecutive articles from same source)
function diversifySources(articles: NewsArticle[]): NewsArticle[] {
  if (articles.length <= 1) return articles

  // Group articles by source
  const sourceGroups = articles.reduce((groups, article) => {
    const sourceName = article.source.name
    if (!groups[sourceName]) {
      groups[sourceName] = []
    }
    groups[sourceName].push(article)
    return groups
  }, {} as Record<string, NewsArticle[]>)

  const sourceNames = Object.keys(sourceGroups)
  const diversifiedArticles: NewsArticle[] = []
  const sourceIndices = sourceNames.reduce((indices, name) => {
    indices[name] = 0
    return indices
  }, {} as Record<string, number>)

  // Round-robin through sources
  let totalProcessed = 0
  while (totalProcessed < articles.length) {
    let addedInThisRound = 0

    for (const sourceName of sourceNames) {
      const sourceArticles = sourceGroups[sourceName]
      const currentIndex = sourceIndices[sourceName]
      
      if (currentIndex < sourceArticles.length) {
        diversifiedArticles.push(sourceArticles[currentIndex])
        sourceIndices[sourceName]++
        totalProcessed++
        addedInThisRound++
      }
    }

    // If no articles were added in this round, we're done
    if (addedInThisRound === 0) break
  }

  return diversifiedArticles
}

// Helper function to get relative time
function getRelativeTime(dateString: string | null): string | null {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

// Compact news card component
function CompactNewsCard({ 
  article, 
  onClick,
  compact = false,
  titleLineLimit = 2
}: { 
  article: NewsArticle
  onClick: () => void
  compact?: boolean
  titleLineLimit?: number
}) {
  const relativeTime = getRelativeTime(article.publishedAt)
  const domain = article.domain || new URL(article.url).hostname.replace('www.', '')

  // Generate line-clamp class based on titleLineLimit
  const lineClampClass = `line-clamp-${titleLineLimit}`

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "flex-shrink-0 cursor-pointer border border-slate-200 dark:border-slate-800",
              "hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200",
              "hover:shadow-sm group"
            )}
            style={{ 
              width: compact ? '260px' : '320px', 
              minWidth: compact ? '260px' : '320px'
            }}
            onClick={onClick}
          >
            <CardContent className={compact ? "p-3" : "p-4"}>
              <div className={compact ? "space-y-2" : "space-y-3"}>
                {/* Title */}
                <h4 className={cn(
                  "font-medium text-slate-900 dark:text-white leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors",
                  compact ? "text-xs" : "text-sm",
                  lineClampClass
                )}>
                  {article.title}
                </h4>
                
                {/* Description */}
                {article.description && !compact && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-light leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                )}
                
                {/* Footer - domain and time */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Globe className="w-3 h-3" />
                    <span className={cn("truncate font-light font-mono", compact ? "max-w-[100px]" : "max-w-[140px]")}>{domain}</span>
                  </div>
                  
                  {relativeTime && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-light font-mono">
                      {relativeTime}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-sm p-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-700 dark:border-slate-300"
          sideOffset={5}
        >
          <div className="space-y-2">
            <h4 className="font-medium text-sm leading-tight">
              {article.title}
            </h4>
            {article.description && (
              <p className="text-xs opacity-90 leading-relaxed">
                {article.description}
              </p>
            )}
            <div className="text-xs opacity-75 font-light font-mono">
              {article.source.name} • {relativeTime}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// News card skeleton component
function NewsCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card 
      className="flex-shrink-0 border border-slate-200 dark:border-slate-800"
      style={{ 
        width: compact ? '260px' : '320px', 
        minWidth: compact ? '260px' : '320px'
      }}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className={compact ? "space-y-2" : "space-y-3"}>
          {/* Title skeleton */}
          <div className="space-y-2">
            <Skeleton className={compact ? "h-3 w-full" : "h-4 w-full"} />
            <Skeleton className={compact ? "h-3 w-4/5" : "h-4 w-3/4"} />
            {!compact && <Skeleton className="h-3 w-2/3" />}
          </div>
          
          {/* Description skeleton (only for non-compact) */}
          {!compact && (
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          )}
          
          {/* Footer skeleton */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main component
export function NewsTicker({ 
  className, 
  sources = ['reuters', 'ap-news', 'politico'], 
  categories = ['politics', 'government'],
  autoScroll = true,
  scrollSpeed = 30,
  maxArticles = 20,
  onArticleClick,
  showHeader = true,
  showControls = true,
  showStats = true,
  compact = false,
  titleLineLimit = 2
}: NewsTickerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScrolling, setIsScrolling] = useState(autoScroll)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newsSource, setNewsSource] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState<boolean>(false)
  
  const tickerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<number | null>(null)

  // News loading
  const loadNews = useCallback(async () => {
    const wasRefreshing = isRefreshing
    if (!wasRefreshing) setIsLoading(true)
    
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
      
      // Enhanced articles with domain info
      const enhancedArticles = articlesData.map((article: NewsArticle) => ({
        ...article,
        domain: article.domain || new URL(article.url).hostname.replace('www.', '')
      }))
      
      setArticles(diversifySources(enhancedArticles))
      setNewsSource(data.source || null)
      setFromCache(data.fromCache || false)
      setError(null)
      
      if (wasRefreshing && showControls) {
        const cacheStatus = data.fromCache ? ' (cached)' : ' (fresh)'
        toast({
          title: "News updated",
          description: `Loaded ${enhancedArticles.length} articles${cacheStatus}`
        })
      }
      
    } catch (err) {
      setError('Failed to load news articles')
      console.error('Error loading news:', err)
      if (wasRefreshing && showControls) {
        toast({
          title: "Error loading news",
          description: "Please check your connection and try again",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [sources, categories, maxArticles, isRefreshing, toast, showControls])

  // Auto-scroll functionality
  useEffect(() => {
    if (isScrolling && tickerRef.current && articles.length > 0) {
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
  }, [isScrolling, scrollSpeed, articles.length])

  useEffect(() => {
    loadNews()
  }, [loadNews])

  const handleArticleClick = (article: NewsArticle) => {
    if (onArticleClick) {
      onArticleClick(article)
    } else {
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }

  const toggleScrolling = () => {
    setIsScrolling(!isScrolling)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadNews()
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-48 h-6" />
          </div>
        )}
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <NewsCardSkeleton key={i} compact={compact} />
          ))}
        </div>
      </div>
    )
  }

  if (error && articles.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-950/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Latest News
            </h2>
          </div>
        )}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-light">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/20 rounded-full flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Latest Politics News
            </h2>
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-light">
              {articles.length} articles
            </Badge>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 font-light"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleScrolling}
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 font-light"
              >
                {isScrolling ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* News ticker */}
      <div className="relative">
        <div 
          ref={tickerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide py-2"
          style={{ 
            scrollBehavior: isScrolling ? 'auto' : 'smooth',
            maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
          }}
        >
          {articles.map((article) => (
            <CompactNewsCard
              key={article.id}
              article={article}
              onClick={() => handleArticleClick(article)}
              compact={compact}
              titleLineLimit={titleLineLimit}
            />
          ))}
          
          {/* Duplicate articles for seamless loop when auto-scrolling */}
          {isScrolling && articles.map((article) => (
            <CompactNewsCard
              key={`duplicate-${article.id}`}
              article={article}
              onClick={() => handleArticleClick(article)}
              compact={compact}
              titleLineLimit={titleLineLimit}
            />
          ))}
        </div>
        
        {/* Gradient overlays for smooth edges */}
        <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white dark:from-slate-950 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none z-10" />
      </div>
      
      {/* Simple stats */}
      {showStats && (
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-light">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${fromCache ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <span>{fromCache ? 'Cached' : 'Live'} updates from {new Set(articles.map(a => a.source.name)).size} sources</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Updated {isRefreshing ? 'now' : (fromCache ? 'recently' : 'continuously')}</span>
          </div>
          {newsSource && (
            <div className="flex items-center gap-1.5 text-xs">
              <span>•</span>
              <span className={fromCache ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}>
                {fromCache ? 'Cache' : newsSource.includes('rss') ? 'RSS' : 'Live'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 