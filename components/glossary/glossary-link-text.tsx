"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface GlossaryTerm {
  term: string
}

interface GlossaryLinkTextProps {
  text: string
  className?: string
}

// Very lightweight in-memory cache so multiple renders share one fetch
let glossaryCache: GlossaryTerm[] | null = null

export function GlossaryLinkText({ text, className }: GlossaryLinkTextProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>(glossaryCache || [])

  useEffect(() => {
    if (glossaryCache) return // already loaded

    fetch('/api/glossary?limit=1000')
      .then((res) => res.json())
      .then((json) => {
        if (json.terms) {
          glossaryCache = json.terms as GlossaryTerm[]
          setTerms(glossaryCache)
        }
      })
      .catch(() => {/* fail silently */})
  }, [])

  const linked = useMemo(() => {
    if (!terms || terms.length === 0) return text

    // Build lookup set for O(1)
    const termSet = new Set(terms.map((t) => t.term.toLowerCase()))

    // Split text into words and non-words (keep delimiters)
    const parts = text.split(/(\b)/g)

    return parts.map((part, idx) => {
      const clean = part.replace(/[^A-Za-z]/g, '').toLowerCase()
      if (clean && termSet.has(clean)) {
        return (
          <Link
            href={`/glossary?term=${encodeURIComponent(part)}`}
            key={idx}
            className="underline decoration-dotted hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {part}
          </Link>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }, [terms, text])

  return <span className={className}>{linked}</span>
} 