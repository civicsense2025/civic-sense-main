import { Metadata } from 'next'
import Link from 'next/link'
import { AutoReadPage } from '@/components/auto-read-page'

export const metadata: Metadata = {
  title: 'Terms of Service | CivicSense',
  description: 'Terms and conditions for using CivicSense.',
}

export default function TermsPage() {
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
            <div className="text-6xl mb-6">📋</div>
            <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-6">
              Terms of Service
            </h1>
            <p className="text-xl sm:text-2xl font-light text-slate-700 dark:text-slate-300 leading-relaxed">
              Clear terms for using CivicSense
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
                Welcome to CivicSense! These terms explain your rights and responsibilities when using our civic education platform. 
                By using CivicSense, you agree to these terms.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            {/* Using CivicSense */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Using CivicSense</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">What You Can Do</h3>
                    <div className="prose">
                      <ul>
                        <li>Take quizzes and learn about civic topics</li>
                        <li>Track your progress and earn achievements</li>
                        <li>Create an account to save your progress</li>
                        <li>Subscribe to premium features for enhanced learning</li>
                        <li>Share your achievements (but not other users' data)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">What You Can't Do</h3>
                    <div className="prose">
                      <ul>
                        <li>Copy, redistribute, or sell our content</li>
                        <li>Use automated tools to scrape or access our service</li>
                        <li>Create multiple accounts to abuse free trials</li>
                        <li>Share your premium account with others</li>
                        <li>Use the service for any illegal or harmful purposes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Account */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Your Account</h2>
                <div className="prose">
                  <ul>
                    <li><strong>Account security:</strong> You're responsible for keeping your login information secure</li>
                    <li><strong>Accurate information:</strong> Please provide accurate information when creating your account</li>
                    <li><strong>One account per person:</strong> Each person should have only one account</li>
                    <li><strong>Account termination:</strong> We may suspend accounts that violate these terms</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Premium Services */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Premium Services</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Billing</h3>
                    <div className="prose">
                      <ul>
                        <li>Premium subscriptions are billed monthly or annually</li>
                        <li>Lifetime subscriptions are one-time payments</li>
                        <li>All payments are processed securely through Stripe</li>
                        <li>Prices may change with 30 days notice to existing subscribers</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Cancellation & Refunds</h3>
                    <div className="prose">
                      <ul>
                        <li>You can cancel your subscription anytime from your account settings</li>
                        <li>Cancellation takes effect at the end of your current billing period</li>
                        <li>Refunds are available within 30 days of purchase for annual subscriptions</li>
                        <li>Lifetime subscriptions are final sale after 30 days</li>
                        <li>We may offer prorated refunds at our discretion</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Content & Intellectual Property */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Content & Intellectual Property</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Our Content</h3>
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      All quizzes, explanations, and educational materials on CivicSense are our intellectual property or used with permission. 
                      This includes:
                    </p>
                    <div className="prose">
                      <ul>
                        <li>Quiz questions and answers</li>
                        <li>Explanations and educational content</li>
                        <li>Progress tracking algorithms</li>
                        <li>User interface and design</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Fair Use</h3>
                    <p className="text-base text-slate-700 dark:text-slate-300">
                      You may reference our content for educational purposes, but please cite CivicSense as the source. 
                      Commercial use requires written permission.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy & Data */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Privacy & Data</h2>
                <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                  Your privacy is important to us. Our <Link href="/privacy" className="text-interactive hover:text-interactive">Privacy Policy</Link> explains 
                  how we collect, use, and protect your information.
                </p>
                <div className="prose">
                  <ul>
                    <li>We collect only what's necessary to provide our service</li>
                    <li>We never sell your personal information</li>
                    <li>You can request deletion of your data at any time</li>
                    <li>AI features use anonymized data only</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Important Disclaimers</h2>
                
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                  <p className="text-base text-amber-900 dark:text-amber-100">
                    <strong>Educational Purpose:</strong> CivicSense is for educational purposes only and should not be considered legal or political advice.
                  </p>
                </div>

                <div className="prose">
                  <ul>
                    <li><strong>Accuracy:</strong> We strive for accuracy but cannot guarantee all information is error-free</li>
                    <li><strong>Updates:</strong> Civic information changes frequently; we update content regularly but some may be outdated</li>
                    <li><strong>Bias:</strong> We aim for balanced, non-partisan content but acknowledge that complete objectivity is challenging</li>
                    <li><strong>Sources:</strong> We cite reliable sources but encourage you to verify important information independently</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Changes to These Terms</h2>
                <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                  We may update these terms occasionally. When we do:
                </p>
                <div className="prose">
                  <ul>
                    <li>We'll notify you via email or in-app notification</li>
                    <li>Changes take effect 30 days after notification</li>
                    <li>Continued use of CivicSense means you accept the new terms</li>
                    <li>If you don't agree, you can cancel your account</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-slate-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h2 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-6">Questions?</h2>
                <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                  If you have questions about these terms, please contact us:
                </p>
                <div className="prose">
                  <ul>
                    <li>Email: legal@civicsense.com</li>
                    <li>Use the contact form in your account settings</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Line */}
          <div className="relative mt-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-lg"></div>
            <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-8 py-6 rounded-2xl">
              <p className="text-base text-slate-700 dark:text-slate-300">
                <strong>In simple terms:</strong> Use CivicSense to learn about civic topics, respect our content and other users, 
                and we'll provide you with a great educational experience while protecting your privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 