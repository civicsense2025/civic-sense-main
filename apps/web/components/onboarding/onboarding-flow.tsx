'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { supabase } from "../lib/supabase/client"
import { useToast } from '@civicsense/ui-web'
import { Header } from '@/components/header'

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

interface OnboardingFlowProps {
  userId: string
  onComplete?: () => void
  onSkip?: (reason: string) => void
}

// Define interfaces for database tables
interface UserPlatformPreferences {
  id: string
  user_id: string
  preferred_quiz_length?: number
  preferred_difficulty?: string
  learning_pace?: string
  learning_style?: string
  study_time_preference?: string
  email_notifications?: boolean
  push_notifications?: boolean
  daily_reminder?: boolean
  weekly_summary?: boolean
  achievement_notifications?: boolean
  [key: string]: any
}

interface AssessmentData {
  assessment_data?: {
    questions?: any[]
    answers?: any[]
  }
  results?: any
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

export function OnboardingFlow({ userId, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({ userId })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const currentStep = STEPS[currentStepIndex]
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100
  const StepComponent = currentStep.component

  // Check if user has existing onboarding data
  useEffect(() => {
    const fetchOnboardingState = async () => {
      if (!userId) return

      try {
        // Call the get_user_onboarding_progress function
        const { data, error } = await supabase
          .from('user_onboarding_state')
          .select('current_step, is_completed')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching onboarding state:', error)
          return
        }

        // If we found onboarding data
        if (data) {
          // Find the step index based on the current_step from the database
          const savedStepIndex = STEPS.findIndex(step => step.id === data.current_step)
          
          if (savedStepIndex >= 0) {
            setCurrentStepIndex(savedStepIndex)
          }

          // Now fetch additional data for each step
          await fetchStepData(userId)
        }
      } catch (err) {
        console.error('Error in fetching onboarding state:', err)
      }
    }

    fetchOnboardingState()
  }, [userId])

  // Fetch data for each onboarding step
  const fetchStepData = async (userId: string) => {
    const reconstructedState: OnboardingState = {}

    try {
      // Fetch category preferences
      const { data: categoryData } = await supabase
        .from('user_category_preferences')
        .select('*, categories:category_id(id, name, emoji)')
        .eq('user_id', userId)
      
      if (categoryData && categoryData.length > 0) {
        reconstructedState.categories = { 
          categories: categoryData.map(item => ({
            id: item.category_id,
            name: item.categories?.name,
            emoji: item.categories?.emoji,
            interest_level: item.interest_level,
            priority_rank: item.priority_rank
          }))
        }
      }

      // Fetch skill preferences
      const { data: skillData } = await supabase
        .from('user_skill_preferences')
        .select('*, skills:skill_id(id, skill_name, category_id)')
        .eq('user_id', userId)
      
      if (skillData && skillData.length > 0) {
        reconstructedState.skills = { 
          skills: skillData.map(item => ({
            id: item.skill_id,
            skill_name: item.skills?.skill_name,
            interest_level: item.interest_level,
            target_mastery_level: item.target_mastery_level,
            learning_timeline: item.learning_timeline
          }))
        }
      }

      // Fetch platform preferences
      const { data: preferencesData } = await supabase
        .from('user_platform_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (preferencesData) {
        const prefs = preferencesData as UserPlatformPreferences
        reconstructedState.preferences = {
          learningStyle: prefs.learning_style || 'mixed',
          difficulty: prefs.preferred_difficulty || 'adaptive',
          reminders: prefs.push_notifications || false
        }
      }

      // Fetch assessment data
      const { data: assessmentData } = await (supabase as any)
        .from('user_onboarding_assessment')
        .select('*')
        .eq('user_id', userId)
        .eq('assessment_type', 'initial_skills')
        .single()
      
      if (assessmentData) {
        const assessment = assessmentData as AssessmentData
        reconstructedState.assessment = { 
          results: assessment.results || {},
          questions: assessment.assessment_data?.questions || [],
          answers: assessment.assessment_data?.answers || []
        }
      }

      // Update the state with all fetched data
      setOnboardingState({ ...reconstructedState, userId })
    } catch (err) {
      console.error('Error fetching step data:', err)
    }
  }

  const handleStepComplete = async (stepData: any) => {
    setIsLoading(true)
    
    // Update onboarding state
    const updatedState = {
      ...onboardingState,
      [currentStep.id]: stepData
    }
    
    setOnboardingState(updatedState)

    try {
      // Save step data to database
      await saveStepData(currentStep.id, stepData)

      // If this is the last step, complete onboarding
      if (currentStepIndex === STEPS.length - 1) {
        await completeOnboarding(updatedState)
      } else {
        // Move to next step AFTER successful save
        const nextStepIndex = currentStepIndex + 1
        setCurrentStepIndex(nextStepIndex)
        
        // Update the current step in the database
        await supabase
          .from('user_onboarding_state')
          .upsert({
            user_id: userId,
            current_step: STEPS[nextStepIndex]?.id || 'completion',
            onboarding_data: updatedState
          }, { onConflict: 'user_id' })
      }
    } catch (error) {
      console.error(`Error saving ${currentStep.id} step data:`, error)
      toast({
        title: "Error saving your progress",
        description: "Your selections have been saved locally. You can continue or try again.",
        variant: "destructive",
      })
      
      // Allow user to continue even if save failed
      if (currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const saveStepData = async (stepId: string, stepData: any) => {
    if (!userId) return
    
    // Defensive: always provide a valid onboarding_data object
    const jsonbData: Record<string, any> = stepData && Object.keys(stepData).length > 0 ? { [stepId]: stepData } : { [stepId]: {} }

    // Update onboarding state
    const { error: stateError } = await supabase
      .from('user_onboarding_state')
      .upsert({
        user_id: userId,
        current_step: stepId,
        onboarding_data: jsonbData
      }, { onConflict: 'user_id' })

    if (stateError) {
      console.error('Onboarding state upsert error:', stateError)
      throw stateError
    }

    // Handle specific step data that needs to be saved to dedicated tables
    switch (stepId) {
      case 'categories':
        if (stepData.categories && Array.isArray(stepData.categories)) {
          await saveCategories(stepData.categories)
        }
        break
        
      case 'skills':
        if (stepData.skills && Array.isArray(stepData.skills)) {
          await saveSkills(stepData.skills)
        }
        break
        
      case 'preferences':
        await savePreferences(stepData)
        break
        
      case 'assessment':
        if (stepData.questions && stepData.answers && stepData.results) {
          await saveAssessment(stepData)
        }
        break
    }
  }

  const saveCategories = async (categories: Array<{ id: string; interest_level: number; priority_rank?: number }>) => {
    // Insert or update user category preferences
    for (const category of categories) {
      await supabase
        .from('user_category_preferences')
        .upsert({
          user_id: userId,
          category_id: category.id,
          interest_level: category.interest_level,
          priority_rank: category.priority_rank,
          selected_during_onboarding: true
        })
    }
  }

  const saveSkills = async (skills: Array<{ id: string; interest_level: number; target_mastery_level?: string; learning_timeline?: string }>) => {
    // Insert or update user skill preferences
    for (const skill of skills) {
      await supabase
        .from('user_skill_preferences')
        .upsert({
          user_id: userId,
          skill_id: skill.id,
          interest_level: skill.interest_level,
          target_mastery_level: skill.target_mastery_level || 'intermediate',
          learning_timeline: skill.learning_timeline || 'flexible',
          selected_during_onboarding: true
        })
    }
  }

  const savePreferences = async (preferences: any) => {
    // Insert or update user platform preferences
    await supabase
      .from('user_platform_preferences')
      .upsert({
        user_id: userId,
        learning_style: preferences.learningStyle || 'mixed',
        preferred_difficulty: preferences.difficulty || 'adaptive',
        push_notifications: preferences.reminders || false,
        // Add other preference fields as needed
      })
  }

  const saveAssessment = async (assessmentData: any) => {
    // Insert or update user assessment data
    await (supabase as any)
      .from('user_onboarding_assessment')
      .upsert({
        user_id: userId,
        assessment_type: 'initial_skills',
        assessment_data: {
          questions: assessmentData.questions,
          answers: assessmentData.answers
        },
        results: assessmentData.results,
        score: assessmentData.score || 0
      })
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

  const handleSkip = async (reason: string) => {
    try {
      // Record skip reason in database
      if (userId) {
        await supabase
          .from('user_onboarding_state')
          .upsert({
            user_id: userId,
            skip_reason: reason,
            current_step: currentStep.id,
            is_completed: reason === 'skip_all'
          }, { onConflict: 'user_id' })
      }
      
      // If it's the last step or the user wants to skip entirely
      if (currentStepIndex === STEPS.length - 1 || reason === 'skip_all') {
        if (onSkip) {
          onSkip(reason);
        } else {
          // Default behavior - redirect to dashboard
          toast({
            title: "Setup skipped",
            description: "You can complete setup anytime from your dashboard.",
            variant: "default",
          })
          router.push('/dashboard')
        }
      } else {
        // Skip to next step
        handleNext()
      }
    } catch (error) {
      console.error('Error recording skip:', error)
      // Still skip even if there was an error recording
      handleNext()
    }
  }

  const completeOnboarding = async (finalState: OnboardingState) => {
    try {
      // Mark onboarding as complete in database
      await supabase
        .from('user_onboarding_state')
        .upsert({
          user_id: userId,
          current_step: 'completion',
          is_completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      // Show success message
      toast({
        title: "Setup complete!",
        description: "Welcome to your personalized CivicSense experience.",
        variant: "default",
      })

      // If external completion handler is provided, call it
      if (onComplete) {
        onComplete()
      } else {
        // Default behavior - redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      
      // Still call onComplete even if there was an error saving
      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      {/* Progress Header */}
      <div className="max-w-7xl mx-auto px-8 py-6">
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
      {/* Step Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
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
            initialData={onboardingState[currentStep.id]}
            userId={userId}
          />
        )}
      </main>
      {/* Footer */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
            {currentStepIndex === 0 && 'Welcome to CivicSense'}
            {currentStepIndex === 1 && 'Choose your areas of interest'}
            {currentStepIndex === 2 && 'Select skills to develop'}
            {currentStepIndex === 3 && 'Set your learning preferences'}
            {currentStepIndex === 4 && 'Quick knowledge assessment'}
            {currentStepIndex === 5 && 'Your personalized setup is complete'}
          </div>
          <Button
            variant="link"
            onClick={() => handleSkip('skip_all')}
            className="text-sm text-slate-500 dark:text-slate-500"
          >
            Skip setup
          </Button>
        </div>
      </div>
    </div>
  )
} 