"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { ArrowRight } from "lucide-react"
import { dataService } from '@civicsense/shared/data-service'

interface Category {
  id: string
  name: string
  emoji: string
  description: string | null
  display_order: number | null
}

interface CategoryCloudProps {
  limit?: number
  showViewAll?: boolean
  className?: string
  onLoadingStateChange?: (isReady: boolean) => void
  preloadedCategories?: Category[]
}

export function CategoryCloud({ 
  limit = 6, 
  showViewAll = true, 
  className = "", 
  onLoadingStateChange,
  preloadedCategories 
}: CategoryCloudProps) {
  const [categories, setCategories] = useState<Category[]>(preloadedCategories || [])
  const [loading, setLoading] = useState(!preloadedCategories)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we already have preloaded categories, skip the API call
    if (preloadedCategories && preloadedCategories.length > 0) {
      setCategories(preloadedCategories.slice(0, limit))
      setLoading(false)
      onLoadingStateChange?.(true)
      console.log(`📊 CategoryCloud: Using preloaded ${preloadedCategories.length} categories`)
      return
    }

    const fetchCategories = async () => {
      try {
        // Use centralized caching from dataService
        const allCategories = await dataService.getCachedCategories()
        const selectedCategories = allCategories.slice(0, limit)

        setCategories(selectedCategories)
        console.log(`📊 CategoryCloud: Loaded ${selectedCategories.length} categories`)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories')
      } finally {
        setLoading(false)
        // Notify parent that loading is complete
        onLoadingStateChange?.(true)
      }
    }

    fetchCategories()
  }, [limit, onLoadingStateChange, preloadedCategories])

  if (loading) {
    return (
      <div className={`space-y-4 mt-16 ${className}`}>
        <div className="flex items-center justify-between px-4 sm:px-0">
          <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
            Explore by Category
          </h2>
        </div>
        
        {/* Desktop loading skeleton */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-200 dark:bg-slate-800 rounded-xl h-24 w-full"></div>
            </div>
          ))}
        </div>
        
        {/* Mobile loading skeleton */}
        <div className="flex gap-3 px-4 sm:hidden">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="animate-pulse flex-shrink-0">
              <div className="bg-slate-200 dark:bg-slate-800 rounded-xl h-24 w-32"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || categories.length === 0) {
    return (
      <div className={`space-y-4 mt-16 ${className}`}>
        <div className="flex items-center justify-between px-4 sm:px-0">
          <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
            Explore by Category
          </h2>
        </div>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 font-light">
          {error || 'No categories available at the moment.'}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 mt-16 ${className}`}>
      <div className="flex items-center justify-between px-4 sm:px-0">
        <h2 className="text-2xl font-medium text-slate-900 dark:text-white">
          Explore by Category
        </h2>
        {showViewAll && (
          <Link href="/categories">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Mobile: Horizontal scroll, Desktop: Grid layout */}
      <div className="sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 hidden sm:block">
        {categories.map((category) => {
          const categorySlug = category.name
            ? category.name.toLowerCase().replace(/\s+/g, '-')
            : category.id
          
          return (
            <Link
              key={category.id}
              href={`/categories/${categorySlug}`}
              className="group"
            >
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all hover:shadow-sm group-hover:scale-105 duration-200">
                <div className="text-center space-y-2">
                  <div className="text-2xl" role="img" aria-label={category.name ?? 'Category'}>
                    {category.emoji}
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {category.name ?? 'Unnamed'}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Mobile horizontal scroll */}
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 sm:hidden scrollbar-hide">
        {categories.map((category) => {
          const categorySlug = category.name
            ? category.name.toLowerCase().replace(/\s+/g, '-')
            : category.id
          
          return (
            <Link
              key={category.id}
              href={`/categories/${categorySlug}`}
              className="group flex-shrink-0"
            >
              <div className="w-32 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all hover:shadow-sm group-hover:scale-105 duration-200">
                <div className="text-center space-y-2">
                  <div className="text-2xl" role="img" aria-label={category.name ?? 'Category'}>
                    {category.emoji}
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {category.name ?? 'Unnamed'}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Description text */}
      <p className="text-sm text-slate-500 dark:text-slate-400 font-light text-center max-w-2xl mx-auto px-4 sm:px-0 mb-8 py-4">
        Master the topics that politicians don't want you to understand. Categories ranked by what's actually affecting your life right now.
      </p>
    </div>
  )
}
