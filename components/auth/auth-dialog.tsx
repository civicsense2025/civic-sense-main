"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {activeTab === "donate"
              ? "Support Civic Spark"
              : activeTab === "sign-up"
                ? "Create an account"
                : "Welcome back"}
          </DialogTitle>
          <DialogDescription>
            {activeTab === "donate"
              ? "Your donation helps us create more educational content."
              : "Access unlimited quizzes and track your progress."}
          </DialogDescription>
        </DialogHeader>

        {activeTab !== "donate" ? (
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in">
              <SignInForm onSuccess={handleSignInSuccess} />
            </TabsContent>
            <TabsContent value="sign-up">
              <SignUpForm onSuccess={handleSignUpSuccess} />
            </TabsContent>
          </Tabs>
        ) : (
          <DonationForm onSuccess={handleDonationSuccess} onSkip={handleDonationSuccess} />
        )}
      </DialogContent>
    </Dialog>
  )
}
