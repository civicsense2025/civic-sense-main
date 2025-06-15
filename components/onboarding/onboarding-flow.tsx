'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { useAnalytics } from '@/utils/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

// Import step components
import { WelcomeStep } from './steps/welcome-step'
import { CategorySelectionStep } from './steps/category-selection-step'
import { SkillSelectionStep } from './steps/skill-selection-step'
import { PreferencesStep } from './steps/preferences-step'
import { AssessmentStep } from './steps/assessment-step'
import { CompletionStep } from './steps/completion-step'

interface OnboardingState {
  [key: string]: any
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'categories', title: 'Choose Interests', component: CategorySelectionStep },
  { id: 'skills', title: 'Set Goals', component: SkillSelectionStep },
  { id: 'preferences', title: 'Preferences', component: PreferencesStep },
  { id: 'assessment', title: 'Assessment', component: AssessmentStep },
  { id: 'completion', title: 'Complete', component: CompletionStep }
]

export function OnboardingFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { trackAuth, trackCustomEvent } = useAnalytics()

  const currentStep = STEPS[currentStepIndex]
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100
  const StepComponent = currentStep.component

  useEffect(() => {
    // Track onboarding start
    trackAuth.onboardingStarted('new', 'onboarding_flow')
  }, [])

  const handleStepComplete = async (stepData: any) => {
    setIsLoading(true)
    
    // Update onboarding state
    setOnboardingState(prev => ({
      ...prev,
      [currentStep.id]: stepData
    }))

    // Track step completion
    trackCustomEvent('onboarding_step_completed', 1, {
      step: currentStep.id,
      step_index: currentStepIndex,
      data: stepData
    })

    // If this is the last step, complete onboarding
    if (currentStepIndex === STEPS.length - 1) {
      await completeOnboarding({
        ...onboardingState,
        [currentStep.id]: stepData
      })
    } else {
      // Move to next step
      setCurrentStepIndex(prev => prev + 1)
    }
    
    setIsLoading(false)
  }

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleSkip = (reason: string) => {
    trackCustomEvent('onboarding_step_skipped', 1, {
      step: currentStep.id,
      step_index: currentStepIndex,
      reason
    })
    
    // Skip to next step
    handleNext()
  }

  const completeOnboarding = async (finalState: OnboardingState) => {
    try {
      // Track completion
      const totalSteps = STEPS.length
      const completionTime = Math.round((Date.now() - (finalState.welcome?.startTime || Date.now())) / 1000)
      trackAuth.onboardingCompleted(completionTime, totalSteps, [])

      // TODO: Save onboarding data to database via API
      // await saveOnboardingData(finalState)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Handle error appropriately
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Progress Header */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <Badge variant="outline" className="text-xs">
                {currentStep.title}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    index <= currentStepIndex 
                      ? 'text-slate-900 dark:text-white' 
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <div 
                      className={`w-4 h-4 rounded-full border-2 ${
                        index === currentStepIndex
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`} 
                    />
                  )}
                  <span className="text-xs font-light hidden sm:block">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Processing...</p>
            </div>
          ) : (
            <StepComponent
              onComplete={handleStepComplete}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              onboardingState={onboardingState}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
              {currentStepIndex === 0 && 'Welcome to CivicSense'}
              {currentStepIndex === 1 && 'Choose your areas of interest'}
              {currentStepIndex === 2 && 'Select skills to develop'}
              {currentStepIndex === 3 && 'Set your learning preferences'}
              {currentStepIndex === 4 && 'Quick knowledge assessment'}
              {currentStepIndex === 5 && 'Your personalized setup is complete'}
            </div>
            
            <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
              {Math.round(progress)}% complete
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 