import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { assessmentFrameworkService } from '@/lib/assessment-framework/service'
import { RelatedTopics } from '@/components/assessment/related-topics'
import { Button } from '@civicsense/ui-web'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, BookOpen, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface IndicatorPageProps {
  params: {
    indicatorSlug: string
  }
}

export async function generateMetadata({ params }: IndicatorPageProps): Promise<Metadata> {
  const framework = await assessmentFrameworkService.getCurrentFramework()
  const indicator = framework?.indicators.find(i => i.slug === params.indicatorSlug)
  
  if (!indicator) {
    return {
      title: 'Indicator Not Found | CivicSense'
    }
  }

  return {
    title: `${indicator.name} | Democracy Assessment | CivicSense`,
    description: `${indicator.description} - Current status: ${indicator.status}. Learn about this indicator for monitoring democratic health.`,
    openGraph: {
      title: `${indicator.name} | Democracy Assessment`,
      description: indicator.description,
      type: 'website'
    }
  }
}

function IndicatorLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2" />
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
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

async function IndicatorDetailContent({ indicatorSlug }: { indicatorSlug: string }) {
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

  const indicator = framework.indicators.find(i => i.slug === indicatorSlug)
  
  if (!indicator) {
    notFound()
  }

  const category = framework.categories.find(c => c.id === indicator.categoryId)
  const relatedTopics = await assessmentFrameworkService.getRelatedTopics(indicator.id)

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'TRIGGERED':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: AlertTriangle,
          description: 'This indicator is currently triggered, representing an active threat to democratic norms.'
        }
      case 'PARTIAL':
        return {
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          icon: Clock,
          description: 'This indicator shows partial signs of concern but has not fully materialized.'
        }
      case 'NOT_YET':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircle,
          description: 'This indicator has not been triggered and democratic norms are being respected in this area.'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: AlertTriangle,
          description: 'Status unknown.'
        }
    }
  }

  const statusInfo = getStatusStyle(indicator.status)
  const StatusIcon = statusInfo.icon

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

      {/* Indicator Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {category && (
                <Link 
                  href={`/assessment/categories/${category.slug}`}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {category.name}
                </Link>
              )}
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">Level {category?.severityLevel}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{indicator.name}</h1>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusInfo.color}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-semibold">Status: {indicator.status.replace('_', ' ')}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Last Updated</div>
            <div className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(indicator.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <p className="text-lg text-gray-600 max-w-4xl">{indicator.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Current Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border ${statusInfo.color}`}>
                <p className="font-medium mb-2">{statusInfo.description}</p>
                {indicator.currentStatus && (
                  <p className="text-sm">{indicator.currentStatus}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Threshold */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Threshold</CardTitle>
              <CardDescription>
                What constitutes triggering this indicator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{indicator.evidenceThreshold}</p>
            </CardContent>
          </Card>

          {/* Historical Context */}
          {indicator.historicalContext && (
            <Card>
              <CardHeader>
                <CardTitle>Historical Context</CardTitle>
                <CardDescription>
                  Examples and precedents from history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{indicator.historicalContext}</p>
              </CardContent>
            </Card>
          )}

          {/* Civic Education Angle */}
          {indicator.civicEducationAngle && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Why This Matters for Citizens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{indicator.civicEducationAngle}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Indicator Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Measurement Type</span>
                <span className="text-sm font-medium capitalize">{indicator.measurementType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Weight</span>
                <span className="text-sm font-medium">{indicator.weight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category</span>
                <span className="text-sm font-medium">{category?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Severity Level</span>
                <span className="text-sm font-medium">Level {category?.severityLevel}</span>
              </div>
            </CardContent>
          </Card>

          {/* Related Learning */}
          {relatedTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Learning</CardTitle>
                <CardDescription>
                  Topics that help understand this indicator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RelatedTopics topics={relatedTopics.slice(0, 3)} compact />
                {relatedTopics.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/topics/search?indicator=${indicator.slug}`}>
                        View All Topics
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Take Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/quiz/democratic-institutions">
                  Test Your Knowledge
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/assessment/categories/${category?.slug}`}>
                  View Category
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/assessment">
                  Full Framework
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Understanding Matters</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          This indicator helps track threats to democratic institutions. Stay informed about how democracy 
          works and what you can do to protect it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/quiz/democratic-institutions">
              Quiz: Democratic Institutions
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/assessment/methodology">
              Our Methodology
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function IndicatorPage({ params }: IndicatorPageProps) {
  return (
    <Suspense fallback={<IndicatorLoadingSkeleton />}>
      <IndicatorDetailContent indicatorSlug={params.indicatorSlug} />
    </Suspense>
  )
} 