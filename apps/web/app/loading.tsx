"use client"

import { Skeleton, Card, CardContent } from "@civicsense/ui-web"

// Continue Quiz Card Skeleton
function ContinueQuizCardSkeleton() {
  return (
    <Card className="flex-shrink-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2 mt-3">
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// Daily Card Skeleton
function DailyCardSkeleton() {
  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Date and category */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          
          {/* Title and description */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          
          {/* Action button */}
          <div className="pt-4">
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Category Cloud Item Skeleton
function CategoryItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

// Features Showcase Skeleton
function FeaturesShowcaseSkeleton() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 mb-16">
          <Skeleton className="h-10 w-80 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        
        {/* Before/After comparison skeleton */}
        <div className="mb-16">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        
        {/* Research citations skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePageLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header skeleton */}
      <div className="w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>
      
      {/* Continue quiz section skeleton */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-48 mb-3" />
          <div className="flex gap-3 overflow-x-auto pb-2">
            <ContinueQuizCardSkeleton />
            <ContinueQuizCardSkeleton />
          </div>
        </div>
      </div>

      <main className="w-full py-6">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Daily cards stack skeleton */}
          <div className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-5 w-96 mx-auto" />
            </div>
            
            <div className="grid gap-6">
              <DailyCardSkeleton />
              <DailyCardSkeleton />
              <DailyCardSkeleton />
            </div>
          </div>

          {/* Categories section skeleton */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-48 mx-auto mb-4" />
              <Skeleton className="h-5 w-64 mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CategoryItemSkeleton key={i} />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Skeleton className="h-10 w-32 mx-auto rounded-md" />
            </div>
          </div>
        </div>
      </main>

      {/* Features showcase skeleton */}
      <FeaturesShowcaseSkeleton />
    </div>
  )
} 