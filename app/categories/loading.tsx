import { Header } from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

// Category Card Skeleton
function CategoryCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header with emoji and title */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto mt-1" />
              </div>
              <div className="text-center">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto mt-1" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
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

        {/* Categories grid skeleton */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, colIndex) => (
                <CategoryCardSkeleton key={colIndex} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 