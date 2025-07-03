import { Metadata } from 'next'
import { JoinPodForm } from './join-pod-form'

interface JoinPodPageProps {
  params: {
    inviteCode: string
  }
}

export async function generateMetadata({ params }: JoinPodPageProps): Promise<Metadata> {
  return {
    title: `Join Learning Pod - ${params.inviteCode} | CivicSense`,
    description: 'Join a learning pod and start learning civics with others.',
  }
}

export default function JoinPodPage({ params }: JoinPodPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <JoinPodForm inviteCode={params.inviteCode} />
      </div>
    </div>
  )
} 