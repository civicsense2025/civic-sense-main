"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/admin-access'
import { ScheduledJobsManager } from '@/components/admin/scheduled-jobs-manager'

export default function ScheduledContentPage() {
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
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // Don't render anything for non-admin users
  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <ScheduledJobsManager />
    </div>
  )
} 