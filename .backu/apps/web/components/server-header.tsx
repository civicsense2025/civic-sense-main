"use client"

import { useState } from "react"
import { Header } from "./header"
import { AuthDialog } from "./auth/auth-dialog"

interface ServerHeaderProps {
  className?: string
  showTopBar?: boolean
  showMainHeader?: boolean
  enableAuth?: boolean
}

export function ServerHeader({ 
  className, 
  showTopBar = true, 
  showMainHeader = true,
  enableAuth = false
}: ServerHeaderProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const handleSignInClick = enableAuth ? () => setShowAuthDialog(true) : () => {}

  return (
    <>
      <Header 
        onSignInClick={handleSignInClick}
        className={className}
        showTopBar={showTopBar}
        showMainHeader={showMainHeader}
      />
      
      {enableAuth && (
        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={() => setShowAuthDialog(false)}
          initialMode="sign-in"
        />
      )}
    </>
  )
} 