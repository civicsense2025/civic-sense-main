'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Clock, Users, Star, TrendingUp } from 'lucide-react'
// Temporary types for monorepo migration
type Collection = {
  id: string
  title: string
  description: string
  slug: string
  emoji: string
  difficulty_level: number
  estimated_minutes: number
  completion_count: number
  current_events_relevance: number
  tags: string[]
}

type CollectionFilters = {
  status?: string
  difficulty_level?: number[]
  categories?: string[]
  tags?: string[]
}
import { Button } from "../../components/ui"
import { Input } from "../../components/ui"
import { Badge } from "../../components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui"
import { Progress } from "../../components/ui"
// Temporary stub for monorepo migration
const CollectionBookmarkButton = ({ collection, variant, className }: any) => (
  <button className={className}>⭐</button>
)

interface CollectionWithProgress extends Omit<Collection, 'progress'> {
  progress?: {
    is_completed: boolean
    items_completed: string[]
    total_time_spent: number
    completion_percentage: number
  }
  items_count: number
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionWithProgress[]>([])
  const [featuredCollections, setFeaturedCollections] = useState<CollectionWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<CollectionFilters>({
    status: 'published'
  })

  // Fetch collections
  useEffect(() => {
    fetchCollections()
  }, [filters, searchTerm])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams({
        status: filters.status || 'published',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.difficulty_level?.length && { 
          difficulty: filters.difficulty_level.join(',') 
        }),
        ...(filters.categories?.length && { 
          categories: filters.categories.join(',') 
        }),
        ...(filters.tags?.length && { 
          tags: filters.tags.join(',') 
        })
      })

      const [collectionsRes, featuredRes] = await Promise.all([
        fetch(`/api/collections?${params}`),
        fetch('/api/collections?featured=true')
      ])

      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json()
        setCollections(collectionsData)
      }

      if (featuredRes.ok) {
        const featuredData = await featuredRes.json()
        setFeaturedCollections(featuredData)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Learning Collections
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Curated journeys through the most important civic knowledge. 
          Each collection connects the dots between power, policy, and your daily life.
        </motion.p>
      </div>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Featured Collections
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCollections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CollectionCard collection={collection} featured />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Search and Filters */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={filters.difficulty_level?.[0]?.toString() || ''}
              onValueChange={(value) => 
                setFilters(prev => ({
                  ...prev,
                  difficulty_level: value ? [parseInt(value)] : undefined
                }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="1">Beginner</SelectItem>
                <SelectItem value="2">Easy</SelectItem>
                <SelectItem value="3">Intermediate</SelectItem>
                <SelectItem value="4">Advanced</SelectItem>
                <SelectItem value="5">Expert</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilters({ status: 'published' })
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Collections Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        ) : collections.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                All Collections
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {collections.length} collection{collections.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <CollectionCard collection={collection} />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No collections found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setFilters({ status: 'published' })
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </motion.section>
    </div>
  )
}

// Collection Card Component
function CollectionCard({ 
  collection, 
  featured = false 
}: { 
  collection: CollectionWithProgress
  featured?: boolean 
}) {
  const progressPercentage = collection.progress
    ? (collection.progress.items_completed.length / collection.items_count) * 100
    : 0

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 5: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner'
      case 2: return 'Easy'
      case 3: return 'Intermediate'
      case 4: return 'Advanced'
      case 5: return 'Expert'
      default: return 'Unknown'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return (
    <Card className={`h-full hover:shadow-lg transition-shadow duration-300 ${
      featured ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''
    }`}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{collection.emoji}</span>
            {featured && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(collection.difficulty_level)}>
              {getDifficultyLabel(collection.difficulty_level)}
            </Badge>
            <CollectionBookmarkButton
              collection={collection}
              variant="icon"
              className="p-1"
            />
          </div>
        </div>
        
        <CardTitle className="text-lg leading-tight">
          {collection.title}
        </CardTitle>
        
        <CardDescription className="line-clamp-2">
          {collection.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar if user has started */}
        {collection.progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-gray-500">
              {collection.progress.items_completed.length} of {collection.items_count} completed
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(collection.estimated_minutes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{collection.completion_count}</span>
          </div>
          {collection.current_events_relevance >= 4 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400">Hot</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {collection.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {collection.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {collection.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{collection.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/collections/${collection.slug}`}>
            {collection.progress?.is_completed 
              ? 'Review Collection'
              : collection.progress 
              ? 'Continue Learning'
              : 'Start Learning'
            }
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 