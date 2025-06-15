import { Metadata } from 'next'
import Link from 'next/link'
import { AutoReadPage } from '@/components/auto-read-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | CivicSense',
  description: 'Learn how CivicSense protects your privacy and handles your data.',
}

export default function PrivacyPage() {
  return (
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 apple-animate-in">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl sm:text-2xl font-light text-slate-700 dark:text-slate-300 leading-relaxed">
              We believe in transparency about how we protect your data
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
              <strong>Last updated:</strong> January 2025
            </p>
          </div>

          {/* Introduction */}
          <div className="relative mb-12 apple-slide-up">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
              <p className="text-base text-slate-700 dark:text-slate-300">
                At CivicSense, we believe in being transparent about how we collect, use, and protect your information. 
                This policy explains our practices in plain English.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            {/* What We Collect */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">What Information We Collect</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Account Information</h3>
                    <div className="prose">
                      <ul>
                        <li>Email address (for account creation and communication)</li>
                        <li>Name (if you choose to provide it)</li>
                        <li>Profile preferences (theme, notification settings)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Learning Data</h3>
                    <div className="prose">
                      <ul>
                        <li>Quiz scores and performance metrics</li>
                        <li>Questions answered and time spent</li>
                        <li>Learning preferences and skill progress</li>
                        <li>Custom deck preferences (premium users)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Technical Information</h3>
                    <div className="prose">
                      <ul>
                        <li>Device and browser information</li>
                        <li>IP address and general location</li>
                        <li>Usage patterns and app performance data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">How We Use Your Information</h2>
                <div className="prose">
                  <ul>
                    <li><strong>Personalize your experience:</strong> Track your progress, recommend relevant content, and adapt difficulty levels</li>
                    <li><strong>Improve our service:</strong> Analyze usage patterns to enhance features and fix issues</li>
                    <li><strong>Communicate with you:</strong> Send important updates, respond to support requests</li>
                    <li><strong>Premium features:</strong> Generate custom learning content (see AI Usage section below)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Third-Party Services</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Stripe (Payment Processing)</h3>
                    <p className="text-base text-slate-700 dark:text-slate-300">
                      We use Stripe to process payments securely. Stripe handles all payment information according to 
                      <a href="https://stripe.com/privacy" className="text-interactive hover:text-interactive" target="_blank" rel="noopener noreferrer">
                        their privacy policy
                      </a>. We never store your full credit card information on our servers.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">OpenAI (AI Content Generation)</h3>
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <p className="text-base text-blue-900 dark:text-blue-100">
                        <strong>Important:</strong> We take your privacy seriously when using AI services.
                      </p>
                    </div>
                    <div className="prose">
                      <ul>
                        <li><strong>Only for premium features:</strong> AI is used solely to generate custom learning decks and personalized content</li>
                        <li><strong>Data is anonymized:</strong> We remove all personal identifiers before sending data to OpenAI</li>
                        <li><strong>No account linkage:</strong> OpenAI never receives your name, email, payment info, or any data that could identify you</li>
                        <li><strong>Opt-in only:</strong> AI features are only used if you subscribe to premium services</li>
                        <li><strong>Learning patterns only:</strong> We only share anonymized learning preferences and general performance patterns</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Your Rights</h2>
                <p className="text-base text-slate-700 dark:text-slate-300 mb-4">You have the right to:</p>
                <div className="prose">
                  <ul>
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Update:</strong> Correct any inaccurate information</li>
                    <li><strong>Delete:</strong> Request deletion of your account and data</li>
                    <li><strong>Export:</strong> Download your learning data</li>
                    <li><strong>Opt-out:</strong> Disable AI features or data collection at any time</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Contact Us</h2>
                <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                  Questions about this privacy policy or your data? We're here to help:
                </p>
                <div className="prose">
                  <ul>
                    <li>Email: privacy@civicsense.com</li>
                    <li>Use the contact form in your account settings</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Line */}
          <div className="relative mt-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-2xl blur-lg"></div>
            <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-8 py-6 rounded-2xl">
              <p className="text-base text-slate-700 dark:text-slate-300">
                <strong>Bottom line:</strong> We collect only what's necessary to provide you with a great learning experience. 
                We never sell your data, and when we use AI services, your personal information never leaves our servers in an identifiable form.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 