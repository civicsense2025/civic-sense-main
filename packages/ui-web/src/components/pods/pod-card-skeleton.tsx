import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { cn } from '@civicsense/shared/lib/utils'

interface PodCardSkeletonProps {
  className?: string
}

export function PodCardSkeleton({ className }: PodCardSkeletonProps) {
  return (
    <Card className={cn(
      "transition-all duration-200 border-0 bg-white dark:bg-slate-900",
      className
    )}>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2 mt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Stats Grid skeleton */}
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-8 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>

          {/* Action Bar skeleton */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 