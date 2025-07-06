import { Metadata } from 'next'
import Link from 'next/link'
import { AutoReadPage } from '@/components/auto-read-page'
import { ServerHeader } from '@/components/server-header'
import { TableOfContents } from '@/components/ui/table-of-contents'

export const metadata: Metadata = {
  title: 'Privacy Policy | CivicSense',
  description: 'Learn how CivicSense protects your privacy and handles your data.',
}

// Define TOC items
const tocItems = [
  { id: 'what-we-collect', text: 'What Information We Collect', level: 2 },
  { id: 'how-we-use', text: 'How We Use Your Information', level: 2 },
  { id: 'third-party', text: 'Third-Party Services', level: 2 },
  { id: 'data-sharing', text: 'Data Sharing & Protection', level: 2 },
  { id: 'your-rights', text: 'Your Rights & Controls', level: 2 },
  { id: 'childrens-privacy', text: 'Children\'s Privacy', level: 2 },
  { id: 'data-retention', text: 'Data Retention', level: 2 },
  { id: 'international-transfers', text: 'International Data Transfers', level: 2 },
  { id: 'cookies', text: 'Cookies & Tracking', level: 2 },
  { id: 'security', text: 'Security Measures', level: 2 },
  { id: 'breach-notification', text: 'Data Breach Notification', level: 2 },
  { id: 'contact-privacy', text: 'Contact Us About Privacy', level: 2 },
  { id: 'changes-policy', text: 'Changes to This Policy', level: 2 },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AutoReadPage />
      
      {/* Header */}
      <ServerHeader />

      <div className="apple-container py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative flex gap-12 items-start">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl min-w-0">
              {/* Header */}
              <div className="text-center mb-16 apple-animate-in">
                <div className="text-6xl mb-6">🔒</div>
                <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-tight mb-6">
                  Privacy Policy
                </h1>
                <p className="text-xl sm:text-2xl font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  We believe in transparency about how we protect your data
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
                  <strong>Last updated:</strong> June 18, 2025 | <strong>Effective date:</strong> June 18, 2025
                </p>
              </div>

              {/* Introduction */}
              <div className="relative mb-12 apple-slide-up">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                                      <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      CivicSense Labs Inc. ("we", "us") provides a civics-education platform for K-12 learners and general users. 
                      This policy explains our practices in plain English, covering all our features including AI assistance, 
                      multiplayer games, and learning pods. We are committed to protecting your privacy and giving you control 
                      over your personal information. <strong>We are FERPA and COPPA compliant and have signed the Student Data Privacy Consortium 
                      (SDPC) National Data Privacy Agreement v2.0.</strong>
                    </p>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-12">
                {/* What We Collect */}
                <section id="what-we-collect" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">What Information We Collect</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Account Information</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Email address (for account creation and communication)</li>
                            <li>Name (if you choose to provide it)</li>
                            <li>Profile preferences (theme, notification settings, accessibility options)</li>
                            <li>Educational status (for educational access verification)</li>
                            <li>Language preferences and accessibility settings</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Educational Records (FERPA Protected)</h3>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                          <p className="text-base text-blue-900 dark:text-blue-200">
                            <strong>FERPA Compliance:</strong> We act as a School Official with a legitimate educational interest when handling student data. 
                            Educational records are isolated in our school schema with enhanced protections.
                          </p>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Student names, grades, and school identification numbers</li>
                            <li>Course enrollments and teacher assignments</li>
                            <li>Quiz scores and educational progress tracking</li>
                            <li>Learning pod memberships and classroom integrations</li>
                            <li>Parent/guardian contact information (when applicable)</li>
                            <li>Google Classroom or other LMS integration data</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Learning Data</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Quiz scores, performance metrics, and progress tracking</li>
                            <li>Questions answered, time spent, and learning patterns</li>
                            <li>Skill assessments and knowledge gap analysis</li>
                            <li>Custom deck preferences and AI-generated content interactions (premium users)</li>
                            <li>Gamification data (XP, levels, achievements, streaks)</li>
                            <li>Learning objectives and personalized recommendations</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Social & Multiplayer Data</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Multiplayer game participation and performance</li>
                            <li>Learning pod memberships and interactions</li>
                            <li>Chat messages and communications in multiplayer features (moderated for safety)</li>
                            <li>Social features usage (sharing achievements, inviting friends)</li>
                            <li>Collaborative learning activities and group progress</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">AI Interaction Data</h3>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                          <p className="text-base text-blue-900 dark:text-blue-200">
                            <strong>Privacy First:</strong> All AI interactions are anonymized before processing. We never share 
                            your personal information with AI providers.
                          </p>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Conversations with our AI NPC (anonymized and encrypted)</li>
                            <li>Learning preferences used for AI personalization</li>
                            <li>Content generation requests and preferences</li>
                            <li>AI-powered accessibility feature usage (text-to-speech, translations)</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Technical Information</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Device and browser information</li>
                            <li>IP address and general location (for security and regional content)</li>
                            <li>Usage patterns and app performance data</li>
                            <li>Error logs and crash reports (anonymized)</li>
                            <li>Feature usage analytics and A/B testing data</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Payment & Subscription Data</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Subscription status and billing history (processed by Stripe)</li>
                            <li>Donation records for access verification</li>
                            <li>Educational access verification documents</li>
                            <li>Gift credit transactions and redemptions</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* How We Use Information */}
                <section id="how-we-use" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">How We Use Your Information</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Core Educational Features</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Personalize your experience:</strong> Track your progress, recommend relevant content, and adapt difficulty levels</li>
                            <li><strong>Gamification:</strong> Calculate XP, levels, achievements, and maintain learning streaks</li>
                            <li><strong>Skill assessment:</strong> Identify knowledge gaps and suggest targeted learning paths</li>
                            <li><strong>Progress analytics:</strong> Provide detailed insights into your learning journey</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">AI-Powered Features</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>AI NPC interactions:</strong> Provide personalized learning assistance and answer civic questions</li>
                            <li><strong>Content generation:</strong> Create custom quiz questions and learning materials based on your needs</li>
                            <li><strong>Accessibility:</strong> Power text-to-speech and language translation features</li>
                            <li><strong>Smart recommendations:</strong> Suggest relevant topics and learning objectives</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Social & Collaborative Features</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Multiplayer games:</strong> Match you with appropriate opponents and track game performance</li>
                            <li><strong>Learning pods:</strong> Enable collaborative learning and group progress tracking</li>
                            <li><strong>Safety & moderation:</strong> Monitor interactions to prevent harassment and maintain a positive environment</li>
                            <li><strong>Community features:</strong> Enable sharing achievements and connecting with other learners</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Platform Improvement & Communication</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Improve our service:</strong> Analyze usage patterns to enhance features and fix issues</li>
                            <li><strong>Communicate with you:</strong> Send important updates, respond to support requests</li>
                            <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security threats</li>
                            <li><strong>Legal compliance:</strong> Meet legal obligations and enforce our terms of service</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Third-Party Services */}
                <section id="third-party" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Third-Party Services</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Stripe (Payment Processing)</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                          We use Stripe to process payments securely. Stripe handles all payment information according to{' '}
                          <a href="https://stripe.com/privacy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            their privacy policy
                          </a>. We never store your full credit card information on our servers.
                        </p>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Subscription billing and management</li>
                            <li>Donation processing for access verification</li>
                            <li>Gift credit purchases and transactions</li>
                            <li>Refund and dispute handling</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">OpenAI (AI Content Generation)</h3>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                          <p className="text-base text-blue-900 dark:text-blue-200">
                            <strong>Privacy Protection:</strong> We take extraordinary measures to protect your privacy when using AI services.
                          </p>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>AI NPC conversations:</strong> All personal identifiers are stripped before processing</li>
                            <li><strong>Custom content generation:</strong> Only anonymized learning preferences are shared</li>
                            <li><strong>No account linkage:</strong> OpenAI never receives your name, email, payment info, or any data that could identify you</li>
                            <li><strong>Data retention:</strong> AI service providers do not retain conversation data beyond processing</li>
                            <li><strong>Opt-in only:</strong> AI features are only used if you explicitly enable them</li>
                            <li><strong>Local processing:</strong> Simple AI features like text-to-speech may be processed locally when possible</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Sub-Processors (Required for Educational Compliance)</h3>
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                          <p className="text-base text-green-900 dark:text-green-200">
                            <strong>Full Transparency:</strong> Below are all third-party services that may access your data, as required by the SDPC National Data Privacy Agreement.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Supabase (Database & Authentication)</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Location: AWS us-east-1 | Compliance: SOC 2 Type II</p>
                            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                              <li>• User account management and authentication</li>
                              <li>• Educational records storage with encryption at rest</li>
                              <li>• Learning progress and quiz data storage</li>
                              <li>• Multiplayer and learning pod data</li>
                            </ul>
                          </div>
                          
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Vercel (Front-end Hosting)</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Location: USA & EU PoPs | Compliance: ISO 27001, TLS 1.2+</p>
                            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                              <li>• Front-end hosting and edge network</li>
                              <li>• Performance metrics (anonymized)</li>
                              <li>• CDN for educational content delivery</li>
                            </ul>
                          </div>
                          
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Sentry (Error Monitoring)</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Location: USA | Compliance: DSF signed, Error payloads scrubbed</p>
                            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                              <li>• Error logging (non-PII only)</li>
                              <li>• Application stability monitoring</li>
                              <li>• Crash reports with personal data removed</li>
                            </ul>
                          </div>
                          
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Statsig (Product Analytics)</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Location: USA | Data Retention: 12 months maximum</p>
                            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                              <li>• Event tracking and user analytics (anonymized)</li>
                              <li>• Feature usage metrics and A/B testing</li>
                              <li>• Product performance monitoring</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Data Sharing & Protection */}
                <section id="data-sharing" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Data Sharing & Protection</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">What We Share</h3>
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                          <p className="text-base text-green-900 dark:text-green-200">
                            <strong>We never sell your personal data.</strong> Period. Your trust is more valuable than any payment.
                          </p>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Learning pod members:</strong> Only the progress and achievements you choose to share within your learning pods</li>
                            <li><strong>Multiplayer participants:</strong> Only your game performance and chosen display name during multiplayer sessions</li>
                            <li><strong>Public achievements:</strong> Only achievements you explicitly choose to share publicly</li>
                            <li><strong>Aggregated analytics:</strong> Anonymized, non-identifying usage statistics for research and improvement</li>
                            <li><strong>Legal requirements:</strong> Information when required by law or to protect rights and safety</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">What We Don't Share</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Personal information:</strong> Your email, name, or any identifying information</li>
                            <li><strong>Private learning data:</strong> Your individual quiz scores, learning patterns, or progress details</li>
                            <li><strong>AI conversations:</strong> Your private interactions with our AI NPC</li>
                            <li><strong>Payment information:</strong> Any financial or billing details</li>
                            <li><strong>Private communications:</strong> Messages or content not explicitly shared by you</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Your Rights & Controls */}
                <section id="your-rights" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Your Rights & Controls</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Privacy Rights</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300 mb-4">You have the right to:</p>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Update:</strong> Correct any inaccurate information in your account settings</li>
                            <li><strong>Delete:</strong> Request deletion of your account and all associated data</li>
                            <li><strong>Export:</strong> Download your learning data, progress, and achievements</li>
                            <li><strong>Opt-out:</strong> Disable AI features, analytics, or specific data collection at any time</li>
                            <li><strong>Portability:</strong> Transfer your data to another service</li>
                            <li><strong>Restrict processing:</strong> Limit how we use your information</li>
                            <li><strong>Object:</strong> Object to certain types of processing</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Granular Controls</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>AI features:</strong> Enable/disable AI NPC interactions and content generation</li>
                            <li><strong>Social features:</strong> Control visibility in multiplayer games and learning pods</li>
                            <li><strong>Analytics:</strong> Opt out of usage analytics and performance tracking</li>
                            <li><strong>Communications:</strong> Manage email preferences and notification settings</li>
                            <li><strong>Data sharing:</strong> Control what information is shared in collaborative features</li>
                            <li><strong>Accessibility:</strong> Enable/disable text-to-speech and translation features</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Account Management</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Profile settings:</strong> Control what information is visible to other users</li>
                            <li><strong>Learning pod privacy:</strong> Manage who can see your progress and invite you to pods</li>
                            <li><strong>Multiplayer settings:</strong> Control matchmaking preferences and communication options</li>
                            <li><strong>Data retention:</strong> Set preferences for how long we keep your inactive data</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Children's Privacy */}
                <section id="childrens-privacy" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Children's Privacy (COPPA Compliance)</h2>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                      <p className="text-base text-yellow-900 dark:text-yellow-200">
                        <strong>Age Requirement:</strong> CivicSense is designed for users 13 and older. Users under 18 need parental consent.
                      </p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Parental consent:</strong> Required for all users under 18</li>
                        <li><strong>Limited data collection:</strong> We collect minimal data from minors and never use it for advertising</li>
                        <li><strong>Enhanced protections:</strong> Additional privacy safeguards for users under 18</li>
                        <li><strong>Educational focus:</strong> All features for minors are strictly educational</li>
                        <li><strong>Moderated interactions:</strong> Enhanced moderation for any social features involving minors</li>
                        <li><strong>Parental access:</strong> Parents can request access to their child's data and account deletion</li>
                        <li><strong>No behavioral advertising:</strong> We never target ads to children</li>
                        <li><strong>Age verification:</strong> We use age screening to prevent underage access</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Data Retention */}
                <section id="data-retention" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 via-slate-500/10 to-gray-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Data Retention</h2>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Active accounts:</strong> Data is retained while your account is active</li>
                        <li><strong>Educational contracts:</strong> Educational records deleted within 30 days of contract termination (FERPA requirement)</li>
                        <li><strong>Individual accounts:</strong> Personal data deleted within 30 days of account deletion request</li>
                        <li><strong>Inactive accounts:</strong> Data may be deleted after 3 years of inactivity (with prior notice)</li>
                        <li><strong>Legal requirements:</strong> Some data may be retained longer for legal compliance</li>
                        <li><strong>Anonymized analytics:</strong> Anonymized usage data may be retained indefinitely for research</li>
                        <li><strong>AI training data:</strong> Anonymized interactions may be used to improve our AI systems</li>
                        <li><strong>Backup retention:</strong> Encrypted backups are retained for 90 days for disaster recovery</li>
                        <li><strong>Educational backups:</strong> Rolling 7-day backups align with database backup policy</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* International Transfers */}
                <section id="international-transfers" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">International Data Transfers</h2>
                    
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      CivicSense operates globally. Your information may be transferred to and processed in countries 
                      other than your own. We ensure appropriate safeguards are in place to protect your information 
                      regardless of where it's processed.
                    </p>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Data location:</strong> Primary servers are located in the United States</li>
                        <li><strong>Legal basis:</strong> We use standard contractual clauses for international transfers</li>
                        <li><strong>Security:</strong> All transfers are encrypted and secured</li>
                        <li><strong>Your rights:</strong> You maintain all privacy rights regardless of data location</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Cookies & Tracking */}
                <section id="cookies" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Cookies & Tracking Technologies</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Essential Cookies</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Authentication:</strong> Keep you logged in securely</li>
                            <li><strong>Preferences:</strong> Remember your theme and language settings</li>
                            <li><strong>Security:</strong> Protect against cross-site request forgery</li>
                            <li><strong>Session management:</strong> Maintain your session during use</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Analytics Cookies (Optional)</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Usage patterns:</strong> Understand how features are used</li>
                            <li><strong>Performance:</strong> Measure page load times and errors</li>
                            <li><strong>A/B testing:</strong> Test new features and improvements</li>
                            <li><strong>Opt-out available:</strong> You can disable analytics in settings</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Security Measures */}
                <section id="security" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Security Measures</h2>
                    
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      We implement industry-standard security measures to protect your information:
                    </p>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS) and at rest (AES-256)</li>
                        <li><strong>Access controls:</strong> Strict employee access controls and regular security audits</li>
                        <li><strong>Data minimization:</strong> We collect only what's necessary for our service</li>
                        <li><strong>Regular backups:</strong> Secure, encrypted backups to prevent data loss</li>
                        <li><strong>Incident response:</strong> Established procedures for handling any security incidents</li>
                        <li><strong>Anonymization:</strong> Personal identifiers are removed from analytics and AI processing</li>
                        <li><strong>Secure development:</strong> Security review of all code and features</li>
                        <li><strong>Vulnerability management:</strong> Regular security scans and updates</li>
                        <li><strong>Two-factor authentication:</strong> Available for enhanced account security</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Data Breach Notification */}
                <section id="breach-notification" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Data Breach Notification</h2>
                    
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      In the unlikely event of a data breach that affects your personal information:
                    </p>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Initial notification:</strong> 24-hour initial email to affected users and district CISOs</li>
                        <li><strong>Full report:</strong> Comprehensive 72-hour report with complete details</li>
                        <li><strong>Educational institutions:</strong> Direct notification to district administrators and IT security teams</li>
                        <li><strong>Detailed information:</strong> We'll explain what happened, what data was affected, and steps taken</li>
                        <li><strong>Remediation:</strong> We'll provide guidance on protecting yourself</li>
                        <li><strong>Support:</strong> Dedicated phone hotline and support for affected users</li>
                        <li><strong>Transparency:</strong> Public disclosure when appropriate</li>
                        <li><strong>Legal compliance:</strong> All notifications will meet FERPA and state educational data laws</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Contact & Questions */}
                <section id="contact-privacy" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Contact Us About Privacy</h2>
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      Questions about this privacy policy or your data? We're here to help:
                    </p>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Privacy inquiries:</strong> privacy@civicsense.com</li>
                        <li><strong>Data Protection Officer:</strong> dpo@civicsense.com</li>
                        <li><strong>Educational compliance:</strong> schools@civicsense.com</li>
                        <li><strong>Security concerns:</strong> security@civicsense.com</li>
                        <li><strong>Legal matters:</strong> legal@civicsense.com</li>
                        <li><strong>Data requests:</strong> Submit requests for data access, correction, or deletion through your account</li>
                        <li><strong>Response time:</strong> We respond to privacy requests within 30 days (educational institutions within 15 days)</li>
                        <li><strong>FERPA requests:</strong> Educational data requests processed within FERPA-required timeframes</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Changes to Policy */}
                <section id="changes-policy" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Changes to This Policy</h2>
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      When we update this privacy policy:
                    </p>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li>We'll notify you via email and in-app notification</li>
                        <li>Changes take effect 30 days after notification</li>
                        <li>We'll highlight significant changes clearly</li>
                        <li>Previous versions are available upon request</li>
                        <li>Continued use means you accept the updated policy</li>
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
                    <strong>Our Privacy Promise:</strong> We collect only what's necessary to provide you with a great learning experience. 
                    We never sell your data, we use strong privacy protections for all AI features, and you have complete control 
                    over your information. Your trust is our most valuable asset.
                  </p>
                </div>
              </div>
            </div>

            {/* Table of Contents - Desktop Only */}
            <div className="hidden lg:block flex-shrink-0 w-64 ml-12">
              <div className="sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
                <TableOfContents items={tocItems} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 