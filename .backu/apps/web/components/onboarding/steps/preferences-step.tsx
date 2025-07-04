'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { ArrowRight, ArrowLeft, Clock, Bell, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface PreferencesStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onBack: () => void
  onSkip: (reason: string) => void
  onboardingState: any
}

interface SimplePreferences {
  learningStyle: 'bite_sized' | 'deep_dive' | 'mixed'
  reminders: boolean
  difficulty: 'adaptive' | 'steady' | 'challenging'
}

export function PreferencesStep({ onComplete, onBack }: PreferencesStepProps) {
  const [preferences, setPreferences] = useState<SimplePreferences>({
    learningStyle: 'mixed',
    reminders: true,
    difficulty: 'adaptive'
  })

  const handleContinue = () => {
    onComplete({ 
      preferences: {
        ...preferences,
        // Map to full preferences for backend compatibility
        dailyReminders: preferences.reminders,
        weeklyDigest: true,
        adaptiveDifficulty: preferences.difficulty === 'adaptive',
        pushNotifications: preferences.reminders,
        emailNotifications: false,
        achievementAlerts: true,
        autoPlayAudio: false,
        reducedMotion: false,
        darkMode: false,
        showStreaks: true,
        enableBoosts: true,
        publicProfile: false
      }
    })
  }

  const learningStyles = [
    {
      id: 'bite_sized',
      title: 'Quick & casual',
      description: 'Short questions when you have a few minutes',
      icon: '⚡',
      time: '2-5 min sessions'
    },
    {
      id: 'deep_dive',
      title: 'Focused learning',
      description: 'Longer sessions with detailed explanations',
      icon: '🎯',
      time: '15-30 min sessions'
    },
    {
      id: 'mixed',
      title: 'Mix it up',
      description: 'Sometimes quick, sometimes deeper',
      icon: '🎲',
      time: 'Flexible timing'
    }
  ]

  const difficultyOptions = [
    {
      id: 'adaptive',
      title: 'Match my level',
      description: 'Adjusts based on how I\'m doing'
    },
    {
      id: 'steady',
      title: 'Keep it consistent',
      description: 'Same difficulty level'
    },
    {
      id: 'challenging',
      title: 'Push me',
      description: 'Always include harder questions'
    }
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Conversational header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white">
          How do you like to learn?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
          Help us tailor the experience to fit your style.
        </p>
      </div>

      <div className="space-y-8">
        {/* Learning Style */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            Learning pace
          </h3>
          <div className="grid gap-3">
            {learningStyles.map((style) => (
              <div key={style.id}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, learningStyle: style.id as any }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      preferences.learningStyle === style.id
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{style.icon}</div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          preferences.learningStyle === style.id 
                            ? 'text-white dark:text-slate-900' 
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {style.title}
                        </div>
                        <div className={`text-sm font-light ${
                          preferences.learningStyle === style.id 
                            ? 'text-slate-200 dark:text-slate-600' 
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {style.description}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          preferences.learningStyle === style.id 
                            ? 'border-slate-300 dark:border-slate-600 text-slate-200 dark:text-slate-600' 
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {style.time}
                      </Badge>
                    </div>
                  </button>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            Difficulty level
          </h3>
          <div className="grid gap-3">
            {difficultyOptions.map((option) => (
              <div key={option.id}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, difficulty: option.id as any }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      preferences.difficulty === option.id
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`font-medium ${
                      preferences.difficulty === option.id 
                        ? 'text-white dark:text-slate-900' 
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {option.title}
                    </div>
                    <div className={`text-sm font-light ${
                      preferences.difficulty === option.id 
                        ? 'text-slate-200 dark:text-slate-600' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {option.description}
                    </div>
                  </button>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Simple reminder toggle */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">
                  Gentle reminders
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-light">
                  We'll nudge you to keep learning
                </div>
              </div>
            </div>
            <Switch
              checked={preferences.reminders}
              onCheckedChange={(value) => setPreferences(prev => ({ ...prev, reminders: value }))}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-light"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          onClick={handleContinue}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 py-2 rounded-full font-light group"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}