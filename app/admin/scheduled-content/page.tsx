import { Metadata } from 'next'
import { ScheduledJobsManager } from '@/components/admin/scheduled-jobs-manager'

export const metadata: Metadata = {
  title: 'Scheduled Content Generation - CivicSense Admin',
  description: 'Automate civic education content creation with intelligent scheduling',
}

export default function ScheduledContentPage() {
  return (
    <div className="container mx-auto py-8">
      <ScheduledJobsManager />
    </div>
  )
} 