import { Skeleton } from "@/components/ui/skeleton"

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Loading...</p>
      </div>
    </div>
  )
}

export function AuthLoadingState() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 dark:border-white"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Checking authentication...</p>
      </div>
    </div>
  )
}

export function ComponentLoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
} 