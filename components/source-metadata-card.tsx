// components/SourceMetadataCard.tsx
"use client"

import { useState, useEffect } from "react"

interface SourceMetadata {
  title: string
  description: string
  domain: string
  url: string
  image?: string | null
  siteName?: string | null
  type?: string | null
  favicon?: string | null
  author?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
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

// Simple cache
const metadataCache = new Map<string, { data: SourceMetadata; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

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

export function SourceMetadataCard({ 
  source, 
  className = "", 
  showThumbnail = true, 
  compact = false 
}: SourceMetadataCardProps) {
  const [metadata, setMetadata] = useState<SourceMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchMetadata = async () => {
      // Check cache first
      const cached = metadataCache.get(source.url)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`[SourceMetadataCard] Using cached metadata for ${source.url}`)
        setMetadata(cached.data)
        return
      }

      setIsLoading(true)
      setError(null)
      console.log(`[SourceMetadataCard] Fetching metadata for: ${source.url}`)

      try {
        const response = await fetch('/api/fetch-meta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: source.url }),
        })

        console.log(`[SourceMetadataCard] Response status for ${source.url}:`, response.status)

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const data = await response.json()
        console.log(`[SourceMetadataCard] Received metadata for ${source.url}:`, data)

        const fetchedMetadata: SourceMetadata = {
          title: data.title || source.name,
          description: data.description || '',
          domain: data.domain || new URL(source.url).hostname,
          url: data.url || source.url,
          image: data.image,
          siteName: data.siteName,
          type: data.type,
          favicon: data.favicon,
          author: data.author,
          publishedTime: data.publishedTime,
          modifiedTime: data.modifiedTime
        }

        metadataCache.set(source.url, { data: fetchedMetadata, timestamp: Date.now() })
        setMetadata(fetchedMetadata)

      } catch (err) {
        console.error(`[SourceMetadataCard] Error fetching metadata for ${source.url}:`, err)
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata')
        
        // Set fallback metadata
        const fallbackMetadata: SourceMetadata = {
          title: source.name || 'External Link',
          description: 'Click to visit this source',
          domain: new URL(source.url).hostname,
          url: source.url
        }
        setMetadata(fallbackMetadata)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [source.url, source.name])

  const handleImageError = () => {
    console.log(`[SourceMetadataCard] Image failed to load for ${source.url}`)
    setImageError(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse ${className}`}>
        <div className="flex-1 text-left">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !metadata) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <p className="text-sm text-red-600 dark:text-red-400 text-left">Failed to load metadata: {error}</p>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm text-left">
          {source.url}
        </a>
      </div>
    )
  }

  // Compact view
  if (compact) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline text-left ${className}`}
      >
        <span className="font-mono">{metadata?.title || source.name}</span>
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    )
  }

  // Full card view
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {showThumbnail && metadata && (
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
            {metadata.image && !imageError ? (
              <img
                src={metadata.image}
                alt=""
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : metadata.favicon && !imageError ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={metadata.favicon}
                  alt=""
                  className="w-8 h-8"
                  onError={handleImageError}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 text-left">
            {metadata?.title || source.name}
          </h4>
          
          {metadata?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 text-left">
              {metadata.description}
            </p>
          )}
          
          {/* Author and Date Information */}
          {(metadata?.author || metadata?.publishedTime) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 space-y-1 text-left font-mono">
              {metadata.author && (
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>By {metadata.author}</span>
                </div>
              )}
              {metadata.publishedTime && (
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span title={formatDate(metadata.publishedTime) || undefined}>
                    {getRelativeTime(metadata.publishedTime) || formatDate(metadata.publishedTime)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Site and Type Information */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 text-left">
            <span className="font-mono">{metadata?.siteName || metadata?.domain}</span>
            {metadata?.type && metadata.type !== 'website' && (
              <>
                <span>•</span>
                <span className="capitalize">{metadata.type}</span>
              </>
            )}
          </div>
        </div>

        {/* External link icon */}
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}