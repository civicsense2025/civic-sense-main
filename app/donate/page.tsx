import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import { DonateForm } from '@/components/donate-form'
import { AutoReadPage } from '@/components/auto-read-page'
import { FeedbackButton } from '@/components/feedback'

export const metadata: Metadata = {
  title: 'Support CivicSense | Donate',
  description: 'Help us build a more informed society by supporting CivicSense.',
}

export default function DonatePage() {
  return (
    <>
      <Script
        src="https://js.stripe.com/v3/"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <AutoReadPage />
        
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-900 mb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
            <Link 
              href="/" 
              className="group hover:opacity-70 transition-opacity"
            >
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                CivicSense
              </h1>
            </Link>
          </div>
        </div>

        <div className="apple-container py-16">
          <div className="max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16 apple-animate-in">
              <div className="text-6xl mb-6">🏛️</div>
              <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-6">
                Support CivicSense
              </h1>
              <p className="text-xl sm:text-2xl font-light text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
                Politics overwhelms you by design. We break it down daily so you can build up power and reclaim your voice.
              </p>
              <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Research shows civic education increases voter participation and community engagement. Your support makes this accessible to more people.
              </p>
            </div>

            {/* Donation Form Component - Front and Center */}
            <DonateForm />

            {/* Other Ways to Help */}
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6 text-center">Other Ways to Help</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-4xl mb-4">
                      📢
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">Spread the Word</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Share CivicSense with friends and family</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-4">
                      ⭐
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">Leave Feedback</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Help us improve with your suggestions</p>
                    <FeedbackButton 
                      label="Share Your Feedback" 
                      contextType="general" 
                      contextId="donate_page" 
                      variant="outline"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transparency */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-2xl blur-lg"></div>
                <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-8 py-6 rounded-2xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                    <strong>100% Transparent:</strong> Your donations directly support content creation, 
                    platform development, and keeping CivicSense ad-free and privacy-focused.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with margin */}
        <div className="mt-8">
          {/* Footer content handled by layout */}
        </div>
      </div>
    </>
  )
} 