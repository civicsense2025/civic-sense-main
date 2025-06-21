"use client"

import { Header } from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

// Glossary Term Card Skeleton
function GlossaryTermSkeleton() {
  return (
    <Card className="group border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with term and category */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          
          {/* Definition */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          
          {/* Example usage */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          </div>
          
          {/* Related terms */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GlossaryLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      
      <main className="w-full py-8">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Header skeleton */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-64 mx-auto" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            
            {/* Search and stats */}
            <div className="space-y-6">
              {/* Search bar */}
              <div className="relative max-w-md mx-auto">
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
              
              {/* Stats */}
              <div className="text-center space-y-2">
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="space-y-4">
            <div className="text-center">
              <Skeleton className="h-6 w-32 mx-auto" />
            </div>
            <div className="flex justify-center">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-16 rounded-full" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Glossary grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <GlossaryTermSkeleton key={i} />
            ))}
          </div>
          
          {/* Load more skeleton */}
          <div className="text-center">
            <Skeleton className="h-10 w-32 mx-auto rounded-full" />
          </div>
        </div>
      </main>
    </div>
  )
} 