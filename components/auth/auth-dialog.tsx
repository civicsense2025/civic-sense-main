"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SignInForm } from "./sign-in-form"
import { SignUpForm } from "./sign-up-form"
import { DonationForm } from "./donation-form"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: () => void
}

export function AuthDialog({ isOpen, onClose, onAuthSuccess }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"sign-in" | "sign-up" | "donate">("sign-in")

  const handleSignUpSuccess = () => {
    setActiveTab("donate")
  }

  const handleSignInSuccess = () => {
    onAuthSuccess()
  }

  const handleDonationSuccess = () => {
    onAuthSuccess()
  }

  const handleDonationSkip = () => {
    onAuthSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 gap-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {activeTab === "donate" ? "Support CivicSense" : "Join CivicSense"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-8 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 tracking-tight mb-3">
              Join CivicSense
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              Start your civic education journey with unlimited access to quizzes and progress tracking.
            </p>
          </div>

          {/* Tab Navigation */}
          {activeTab !== "donate" && (
            <div className="flex mb-8">
              <button
                onClick={() => setActiveTab("sign-in")}
                className={`flex-1 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === "sign-in"
                    ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab("sign-up")}
                className={`flex-1 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === "sign-up"
                    ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Form Content */}
          {activeTab === "sign-in" && (
            <SignInForm onSuccess={handleSignInSuccess} />
          )}
          
          {activeTab === "sign-up" && (
            <SignUpForm onSuccess={handleSignUpSuccess} />
          )}
          
          {activeTab === "donate" && (
            <DonationForm 
              onSuccess={handleDonationSuccess}
              onSkip={handleDonationSkip}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
