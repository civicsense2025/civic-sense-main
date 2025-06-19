import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { PodManagementDashboard } from '@/components/learning-pods/pod-management-dashboard'
import { arePodsEnabled } from '@/lib/feature-flags'

interface PodPageProps {
  params: {
    podId: string
  }
}

export async function generateMetadata({ params }: PodPageProps): Promise<Metadata> {
  // In a real app, you'd fetch the pod name from the database
  const { podId } = await params
  return {
    title: `Pod Details | CivicSense`,
    description: 'Manage your learning pod members, settings, and activities.',
  }
}

export default async function PodPage({ params }: PodPageProps) {
  // Feature flag check - hide pods in production
  if (!arePodsEnabled()) {
    notFound()
  }

  const { podId } = await params

  // Basic validation
  if (!podId) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      
      <main className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <PodManagementDashboard podId={podId} />
        </div>
      </main>
    </div>
  )
} 