"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from './ui/card'
import { Globe } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  description: string | null
  url: string
  domain: string
  published_time: string | null
  og_description: string | null
  og_title: string | null
  og_image: string | null
  credibility_score: number | null
  is_active: boolean | null
  author: string | null
}

interface NewsTickerProps {
  sources?: string[]
  categories?: string[]
  maxArticles?: number
  onArticleClick?: (article: NewsArticle) => void
  compact?: boolean
  titleLineLimit?: number
}

// Helper function to diversify sources (avoid consecutive articles from same source)
function diversifySources(articles: NewsArticle[]): NewsArticle[] {
  if (articles.length <= 1) return articles

  // Group articles by domain
  const sourceGroups = articles.reduce((groups, article) => {
    const domain = article.domain
    if (!groups[domain]) {
      groups[domain] = []
    }
    groups[domain].push(article)
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
      if (!sourceArticles) continue
      
      const currentIndex = sourceIndices[sourceName] || 0
      if (currentIndex < sourceArticles.length) {
        const article = sourceArticles[currentIndex]
        if (article) {
          diversifiedArticles.push(article)
          sourceIndices[sourceName] = currentIndex + 1
          totalProcessed++
          addedInThisRound++
        }
      }
    }

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

export const NewsTicker: React.FC<NewsTickerProps> = ({
  sources = ['reuters', 'ap-news', 'politico'],
  categories = ['politics', 'government'],
  maxArticles = 20,
  onArticleClick,
  compact = false,
  titleLineLimit = 2,
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // News loading
  const loadNews = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
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
      const newsData = data.articles || []
      
      // Transform the data to match the NewsArticle interface
      const transformedNews: NewsArticle[] = newsData.map((item: any) => ({
        id: item.id.toString(),
        title: item.og_title || item.title || 'No title available',
        description: item.og_description || item.description || null,
        url: item.url,
        domain: item.domain || new URL(item.url).hostname.replace('www.', ''),
        published_time: item.publishedAt || item.published_time,
        og_description: item.og_description,
        og_title: item.og_title,
        og_image: item.og_image,
        credibility_score: item.credibility_score,
        is_active: item.is_active,
        author: item.author
      }))
      
      setArticles(diversifySources(transformedNews))
    } catch (error) {
      console.error('Error loading news:', error)
      setError('Failed to load news')
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }, [sources, categories, maxArticles])

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    )
  }

  if (error && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-600 dark:text-slate-400">
        {error}
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide h-full py-3 px-4"
        style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
        }}
      >
        {articles.map((article) => (
          <Card
            key={article.id}
            className="flex-shrink-0 cursor-pointer border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
            style={{ width: compact ? '260px' : '320px' }}
            onClick={() => handleArticleClick(article)}
          >
            <CardContent className={compact ? "p-3" : "p-4"}>
              <div className="space-y-2">
                <h4 className={`font-medium text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${compact ? "text-xs" : "text-sm"} line-clamp-${titleLineLimit}`}>
                  {article.title}
                </h4>
                
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Globe className="w-3 h-3" />
                    <span className="truncate font-light font-mono max-w-[100px]">{article.domain}</span>
                  </div>
                  
                  {article.published_time && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-light font-mono">
                      {getRelativeTime(article.published_time)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent pointer-events-none" />
    </div>
  )
} 