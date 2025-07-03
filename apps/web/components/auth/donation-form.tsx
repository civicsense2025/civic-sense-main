"use client"

import { useState } from "react"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Heart, Coffee, Sparkles } from "lucide-react"
import { useToast } from '@civicsense/ui-web'

interface DonationFormProps {
  onSuccess: () => void
  onSkip: () => void
}

export function DonationForm({ onSuccess, onSkip }: DonationFormProps) {
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const presetAmounts = [
    { value: "5", label: "$5", description: "Buy us a coffee" },
    { value: "25", label: "$25", description: "Support for a week" },
    { value: "50", label: "$50", description: "Power civic education" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate donation process
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Thank you for your support! 💝",
        description: `Your donation of $${customAmount || amount} helps us improve civic education for everyone.`,
        variant: "default",
      })
      onSuccess()
    }, 2000)
  }

  const selectedAmount = customAmount || amount

  return (
    <div className="space-y-8">
      {/* Donation message */}
      <div className="text-center space-y-4">
        <div className="text-4xl">💝</div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Help us grow CivicSense
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-sm mx-auto">
            Your support helps us create more educational content and keep CivicSense free for everyone.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preset amounts */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Choose an amount
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {presetAmounts.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setAmount(preset.value)
                  setCustomAmount("")
                }}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 text-center
                  ${amount === preset.value
                    ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }
                `}
              >
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {preset.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="space-y-2">
          <Label htmlFor="custom-amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Or enter custom amount
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">
              $
            </span>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              step="0.01"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setAmount("")
              }}
              className="h-12 pl-8 border-slate-200 dark:border-slate-700 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-900"
              placeholder="25.00"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            type="submit"
            disabled={isLoading || !selectedAmount}
            className="w-full h-12 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-medium rounded-full transition-all duration-200 shadow-sm"
          >
            <Heart className="h-4 w-4 mr-2" />
            {isLoading ? "Processing..." : `Donate $${selectedAmount}`}
          </Button>
          
          <Button
            type="button"
            onClick={onSkip}
            variant="ghost"
            className="w-full h-12 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium rounded-full transition-all duration-200"
          >
            Continue without donating
          </Button>
        </div>
      </form>

      {/* Thank you note */}
      <div className="text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Every contribution helps us improve civic education for all
        </p>
      </div>
    </div>
  )
}
