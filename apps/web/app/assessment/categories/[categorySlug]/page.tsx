import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { assessmentFrameworkService } from '@/lib/assessment-framework/service'
import { IndicatorCard } from '@/components/assessment/indicator-card'
import { RelatedTopics } from '@/components/assessment/related-topics'
import { Button } from '@civicsense/ui-web'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { ArrowLeft, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface CategoryPageProps {
  params: {
    categorySlug: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const framework = await assessmentFrameworkService.getCurrentFramework()
  const category = framework?.categories.find(c => c.slug === params.categorySlug)
  
  if (!category) {
    return {
      title: 'Category Not Found | CivicSense'
    }
  }

  return {
    title: `${category.name} | Democracy Assessment | CivicSense`,
    description: `${category.description} - Level ${category.severityLevel} indicators for monitoring democratic health.`,
    openGraph: {
      title: `${category.name} | Democracy Assessment`,
      description: category.description,
      type: 'website'
    }
  }
}

function CategoryLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

async function CategoryDetailContent({ categorySlug }: { categorySlug: string }) {
  const framework = await assessmentFrameworkService.getCurrentFramework()
  
  if (!framework) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Assessment Framework Unavailable</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            The democracy assessment framework is currently being updated. Please check back soon.
          </p>
        </div>
      </div>
    )
  }

  const category = framework.categories.find(c => c.slug === categorySlug)
  
  if (!category) {
    notFound()
  }

  const categoryIndicators = framework.indicators.filter(i => i.categoryId === category.id)
  const triggeredCount = categoryIndicators.filter(i => i.status === 'TRIGGERED').length
  const partialCount = categoryIndicators.filter(i => i.status === 'PARTIAL').length
  const notYetCount = categoryIndicators.filter(i => i.status === 'NOT_YET').length

  // Get severity level color
  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1: return 'text-amber-600 bg-amber-50 border-amber-200'
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200'
      case 3: return 'text-red-600 bg-red-50 border-red-200'
      case 4: return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Get related topics for all indicators in this category
  const relatedTopicsPromises = categoryIndicators.map(indicator => 
    assessmentFrameworkService.getRelatedTopics(indicator.id)
  )
  const relatedTopicsArrays = await Promise.all(relatedTopicsPromises)
  const allRelatedTopics = relatedTopicsArrays.flat()
  
  // Deduplicate topics and sort by relevance
  const uniqueTopics = allRelatedTopics.reduce((acc: any[], topic: any) => {
    const existing = acc.find((t: any) => t.id === topic.id)
    if (!existing || topic.relevanceScore > existing.relevanceScore) {
      acc = acc.filter((t: any) => t.id !== topic.id)
      acc.push(topic)
    }
    return acc
  }, [])
  
  const sortedTopics = uniqueTopics.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore).slice(0, 6)

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="text-sm">
          <Link href="/assessment" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment Framework
          </Link>
        </Button>
      </div>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-lg border text-sm font-medium ${getSeverityColor(category.severityLevel)}`}>
              Level {category.severityLevel} - {category.thresholdDescription}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Last Updated</div>
            <div className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(framework.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <p className="text-lg text-gray-600 max-w-3xl">{category.description}</p>

        {/* Category Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Indicators</div>
                  <div className="text-2xl font-bold">{categoryIndicators.length}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-red-600">Triggered</div>
                  <div className="text-2xl font-bold text-red-600">{triggeredCount}</div>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-amber-600">Partial</div>
                  <div className="text-2xl font-bold text-amber-600">{partialCount}</div>
                </div>
                <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-600">Not Yet</div>
                  <div className="text-2xl font-bold text-green-600">{notYetCount}</div>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-6">Indicators in this Category</h2>
        </div>
        
        {categoryIndicators
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(indicator => (
            <IndicatorCard 
              key={indicator.id} 
              indicator={indicator} 
            />
          ))}
      </div>

      {/* Related Topics */}
      {sortedTopics.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Related Learning Topics</h2>
          <RelatedTopics topics={sortedTopics} />
        </div>
      )}

      {/* Actions */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Take Action</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Understanding these {category.name.toLowerCase()} indicators helps you recognize threats to democracy. 
          Learn more about protecting democratic institutions and processes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/quiz/democratic-institutions">
              Test Your Knowledge
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/assessment">
              View Full Framework
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <Suspense fallback={<CategoryLoadingSkeleton />}>
      <CategoryDetailContent categorySlug={params.categorySlug} />
    </Suspense>
  )
} 