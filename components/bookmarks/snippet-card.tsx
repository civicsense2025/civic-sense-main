// =============================================================================
// SNIPPET CARD COMPONENT
// =============================================================================

import React from 'react'
import { BookmarkSnippet } from '@/lib/types/bookmarks'
import { cn } from '@/lib/utils'
import { Quote, Tag, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface SnippetCardProps {
  snippet: BookmarkSnippet
  /** Whether to show metadata like date, tags */
  showMetadata?: boolean
  /** Additional styling */
  className?: string
  /** Click handler for the snippet */
  onClick?: () => void
}

/**
 * Displays a saved snippet with its user-chosen highlight color and metadata.
 * Used in bookmark lists, search results, and anywhere snippets are shown.
 */
export function SnippetCard({ 
  snippet, 
  showMetadata = true, 
  className,
  onClick 
}: SnippetCardProps) {
  const backgroundColor = snippet.highlight_color || '#FEF08A' // default yellow
  
  return (
    <div 
      className={cn(
        "group cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 p-4 transition-all hover:shadow-md",
        onClick && "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        className
      )}
      onClick={onClick}
    >
      {/* Main snippet content with highlight color */}
      <blockquote 
        className="relative rounded-md px-3 py-2 text-sm leading-relaxed border-l-4 border-slate-300 dark:border-slate-600"
        style={{ backgroundColor }}
      >
        <Quote className="absolute top-1 left-1 h-3 w-3 text-slate-500" />
        <div className="pl-4">
          "{snippet.snippet_text}"
        </div>
      </blockquote>

      {/* User notes if present */}
      {snippet.user_notes && (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 italic">
          Note: {snippet.user_notes}
        </div>
      )}

      {/* Metadata section */}
      {showMetadata && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {/* Source info */}
          {snippet.source_title && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              From: {snippet.source_title}
            </span>
          )}

          {/* Created date */}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(snippet.created_at).toLocaleDateString()}
          </span>

          {/* Tags */}
          {snippet.tags && snippet.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <div className="flex gap-1">
                {snippet.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI summary if available */}
      {snippet.ai_summary && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-400">
          <div className="font-medium mb-1">AI Summary:</div>
          {snippet.ai_summary}
        </div>
      )}
    </div>
  )
}

/**
 * Inline version for embedding highlighted text within content
 */
export function InlineSnippet({ 
  text, 
  highlightColor = '#FEF08A',
  className 
}: { 
  text: string
  highlightColor?: string
  className?: string 
}) {
  return (
    <mark
      className={cn("px-1 py-0.5 rounded", className)}
      style={{ backgroundColor: highlightColor }}
    >
      {text}
    </mark>
  )
} 