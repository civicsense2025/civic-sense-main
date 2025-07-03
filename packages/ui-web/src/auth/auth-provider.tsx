"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'

// Stub auth context type
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Stub: simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Stub implementation
    console.log('Sign in:', email, password)
    setUser({ id: 'stub-user-id', email, role: 'user' })
  }

  const signUp = async (email: string, password: string) => {
    // Stub implementation
    console.log('Sign up:', email, password)
    setUser({ id: 'stub-user-id', email, role: 'user' })
  }

  const signOut = async () => {
    // Stub implementation
    console.log('Sign out')
    setUser(null)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
