/**
 * ============================================================================
 * ADMIN TRANSLATIONS PAGE
 * ============================================================================
 * Main page for translation and localization management in CivicSense admin panel.
 * Provides comprehensive DeepL integration and bulk translation capabilities.
 */

import { Metadata } from 'next'
import { TranslationAdminDashboard } from '@/components/admin/translation-admin-dashboard'

export const metadata: Metadata = {
  title: 'Translation & Localization Management | CivicSense Admin',
  description: 'Manage multilingual content translation with DeepL integration for civic education platform',
  keywords: ['translation', 'localization', 'DeepL', 'multilingual', 'civic education', 'admin'],
}

export default function AdminTranslationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TranslationAdminDashboard />
        </div>
      </main>
    </div>
  )
} 