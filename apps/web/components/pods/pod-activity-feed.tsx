import React from 'react'
import { Activity } from 'lucide-react'

interface PodActivityFeedProps {
  showPodName?: boolean
  limit?: number
  className?: string
}

export function PodActivityFeed({ showPodName = false, limit = 10, className }: PodActivityFeedProps) {
  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Placeholder for activity feed */}
        <div className="flex items-center justify-center p-8 text-gray-400">
          <Activity className="h-6 w-6 mr-2" />
          <span>No recent activity</span>
        </div>
      </div>
    </div>
  )
} 