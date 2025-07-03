"use client"

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@civicsense/ui-web'
import { Card, CardContent } from '@civicsense/ui-web'
import { AutoReadPage } from '@civicsense/ui-web'
import { Skeleton } from '@civicsense/ui-web'
import { Header } from '@civicsense/ui-web'
// Temporary stub for monorepo migration
const SimpleBookmarkButton = ({ contentType, contentId, title, description, tags, variant }: any) => (
  <button className="p-1 hover:bg-gray-100 rounded">⭐</button>
)

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  part_of_speech?: string
  category?: string
  examples?: string[]
  synonyms?: string[]
}

// Glossary Term Card Skeleton
function GlossaryTermSkeleton() {
  return (
    <Card className="group border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with term and category */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          
          {/* Definition */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          
          {/* Example usage */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          </div>
          
          {/* Related terms */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Filter Tags Skeleton
function FilterTagsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-8 w-16 rounded-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full" />
      ))}
    </div>
  )
}

// Search and Stats Skeleton
function SearchStatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-md mx-auto">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
      
      {/* Stats */}
      <div className="text-center space-y-2">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    </div>
  )
}

// Complete Glossary Loading Skeleton
function GlossaryLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Static header for loading state - no client-side logic */}
      <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
          <div className="flex items-center gap-2">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              CivicSense
            </div>
            <span className="text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
              alpha
            </span>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>
      
      <main className="w-full py-8">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Header skeleton */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-64 mx-auto" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            
            {/* Search and stats */}
            <SearchStatsSkeleton />
          </div>
          
          {/* Filters */}
          <div className="space-y-4">
            <div className="text-center">
              <Skeleton className="h-6 w-32 mx-auto" />
            </div>
            <div className="flex justify-center">
              <FilterTagsSkeleton />
            </div>
          </div>
          
          {/* Glossary grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <GlossaryTermSkeleton key={i} />
            ))}
          </div>
          
          {/* Load more skeleton */}
          <div className="text-center">
            <Skeleton className="h-10 w-32 mx-auto rounded-full" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTerms = useCallback(async (search = '') => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      const res = await fetch(`/api/glossary?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch terms')
      setTerms(json.terms || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTerms()
  }, [fetchTerms])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchTerms(query)
    }, 300)
    return () => clearTimeout(t)
  }, [query, fetchTerms])

  if (loading) {
    return <GlossaryLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-16">
      <AutoReadPage />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-50">Glossary</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Search key civics terms and definitions</p>
        </div>

        <div className="flex justify-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            className="max-w-lg"
          />
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          {terms.map((term) => (
            <Card key={term.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-medium text-slate-900 dark:text-slate-50">
                  {term.term}
                  {term.part_of_speech && (
                    <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">({term.part_of_speech})</span>
                  )}
                </h2>
                <SimpleBookmarkButton
                  contentType="glossary"
                  contentId={term.id}
                  title={term.term}
                  description={term.definition}
                  tags={term.category ? [term.category] : []}
                  variant="icon"
                />
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-2">{term.definition}</p>
              {term.examples && term.examples.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400"><strong>Examples:</strong> {term.examples.join('; ')}</p>
              )}
              {term.synonyms && term.synonyms.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400"><strong>Synonyms:</strong> {term.synonyms.join(', ')}</p>
              )}
            </Card>
          ))}
          {!loading && terms.length === 0 && <p className="text-center text-slate-500">No terms found.</p>}
        </div>
      </div>
    </div>
  )
} 