import { Suspense } from 'react'
import { Metadata } from 'next'
import { assessmentFrameworkService } from '@/lib/assessment-framework/service'
import { FrameworkOverview } from '@/components/assessment/framework-overview'
import { Button } from '@civicsense/ui-web'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Democracy Assessment Framework | CivicSense',
  description: 'Real-time monitoring of democratic health and threats to American democracy using evidence-based indicators.',
  keywords: 'democracy assessment, democratic backsliding, authoritarianism indicators, political science',
  openGraph: {
    title: 'Democracy Assessment Framework | CivicSense',
    description: 'Monitor threats to American democracy with our evidence-based assessment framework.',
    type: 'website'
  }
}

function FrameworkLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded" />
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
  )
}

async function AssessmentFrameworkContent() {
  // Get the main framework
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

  const statusColor = framework.metadata.overallThreatLevel >= 70 ? 'destructive' :
                     framework.metadata.overallThreatLevel >= 40 ? 'secondary' : 'default'
  
  const statusText = framework.metadata.overallThreatLevel >= 70 ? 'High Risk' :
                    framework.metadata.overallThreatLevel >= 40 ? 'Moderate Risk' : 'Low Risk'

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Democracy Assessment Framework
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          Evidence-based monitoring of democratic health and threats to American democracy. 
          Real-time tracking of indicators that political scientists use to measure democratic backsliding.
        </p>
        
        {/* Current Status */}
        <div className="inline-flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Current Threat Level:</span>
          </div>
          <Badge variant={statusColor} className="text-sm font-semibold">
            {framework.metadata.overallThreatLevel}% - {statusText}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Updated {new Date(framework.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Framework Overview */}
      <div className="mb-12">
        <FrameworkOverview framework={framework} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {framework.metadata.totalIndicators}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Triggered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {framework.metadata.triggeredCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {framework.metadata.partialCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Not Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {framework.metadata.notYetCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Assessment Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {framework.categories.map(category => {
            const categoryIndicators = framework.indicators.filter(i => i.categoryId === category.id)
            const triggeredInCategory = categoryIndicators.filter(i => i.status === 'TRIGGERED').length
            const partialInCategory = categoryIndicators.filter(i => i.status === 'PARTIAL').length
            
            return (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Level {category.severityLevel} - {category.thresholdDescription}
                      </CardDescription>
                    </div>
                    <Badge variant={triggeredInCategory > 0 ? 'destructive' : 'secondary'}>
                      {triggeredInCategory + partialInCategory}/{categoryIndicators.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {categoryIndicators.length} indicators
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link href={`/assessment/categories/${category.slug}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Actions Section */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Take Action</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Understanding these indicators is just the first step. Learn what you can do to strengthen democracy 
          and protect against authoritarianism.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/quiz/democratic-institutions">
              Test Your Knowledge
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/assessment/methodology">
              Learn More About Our Methodology
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<FrameworkLoadingSkeleton />}>
      <AssessmentFrameworkContent />
    </Suspense>
  )
} 