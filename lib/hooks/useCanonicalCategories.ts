import { useEffect, useMemo, useState } from 'react'

interface Category { 
  id: string
  name: string
  emoji: string | null
  description?: string
}

interface Synonym { 
  alias: string
  category_id: string
}

interface CategoriesResponse {
  categories: Category[]
  synonyms: Synonym[]
}

export function useCanonicalCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [aliasMap, setAliasMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const res = await fetch('/api/categories')
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.statusText}`)
        }
        
        const { categories, synonyms }: CategoriesResponse = await res.json()

        setCategories(categories)

        // Build quick-lookup map: lower(alias) → canonical name
        const map: Record<string, string> = {}
        
        // Map synonyms to their canonical names
        synonyms.forEach(s => {
          const canonical = categories.find(c => c.id === s.category_id)?.name
          if (canonical) {
            map[s.alias.toLowerCase()] = canonical
          }
        })
        
        // Also map each canonical name to itself for direct hits
        categories.forEach(c => {
          map[c.name.toLowerCase()] = c.name
        })
        
        setAliasMap(map)
      } catch (err) {
        console.error('Error loading canonical categories:', err)
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  /** Convert an array of raw aliases → canonical, de-duplicated, alpha-sorted */
  const normalise = useMemo(() => {
    return (aliases: string[]) => {
      if (!aliases || aliases.length === 0) return []
      
      const canonicalNames = aliases
        .map(alias => {
          const trimmed = alias.trim()
          if (!trimmed) return null
          
          // Try exact match first
          const canonical = aliasMap[trimmed.toLowerCase()]
          if (canonical) return canonical
          
          // Try fuzzy matching for common variations
          const fuzzyMatch = Object.keys(aliasMap).find(key => 
            key.includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(key)
          )
          
          return fuzzyMatch ? aliasMap[fuzzyMatch] : null
        })
        .filter((name): name is string => name !== null)
      
      // De-duplicate and sort
      return Array.from(new Set(canonicalNames)).sort()
    }
  }, [aliasMap])

  /** Get category info by canonical name */
  const getCategoryInfo = useMemo(() => {
    return (canonicalName: string) => {
      return categories.find(c => c.name === canonicalName)
    }
  }, [categories])

  /** Get all canonical categories with their info */
  const getCanonicalCategories = useMemo(() => {
    return () => categories.map(c => ({
      name: c.name,
      emoji: c.emoji || '📚',
      description: c.description
    }))
  }, [categories])

  return { 
    categories, 
    normalise, 
    getCategoryInfo,
    getCanonicalCategories,
    isLoading, 
    error 
  }
} 