"use client"

import Link from "next/link"
import { UserMenu } from "@/components/auth/user-menu"
import { ArrowLeft } from "lucide-react"

interface CategoryPageHeaderProps {
  categoryName: string
  categoryEmoji: string
  categoryDescription?: string | null
  skillCount: number
  topicCount: number
}

export function CategoryPageHeader({
  categoryName,
  categoryEmoji,
  categoryDescription,
  skillCount,
  topicCount
}: CategoryPageHeaderProps) {
  return (
    <>
      {/* Minimal header */}
      <div className="border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="group hover:opacity-70 transition-opacity"
            >
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                CivicSense
              </h1>
            </Link>
            
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            href="/categories" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors font-light"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Categories
          </Link>
        </div>

        {/* Category header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl" role="img" aria-label={categoryName}>
              {categoryEmoji}
            </span>
            <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
              {categoryName}
            </h1>
          </div>
          
          {categoryDescription && (
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
              {categoryDescription}
            </p>
          )}

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-4 pt-4">
            {skillCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {skillCount} skill{skillCount !== 1 ? 's' : ''}
              </span>
            )}
            {topicCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                {topicCount} topic{topicCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 