/**
 * ============================================================================
 * USER ANALYTICS ADMIN PAGE
 * ============================================================================
 * Comprehensive user analytics and behavior insights for admin dashboard
 */

"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/admin-access'
import { UserAnalyticsDashboard } from '@/components/admin/user-analytics-dashboard'

export default function UserAnalyticsPage() {
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard?error=admin_access_denied')
      return
    }
  }, [adminLoading, isAdmin, router])

  // Show loading while checking admin access
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <main className="w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-4">
              <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
              <div className="h-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Don't render anything for non-admin users
  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UserAnalyticsDashboard />
        </div>
      </main>
    </div>
  )
} 