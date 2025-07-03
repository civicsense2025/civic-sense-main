"use client"

import React from 'react'

interface HeaderProps {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">CivicSense</h1>
          </div>
          <nav className="flex items-center space-x-4">
            {children}
          </nav>
        </div>
      </div>
    </header>
  )
}

// Legacy exports for backward compatibility
export function TopUtilityBar({ onSignInClick, onSignUpClick }: { onSignInClick: () => void, onSignUpClick?: () => void }) {
  return <Header>
    <button onClick={onSignInClick}>Sign In</button>
    <button onClick={onSignUpClick}>Sign Up</button>
  </Header>
}

export function MainHeader({ onSignInClick, onSignUpClick }: { onSignInClick: () => void, onSignUpClick?: () => void }) {
  return <Header>
    <button onClick={onSignInClick}>Sign In</button>
    <button onClick={onSignUpClick}>Sign Up</button>
  </Header>
}
