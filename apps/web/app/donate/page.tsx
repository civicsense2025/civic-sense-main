"use client"

import Script from 'next/script'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
// Temporary stub for monorepo migration
const DonateForm = ({ donationPriceId }: any) => (
  <div className="text-center p-8 border rounded-lg">
    <h3 className="text-xl font-medium mb-4">Donation Form (Stub)</h3>
    <p className="text-gray-600 mb-4">Donation functionality temporarily disabled during migration</p>
    <button className="bg-blue-600 text-white px-6 py-2 rounded">Donate</button>
  </div>
)
import { AutoReadPage } from "../../components/ui"
// Temporary stub for monorepo migration
const FeedbackButton = ({ label, contextType, contextId, variant }: any) => (
  <button className="border border-gray-300 px-4 py-2 rounded text-sm">
    {label}
  </button>
)
import { Header } from "../../components/ui"
import { AuthDialog } from "../../components/ui"
import { useAuth } from "../../components/ui"
// Temporary stub for monorepo migration
const useGuestAccess = () => ({
  resetGuestState: () => console.log('Guest state reset (stub)')
})
import { Alert, AlertTitle, AlertDescription } from "../../components/ui"
import { Info } from 'lucide-react'

// Client component that uses useSearchParams
function DonateContent() {
  const searchParams = useSearchParams()
  const source = searchParams.get('source')
  const { user } = useAuth()
  const { resetGuestState } = useGuestAccess()
  const [showPremiumMessage, setShowPremiumMessage] = useState(false)
  
  // Check if user came from premium gate
  useEffect(() => {
    if (source === 'premium_gate') {
      setShowPremiumMessage(true)
    }
  }, [source])
  
  // Reset guest access limits when user donates
  const handleDonationSuccess = () => {
    resetGuestState()
    // Additional logic for tracking donation-based access could go here
  }

  // Get the Stripe donation price/product ID from env
  const donationPriceId = process.env.NEXT_PUBLIC_STRIPE_DONATION

  return (
    <>
      {/* Premium Access Message */}
      {showPremiumMessage && (
        <Alert className="mb-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-700 dark:text-blue-300 font-medium">
            Unlock Premium Access with Your Donation
          </AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            Donate $25+ for annual access or $50+ for lifetime access to all quizzes and premium features.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Hero Section */}
      <div className="text-center mb-16 apple-animate-in">
        <div className="text-6xl mb-6">🏛️</div>
        <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-tight mb-6">
          Support CivicSense
        </h1>
        <p className="text-xl sm:text-2xl font-light text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
          Politics overwhelms you by design. We break it down daily so you can build up power and reclaim your voice.
        </p>
        <p className="text-base text-slate-500 dark:text-slate-500 max-w-2xl mx-auto">
          Research shows civic education increases voter participation and community engagement. Your support makes this accessible to more people.
        </p>
      </div>

      {/* Donation Form Component - Front and Center */}
      <DonateForm 
        donationPriceId={donationPriceId}
      />

      {/* Other Ways to Help */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
          <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6 text-center">Other Ways to Help</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">
                📢
              </div>
              <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Spread the Word</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Share CivicSense with friends and family</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">
                ⭐
              </div>
              <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Leave Feedback</h4>
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
            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl">
              <strong>100% Transparent:</strong> Your donations directly support content creation, 
              platform development, and keeping CivicSense ad-free and privacy-focused.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DonatePage() {
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  return (
    <>
      <Script
        src="https://js.stripe.com/v3/"
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <AutoReadPage />
        
        {/* Header */}
        <Header onSignInClick={() => setShowAuthDialog(true)} />

        <div className="apple-container py-16">
          <div className="max-w-3xl mx-auto">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <DonateContent />
            </Suspense>
          </div>
        </div>

        {/* Footer with margin */}
        <div className="mt-8">
          {/* Footer content handled by layout */}
        </div>
        
        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={() => setShowAuthDialog(false)}
          initialMode="sign-in"
        />
      </div>
    </>
  )
} 