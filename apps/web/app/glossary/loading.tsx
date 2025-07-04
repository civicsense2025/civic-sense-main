"use client"

import { Skeleton } from "../../components/ui"
import { Card, CardContent } from "../../components/ui"

// Glossary Term Card Skeleton
function GlossaryTermSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header with term and bookmark */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        
        {/* Definition */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        
        {/* Examples and synonyms */}
        <div className="space-y-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function GlossaryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Search bar skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-full max-w-lg rounded-md" />
        </div>

        {/* Terms list skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <GlossaryTermSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
} 