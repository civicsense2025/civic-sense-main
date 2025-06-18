"use client"

import { useState } from 'react'
import { DonationThankYouPopover } from './donation-thank-you-popover'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function DonationThankYouDemo() {
  const [showPopover, setShowPopover] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<'annual' | 'lifetime'>('lifetime')
  const [selectedAmount, setSelectedAmount] = useState(50)

  const scenarios = [
    { 
      tier: 'annual' as const, 
      amount: 25, 
      label: '$25 Annual Access',
      description: 'One year of premium features'
    },
    { 
      tier: 'lifetime' as const, 
      amount: 50, 
      label: '$50 Lifetime Access',
      description: 'Unlimited access forever'
    },
    { 
      tier: 'lifetime' as const, 
      amount: 100, 
      label: '$100 + Gift Credits',
      description: 'Lifetime access + 1 annual gift'
    },
    { 
      tier: 'lifetime' as const, 
      amount: 250, 
      label: '$250 + Gift Credits',
      description: 'Lifetime access + 4 lifetime gifts'
    },
    { 
      tier: 'lifetime' as const, 
      amount: 500, 
      label: '$500 + Gift Credits',
      description: 'Lifetime access + 9 lifetime gifts'
    }
  ]

  const handleTriggerDemo = (tier: 'annual' | 'lifetime', amount: number) => {
    setSelectedScenario(tier)
    setSelectedAmount(amount)
    setShowPopover(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm bg-white/80 dark:bg-slate-950/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
              Donation Thank You Demo
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Interactive preview of the donation thank you experience with research citations and brand messaging
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
        <div className="space-y-12">
          {/* Demo scenarios */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                Choose a scenario to preview
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                Click any scenario below to see the donation thank you popover
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenarios.map((scenario, index) => (
                <Card 
                  key={index}
                  className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer group"
                  onClick={() => handleTriggerDemo(scenario.tier, scenario.amount)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                          {scenario.label}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          scenario.tier === 'lifetime' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {scenario.tier === 'lifetime' ? 'Lifetime' : 'Annual'}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 font-light">
                        {scenario.description}
                      </p>
                      
                      <Button 
                        variant="outline"
                        className="w-full group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors"
                      >
                        Preview Thank You Experience
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
            <div className="text-center space-y-8">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                Component Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center space-y-3">
                  <div className="text-3xl">🔬</div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Research-Backed Content
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    Collapsible section with citations from Stanford, Carnegie, and other institutions
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="text-3xl">🎨</div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Clean Design
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    Minimal, modern styling that matches the app's design system
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="text-3xl">🌙</div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Theme Responsive
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    Seamless light and dark mode support with proper contrast
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical details */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white text-center">
                Implementation Details
              </h2>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                        Component Props
                      </h4>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-light">
                        <li><code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 rounded">isOpen: boolean</code></li>
                        <li><code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 rounded">onClose: () =&gt; void</code></li>
                        <li><code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 rounded">amount: number</code></li>
                        <li><code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 rounded">accessTier: 'annual' | 'lifetime'</code></li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                        Key Features
                      </h4>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-light">
                        <li>• Framer Motion animations</li>
                        <li>• Collapsible research section</li>
                        <li>• Responsive design</li>
                        <li>• Dark mode support</li>
                        <li>• External link handling</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo popover */}
      <DonationThankYouPopover
        isOpen={showPopover}
        onClose={() => setShowPopover(false)}
        amount={selectedAmount}
        accessTier={selectedScenario}
      />
    </div>
  )
} 