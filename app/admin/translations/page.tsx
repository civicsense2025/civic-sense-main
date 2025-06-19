import { Metadata } from 'next'
import { ContentTranslationDashboard } from '@/components/admin/content-translation-dashboard'

export const metadata: Metadata = {
  title: 'Content Translation Management | CivicSense Admin',
  description: 'Manage and monitor bulk content translations across all languages',
}

export default function AdminTranslationsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <ContentTranslationDashboard />
    </div>
  )
} 