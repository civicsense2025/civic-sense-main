"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { ConsolidatedAuthForm } from "./consolidated-auth-form"
import { DonationForm } from "./donation-form"
import { PasswordResetForm } from "./password-reset-form"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: () => void
  initialMode?: 'sign-in' | 'sign-up'
}

export function AuthDialog({ isOpen, onClose, onAuthSuccess, initialMode = 'sign-in' }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"auth" | "donate" | "reset-password">("auth")

  const handleAuthSuccess = () => {
    // Skip donation for now, proceed to completion
    onAuthSuccess()
    // Uncomment to enable donation step after auth
    // setActiveTab("donate")
  }

  const handleDonationSuccess = () => {
    onAuthSuccess()
  }

  const handleDonationSkip = () => {
    onAuthSuccess()
  }
  
  const handleResetPasswordRequest = () => {
    setActiveTab("reset-password")
  }
  
  const handleBackToSignIn = () => {
    setActiveTab("auth")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {activeTab === "donate" ? "Support CivicSense" : 
             activeTab === "reset-password" ? "Reset Your Password" : "Join CivicSense"}
          </DialogTitle>
          <DialogDescription>
            {activeTab === "donate"
              ? "Support the civic education politicians don't want you to have."
              : activeTab === "reset-password"
              ? "Enter your email and we'll send you a reset link."
              : "Track your civic knowledge. Hold democracy accountable."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Visual Header */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {activeTab === "donate" ? "Support CivicSense" : 
               activeTab === "reset-password" ? "Reset Your Password" : "Keep power in check"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {activeTab === "donate"
                ? "Support the civic education politicians don't want you to have."
                : activeTab === "reset-password"
                ? "Enter your email and we'll send you a reset link."
                : "Track your civic knowledge. Hold democracy accountable."}
            </p>
          </div>

          {/* Form Content */}
          {activeTab === "auth" && (
            <ConsolidatedAuthForm
              onSuccess={handleAuthSuccess}
              initialMode={initialMode}
              onResetPassword={handleResetPasswordRequest}
            />
          )}

          {activeTab === "donate" && (
            <DonationForm
              onSuccess={handleDonationSuccess}
              onSkip={handleDonationSkip}
            />
          )}
          
          {activeTab === "reset-password" && (
            <PasswordResetForm
              onBack={handleBackToSignIn}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}