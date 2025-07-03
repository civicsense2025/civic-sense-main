"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { DailyCardStack } from '@civicsense/ui-web'
import { Calendar } from '@civicsense/ui-web' 
import { AuthDialog } from '@civicsense/ui-web'
import { useAuth } from '@civicsense/ui-web'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from '@civicsense/ui-web'
import { ContinueQuizCard } from '@civicsense/ui-web'
import dynamic from 'next/dynamic'

// Import from the correct local lib files
import { dataService } from "../lib/data-service"
import { enhancedQuizDatabase } from "../lib/quiz-database"
import { supabase } from "../lib/supabase"

// Import UI components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@civicsense/ui-web'
import { Button } from '@civicsense/ui-web'
import { cn } from '@civicsense/ui-web'

// Import correct types from shared package
import type { TopicMetadata } from '@civicsense/shared'

type CategoryType = string

// Lazy load FeaturesShowcase only when needed (for non-authenticated users)
const FeaturesShowcase = dynamic(
  () => import('@civicsense/ui-web').then(mod => ({ 
    default: mod.FeaturesShowcase || (() => null) 
  })).catch(() => ({ 
    default: () => null 
  })),
  {
    ssr: false,
    loading: () => (
      <section className="py-24 sm:py-32 lg:py-40 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center space-y-8">
            <div className="h-12 w-96 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-6 w-64 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>
      </section>
    )
  }
)

type ViewMode = 'cards' | 'calendar'

// Optimized batched data fetching
interface HomePageData {
  incompleteAttempts: any[]
  incompleteTopics: TopicMetadata[]
  topicsForCalendar?: TopicMetadata[]
}

const fetchHomePageData = async (userId?: string, needsCalendarData: boolean = false): Promise<HomePageData> => {
  try {
    // Batch all API calls into a single Promise.all to prevent waterfall loading
    const promises: Promise<any>[] = []
    
    // Only fetch user-specific data if user exists
    if (userId) {
      promises.push(enhancedQuizDatabase.getUserQuizAttempts(userId))
    } else {
      promises.push(Promise.resolve([]))
    }
    
    // Only fetch calendar topics if needed
    if (needsCalendarData) {
      promises.push(dataService.getAllTopics())
    } else {
      promises.push(Promise.resolve({}))
    }
    
    const [userAttempts, allTopics] = await Promise.all(promises)
    
    // Process incomplete attempts
    let incompleteAttempts: any[] = []
    let incompleteTopics: TopicMetadata[] = []
    
    if (userId && userAttempts?.length > 0) {
      // Get dismissed quiz IDs from localStorage
      const dismissedQuizzes = JSON.parse(localStorage.getItem('dismissedQuizzes') || '[]')
      
      // Filter out dismissed quizzes
      const incomplete = userAttempts.filter((a: any) => a.isPartial && !dismissedQuizzes.includes(a.id))
      incompleteAttempts = incomplete
      
      // Batch fetch topic metadata for incomplete attempts
      if (incomplete.length > 0) {
        const topicPromises = incomplete.map((a: any) => dataService.getTopicById(a.topicId))
        incompleteTopics = (await Promise.all(topicPromises)).filter(Boolean) as TopicMetadata[]
      }
    }
    
    return {
      incompleteAttempts,
      incompleteTopics,
      topicsForCalendar: needsCalendarData ? Object.values(allTopics) : undefined
    }
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return {
      incompleteAttempts: [],
      incompleteTopics: [],
      topicsForCalendar: undefined
    }
  }
}

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Welcome to My App</h1>
      <div className="prose lg:prose-xl">
        <p className="mb-4">
          This is a demo application showcasing Next.js 14 with Supabase Authentication.
        </p>
        <p className="mb-8">
          Get started by signing up for an account or logging in if you already have one.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
