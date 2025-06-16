"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(true)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  const handleAuthSuccess = () => {
    // Dialog will close automatically and user will be redirected by the above effect
  }

  const handleClose = () => {
    // If user closes the dialog, redirect to home page
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={handleClose}
        onAuthSuccess={handleAuthSuccess}
        initialMode="sign-in"
      />
    </div>
  )
} 