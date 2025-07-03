import { Metadata } from 'next'
import Link from 'next/link'
import { AutoReadPage } from '@civicsense/ui-web'
import { ServerHeader } from '@civicsense/ui-web'
import { TableOfContents } from '@civicsense/ui-web'

export const metadata: Metadata = {
  title: 'Terms of Service | CivicSense',
  description: 'Terms and conditions for using CivicSense.',
}

// Define TOC items
const tocItems = [
  { id: 'educational-use', text: 'Educational Use & FERPA Compliance', level: 2 },
  { id: 'using-civicsense', text: 'Using CivicSense', level: 2 },
  { id: 'community-standards', text: 'Community Standards & Zero Tolerance', level: 2 },
  { id: 'ai-features', text: 'AI Features & Technology', level: 2 },
  { id: 'multiplayer-social', text: 'Multiplayer & Learning Pods', level: 2 },
  { id: 'your-account', text: 'Your Account', level: 2 },
  { id: 'premium-services', text: 'Premium Services', level: 2 },
  { id: 'content-ip', text: 'Content & Intellectual Property', level: 2 },
  { id: 'privacy-data', text: 'Privacy & Data', level: 2 },
  { id: 'disclaimers', text: 'Important Disclaimers', level: 2 },
  { id: 'limitation-liability', text: 'Limitation of Liability', level: 2 },
  { id: 'indemnification', text: 'Indemnification', level: 2 },
  { id: 'dispute-resolution', text: 'Dispute Resolution', level: 2 },
  { id: 'changes-terms', text: 'Changes to These Terms', level: 2 },
  { id: 'contact', text: 'Contact Us', level: 2 },
]

