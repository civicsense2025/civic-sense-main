import { Skeleton } from '@civicsense/ui-web'
import { Card, CardContent, CardHeader } from '@civicsense/ui-web'
import { Header } from '@civicsense/ui-web'

// Category Card Skeleton
function CategoryCardSkeleton() {
  return (
    <Card className="h-full border-slate-100 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with emoji and title */}
          <div className="flex items-start gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-lg" />
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end pt-2">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Core Topic Card Skeleton
function CoreTopicSkeleton() {
  return (
    <Card className="h-full border-slate-100 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20 rounded-lg" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skills Carousel Skeleton
function SkillsCarouselSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, categoryIndex) => (
        <div key={categoryIndex} className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-lg" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, skillIndex) => (
              <Card key={skillIndex} className="border-slate-100 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-16 rounded-lg" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {/* Page header skeleton */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-6">
            <Skeleton className="h-8 w-56 mx-auto rounded-full" />
            <Skeleton className="h-12 w-80 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          
          {/* Quick stats skeleton */}
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-16">
          {/* Categories section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-40" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))}
            </div>
          </section>

          {/* Core Civic Knowledge section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-16 rounded-lg" />
            </div>
            
            <div className="space-y-8">
              <Skeleton className="h-16 w-full max-w-3xl" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, index) => (
                  <CoreTopicSkeleton key={index} />
                ))}
              </div>
              
              <div className="text-center">
                <Skeleton className="h-10 w-40 mx-auto rounded-md" />
              </div>
            </div>
          </section>

          {/* Featured Skills section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-16 rounded-lg" />
            </div>
            
            <div className="space-y-8">
              <Skeleton className="h-16 w-full max-w-3xl" />
              <SkillsCarouselSkeleton />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 