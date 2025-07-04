'use client'

import React, { Suspense } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, X, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CollectionCard } from '@/components/collections/collection-card'
import { CollectionStats } from '@/components/collections/collection-stats'
import { CollectionFilters } from '@/components/collections/collection-filters'
import type { Collection, CollectionStep } from '@/types/collections'
import { Skeleton } from '@/components/ui/skeleton'

interface CollectionPageProps {
  params: {
    slug: string
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = params

  // Sample collection step
  const sampleStep: CollectionStep = {
    id: '1',
    type: 'lesson',
    title: 'Introduction',
    description: 'Learn the basics',
    content: null,
    duration: 15,
    order: 1,
    isRequired: true
  }

  // Fetch collection data
  const collection: Collection = {
    id: '1',  // Use a UUID or other unique identifier
    title: 'Sample Collection',
    description: 'This is a sample collection',
    topics: ['civics', 'democracy'],
    difficulty: 'beginner',
    estimatedTime: 30,
    author: 'CivicSense',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'civics',
    isPublic: true,
    objectives: ['Learn about civic engagement'],
    steps: [sampleStep],
    tags: ['civics', 'beginner']
  }

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' }
  ]

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <CollectionStats collection={collection} />
        <CollectionFilters 
          filters={filters} 
          activeFilter="all"
          onFilterChange={(filter: { id: string; label: string }) => console.log('Filter:', filter)} 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CollectionCard collection={collection} onSelect={(c: Collection) => console.log('Selected:', c)} />
        </div>
      </Card>
    </div>
  )
}

// Temporary stub for data fetching
function getCollection(slug: string): Collection | null {
  return {
    id: '1',
    title: 'Example Collection',
    description: 'This is an example collection.',
    topics: ['civics', 'democracy'],
    difficulty: 'beginner',
    estimatedTime: 60,
    author: 'CivicSense',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['civics', 'beginner'],
    category: 'civics',
    isPublic: true,
    objectives: ['Learn about civic engagement'],
    steps: [
      {
        id: '1',
        title: 'Item 1',
        description: 'Description 1',
        type: 'quiz',
        content: null,
        duration: 15,
        order: 1,
        isRequired: true
      }
    ]
  }
} 