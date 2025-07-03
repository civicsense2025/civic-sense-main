"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccessibilityPreferences, AccessibilityPreferences } from '@/components/accessibility-settings'

interface AccessibilityContextType {
  preferences: AccessibilityPreferences
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
  speak: (text: string, options?: SpeechOptions) => void
  stopSpeaking: () => void
  isSpeaking: boolean
  announceToScreenReader: (message: string) => void
}

interface SpeechOptions {
  rate?: number
  pitch?: number
  volume?: number
  voice?: string | null
  interrupt?: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const preferences = useAccessibilityPreferences()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [screenReaderRegion, setScreenReaderRegion] = useState<HTMLElement | null>(null)

  // Create screen reader announcement region
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let region = document.getElementById('screen-reader-announcements')
      if (!region) {
        region = document.createElement('div')
        region.id = 'screen-reader-announcements'
        region.setAttribute('aria-live', 'polite')
        region.setAttribute('aria-atomic', 'true')
        region.className = 'sr-only'
        region.style.cssText = `
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        `
        document.body.appendChild(region)
      }
      setScreenReaderRegion(region)
    }
  }, [])

  // Apply global accessibility styles
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      
      // High contrast mode
      if (preferences.highContrast) {
        root.classList.add('accessibility-high-contrast')
      } else {
        root.classList.remove('accessibility-high-contrast')
      }
      
      // Large text mode
      if (preferences.largeText) {
        root.classList.add('accessibility-large-text')
      } else {
        root.classList.remove('accessibility-large-text')
      }
      
      // Reduced motion
      if (preferences.reducedMotion) {
        root.classList.add('accessibility-reduced-motion')
      } else {
        root.classList.remove('accessibility-reduced-motion')
      }
    }
  }, [preferences.highContrast, preferences.largeText, preferences.reducedMotion])

  // Speech synthesis functions
  const speak = (text: string, options: SpeechOptions = {}) => {
    if (!preferences.audioEnabled || !text.trim()) return
    
    // Stop any current speech if interrupt is true (default)
    if (options.interrupt !== false) {
      speechSynthesis.cancel()
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Apply user preferences or options
    utterance.rate = options.rate ?? preferences.speechRate
    utterance.pitch = options.pitch ?? preferences.speechPitch
    utterance.volume = options.volume ?? preferences.speechVolume
    
    // Set preferred voice if available
    const voiceName = options.voice ?? preferences.preferredVoice
    if (voiceName) {
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => voice.name === voiceName)
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const announceToScreenReader = (message: string) => {
    if (screenReaderRegion) {
      screenReaderRegion.textContent = message
      // Clear after a delay to avoid repetition
      setTimeout(() => {
        if (screenReaderRegion) {
          screenReaderRegion.textContent = ''
        }
      }, 1000)
    }
  }

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    const currentPrefs = JSON.parse(localStorage.getItem('accessibility-preferences') || '{}')
    const updatedPrefs = { ...currentPrefs, [key]: value }
    localStorage.setItem('accessibility-preferences', JSON.stringify(updatedPrefs))
    
    // Force re-render by dispatching a storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessibility-preferences',
      newValue: JSON.stringify(updatedPrefs)
    }))
  }

  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreference,
    speak,
    stopSpeaking,
    isSpeaking,
    announceToScreenReader
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Global keyboard shortcut hook
export function useAccessibilityKeyboardShortcuts() {
  const { preferences } = useAccessibility()
  
  useEffect(() => {
    if (!preferences.keyboardShortcuts) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }
      
      // Quiz navigation shortcuts
      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          event.preventDefault()
          // Dispatch custom event for quiz answer selection
          window.dispatchEvent(new CustomEvent('accessibility-answer-select', {
            detail: { answerIndex: parseInt(event.key) - 1 }
          }))
          break
        case 'n':
        case 'N':
          if (event.altKey) {
            event.preventDefault()
            window.dispatchEvent(new CustomEvent('accessibility-next-question'))
          }
          break
        case 'p':
        case 'P':
          if (event.altKey) {
            event.preventDefault()
            window.dispatchEvent(new CustomEvent('accessibility-previous-question'))
          }
          break
        case 'r':
        case 'R':
          if (event.altKey) {
            event.preventDefault()
            window.dispatchEvent(new CustomEvent('accessibility-read-current'))
          }
          break
        case 'h':
        case 'H':
          if (event.altKey) {
            event.preventDefault()
            window.dispatchEvent(new CustomEvent('accessibility-show-help'))
          }
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [preferences.keyboardShortcuts])
} 