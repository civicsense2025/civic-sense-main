"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DonationThankYouPopoverProps {
  isVisible: boolean
  onClose: () => void
  donationAmount?: number
  accessTier?: 'annual' | 'lifetime'
}

export function DonationThankYouPopover({ 
  isVisible, 
  onClose, 
  donationAmount, 
  accessTier 
}: DonationThankYouPopoverProps) {
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="bg-white dark:bg-slate-900 border-2 border-[#1E3A8A] shadow-2xl">
            <CardContent className="p-8">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1E3A8A] dark:text-blue-400 mb-2">
                  Thank you for joining the fight! 🔥
                </h2>
                {donationAmount && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your ${donationAmount} donation has been linked to your account • {accessTier} access activated
                  </p>
                )}
              </div>

              {/* Main message */}
              <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Your support powers CivicSense's mission to rebuild civic education for the digital age. 
                  After years of watching misinformation tear apart our democracy, I decided to stop 
                  complaining and start building.
                </p>

                <p>
                  Your donation helps us cut through the noise, teach real critical thinking skills, 
                  and give people the tools they need to participate meaningfully in democracy. 
                  You're not just supporting an app—you're investing in a more informed America.
                </p>

                {/* Research section */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-[#1E3A8A] dark:text-blue-400 mb-3">
                    Research shows civic education works:
                  </h3>
                  
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-medium">•</span>
                      <span>
                        <a 
                          href="https://ed.stanford.edu/news/it-doesn-t-take-long-learn-how-spot-misinformation-online-stanford-study-finds"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1E3A8A] dark:text-blue-400 hover:underline font-medium"
                        >
                          Stanford study found that just six 50-minute lessons doubled students' ability to spot questionable websites
                        </a>
                        <ExternalLink className="inline h-3 w-3 ml-1 opacity-60" />
                      </span>
                    </li>
                    
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-medium">•</span>
                      <span>
                        <a 
                          href="https://www.carnegie.org/publications/guardian-of-democracy-the-civic-mission-of-schools/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1E3A8A] dark:text-blue-400 hover:underline font-medium"
                        >
                          Students who receive quality civic education show significant positive association with voting as young adults
                        </a>
                        <ExternalLink className="inline h-3 w-3 ml-1 opacity-60" />
                      </span>
                    </li>
                    
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-medium">•</span>
                      <span>
                        <a 
                          href="https://www.carnegie.org/publications/guardian-of-democracy-the-civic-mission-of-schools/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1E3A8A] dark:text-blue-400 hover:underline font-medium"
                        >
                          Guardian of Democracy report demonstrates that high-quality civic education increases civic engagement and participation
                        </a>
                        <ExternalLink className="inline h-3 w-3 ml-1 opacity-60" />
                      </span>
                    </li>
                    
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-medium">•</span>
                      <span>
                        <a 
                          href="https://circle.tufts.edu/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1E3A8A] dark:text-blue-400 hover:underline font-medium"
                        >
                          Youth voter turnout can reach as high as 37% in states that support civic engagement
                        </a>
                        <ExternalLink className="inline h-3 w-3 ml-1 opacity-60" />
                      </span>
                    </li>
                  </ul>
                </div>

                <p className="font-medium">
                  Together, we're proving that civic education can actually work when it's designed 
                  for real people facing real information chaos.
                </p>

                <div className="pt-2">
                  <p className="font-medium text-[#1E3A8A] dark:text-blue-400">
                    Thank you for believing in this vision.
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    – Tán
                  </p>
                </div>

                {/* Sources section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Sources:
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 dark:text-slate-500">
                    <a 
                      href="https://ed.stanford.edu/news/it-doesn-t-take-long-learn-how-spot-misinformation-online-stanford-study-finds"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors"
                    >
                      Stanford History Education Group Media Literacy Study
                    </a>
                    <a 
                      href="https://www.carnegie.org/publications/guardian-of-democracy-the-civic-mission-of-schools/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors"
                    >
                      Guardian of Democracy: The Civic Mission of Schools
                    </a>
                    <a 
                      href="https://circle.tufts.edu/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors"
                    >
                      CIRCLE Youth Voting Research
                    </a>
                    <a 
                      href="https://www.sciencedirect.com/science/article/abs/pii/S0885985X18301293"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors"
                    >
                      Civic Education and Voter Turnout Research
                    </a>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={onClose}
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-8"
                >
                  Let's Build This Together
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
} 