"use client"

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AutoReadPage } from '@/components/auto-read-page'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  part_of_speech?: string
  category?: string
  examples?: string[]
  synonyms?: string[]
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

        {loading && <p className="text-center text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          {terms.map((term) => (
            <Card key={term.id} className="p-4">
              <h2 className="text-xl font-medium text-slate-900 dark:text-slate-50 mb-2">
                {term.term}
                {term.part_of_speech && (
                  <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">({term.part_of_speech})</span>
                )}
              </h2>
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