"use client"

import React from 'react'

interface PremiumGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PremiumGate({ children, fallback }: PremiumGateProps) {
  // Stub: always show children for now
  return <>{children}</>
}

export function usePremium() {
  // Stub: return default premium state
  return {
    isPremium: false,
    isPro: false,
    isLoading: false
  }
} 