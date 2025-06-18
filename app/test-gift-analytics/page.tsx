import { GiftCreditsAnalytics } from '@/components/gift-credits-analytics'

export const metadata = {
  title: 'Gift Credits Analytics Test | CivicSense',
  description: 'Test page for the gift credits analytics dashboard.',
}

export default function TestGiftAnalyticsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
              Gift Credits Analytics Test
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Comprehensive analytics dashboard showing detailed tracking of gift credits, individual claims, and people helped.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
        <GiftCreditsAnalytics />
      </div>
    </div>
  )
} 