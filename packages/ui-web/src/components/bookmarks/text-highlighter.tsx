// =============================================================================
// TEXT HIGHLIGHTER COMPONENT
// =============================================================================

import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '../auth/auth-provider'
import { useTextSelection } from '@civicsense/shared/use-text-selection'
import { HighlightColorPicker } from './highlight-color-picker'
import { bookmarkOperations } from '@civicsense/shared/bookmarks'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import { Highlighter, X } from 'lucide-react'
import { cn } from '../../utils'
import type { HighlightSelection, ContentType } from '@civicsense/shared/types/bookmarks'

export interface TextHighlighterProps {
  /** Content type for bookmarking */
  contentType: ContentType
  /** Content ID for bookmarking */
  contentId?: string
  /** Content title for bookmarking */
  contentTitle: string
  /** Content URL for bookmarking */
  contentUrl?: string
  /** Whether highlighting is enabled */
  enabled?: boolean
  /** Container element to limit highlighting to */
  container?: HTMLElement | null
  /** Additional CSS classes */
  className?: string
  /** Callback when highlight is saved */
  onHighlightSaved?: (snippetId: string) => void
}

/**
 * Provides text selection and highlighting functionality for content.
 * Shows a color picker when text is selected and handles saving highlights as bookmark snippets.
 */
export function TextHighlighter({
  contentType,
  contentId,
  contentTitle,
  contentUrl,
  enabled = true,
  container,
  className,
  onHighlightSaved
}: TextHighlighterProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const savedRangeRef = useRef<Range | null>(null)

  const handleSelectionChange = useCallback((selection: HighlightSelection | null) => {
    if (!selection || !enabled) {
      setIsPopoverOpen(false)
      return
    }

    // Save the current range for restoration later
    const currentSelection = window.getSelection()
    if (currentSelection && currentSelection.rangeCount > 0) {
      savedRangeRef.current = currentSelection.getRangeAt(0).cloneRange()
    }

    // Calculate popover position
    const rect = savedRangeRef.current?.getBoundingClientRect()
    if (rect) {
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
    }

    setIsPopoverOpen(true)
  }, [enabled])

  const { 
    selectedText, 
    selectionData, 
    hasSelection, 
    clearSelection 
  } = useTextSelection(handleSelectionChange, {
    enabled,
    container,
    minLength: 10
  })

  const handleColorSelect = async (color: string) => {
    if (!user?.id || !selectionData || !selectedText) {
      toast({
        title: "Cannot save highlight",
        description: "Please sign in to save highlights",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)

      // First create or find the bookmark for this content
      let bookmark = await bookmarkOperations.getBookmarkByContent(
        contentType, 
        contentId || '', 
        user.id
      )

      if (!bookmark) {
        bookmark = await bookmarkOperations.createBookmark({
          content_type: contentType,
          content_id: contentId,
          content_url: contentUrl,
          title: contentTitle,
          description: `Highlights from ${contentTitle}`,
          tags: ['highlight', contentType]
        }, user.id)
      }

      // Create the snippet with the selected color
      const snippet = await bookmarkOperations.createSnippet(
        bookmark.id,
        {
          snippet_text: selectedText,
          source_type: 'highlight',
          user_notes: `Highlighted in ${contentTitle}`,
          highlight_color: color,
          selection_start: selectionData.start,
          selection_end: selectionData.end
        },
        user.id
      )

      // Visually mark the text in the document
      await markTextInDocument(color)

      toast({
        title: "Highlight saved!",
        description: `Text highlighted with ${color === '#FEF08A' ? 'yellow' : 'custom color'}`
      })

      onHighlightSaved?.(snippet.id)
      setIsPopoverOpen(false)
      clearSelection()

    } catch (error) {
      console.error('Failed to save highlight:', error)
      toast({
        title: "Failed to save highlight",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const markTextInDocument = async (color: string) => {
    if (!savedRangeRef.current) return

    try {
      // Create a highlight element
      const mark = document.createElement('mark')
      mark.style.backgroundColor = color
      mark.style.color = 'inherit'
      mark.className = 'civic-highlight'
      mark.setAttribute('data-highlight-color', color)

      // Surround the range contents with the mark element
      savedRangeRef.current.surroundContents(mark)
    } catch (error) {
      // If surroundContents fails (e.g., range spans multiple elements),
      // we'll skip visual marking for now
      console.warn('Could not visually mark text:', error)
    }
  }

  const handleClose = () => {
    setIsPopoverOpen(false)
    clearSelection()
  }

  // Don't render if not enabled or no user
  if (!enabled) {
    return null
  }

  return (
    <>
      {/* Selection indicator overlay */}
      {isPopoverOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}

      {/* Color picker popover */}
      {isPopoverOpen && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3"
          style={{
            left: popoverPosition.x - 100, // Center the popover
            top: popoverPosition.y - 60,
            minWidth: '200px'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              Choose highlight color
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <HighlightColorPicker
            onSelect={handleColorSelect}
            className="mb-3"
          />

          <div className="text-xs text-slate-500 dark:text-slate-400">
            "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </div>

          {isSaving && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Saving highlight...
            </div>
          )}
        </div>
      )}

      {/* Optional toolbar/status indicator */}
      {enabled && (
        <div className={cn("flex items-center gap-2 text-xs text-slate-500", className)}>
          <Highlighter className="h-4 w-4" />
          <span>Select text to highlight</span>
          {hasSelection && (
            <span className="text-blue-600 dark:text-blue-400">
              {selectedText.length} characters selected
            </span>
          )}
        </div>
      )}
    </>
  )
} 