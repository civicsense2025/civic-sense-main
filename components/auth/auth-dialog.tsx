"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ConsolidatedAuthForm } from "./consolidated-auth-form"
import { DonationForm } from "./donation-form"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: () => void
  initialMode?: 'sign-in' | 'sign-up'
}

export function AuthDialog({ isOpen, onClose, onAuthSuccess, initialMode = 'sign-in' }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"auth" | "donate">("auth")

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Remove the duplicate DialogOverlay - it's already included in DialogContent */}
      <DialogContent
        className="w-[95vw] max-w-md max-h-[90vh] p-0 gap-0
                   border border-slate-200 dark:border-slate-800 shadow-2xl
                   bg-white dark:bg-slate-950 overflow-hidden rounded-xl
                   focus:outline-none"
        style={{
          // Force proper centering with inline styles
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
        }}
      >
        {/* Visually hidden DialogTitle for accessibility */}
        <span className="sr-only">
          <DialogTitle>
            {activeTab === "donate" ? "Support CivicSense" : "Join CivicSense"}
          </DialogTitle>
        </span>
        <div className="px-8 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-slate-900 dark:text-slate-100 tracking-tight mb-3">
              {activeTab === "donate" ? "Support CivicSense" : "Join CivicSense"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              {activeTab === "donate"
                ? "Your support helps us provide quality civic education for all."
                : "Start your civic education journey with unlimited access to quizzes and progress tracking."}
            </p>
          </div>

          {/* Form Content */}
          {activeTab === "auth" && (
            <ConsolidatedAuthForm
              onSuccess={handleAuthSuccess}
              initialMode={initialMode}
            />
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