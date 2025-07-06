"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState, useCallback } from 'react'

interface GlossaryTerm {
  term: string
}

interface GlossaryLinkTextProps {
  text: string
  className?: string
}

// Very lightweight in-memory cache so multiple renders share one fetch
let glossaryCache: GlossaryTerm[] | null = null
let isLoading = false

export function GlossaryLinkText({ text, className }: GlossaryLinkTextProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>(glossaryCache || [])
  const [loading, setLoading] = useState(false)

  // Memoize the text processing to prevent recalculation on every render
  const processedText = useMemo(() => {
    // Early return if no text or no terms loaded yet
    if (!text || !terms || terms.length === 0) {
      return <span>{text}</span>
    }

    try {
      // Build lookup set for O(1) performance
      const termSet = new Set(terms.map((t) => t.term.toLowerCase()))

      // Split text into words and non-words (keep delimiters)
      const parts = text.split(/(\b)/g)

      return parts.map((part, idx) => {
        const clean = part.replace(/[^A-Za-z]/g, '').toLowerCase()
        if (clean && termSet.has(clean)) {
          return (
            <Link
              href={`/glossary?term=${encodeURIComponent(part)}`}
              key={`${clean}-${idx}`} // More stable key using term + index
              className="underline decoration-dotted hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {part}
            </Link>
          )
        }
        return <span key={`text-${idx}`}>{part}</span>
      })
    } catch (error) {
      console.warn('GlossaryLinkText: Error processing text:', error)
      return <span>{text}</span> // Fallback to plain text
    }
  }, [terms, text])

  // Memoized fetch function to prevent recreation
  const fetchTerms = useCallback(async () => {
    if (glossaryCache || isLoading) return // Already loaded or loading

    try {
      setLoading(true)
      isLoading = true
      
      const response = await fetch('/api/glossary?limit=1000')
      const json = await response.json()
      
      if (json.terms && Array.isArray(json.terms)) {
        glossaryCache = json.terms as GlossaryTerm[]
        setTerms(glossaryCache)
      }
    } catch (error) {
      console.warn('GlossaryLinkText: Failed to fetch terms:', error)
      // Fail silently but set empty cache to prevent retries
      glossaryCache = []
      setTerms([])
    } finally {
      setLoading(false)
      isLoading = false
    }
  }, [])

  useEffect(() => {
    fetchTerms()
  }, [fetchTerms])

  return <span className={className}>{processedText}</span>
} 