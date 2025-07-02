'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@civicsense/shared/lib/supabase'
import { useAuth } from '@/components/auth/auth-provider'
import { OnboardingFlow } from './onboarding-flow'
import { LoadingSpinner } from '../ui/loading-spinner'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ArrowRight, User, Settings, BookOpen } from 'lucide-react'

interface OnboardingGuardProps {
  children: React.ReactNode
  requireOnboarding?: boolean
  showContinueOption?: boolean
}

interface OnboardingStatus {
  isCompleted: boolean
  currentStep: string
  completedSteps: string[]
  hasStarted: boolean
  lastUpdated?: string
}

export function OnboardingGuard({ 
  children, 
  requireOnboarding = false,
  showContinueOption = true 
}: OnboardingGuardProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Check user's onboarding status
        const { data, error } = await supabase
          .from('user_onboarding_state')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding status:', error)
          setLoading(false)
          return
        }

        const status: OnboardingStatus = {
          isCompleted: data?.is_completed || false,
          currentStep: data?.current_step || 'welcome',
          completedSteps: data?.completed_steps || [],
          hasStarted: !!data,
          lastUpdated: data?.updated_at ? data.updated_at : undefined
        }

        setOnboardingStatus(status)

        // Determine what to show based on status and requirements
        if (!status.isCompleted) {
          if (requireOnboarding) {
            // Force onboarding for required pages
            setShowOnboarding(true)
          } else if (status.hasStarted && showContinueOption) {
            // Show continue option for partial onboarding
            setShowWelcomeBack(true)
          } else if (!status.hasStarted) {
            // New user who hasn't started - show subtle prompt
            setShowWelcomeBack(true)
          }
        }
      } catch (error) {
        console.error('Error in onboarding check:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      checkOnboardingStatus()
    }
  }, [user, authLoading, requireOnboarding, showContinueOption])

  const handleStartOnboarding = () => {
    setShowOnboarding(true)
    setShowWelcomeBack(false)
  }

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false)
    setShowWelcomeBack(false)
    setOnboardingStatus(prev => prev ? { ...prev, isCompleted: true } : null)
  }

  const handleSkipOnboarding = () => {
    setShowWelcomeBack(false)
    // Record skip but don't force again
  }

  const handleContinueOnboarding = () => {
    router.push('/onboarding')
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // User not logged in
  if (!user) {
    return <>{children}</>
  }

  // Show full onboarding flow
  if (showOnboarding) {
    return (
      <OnboardingFlow
        userId={user.id}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
      />
    )
  }

  // Show welcome back/continue prompt
  if (showWelcomeBack && onboardingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {onboardingStatus.hasStarted ? 'Welcome back!' : 'Welcome to CivicSense!'}
            </CardTitle>
            <CardDescription>
              {onboardingStatus.hasStarted 
                ? `You're partway through personalizing your experience. Continue where you left off?`
                : 'Let\'s personalize your civic learning experience in just a few minutes.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardingStatus.hasStarted && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Profile: {onboardingStatus.completedSteps.includes('categories') ? '✓' : '○'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Interests: {onboardingStatus.completedSteps.includes('skills') ? '✓' : '○'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>Preferences: {onboardingStatus.completedSteps.includes('preferences') ? '✓' : '○'}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={onboardingStatus.hasStarted ? handleContinueOnboarding : handleStartOnboarding}
                className="w-full"
              >
                {onboardingStatus.hasStarted ? 'Continue Setup' : 'Start Personalization'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleSkipOnboarding}
                className="w-full text-sm"
              >
                {onboardingStatus.hasStarted ? 'Skip for now' : 'Maybe later'}
              </Button>
            </div>
            
            <p className="text-xs text-center text-slate-500">
              You can always complete this later from your settings
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show main app content
  return <>{children}</>
} 