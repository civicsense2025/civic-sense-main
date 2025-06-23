// =============================================================================
// TEXT SELECTION HOOK
// =============================================================================

import { useCallback, useEffect, useState } from 'react'
import { HighlightSelection } from '@/lib/types/bookmarks'

export interface UseTextSelectionOptions {
  /** Whether text selection is enabled */
  enabled?: boolean
  /** Minimum text length to trigger highlight */
  minLength?: number
  /** Container element to limit selection to */
  container?: HTMLElement | null
}

export interface TextSelectionState {
  /** Current selection text */
  selectedText: string
  /** Selection range data */
  selectionData: HighlightSelection | null
  /** Whether a selection is active */
  hasSelection: boolean
  /** Clear current selection */
  clearSelection: () => void
}

/**
 * Hook for capturing and managing text selections within content.
 * Provides selection data needed for creating bookmark snippets.
 */
export function useTextSelection(
  onSelectionChange?: (selection: HighlightSelection | null) => void,
  options: UseTextSelectionOptions = {}
): TextSelectionState {
  const { 
    enabled = true, 
    minLength = 10,
    container 
  } = options

  const [selectedText, setSelectedText] = useState('')
  const [selectionData, setSelectionData] = useState<HighlightSelection | null>(null)

  const clearSelection = useCallback(() => {
    setSelectedText('')
    setSelectionData(null)
    onSelectionChange?.(null)
    
    // Clear browser selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
  }, [onSelectionChange])

  const handleSelectionChange = useCallback(() => {
    if (!enabled) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      clearSelection()
      return
    }

    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()

    // Check minimum length
    if (text.length < minLength) {
      clearSelection()
      return
    }

    // Check if selection is within container (if specified)
    if (container && !container.contains(range.commonAncestorContainer)) {
      clearSelection()
      return
    }

    // Get surrounding context
    const containerElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer as HTMLElement

    const fullText = containerElement?.textContent || ''
    const startOffset = range.startOffset
    const endOffset = range.endOffset

    // Extract context before and after selection
    const contextBefore = fullText.substring(Math.max(0, startOffset - 50), startOffset)
    const contextAfter = fullText.substring(endOffset, Math.min(fullText.length, endOffset + 50))

    const highlightData: HighlightSelection = {
      text,
      start: startOffset,
      end: endOffset,
      container: containerElement || document.body,
      parentElement: containerElement || undefined,
      contextBefore,
      contextAfter
    }

    setSelectedText(text)
    setSelectionData(highlightData)
    onSelectionChange?.(highlightData)
  }, [enabled, minLength, container, clearSelection, onSelectionChange])

  // Listen for selection changes
  useEffect(() => {
    if (!enabled) return

    const targetElement = container || document

    // Handle mouse up for selection
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleSelectionChange, 10)
    }

    // Handle key up for keyboard selection
    const handleKeyUp = (e: Event) => {
      const keyEvent = e as KeyboardEvent
      // Only handle selection-related keys
      if (keyEvent.key === 'ArrowLeft' || keyEvent.key === 'ArrowRight' || 
          keyEvent.key === 'ArrowUp' || keyEvent.key === 'ArrowDown' ||
          keyEvent.shiftKey) {
        setTimeout(handleSelectionChange, 10)
      }
    }

    targetElement.addEventListener('mouseup', handleMouseUp)
    targetElement.addEventListener('keyup', handleKeyUp)

    return () => {
      targetElement.removeEventListener('mouseup', handleMouseUp)
      targetElement.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled, container, handleSelectionChange])

  // Clear selection when disabled
  useEffect(() => {
    if (!enabled) {
      clearSelection()
    }
  }, [enabled, clearSelection])

  return {
    selectedText,
    selectionData,
    hasSelection: !!selectionData && selectedText.length >= minLength,
    clearSelection
  }
}

/**
 * Get the position of the current text selection for positioning popovers
 */
export function getSelectionPosition(): { x: number; y: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  
  return {
    x: rect.left + rect.width / 2,
    y: rect.top - 10 // Position above selection
  }
}

/**
 * Helper to restore a highlight in the DOM
 */
export function restoreHighlight(
  container: HTMLElement,
  text: string,
  highlightColor: string,
  contextBefore?: string,
  contextAfter?: string
): boolean {
  try {
    const fullText = container.textContent || ''
    
    // Find the text using context if available
    let startIndex = -1
    
    if (contextBefore || contextAfter) {
      const searchPattern = `${contextBefore || ''}${text}${contextAfter || ''}`
      const patternIndex = fullText.indexOf(searchPattern)
      if (patternIndex >= 0) {
        startIndex = patternIndex + (contextBefore?.length || 0)
      }
    } else {
      startIndex = fullText.indexOf(text)
    }
    
    if (startIndex === -1) return false

    // Create a range and wrap in highlight
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    )
    
    let currentIndex = 0
    let textNode: Text | null = null
    
    // Find the text node containing our highlight
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const nodeLength = node.textContent?.length || 0
      
      if (currentIndex + nodeLength > startIndex) {
        textNode = node
        break
      }
      currentIndex += nodeLength
    }
    
    if (!textNode) return false
    
    const nodeStartIndex = startIndex - currentIndex
    const nodeEndIndex = nodeStartIndex + text.length
    
    // Split the text node and wrap the middle part
    const beforeNode = textNode.splitText(nodeStartIndex)
    const highlightNode = beforeNode.splitText(text.length)
    
    const mark = document.createElement('mark')
    mark.style.backgroundColor = highlightColor
    mark.style.padding = '1px 2px'
    mark.style.borderRadius = '2px'
    mark.textContent = text
    
    beforeNode.parentNode?.replaceChild(mark, beforeNode)
    
    return true
  } catch (error) {
    console.error('Failed to restore highlight:', error)
    return false
  }
} 