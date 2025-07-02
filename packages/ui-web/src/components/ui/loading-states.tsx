import { Skeleton } from "../ui/skeleton"
import { Card, CardContent } from "../ui/card"

// ============================================================================
// ENHANCED LOADING STATES FOR CIVICSENSE
// ============================================================================

export function PageLoadingSpinner() {
  return (
    <div 
      className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center"
      role="status"
      aria-label="Loading page content"
    >
      <div className="text-center space-y-4">
        <div 
          className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Loading...</p>
      </div>
    </div>
  )
}

export function AuthLoadingState() {
  return (
    <div 
      className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center"
      role="status" 
      aria-label="Checking authentication"
    >
      <div className="text-center space-y-4">
        <div 
          className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 dark:border-white"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Checking authentication...</p>
      </div>
    </div>
  )
}

// ✅ Enhanced skeleton with exact dimensions to prevent layout shift
export function ComponentLoadingSkeleton() {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="Loading component">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

// ============================================================================
// QUIZ-SPECIFIC LOADING STATES
// ============================================================================

/**
 * Quiz card skeleton with exact dimensions matching the actual quiz card
 */
export function QuizCardSkeleton() {
  return (
    <Card className="w-full max-w-sm" role="status" aria-label="Loading quiz card">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Quiz emoji/icon area */}
          <Skeleton className="h-12 w-12 rounded-full" />
          
          {/* Title area */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          
          {/* Description area */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          {/* Stats area */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Button area */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Quiz question skeleton matching actual question layout
 */
export function QuizQuestionSkeleton() {
  return (
    <div className="space-y-6 p-6" role="status" aria-label="Loading quiz question">
      {/* Progress indicator */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-2 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Question text */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-6 w-3/5" />
      </div>
      
      {/* Answer options */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 border rounded-lg">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

// ============================================================================
// CONTENT LISTING SKELETONS
// ============================================================================

/**
 * Category card skeleton with consistent sizing
 */
export function CategoryCardSkeleton() {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading category">
      <Skeleton className="h-16 w-16 rounded-lg" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

/**
 * Topic card skeleton matching topic layout
 */
export function TopicCardSkeleton() {
  return (
    <Card className="w-full" role="status" aria-label="Loading topic">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Topic image/icon */}
          <Skeleton className="h-32 w-full rounded-lg" />
          
          {/* Title and metadata */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          
          {/* Action area */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Public figure card skeleton
 */
export function PublicFigureCardSkeleton() {
  return (
    <Card className="w-full" role="status" aria-label="Loading public figure">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          
          {/* Bio preview */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          {/* Tags/Categories */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * News article skeleton for news ticker
 */
export function NewsArticleSkeleton() {
  return (
    <div className="flex-shrink-0 w-80 p-4 space-y-3" role="status" aria-label="Loading news article">
      {/* Thumbnail */}
      <Skeleton className="h-40 w-full rounded-lg" />
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Metadata */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

// ============================================================================
// LIST ITEM SKELETONS
// ============================================================================

/**
 * Glossary term skeleton for alphabetical listing
 */
export function GlossaryTermSkeleton() {
  return (
    <div className="py-4 border-b border-slate-200 dark:border-slate-700 space-y-2" role="status" aria-label="Loading glossary term">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  )
}

/**
 * Search result skeleton
 */
export function SearchResultSkeleton() {
  return (
    <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-700" role="status" aria-label="Loading search result">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Screen reader announcements for loading states
 */
export function LoadingAnnouncement({ message }: { message: string }) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  )
}

/**
 * Progress indicator skeleton for multi-step processes
 */
export function ProgressSkeleton({ steps = 5 }: { steps?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading progress">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        {Array.from({ length: steps }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    </div>
  )
} 