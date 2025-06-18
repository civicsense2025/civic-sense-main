import { Metadata } from 'next'
import { AdminContentGenerator } from '@/components/admin-content-generator'

export const metadata: Metadata = {
  title: 'Admin Content Generator - CivicSense',
  description: 'Transform current news into high-quality civic education quizzes with AI-powered content generation.',
}

export default function AdminContentDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <AdminContentGenerator />
      </div>
    </div>
  )
} 