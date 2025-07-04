"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Plus } from 'lucide-react'
import { Button } from './ui/button'

interface GiftCredits {
  annual_credits: number
  lifetime_credits: number
  donor_access_type: 'annual' | 'lifetime' | 'none'
}

interface DonationThankYouPopoverProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  accessTier: 'annual' | 'lifetime'
  userId?: string
}

export function DonationThankYouPopover({ 
  isOpen, 
  onClose, 
  amount, 
  accessTier,
  userId 
}: DonationThankYouPopoverProps) {
  const [giftCredits, setGiftCredits] = useState<GiftCredits | null>(null)
  const [showGiftingOptions, setShowGiftingOptions] = useState(false)

  // Calculate gift credits when component opens
  useEffect(() => {
    if (isOpen && amount >= 75) { // Only show for donations that generate gift credits
      // Calculate gift credits based on donation amount
      const calculateGiftCredits = (donationAmount: number): GiftCredits => {
        let remaining = donationAmount
        let donor_access_type: 'annual' | 'lifetime' | 'none' = 'none'
        
        // First, determine donor's access
        if (remaining >= 50) {
          donor_access_type = 'lifetime'
          remaining -= 50
        } else if (remaining >= 25) {
          donor_access_type = 'annual'
          remaining -= 25
        }
        
        // Calculate gift credits from remaining amount
        const lifetime_credits = Math.floor(remaining / 50)
        remaining = remaining % 50
        const annual_credits = Math.floor(remaining / 25)
        
        return {
          annual_credits,
          lifetime_credits,
          donor_access_type
        }
      }

      const credits = calculateGiftCredits(amount)
      setGiftCredits(credits)
    }
  }, [isOpen, amount])

  const hasGiftCredits = giftCredits && (giftCredits.annual_credits > 0 || giftCredits.lifetime_credits > 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-h-screen flex flex-col"
      >
        {/* Close button */}
        <div className="absolute top-8 right-8 z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-16">
            
            {/* Hero section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-8"
            >
              <div className="text-6xl">🔥</div>
              <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white leading-tight tracking-tight">
                You're now a part of the movement.
              </h1>
            </motion.div>

            {/* Main content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-12"
            >
              <div className="space-y-6 text-lg font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                <p>
                  Your support makes CivicSense possible. After years of watching misinformation destroy our democracy, I stopped complaining and started building real solutions.
                </p>
                
                <p>
                  Your donation funds the fight against misinformation. We're teaching Americans how to think critically, spot lies, and participate meaningfully in democracy. You're not just supporting an app—you're rebuilding democracy itself.
                </p>
              </div>

              {/* Access confirmation */}
              <div className="py-8">
                <div className="inline-block bg-slate-50 dark:bg-slate-900 rounded-2xl px-8 py-6">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Your ${amount} contribution unlocks
                  </p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">
                    {accessTier === 'lifetime' ? 'Lifetime Access' : 'Annual Access'}
                  </p>
                </div>
              </div>

              {/* Gift Credits Section */}
              {hasGiftCredits && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-center mb-4">
                      <Gift className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                      <h3 className="text-xl font-light text-green-700 dark:text-green-300">
                        Bonus: You can gift memberships!
                      </h3>
                    </div>
                    
                    <p className="text-green-600 dark:text-green-400 mb-6 leading-relaxed">
                      Your generous ${amount} donation earned you gift credits to share CivicSense access with others.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {giftCredits.lifetime_credits > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
                          <div className="text-2xl font-light text-slate-900 dark:text-white">
                            {giftCredits.lifetime_credits}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Lifetime Access Gifts
                          </div>
                        </div>
                      )}
                      
                      {giftCredits.annual_credits > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
                          <div className="text-2xl font-light text-slate-900 dark:text-white">
                            {giftCredits.annual_credits}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Annual Access Gifts
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => setShowGiftingOptions(!showGiftingOptions)}
                      className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-light"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showGiftingOptions ? 'Hide Gift Options' : 'Send Gifts Now'}
                    </Button>
                  </div>

                  {/* Gift Options */}
                  <AnimatePresence>
                    {showGiftingOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 space-y-4">
                          <h4 className="text-lg font-light text-slate-900 dark:text-white text-center">
                            Gift CivicSense Access
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                            You can send these gifts now or save them for later in your dashboard.
                          </p>
                          
                                                     <div className="space-y-3">
                             <div className="flex items-center justify-center gap-4">
                               <Button
                                 onClick={() => {
                                   // Navigate to gifting interface
                                   window.location.href = '/dashboard?tab=gifts'
                                 }}
                                 variant="outline"
                                 className="flex-1"
                               >
                                 Manage Gifts
                               </Button>
                               <Button
                                 onClick={() => {
                                   // Open immediate gifting modal
                                   window.location.href = '/gift?immediate=true'
                                 }}
                                 className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white"
                               >
                                 Send Individual Gifts
                               </Button>
                             </div>
                             
                             <div className="text-center">
                               <div className="text-xs text-slate-500 dark:text-slate-500 mb-2">or</div>
                               <Button
                                 onClick={() => {
                                   // Create shareable link with all credits
                                   const totalCredits = (giftCredits.lifetime_credits || 0) + (giftCredits.annual_credits || 0)
                                   window.location.href = `/dashboard?tab=gifts&action=create-link&credits=${totalCredits}&type=${giftCredits.lifetime_credits > 0 ? 'lifetime' : 'annual'}`
                                 }}
                                 variant="outline"
                                 className="w-full"
                               >
                                 Create Shareable Link
                               </Button>
                               <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                 Anyone with the link can claim access until credits run out
                               </p>
                             </div>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Closing message */}
              <div className="space-y-4">
                <p className="text-lg font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                  Together, we're proving democracy can fight back against information warfare.
                </p>
                <p className="text-slate-500 dark:text-slate-500">
                  – Tán, Founder of CivicSense
                </p>
              </div>
            </motion.div>

            {/* Action button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button 
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-12 py-4 text-lg font-light rounded-full transition-all hover:scale-105"
              >
                Continue
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 