'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react'

interface WelcomeStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onSkip: (reason: string) => void
  onboardingState: any
}

export function WelcomeStep({ onComplete }: WelcomeStepProps) {
  const handleGetStarted = () => {
    onComplete({
      startTime: Date.now(),
      userReady: true
    })
  }

  return (
    <div className="text-center space-y-12">
      <div className="space-y-4">
        <div className="text-6xl mb-6">🇺🇸</div>
        <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
          Welcome to CivicSense
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
          Your personalized civic learning journey starts here. We'll help you become a more informed and engaged citizen.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        <div className="text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-900 dark:text-white mx-auto" />
          <h3 className="font-medium text-slate-900 dark:text-white">Learn</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Interactive quizzes and lessons</p>
        </div>
        <div className="text-center space-y-3">
          <TrendingUp className="w-10 h-10 text-slate-900 dark:text-white mx-auto" />
          <h3 className="font-medium text-slate-900 dark:text-white">Track Progress</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Monitor your civic knowledge growth</p>
        </div>
        <div className="text-center space-y-3">
          <Award className="w-10 h-10 text-slate-900 dark:text-white mx-auto" />
          <h3 className="font-medium text-slate-900 dark:text-white">Earn Rewards</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Unlock achievements and boosts</p>
        </div>
        <div className="text-center space-y-3">
          <Users className="w-10 h-10 text-slate-900 dark:text-white mx-auto" />
          <h3 className="font-medium text-slate-900 dark:text-white">Community</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Join other engaged citizens</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 max-w-md mx-auto border border-slate-100 dark:border-slate-800">
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">What's Next?</h4>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 text-left font-light">
          <li>• Choose your areas of interest</li>
          <li>• Select skills you want to develop</li>
          <li>• Set your learning preferences</li>
          <li>• Take a quick assessment</li>
        </ul>
        <Badge className="mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-0">
          Takes about 5-10 minutes
        </Badge>
      </div>

      <Button 
        onClick={handleGetStarted}
        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-lg px-12 py-4 rounded-full font-light"
      >
        Let's Get Started! 🚀
      </Button>
    </div>
  )
} 