"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface DonationFormProps {
  onSuccess: () => void
  onSkip: () => void
}

export function DonationForm({ onSuccess, onSkip }: DonationFormProps) {
  const [amount, setAmount] = useState("5")
  const [isCustom, setIsCustom] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // In a real app, you would integrate with a payment processor here
    // For this demo, we'll just simulate a successful donation
    setTimeout(() => {
      setIsLoading(false)
      onSuccess()
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Your donation helps us create more educational content and keep Civic Spark free for everyone.
          </p>
        </div>

        <RadioGroup
          value={isCustom ? "custom" : amount}
          onValueChange={(value) => {
            if (value === "custom") {
              setIsCustom(true)
            } else {
              setIsCustom(false)
              setAmount(value)
            }
          }}
          className="grid grid-cols-3 gap-4"
        >
          <div>
            <RadioGroupItem value="5" id="amount-5" className="peer sr-only" />
            <Label
              htmlFor="amount-5"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-2xl font-bold">$5</span>
              <span className="text-xs text-muted-foreground">One-time</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="10" id="amount-10" className="peer sr-only" />
            <Label
              htmlFor="amount-10"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-2xl font-bold">$10</span>
              <span className="text-xs text-muted-foreground">One-time</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="25" id="amount-25" className="peer sr-only" />
            <Label
              htmlFor="amount-25"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-2xl font-bold">$25</span>
              <span className="text-xs text-muted-foreground">One-time</span>
            </Label>
          </div>
          <div className="col-span-3">
            <RadioGroupItem value="custom" id="amount-custom" className="peer sr-only" />
            <Label
              htmlFor="amount-custom"
              className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="font-medium">Custom amount</span>
              {isCustom && (
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-24 text-right"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex flex-col space-y-2">
        <Button type="submit" disabled={isLoading || (isCustom && !customAmount)}>
          {isLoading ? "Processing..." : "Donate"}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </form>
  )
}
