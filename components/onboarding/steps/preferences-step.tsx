'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Bell, BookOpen, Eye, Gamepad2, Moon, Volume2 } from 'lucide-react'

interface PreferencesStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onSkip: (reason: string) => void
  onboardingState: any
}

interface UserPreferences {
  // Learning preferences
  dailyReminders: boolean
  weeklyDigest: boolean
  adaptiveDifficulty: boolean
  
  // Notification preferences
  pushNotifications: boolean
  emailNotifications: boolean
  achievementAlerts: boolean
  
  // Platform preferences
  autoPlayAudio: boolean
  reducedMotion: boolean
  darkMode: boolean
  
  // Gamification preferences
  showStreaks: boolean
  enableBoosts: boolean
  publicProfile: boolean
}

export function PreferencesStep({ onComplete }: PreferencesStepProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    // Learning defaults
    dailyReminders: true,
    weeklyDigest: true,
    adaptiveDifficulty: true,
    
    // Notification defaults
    pushNotifications: true,
    emailNotifications: false,
    achievementAlerts: true,
    
    // Platform defaults
    autoPlayAudio: false,
    reducedMotion: false,
    darkMode: false,
    
    // Gamification defaults
    showStreaks: true,
    enableBoosts: true,
    publicProfile: false
  })

  const handlePreferenceChange = (key: keyof UserPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleContinue = () => {
    onComplete({ preferences })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
          Customize Your Experience
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
          Set your preferences to personalize how you learn and interact with CivicSense.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learning Preferences */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-slate-900 dark:text-white" />
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">Learning</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              How you want to learn and improve
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Daily reminders</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Get reminded to practice daily</p>
              </div>
              <Switch
                checked={preferences.dailyReminders}
                onCheckedChange={(value) => handlePreferenceChange('dailyReminders', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Weekly digest</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Summary of your progress</p>
              </div>
              <Switch
                checked={preferences.weeklyDigest}
                onCheckedChange={(value) => handlePreferenceChange('weeklyDigest', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Adaptive difficulty</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Adjust based on your performance</p>
              </div>
              <Switch
                checked={preferences.adaptiveDifficulty}
                onCheckedChange={(value) => handlePreferenceChange('adaptiveDifficulty', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-slate-900 dark:text-white" />
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">Notifications</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              How we communicate with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Push notifications</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">In-app alerts and reminders</p>
              </div>
              <Switch
                checked={preferences.pushNotifications}
                onCheckedChange={(value) => handlePreferenceChange('pushNotifications', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Email updates</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Weekly progress via email</p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(value) => handlePreferenceChange('emailNotifications', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Achievement alerts</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Celebrate your milestones</p>
              </div>
              <Switch
                checked={preferences.achievementAlerts}
                onCheckedChange={(value) => handlePreferenceChange('achievementAlerts', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Preferences */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-slate-900 dark:text-white" />
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">Accessibility</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              Make the app work better for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Auto-play audio</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Read questions and explanations</p>
              </div>
              <Switch
                checked={preferences.autoPlayAudio}
                onCheckedChange={(value) => handlePreferenceChange('autoPlayAudio', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Reduced motion</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Minimize animations</p>
              </div>
              <Switch
                checked={preferences.reducedMotion}
                onCheckedChange={(value) => handlePreferenceChange('reducedMotion', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Dark mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Use dark theme</p>
              </div>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={(value) => handlePreferenceChange('darkMode', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gamification Preferences */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <Gamepad2 className="w-5 h-5 text-slate-900 dark:text-white" />
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">Gamification</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              Game elements and social features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Show streaks</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Display daily learning streaks</p>
              </div>
              <Switch
                checked={preferences.showStreaks}
                onCheckedChange={(value) => handlePreferenceChange('showStreaks', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Enable boosts</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Use power-ups in quizzes</p>
              </div>
              <Switch
                checked={preferences.enableBoosts}
                onCheckedChange={(value) => handlePreferenceChange('enableBoosts', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Public profile</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Share achievements publicly</p>
              </div>
              <Switch
                checked={preferences.publicProfile}
                onCheckedChange={(value) => handlePreferenceChange('publicProfile', value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">Your Setup</h4>
        <div className="flex flex-wrap gap-2">
          {preferences.dailyReminders && <Badge variant="secondary">Daily reminders</Badge>}
          {preferences.weeklyDigest && <Badge variant="secondary">Weekly digest</Badge>}
          {preferences.pushNotifications && <Badge variant="secondary">Push notifications</Badge>}
          {preferences.autoPlayAudio && <Badge variant="secondary">Audio enabled</Badge>}
          {preferences.showStreaks && <Badge variant="secondary">Streaks visible</Badge>}
          {preferences.enableBoosts && <Badge variant="secondary">Boosts enabled</Badge>}
        </div>
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <Button 
          onClick={handleContinue}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-12 py-3 rounded-full font-light"
        >
          Continue
        </Button>
      </div>
    </div>
  )
} 