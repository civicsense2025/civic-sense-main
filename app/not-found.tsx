"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()

  // Track 404 errors for analytics
  useEffect(() => {
    // Optional: Add analytics tracking for 404 pages
    console.log("404 page not found")
  }, [])

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* Minimal header */}
      <div className="border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Clean branding */}
            <Link 
              href="/" 
              className="group hover:opacity-70 transition-opacity"
            >
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                CivicSense
              </h1>
            </Link>
          </div>
        </div>
      </div>

      {/* 404 Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 md:py-24 text-center">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-extrabold text-blue-600 dark:text-blue-500 mb-6">404</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Constitutional Crisis!</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-lg mx-auto mb-8">
            Looks like this page has been gerrymandered out of existence. Even the Supreme Court couldn't find it!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="lg"
            className="min-w-[180px]"
          >
            Filibuster Back
          </Button>
          
          <Button 
            asChild
            size="lg"
            className="min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href="/">
              Return to Democracy
            </Link>
          </Button>
        </div>

        <div className="mt-12 md:mt-16 border-t border-slate-200 dark:border-slate-800 pt-8">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Other polling stations you might try:
          </h3>
          <div className="flex flex-col gap-2 max-w-md mx-auto text-slate-700 dark:text-slate-300">
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
              Your Dashboard
            </Link>
            <Link href="/skills" className="hover:text-blue-600 dark:hover:text-blue-400">
              Browse Skills
            </Link>
            <Link href="/quiz/2025-trump-approval-rating-decline" className="hover:text-blue-600 dark:hover:text-blue-400">
              Today's Quiz
            </Link>
            <Link href="/public-figures" className="hover:text-blue-600 dark:hover:text-blue-400">
              Public Figures
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
} 