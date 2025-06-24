import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-800",
        "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800",
        "bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  )
}

// Specialized skeleton for daily card stack
function DailyCardSkeleton() {
  return (
    <div className="min-h-[50vh] flex flex-col justify-center py-4 sm:py-8 relative">
      {/* Guest banner skeleton */}
      <div className="mb-4 text-center space-y-2">
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-lg" />
      </div>

      {/* Progress indicator skeleton */}
      <div className="text-center mb-6">
        <Skeleton className="h-4 w-16 mx-auto" />
      </div>

      {/* Main card skeleton */}
      <div className="relative">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-6">
            {/* Emoji skeleton */}
            <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 rounded-full" />
            
            {/* Title skeleton - responsive sizing */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
              <Skeleton className="h-8 sm:h-10 md:h-12 w-full max-w-4xl rounded-lg" />
            </div>

            {/* Date selector skeleton */}
            <div className="flex justify-center mb-6">
              <Skeleton className="h-8 sm:h-10 w-40 sm:w-48 rounded-full" />
            </div>

            {/* Badges skeleton - responsive */}
            <div className="flex flex-wrap gap-2 justify-center mt-4 py-4 mb-8">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 rounded-full" />
              <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 rounded-full" />
            </div>
            
            {/* Description skeleton - responsive lines */}
            <div className="space-y-2 max-w-4xl mx-auto mb-10">
              <Skeleton className="h-4 sm:h-5 md:h-6 w-full" />
              <Skeleton className="h-4 sm:h-5 md:h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 sm:h-5 md:h-6 w-5/6 mx-auto hidden sm:block" />
            </div>
            
            {/* Button skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-10 sm:h-12 w-28 sm:w-32 rounded-lg" />
            </div>
            
            {/* Status indicators skeleton */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle loading indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

// Compact skeleton for when we know the structure but are loading data
function DailyCardCompactSkeleton() {
  return (
    <div className="min-h-[400px] sm:min-h-[500px] flex flex-col justify-center py-8">
      <div className="text-center space-y-6">
        <Skeleton className="h-16 w-16 mx-auto rounded-full" />
        <Skeleton className="h-8 w-3/4 max-w-2xl mx-auto" />
        <div className="space-y-2 max-w-xl mx-auto">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </div>
        <Skeleton className="h-10 w-24 mx-auto rounded-lg" />
      </div>
    </div>
  )
}

// Transition skeleton for topic navigation
function DailyCardTransitionSkeleton() {
  return (
    <div className="relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-6">
          {/* Quick skeleton for topic transition */}
          <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-8 sm:h-10 md:h-12 w-3/4 max-w-2xl mx-auto mb-4 rounded-lg" />
          <div className="space-y-2 max-w-2xl mx-auto mb-6">
            <Skeleton className="h-4 sm:h-5 w-full" />
            <Skeleton className="h-4 sm:h-5 w-2/3 mx-auto" />
          </div>
          <Skeleton className="h-10 sm:h-12 w-28 sm:w-32 mx-auto rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Demo component for testing skeleton loaders
function SkeletonDemo() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Card Skeleton (Full Loading)</h3>
        <DailyCardSkeleton />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Card Compact Skeleton</h3>
        <DailyCardCompactSkeleton />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Card Transition Skeleton</h3>
        <DailyCardTransitionSkeleton />
      </div>
    </div>
  )
}

export { Skeleton, DailyCardSkeleton, DailyCardCompactSkeleton, DailyCardTransitionSkeleton, SkeletonDemo } 