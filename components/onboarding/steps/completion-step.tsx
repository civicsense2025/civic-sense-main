'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PartyPopper, Sparkles, ArrowRight, BookOpen, Target, Bell } from 'lucide-react'
import confetti from 'canvas-confetti'

interface CompletionStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onboardingState: any
}

export function CompletionStep({ onComplete, onboardingState }: CompletionStepProps) {
  useEffect(() => {
    // Trigger celebration confetti
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      // since particles fall down, start a bit higher than random
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      }))
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      }))
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const handleGetStarted = () => {
    onComplete({
      onboardingCompleted: true,
      completedAt: Date.now(),
      readyToStart: true
    })
  }

  // Extract data from onboarding state for summary
  const selectedCategories = onboardingState?.categories?.categories || []
  const selectedSkills = onboardingState?.skills?.skills || []
  const preferences = onboardingState?.preferences?.preferences || {}
  const assessmentScore = onboardingState?.assessment?.assessmentResults?.score || 0

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* Celebration Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <PartyPopper className="w-20 h-20 text-slate-900 dark:text-white mx-auto mb-4" />
          <Sparkles className="w-6 h-6 absolute top-0 right-1/3 text-yellow-500 animate-pulse" />
          <Sparkles className="w-4 h-4 absolute top-4 left-1/3 text-blue-500 animate-pulse delay-150" />
          <Sparkles className="w-5 h-5 absolute bottom-2 right-1/4 text-purple-500 animate-pulse delay-300" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
            You're All Set! 🎉
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            Welcome to your personalized civic learning journey. We've customized everything based on your preferences.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-slate-900 dark:text-white" />
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
                Your Interests
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              {selectedCategories.length} categories selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.slice(0, 3).map((category: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  Category {index + 1}
                </Badge>
              ))}
              {selectedCategories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedCategories.length - 3} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-slate-900 dark:text-white" />
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
                Learning Goals
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              {selectedSkills.length} skills to develop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.slice(0, 2).map((skill: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  Skill {index + 1}
                </Badge>
              ))}
              {selectedSkills.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedSkills.length - 2} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assessment */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-slate-900 dark:text-white" />
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
                Knowledge Level
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              Assessment completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                {assessmentScore}%
              </div>
              <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                {assessmentScore >= 80 ? 'Advanced' : assessmentScore >= 60 ? 'Intermediate' : 'Beginner'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalization Summary */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-medium text-slate-900 dark:text-white text-center">
            Your Personalized Experience
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 font-light text-center">
            We've configured CivicSense to match your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 dark:text-white">Learning Setup</h4>
              <div className="space-y-2">
                {preferences.dailyReminders && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Bell className="w-4 h-4" />
                    <span className="font-light">Daily learning reminders enabled</span>
                  </div>
                )}
                {preferences.adaptiveDifficulty && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Target className="w-4 h-4" />
                    <span className="font-light">Adaptive difficulty matching your level</span>
                  </div>
                )}
                {preferences.weeklyDigest && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-light">Weekly progress summaries</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 dark:text-white">Content Focus</h4>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-light">
                <div>• Questions matched to your interests</div>
                <div>• Difficulty adjusted to your assessment results</div>
                <div>• Skills practice for your selected goals</div>
                <div>• Progress tracking across all areas</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">What's Next?</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400 font-light">
              <div className="text-center">
                <div className="text-2xl mb-2">📚</div>
                <div className="font-medium text-slate-900 dark:text-white mb-1">Start Learning</div>
                <div>Begin with personalized quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium text-slate-900 dark:text-white mb-1">Track Progress</div>
                <div>Monitor your civic knowledge growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-medium text-slate-900 dark:text-white mb-1">Earn Rewards</div>
                <div>Unlock achievements and boosts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <Button 
          onClick={handleGetStarted}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-lg px-16 py-4 rounded-full font-light"
        >
          Start My Civic Journey
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
          You can always adjust your preferences in settings later
        </p>
      </div>
    </div>
  )
} 