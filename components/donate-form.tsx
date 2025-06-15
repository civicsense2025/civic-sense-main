'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DONATION_IMPACTS = [
  { amount: 5, description: "Covers server costs for 1 day" },
  { amount: 10, description: "Funds fact-checking for 5 questions" },
  { amount: 25, description: "Supports 1 week of content creation" },
  { amount: 50, description: "Powers AI features for 100 users" },
  { amount: 100, description: "Funds a full topic with 20 questions" },
  { amount: 250, description: "Supports platform development for 1 month" },
  { amount: 500, description: "Enables major feature development" },
]

export function DonateForm() {
  const [donationAmount, setDonationAmount] = useState(25)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Find the current impact description
  const getCurrentImpact = () => {
    // Find the closest impact level
    const closest = DONATION_IMPACTS.reduce((prev, curr) => {
      return Math.abs(curr.amount - donationAmount) < Math.abs(prev.amount - donationAmount) ? curr : prev
    })
    return closest.description
  }

  const handleDonation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-donation-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: donationAmount * 100, // Convert to cents
          successUrl: `${window.location.origin}/success?type=donation&amount=${donationAmount}`,
          cancelUrl: `${window.location.origin}/donate`,
        }),
      })

      const { sessionId, error } = await response.json()
      
      if (error) {
        console.error('Error creating donation session:', error)
        return
      }

      // Redirect to Stripe Checkout
      const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      await stripe.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Sliding Scale Donation */}
      <div className="relative mb-12 apple-scale-in">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-6">
              💝
            </div>
            <h3 className="text-2xl font-light text-slate-900 dark:text-slate-50 mb-4">Choose Your Impact</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 mb-6">
              Every contribution helps us build a more informed society
            </p>
          </div>

          {/* Amount Display */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg"></div>
              <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm px-8 py-4 rounded-2xl">
                <div className="text-5xl font-light text-slate-900 dark:text-slate-50 mb-2">
                  ${donationAmount}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {getCurrentImpact()}
                </p>
              </div>
            </div>
          </div>

          {/* Slider */}
          <div className="mb-8">
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={donationAmount}
              onChange={(e) => setDonationAmount(parseInt(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${((donationAmount - 5) / (500 - 5)) * 100}%, #e2e8f0 ${((donationAmount - 5) / (500 - 5)) * 100}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>$5</span>
              <span>$500</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[10, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => setDonationAmount(amount)}
                className={`py-3 px-3 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  donationAmount === amount
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="mb-8">
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-3">
              Or enter a custom amount:
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg">$</span>
              <input
                type="number"
                min="5"
                max="10000"
                value={donationAmount}
                onChange={(e) => setDonationAmount(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-full pl-10 pr-4 py-4 border-0 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500/50 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all duration-300 text-lg"
                placeholder="25"
              />
            </div>
          </div>

          {/* Donate Button */}
          <button
            onClick={handleDonation}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-medium py-5 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] text-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Processing...
              </div>
            ) : (
              `Donate $${donationAmount}`
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          border: 3px solid white;
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
        }

        .slider::-moz-range-thumb {
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          border: 3px solid white;
          transition: all 0.2s ease;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
        }

        .dark .slider::-webkit-slider-thumb {
          border: 3px solid #1e293b;
        }

        .dark .slider::-moz-range-thumb {
          border: 3px solid #1e293b;
        }
      `}</style>
    </>
  )
} 