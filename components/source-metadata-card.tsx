"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface SourceMetadata {
  title: string
  description: string
  domain: string
  url: string
  image?: string | null
  siteName?: string | null
  type?: string | null
  favicon?: string | null
  canonicalUrl?: string | null
  author?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
  keywords?: string[]
  language?: string | null
}

interface Source {
  name: string
  url: string
}

interface SourceMetadataCardProps {
  source: Source
  className?: string
  showThumbnail?: boolean
  compact?: boolean
}

// Cache for storing processed metadata
const metadataCache = new Map<string, { data: SourceMetadata; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

// Utility function to fetch meta information from URLs
async function fetchSourceMetadata(url: string): Promise<SourceMetadata> {
  try {
    const response = await fetch('/api/fetch-meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title,
        description: data.description,
        domain: data.domain,
        url: data.url,
        image: data.image,
        siteName: data.siteName,
        type: data.type,
        favicon: data.favicon,
        canonicalUrl: data.canonicalUrl,
        author: data.author,
        publishedTime: data.publishedTime,
        modifiedTime: data.modifiedTime,
        keywords: data.keywords,
        language: data.language
      }
    } else {
      throw new Error(`API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Error fetching source metadata:', error)
    
    // Fallback to basic URL parsing
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace('www.', '')
      
      return {
        title: domain.charAt(0).toUpperCase() + domain.slice(1),
        description: `Visit ${domain} for more information`,
        domain,
        url,
        siteName: domain.charAt(0).toUpperCase() + domain.slice(1)
      }
    } catch {
      return {
        title: url,
        description: 'External source',
        domain: url,
        url
      }
    }
  }
}

export function SourceMetadataCard({ 
  source, 
  className, 
  showThumbnail = true, 
  compact = false 
}: SourceMetadataCardProps) {
  const [metadata, setMetadata] = useState<SourceMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const loadMetadata = async () => {
      // Check cache first
      const cached = metadataCache.get(source.url)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Using cached metadata for ${source.url}`)
        setMetadata(cached.data)
        return
      }

      setIsLoading(true)
      console.log(`Fetching metadata for: ${source.url}`)

      try {
        const fetchedMetadata = await fetchSourceMetadata(source.url)
        metadataCache.set(source.url, { data: fetchedMetadata, timestamp: Date.now() })
        setMetadata(fetchedMetadata)
        console.log(`Successfully fetched metadata for ${source.url}:`, fetchedMetadata)
      } catch (error) {
        console.error(`Error fetching metadata for ${source.url}:`, error)
        // Fallback metadata
        const fallbackMetadata: SourceMetadata = {
          title: source.name,
          description: 'External source',
          domain: source.url,
          url: source.url
        }
        setMetadata(fallbackMetadata)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetadata()
  }, [source.url, source.name])

  const handleImageError = () => {
    setImageError(true)
  }

  if (!metadata) {
    return (
      <div className={cn(
        "group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse",
        className
      )}>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline",
          className
        )}
      >
        <span className="truncate">{metadata.title || source.name}</span>
        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
      </a>
    )
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200",
        className
      )}
    >
      {/* Thumbnail */}
      {showThumbnail && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          {metadata.image && !imageError ? (
            <img
              src={metadata.image}
              alt={metadata.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : metadata.favicon && !imageError ? (
            <img
              src={metadata.favicon}
              alt={metadata.siteName || metadata.domain}
              className="w-8 h-8 object-contain"
              onError={handleImageError}
            />
          ) : (
            <Globe className="w-6 h-6 text-slate-400" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed">
              {metadata.title || source.name}
            </h4>
            
            {metadata.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {metadata.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {metadata.siteName || metadata.domain}
              </span>
              
              {metadata.author && (
                <>
                  <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {metadata.author}
                  </span>
                </>
              )}
              
              {metadata.publishedTime && (
                <>
                  <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(metadata.publishedTime).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
        </div>
      </div>
    </a>
  )
} 