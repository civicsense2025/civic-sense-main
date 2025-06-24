/**
 * ============================================================================
 * USER ANALYTICS ADMIN PAGE
 * ============================================================================
 * Comprehensive user analytics and behavior insights for admin dashboard
 */

import { Metadata } from 'next'
import { UserAnalyticsDashboard } from '@/components/admin/user-analytics-dashboard'

export const metadata: Metadata = {
  title: 'User Analytics | CivicSense Admin',
  description: 'User behavior analytics and engagement metrics for CivicSense platform',
  keywords: ['analytics', 'users', 'engagement', 'metrics', 'admin'],
}

export default function UserAnalyticsPage() {
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