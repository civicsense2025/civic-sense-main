"use client"

import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    </div>
  )
} 