export default function TermsPage() {
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
                <div className="text-6xl mb-6">📋</div>
                <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-tight mb-6">
                  Terms of Service
                </h1>
                <p className="text-xl sm:text-2xl font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  Clear terms for using CivicSense
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
                    Welcome to CivicSense! These terms ("Terms") constitute a legally binding agreement between you and CivicSense Labs Inc. ("we," "us," or "our") 
                    governing your use of our civic education platform, including our website, mobile applications, and all related services (collectively, the "Service"). 
                    <strong>For educational institutions, we act as a School Official with a legitimate educational interest under FERPA.</strong> 
                    By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-12">
                {/* Educational Use */}
                <section id="educational-use" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Educational Use & FERPA Compliance</h2>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <p className="text-base text-blue-900 dark:text-blue-200">
                        <strong>School Official Status:</strong> When serving educational institutions, CivicSense acts as a School Official 
                        with a legitimate educational interest under FERPA and complies with all applicable educational privacy laws.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Educational Institution Terms</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>FERPA compliance:</strong> We maintain compliance with Family Educational Rights and Privacy Act requirements</li>
                            <li><strong>COPPA protections:</strong> Enhanced protections for students under 13 with parental consent requirements</li>
                            <li><strong>Data minimization:</strong> We collect only educational data necessary for providing our service</li>
                            <li><strong>No advertising:</strong> Educational data is never used for advertising or commercial purposes</li>
                            <li><strong>Google Classroom integration:</strong> Seamless integration with existing educational workflows</li>
                            <li><strong>Teacher controls:</strong> Comprehensive classroom management and content filtering tools</li>
                            <li><strong>Data retention:</strong> Educational records deleted within 30 days of contract termination</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Service Level Agreement</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Uptime guarantee:</strong> 99.5% monthly uptime for all services</li>
                            <li><strong>Educational support:</strong> Priority support for educational institutions during school hours</li>
                            <li><strong>Data backup:</strong> Automated daily backups with 90-day retention for disaster recovery</li>
                            <li><strong>Security monitoring:</strong> 24/7 security monitoring and incident response</li>
                            <li><strong>Maintenance windows:</strong> Scheduled maintenance outside educational hours when possible</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Using CivicSense */}
                <section id="using-civicsense" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Using CivicSense</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Eligibility & Access</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>You must be at least 13 years old to use the Service</li>
                            <li>Users under 18 require parental or guardian consent</li>
                            <li>You must provide accurate and complete registration information</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                            <li>You must notify us immediately of any unauthorized access to your account</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Permitted Use</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Access educational content and take quizzes for personal learning</li>
                            <li>Track your progress and earn achievements through our gamification system</li>
                            <li>Participate in multiplayer quiz games and learning competitions</li>
                            <li>Join or create learning pods for collaborative education</li>
                            <li>Interact with our AI-powered learning assistant for educational purposes</li>
                            <li>Subscribe to premium features for enhanced learning experiences</li>
                            <li>Share your achievements and progress (but not other users' data)</li>
                            <li>Use accessibility features including text-to-speech and translations</li>
                            <li>Provide feedback to help improve our Service</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Prohibited Conduct</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Copy, distribute, or modify our content without written permission</li>
                            <li>Use automated systems or software to extract data from the Service</li>
                            <li>Create multiple accounts or share account credentials</li>
                            <li>Circumvent any content protection or access restriction measures</li>
                            <li>Interfere with or disrupt the Service or servers</li>
                            <li>Attempt to gain unauthorized access to any portion of the Service</li>
                            <li>Engage in any activity that could damage our reputation or business</li>
                            <li>Use the Service for commercial purposes without our consent</li>
                            <li>Reverse engineer or attempt to extract source code</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Community Standards */}
                <section id="community-standards" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Community Standards & Zero Tolerance Policy</h2>
                    
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                      <p className="text-base text-red-900 dark:text-red-200">
                        <strong>Zero Tolerance:</strong> We maintain a zero tolerance policy for harassment, discrimination, hate speech, or any behavior 
                        that creates an unsafe or unwelcoming environment. Violations result in immediate account suspension or termination.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Prohibited Behavior</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Harassment or bullying:</strong> Intimidation, threats, stalking, or persistent unwanted contact</li>
                            <li><strong>Discrimination:</strong> Targeting individuals based on protected characteristics</li>
                            <li><strong>Hate speech:</strong> Content promoting violence or hatred against any group</li>
                            <li><strong>Doxxing:</strong> Sharing private information without consent</li>
                            <li><strong>Impersonation:</strong> Pretending to be another person or entity</li>
                            <li><strong>Spam:</strong> Repetitive, irrelevant, or unsolicited content</li>
                            <li><strong>Misinformation:</strong> Deliberately spreading false civic information</li>
                            <li><strong>Sexual content:</strong> Any sexually explicit or suggestive material</li>
                            <li><strong>Violence:</strong> Threats of violence or content glorifying violence</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Enforcement & Consequences</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Immediate suspension:</strong> For severe violations pending investigation</li>
                            <li><strong>Content removal:</strong> Violating content removed without notice</li>
                            <li><strong>Account termination:</strong> Permanent ban for serious or repeated violations</li>
                            <li><strong>Legal action:</strong> We reserve the right to pursue legal remedies</li>
                            <li><strong>Law enforcement:</strong> Illegal activities will be reported to authorities</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* AI Features */}
                <section id="ai-features" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">AI Features & Technology</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">AI Usage Guidelines</h3>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                          <p className="text-base text-blue-900 dark:text-blue-200">
                            <strong>Educational Purpose:</strong> Our AI features are designed solely for civic education and must not be used for 
                            political campaigning, spreading misinformation, or any non-educational purposes.
                          </p>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Accuracy disclaimer:</strong> AI responses may contain errors; verify important information</li>
                            <li><strong>No professional advice:</strong> AI guidance is educational only, not legal or professional advice</li>
                            <li><strong>Content generation:</strong> AI-generated content remains our intellectual property</li>
                            <li><strong>Privacy:</strong> AI interactions are processed with data anonymization</li>
                            <li><strong>Prohibited uses:</strong> Do not attempt to extract training data or manipulate AI systems</li>
                            <li><strong>Feedback:</strong> Report any concerning AI behavior immediately</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Multiplayer & Social */}
                <section id="multiplayer-social" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Multiplayer & Learning Pods</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Fair Play Policy</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>No cheating:</strong> Compete honestly without external assistance or exploits</li>
                            <li><strong>Respectful competition:</strong> Maintain sportsmanship in all interactions</li>
                            <li><strong>No manipulation:</strong> Do not exploit bugs or game mechanics</li>
                            <li><strong>Account sharing:</strong> Each player must use their own account</li>
                            <li><strong>Communication:</strong> Keep all chat appropriate and constructive</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Learning Pod Guidelines</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Educational focus:</strong> Pods must maintain focus on civic learning</li>
                            <li><strong>Moderator responsibility:</strong> Pod creators must enforce community standards</li>
                            <li><strong>Privacy:</strong> Respect members' privacy and learning progress</li>
                            <li><strong>Inclusive environment:</strong> Welcome all learners regardless of skill level</li>
                            <li><strong>Content sharing:</strong> Only share appropriate educational materials</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Your Account */}
                <section id="your-account" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Your Account</h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Account security:</strong> You are solely responsible for maintaining account security</li>
                        <li><strong>Accurate information:</strong> Provide and maintain accurate account information</li>
                        <li><strong>Age requirements:</strong> Users under 18 must have parental consent on file</li>
                        <li><strong>Account transfer:</strong> Accounts are non-transferable and non-assignable</li>
                        <li><strong>Termination:</strong> We may terminate accounts that violate these Terms</li>
                        <li><strong>Data retention:</strong> Account data is retained per our Privacy Policy</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Premium Services */}
                <section id="premium-services" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Premium Services</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Subscription Terms</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>Billing:</strong> Subscriptions auto-renew unless cancelled before renewal date</li>
                            <li><strong>Price changes:</strong> We'll provide 30 days notice of price increases</li>
                            <li><strong>Cancellation:</strong> Cancel anytime; access continues until end of billing period</li>
                            <li><strong>No sharing:</strong> Premium accounts are for individual use only</li>
                            <li><strong>Payment processing:</strong> All payments processed securely through Stripe</li>
                            <li><strong>Taxes:</strong> You're responsible for applicable taxes</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Refund Policy</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li><strong>30-day guarantee:</strong> Full refund within 30 days of initial purchase</li>
                            <li><strong>Annual plans:</strong> Prorated refunds may be available at our discretion</li>
                            <li><strong>Lifetime access:</strong> Non-refundable after 30 days</li>
                            <li><strong>Donations:</strong> Generally non-refundable but grant access benefits</li>
                            <li><strong>Disputes:</strong> Contact support before initiating chargebacks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Content & IP */}
                <section id="content-ip" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Content & Intellectual Property</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Our Intellectual Property</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                          All content on the Service, including text, graphics, logos, images, audio, video, data compilations, 
                          and software, is owned by us or our licensors and protected by intellectual property laws.
                        </p>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <ul className="text-slate-700 dark:text-slate-300">
                            <li>Quiz questions, answers, and explanations</li>
                            <li>Learning algorithms and gamification systems</li>
                            <li>User interface design and experience</li>
                            <li>AI models and generated content</li>
                            <li>All trademarks and service marks</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Limited License</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300">
                          We grant you a limited, non-exclusive, non-transferable license to access and use the Service 
                          for personal, non-commercial educational purposes only. This license does not include rights to:
                          copy, modify, distribute, sell, or lease any part of our Service or content.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">User Content</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300">
                          By submitting content to the Service, you grant us a worldwide, non-exclusive, royalty-free license 
                          to use, reproduce, modify, and distribute your content for the purpose of operating and improving the Service.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Privacy & Data */}
                <section id="privacy-data" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Privacy & Data</h2>
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      Your use of the Service is also governed by our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>, 
                      which is incorporated into these Terms by reference.
                    </p>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li>We collect and process data as described in our Privacy Policy</li>
                        <li>You consent to such collection and processing by using the Service</li>
                        <li>We implement reasonable security measures to protect your data</li>
                        <li>You can request data deletion per our Privacy Policy</li>
                        <li>We comply with applicable data protection laws</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Disclaimers */}
                <section id="disclaimers" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Important Disclaimers</h2>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                      <p className="text-base text-amber-900 dark:text-amber-200">
                        <strong>Educational Purpose Only:</strong> The Service provides civic education and should not be considered 
                        legal, financial, or professional advice. Always consult qualified professionals for specific situations.
                      </p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>"AS IS" BASIS:</strong> The Service is provided without warranties of any kind</li>
                        <li><strong>Accuracy:</strong> We strive for accuracy but cannot guarantee error-free content</li>
                        <li><strong>Availability:</strong> We don't guarantee uninterrupted access to the Service</li>
                        <li><strong>Third-party content:</strong> We're not responsible for third-party content or links</li>
                        <li><strong>User content:</strong> We don't endorse or verify user-generated content</li>
                        <li><strong>Results:</strong> We don't guarantee specific learning outcomes or results</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section id="limitation-liability" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 via-slate-500/10 to-gray-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Limitation of Liability</h2>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 mb-4">
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL CIVICSENSE, ITS OFFICERS, DIRECTORS, 
                        EMPLOYEES, OR AGENTS BE LIABLE FOR:
                      </p>
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                        <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
                        <li><strong>Individual users:</strong> Damages exceeding $100 or the amount paid to us in the past 12 months</li>
                        <li><strong>Educational institutions:</strong> Damages exceeding the annual license fee paid to us</li>
                        <li>Any matter beyond our reasonable control</li>
                      </ul>
                      <p className="text-slate-700 dark:text-slate-300 mt-4">
                        This limitation applies regardless of the legal theory on which the claim is based. For educational institutions,
                        liability is specifically capped at the annual license fee as defined in your executed contract.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Indemnification */}
                <section id="indemnification" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Indemnification</h2>
                    
                    <p className="text-base text-slate-700 dark:text-slate-300">
                      You agree to indemnify, defend, and hold harmless CivicSense and its officers, directors, employees, 
                      and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorney fees) 
                      arising from: (i) your use of the Service; (ii) your violation of these Terms; (iii) your violation of any 
                      third-party rights; or (iv) any content you submit to the Service.
                    </p>
                  </div>
                </section>

                {/* Dispute Resolution */}
                <section id="dispute-resolution" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Dispute Resolution</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Informal Resolution</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300">
                          Before filing a formal dispute, you agree to try to resolve the dispute informally by contacting us 
                          at legal@civicsense.com. We'll try to resolve the dispute informally for 60 days.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Binding Arbitration</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                          If informal resolution fails, disputes will be resolved through binding arbitration under the 
                          American Arbitration Association rules, except you may assert claims in small claims court.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <p className="text-sm text-blue-900 dark:text-blue-200">
                            <strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive any right 
                            to participate in class actions, class arbitrations, or representative actions.
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Governing Law</h3>
                        <p className="text-base text-slate-700 dark:text-slate-300">
                          These Terms are governed by the laws of Delaware, USA (our state of incorporation), without regard to conflict of law principles. 
                          For educational institutions, any applicable state educational data privacy laws will also apply and will not be superseded by Delaware law 
                          where such state laws provide greater protection.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Changes to Terms */}
                <section id="changes-terms" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Changes to These Terms</h2>
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      We may modify these Terms at any time. When we do:
                    </p>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li>We'll notify you via email and/or prominent notice on the Service</li>
                        <li>Changes become effective 30 days after posting unless urgent</li>
                        <li>Your continued use constitutes acceptance of the new Terms</li>
                        <li>If you disagree, you must stop using the Service and may close your account</li>
                        <li>We'll maintain an archive of previous versions upon request</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="relative scroll-mt-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-slate-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-6">Contact Us</h2>
                    <p className="text-base text-slate-700 dark:text-slate-300 mb-4">
                      For questions about these Terms or the Service:
                    </p>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ul className="text-slate-700 dark:text-slate-300">
                        <li><strong>Legal matters:</strong> legal@civicsense.com</li>
                        <li><strong>General support:</strong> support@civicsense.com</li>
                        <li><strong>Educational institutions:</strong> schools@civicsense.com</li>
                        <li><strong>Privacy concerns:</strong> privacy@civicsense.com</li>
                        <li><strong>Security issues:</strong> security@civicsense.com</li>
                        <li><strong>Company:</strong> CivicSense Labs Inc.</li>
                        <li><strong>Response time:</strong> Legal matters within 2-3 business days, educational institutions within 1 business day</li>
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
                    <strong>Thank you for using CivicSense!</strong> We're committed to providing a safe, effective, and enjoyable 
                    civic education experience. By following these Terms, you help us maintain a positive learning community for everyone.
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