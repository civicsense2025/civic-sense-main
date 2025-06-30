'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Clock, 
  Users, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  PlayCircle, 
  ArrowRight,
  BookOpen,
  MessageSquare,
  Award,
  GraduationCap,
  Target
} from 'lucide-react'
import { Collection, CollectionItem, UserCollectionProgress } from '@/types/collections'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CollectionBookmarkButton } from '@/components/collections/collection-bookmark-button'

interface CollectionWithItems extends Collection {
  collection_items: (CollectionItem & { content?: any })[]
  progress?: UserCollectionProgress
}

interface CollectionPageProps {
  params: { slug: string }
}

// Generate metadata for the page
export async function generateMetadata({ params }: CollectionPageProps) {
  const supabase = await createClient()
  
  const { data: collection } = await supabase
    .from('collections')
    .select('title, description, emoji')
    .eq('slug', params.slug)
    .single()

  if (!collection) {
    return {
      title: 'Collection Not Found | CivicSense',
      description: 'The requested collection could not be found.'
    }
  }

  return {
    title: `${collection.title} | CivicSense Collections`,
    description: collection.description,
    openGraph: {
      title: collection.title,
      description: collection.description,
      type: 'article'
    }
  }
}

async function getCollection(slug: string): Promise<CollectionWithItems | null> {
  const supabase = await createClient()
  
  // Get collection with items
  const { data: collection, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_items (
        id,
        content_type,
        content_id,
        sort_order,
        created_at
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !collection) {
    return null
  }

  // Check if collection is published (unless user is admin)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (collection.status !== 'published' && !user) {
    return null
  }

  // If user is authenticated, check if they have admin access for draft collections
  if (user && collection.status !== 'published') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin'
    
    if (!isAdmin) {
      return null
    }
  }

  // Get user's progress if authenticated
  let progress: UserCollectionProgress | undefined = undefined
  if (user) {
    const { data: progressData } = await supabase
      .from('user_collection_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
      .single()
    
    if (progressData) {
      // Ensure we have the required fields with defaults
      progress = {
        ...progressData,
        created_at: progressData.created_at || new Date().toISOString(),
        updated_at: progressData.updated_at || new Date().toISOString(),
        progress_percentage: progressData.progress_percentage || 0,
        total_time_spent_minutes: progressData.total_time_spent_minutes || 0,
        completed_items: progressData.completed_items || [],
        started_at: progressData.started_at || new Date().toISOString(),
        last_accessed_at: progressData.last_accessed_at || new Date().toISOString()
      }
    }
  }

  return {
    ...collection,
    progress
  }
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const collection = await getCollection(params.slug)

  if (!collection) {
    notFound()
  }

  const estimatedMinutes = collection.estimated_minutes || 45
  const totalItems = collection.collection_items?.length || 0
  const completedItems = collection.progress ? 
    Math.floor((collection.progress.progress_percentage / 100) * totalItems) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Collection Icon */}
            <div className="text-6xl">{collection.emoji}</div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  {collection.title}
                </h1>
                {collection.status !== 'published' && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Draft
                  </Badge>
                )}
              </div>
              
              <p className="text-lg text-gray-600 mb-6 max-w-3xl">
                {collection.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{estimatedMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalItems} items</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Target className="h-4 w-4" />
                  <span>{collection.difficulty_level}/5 difficulty</span>
                </div>
              </div>

              {/* Progress (if user has started) */}
              {collection.progress && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Your Progress</span>
                    <span>{collection.progress.progress_percentage}% complete</span>
                  </div>
                  <Progress value={collection.progress.progress_percentage} className="h-2" />
                  <p className="text-sm text-gray-500 mt-2">
                    {completedItems} of {totalItems} items completed
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Link href={`/collections/${params.slug}/learn`}>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    {collection.progress ? (
                      <>
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Continue Learning
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Start Learning
                      </>
                    )}
                  </Button>
                </Link>
                
                {collection.progress && (
                  <Button variant="outline" size="lg">
                    <BookOpen className="h-5 w-5 mr-2" />
                    View Progress
                  </Button>
                )}

                <CollectionBookmarkButton
                  collection={collection}
                  variant="button"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Objectives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  What You'll Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {collection.learning_objectives && collection.learning_objectives.length > 0 ? (
                    collection.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      <span className="text-gray-700">
                        Interactive learning experience with quizzes and activities
                      </span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Collection Items Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Collection Contents
                </CardTitle>
                <CardDescription>
                  Interactive lessons, quizzes, and reflection exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collection.collection_items?.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.content_type === 'topic' ? 'Quiz Topic' : 'Learning Material'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.content_type} • {item.content_id}
                        </div>
                      </div>
                      {collection.progress && index < completedItems && (
                        <div className="text-green-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {totalItems > 5 && (
                    <div className="text-center py-2 text-gray-500">
                      +{totalItems - 5} more items
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Time</span>
                  <span className="font-medium">{estimatedMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Difficulty</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Star
                        key={level}
                        className={`h-4 w-4 ${
                          level <= collection.difficulty_level
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Categories</span>
                  <div className="flex flex-wrap gap-1">
                    {collection.categories && collection.categories.length > 0 ? (
                      <>
                        {collection.categories.slice(0, 2).map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {collection.categories.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{collection.categories.length - 2}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        General
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-blue-900 mb-2">
                  Ready to Learn?
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Start your interactive journey through the legislative process.
                </p>
                <Link href={`/collections/${params.slug}/learn`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Begin Collection
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 