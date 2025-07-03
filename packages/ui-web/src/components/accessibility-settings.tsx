"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { Slider } from "../ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { 
  Volume2, VolumeX, Headphones, Eye, Type, 
  Accessibility, Settings, Play, Pause
} from "lucide-react"
import { cn } from "../../utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { AudioControls } from "./quiz/audio-controls"

interface AccessibilitySettingsProps {
  className?: string
  trigger?: React.ReactNode
}

interface AccessibilityPreferences {
  // Audio settings
  audioEnabled: boolean
  autoPlayQuestions: boolean
  autoPlayAnswers: boolean
  speechRate: number
  speechPitch: number
  speechVolume: number
  preferredVoice: string | null
  
  // Visual settings
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  
  // Interaction settings
  keyboardShortcuts: boolean
  extendedTimeouts: boolean
  confirmActions: boolean
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  audioEnabled: true,
  autoPlayQuestions: false,
  autoPlayAnswers: false,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 0.8,
  preferredVoice: null,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  keyboardShortcuts: true,
  extendedTimeouts: false,
  confirmActions: false,
}

export function AccessibilitySettings({ className, trigger }: AccessibilitySettingsProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES)
  const [isOpen, setIsOpen] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      } catch (error) {
        console.error('Error loading accessibility preferences:', error)
      }
    }
  }, [])

  // Load available voices (optimized with caching)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      let isLoaded = false
      
      const loadVoices = () => {
        // Prevent multiple loads
        if (isLoaded) return
        
        const availableVoices = speechSynthesis.getVoices()
        if (availableVoices.length === 0) return
        
        isLoaded = true
        
        // Only load top quality English voices for settings
        const englishVoices = availableVoices
          .filter(voice => voice.lang.startsWith('en'))
          .filter(voice => {
            const name = voice.name.toLowerCase()
            return !['espeak', 'festival', 'flite', 'pico'].some(pattern => name.includes(pattern))
          })
          .slice(0, 6) // Limit to 6 voices max for settings dropdown
        
        setVoices(englishVoices)
      }

      loadVoices()
      
      // Single event listener, only if voices not loaded
      if (!isLoaded && speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', loadVoices)
      }
      
      return () => {
        try {
          speechSynthesis.removeEventListener('voiceschanged', loadVoices)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences))
  }, [preferences])

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Accessibility className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Accessibility className="h-5 w-5" />
            <span>Accessibility Settings</span>
          </DialogTitle>
          <DialogDescription>
            Customize your experience to make CivicSense more accessible and comfortable to use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Headphones className="h-5 w-5" />
                <span>Audio & Speech</span>
              </CardTitle>
              <CardDescription>
                Configure text-to-speech and audio feedback settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Audio */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Enable Audio</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Turn on text-to-speech for questions and answers
                  </p>
                </div>
                <Switch
                  checked={preferences.audioEnabled}
                  onCheckedChange={(checked) => updatePreference('audioEnabled', checked)}
                />
              </div>

              {preferences.audioEnabled && (
                <>
                  {/* Auto-play Settings */}
                  <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Auto-play Questions</label>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Automatically read questions when they appear
                        </p>
                      </div>
                      <Switch
                        checked={preferences.autoPlayQuestions}
                        onCheckedChange={(checked) => updatePreference('autoPlayQuestions', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Auto-play Answer Options</label>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Automatically read answer choices after the question
                        </p>
                      </div>
                      <Switch
                        checked={preferences.autoPlayAnswers}
                        onCheckedChange={(checked) => updatePreference('autoPlayAnswers', checked)}
                      />
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Preferred Voice</label>
                    <select
                      value={preferences.preferredVoice || ''}
                      onChange={(e) => updatePreference('preferredVoice', e.target.value || null)}
                      className="w-full p-2 border rounded-md bg-background text-sm"
                    >
                      <option value="">System Default</option>
                      {voices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speech Rate */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Speech Rate: {preferences.speechRate.toFixed(1)}x
                    </label>
                    <Slider
                      value={[preferences.speechRate]}
                      onValueChange={([value]) => updatePreference('speechRate', value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Speech Pitch */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Speech Pitch: {preferences.speechPitch.toFixed(1)}
                    </label>
                    <Slider
                      value={[preferences.speechPitch]}
                      onValueChange={([value]) => updatePreference('speechPitch', value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Speech Volume */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Speech Volume: {Math.round(preferences.speechVolume * 100)}%
                    </label>
                    <Slider
                      value={[preferences.speechVolume]}
                      onValueChange={([value]) => updatePreference('speechVolume', value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Test Audio */}
                  <div className="pt-2">
                    <AudioControls
                      text="This is a test of your audio settings. The speech rate, pitch, and volume are configured according to your preferences."
                      variant="compact"
                      label="audio settings test"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Visual Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Eye className="h-5 w-5" />
                <span>Visual & Display</span>
              </CardTitle>
              <CardDescription>
                Adjust visual elements for better readability and comfort
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">High Contrast Mode</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  checked={preferences.highContrast}
                  onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Large Text</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Increase text size throughout the application
                  </p>
                </div>
                <Switch
                  checked={preferences.largeText}
                  onCheckedChange={(checked) => updatePreference('largeText', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Reduced Motion</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  checked={preferences.reducedMotion}
                  onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Interaction Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Settings className="h-5 w-5" />
                <span>Interaction & Navigation</span>
              </CardTitle>
              <CardDescription>
                Configure how you interact with the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Keyboard Shortcuts</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Enable number keys (1-4) for quick answer selection
                  </p>
                </div>
                <Switch
                  checked={preferences.keyboardShortcuts}
                  onCheckedChange={(checked) => updatePreference('keyboardShortcuts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Extended Timeouts</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Give more time to read and answer questions
                  </p>
                </div>
                <Switch
                  checked={preferences.extendedTimeouts}
                  onCheckedChange={(checked) => updatePreference('extendedTimeouts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Confirm Actions</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ask for confirmation before submitting answers
                  </p>
                </div>
                <Switch
                  checked={preferences.confirmActions}
                  onCheckedChange={(checked) => updatePreference('confirmActions', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Export the preferences type and a hook to use them
export type { AccessibilityPreferences }

export function useAccessibilityPreferences(): AccessibilityPreferences {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    const saved = localStorage.getItem('accessibility-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      } catch (error) {
        console.error('Error loading accessibility preferences:', error)
      }
    }
  }, [])

  return preferences
} 