'use client'

import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ArrowRight } from 'lucide-react'

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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* More personal, less formal intro */}
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-light text-slate-900 dark:text-white">
            Let's get you set up
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed">
            We'll ask you a few quick questions so we can recommend the right content for you. 
            No wrong answers here.
          </p>
        </div>

        {/* Simplified preview of what's coming */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
          <h3 className="font-medium text-slate-900 dark:text-white mb-4">Here's what we'll cover:</h3>
          <div className="space-y-3 text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-slate-900 dark:bg-white rounded-full"></div>
              <span className="font-light">What topics interest you most</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-slate-900 dark:bg-white rounded-full"></div>
              <span className="font-light">How you like to learn</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-slate-900 dark:bg-white rounded-full"></div>
              <span className="font-light">Quick knowledge check</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Badge variant="outline" className="text-xs text-slate-600 dark:text-slate-400">
              Takes about 3-4 minutes
            </Badge>
          </div>
        </div>
      </div>

      {/* Single, clear action */}
      <div className="text-center">
        <Button 
          onClick={handleGetStarted}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-lg px-8 py-3 rounded-full font-light group"
        >
          Let's start
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <p className="text-sm text-slate-500 dark:text-slate-500 font-light mt-3">
          You can always change your preferences later
        </p>
      </div>
    </div>
  )
}