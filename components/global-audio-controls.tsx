"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { 
  Volume2, VolumeX, Play, Pause, RotateCcw, 
  Settings, Headphones, Zap, X, Minimize2, Maximize2, Repeat
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { useAnalytics } from "@/utils/analytics"

interface VoiceOption {
  voice: SpeechSynthesisVoice
  name: string
  lang: string
  quality: 'high' | 'medium' | 'low'
}

interface GlobalAudioControlsProps {
  className?: string
}

// Simplified Word highlighting functionality
class WordHighlighter {
  private static instance: WordHighlighter
  private currentHighlights: HTMLElement[] = []
  private cleanupTimeouts: NodeJS.Timeout[] = []

  static getInstance(): WordHighlighter {
    if (!WordHighlighter.instance) {
      WordHighlighter.instance = new WordHighlighter()
    }
    return WordHighlighter.instance
  }

  highlightText(text: string, onWordHighlight?: (wordIndex: number, word: string) => void) {
    // Clear any existing highlights first
    this.clearHighlights()
    
    // Simple text matching - find the first paragraph or main content
    const mainContent = document.querySelector('main, article, .content, .prose, [role="main"]')
    if (!mainContent) return null

    const textContent = mainContent.textContent || ''
    const words = text.split(/\s+/).filter(word => word.length > 2)
    
    // Only proceed if we have a reasonable match
    if (words.length < 3 || !textContent.toLowerCase().includes(words[0].toLowerCase())) {
      return null
    }

    return {
      highlightWord: (index: number) => {
        // Simple highlighting without complex DOM manipulation
        if (onWordHighlight && index < words.length) {
          onWordHighlight(index, words[index])
        }
      },
      cleanup: () => this.clearHighlights()
    }
  }

  clearHighlights() {
    // Clear any timeouts
    this.cleanupTimeouts.forEach(timeout => clearTimeout(timeout))
    this.cleanupTimeouts = []
    
    // Remove highlights
    this.currentHighlights.forEach(element => {
      try {
        element.style.backgroundColor = 'transparent'
        element.style.color = 'inherit'
      } catch (e) {
        // Element may have been removed from DOM
      }
    })
    this.currentHighlights = []
  }
}

// Simplified Global audio state management
class GlobalAudioManager {
  private static instance: GlobalAudioManager
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private listeners: Set<() => void> = new Set()
  private isPlaying = false
  private isPaused = false
  private currentText = ""
  private autoPlayEnabled = false
  private loopEnabled = false
  private highlightingEnabled = true
  private currentHighlighter: any = null
  private cleanupTimeouts: NodeJS.Timeout[] = []
  private lastPlayAttempt = 0
  private retryCount = 0
  private cloudTTSHandler: ((text: string) => Promise<boolean>) | null = null
  private lastUserInteraction = 0

  static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager()
    }
    return GlobalAudioManager.instance
  }

  addListener(callback: () => void) {
    this.listeners.add(callback)
  }

  removeListener(callback: () => void) {
    this.listeners.delete(callback)
  }

  private notifyListeners() {
    try {
      this.listeners.forEach(callback => {
        try {
          callback()
        } catch (e) {
          console.warn('Error in audio listener:', e)
        }
      })
    } catch (e) {
      console.warn('Error notifying listeners:', e)
    }
  }

  private hasRecentUserInteraction(): boolean {
    const now = Date.now()
    const timeSinceInteraction = now - this.lastUserInteraction
    // Allow auto-play within 5 seconds of user interaction
    return timeSinceInteraction < 5000
  }

  recordUserInteraction() {
    this.lastUserInteraction = Date.now()
  }

  private checkSpeechSynthesis(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not available')
      return false
    }

    // Check if speech synthesis is working
    try {
      const voices = speechSynthesis.getVoices()
      console.log('Speech synthesis check:', {
        speaking: speechSynthesis.speaking,
        pending: speechSynthesis.pending,
        paused: speechSynthesis.paused,
        voiceCount: voices.length
      })
      return true
    } catch (e) {
      console.error('Speech synthesis check failed:', e)
      return false
    }
  }

  private resetSpeechSynthesis() {
    try {
      console.log('Resetting speech synthesis...')
      speechSynthesis.cancel()
      
      // Small delay to let the browser reset
      setTimeout(() => {
        console.log('Speech synthesis reset complete')
      }, 100)
    } catch (e) {
      console.error('Error resetting speech synthesis:', e)
    }
  }

  setAutoPlay(enabled: boolean) {
    this.autoPlayEnabled = enabled
    try {
      localStorage.setItem('globalAudioAutoPlay', enabled.toString())
    } catch (e) {
      console.warn('Could not save autoplay setting:', e)
    }
    
    if (!enabled) {
      this.setHighlighting(false)
    }
    
    this.notifyListeners()
  }

  setLoop(enabled: boolean) {
    this.loopEnabled = enabled
    try {
      localStorage.setItem('globalAudioLoop', enabled.toString())
    } catch (e) {
      console.warn('Could not save loop setting:', e)
    }
    this.notifyListeners()
  }

  setHighlighting(enabled: boolean) {
    this.highlightingEnabled = enabled
    try {
      localStorage.setItem('globalAudioHighlighting', enabled.toString())
    } catch (e) {
      console.warn('Could not save highlighting setting:', e)
    }
    
    if (!enabled && this.currentHighlighter) {
      this.currentHighlighter.cleanup()
      this.currentHighlighter = null
    }
    
    this.notifyListeners()
  }

  getAutoPlay(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('globalAudioAutoPlay')
      return saved === 'true'
    } catch (e) {
      return false
    }
  }

  getLoop(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('globalAudioLoop')
      return saved === 'true'
    } catch (e) {
      return false
    }
  }

  getHighlighting(): boolean {
    if (typeof window === 'undefined') return true
    try {
      const saved = localStorage.getItem('globalAudioHighlighting')
      return saved !== 'false'
    } catch (e) {
      return true
    }
  }

  playText(text: string, options?: {
    voice?: SpeechSynthesisVoice
    rate?: number
    pitch?: number
    volume?: number
    onStart?: () => void
    onEnd?: () => void
    autoPlay?: boolean
  }) {
    if (!text || typeof window === 'undefined') {
      console.warn('No text provided or window unavailable')
      return
    }

    if (options?.autoPlay && !this.autoPlayEnabled) {
      console.log('Auto-play blocked: disabled')
      return
    }

    // Check if this is an auto-play attempt without recent user interaction
    if (options?.autoPlay && !this.hasRecentUserInteraction()) {
      console.log('Auto-play blocked: no recent user interaction')
      return
    }

    // Check if speech synthesis is available
    if (!this.checkSpeechSynthesis()) {
      console.error('Speech synthesis not available')
      return
    }

    // Prevent rapid successive calls
    const now = Date.now()
    if (now - this.lastPlayAttempt < 100) {
      console.warn('Play attempt too soon, skipping')
      return
    }
    this.lastPlayAttempt = now

    console.log('Playing text:', { 
      textLength: text.length, 
      autoPlay: options?.autoPlay,
      isPlaying: this.isPlaying 
    })

    this.stop()

    const cleanText = this.cleanTextForSpeech(text)
    if (cleanText.trim().length === 0) {
      console.warn('No clean text to speak')
      return
    }

    this.playSingleUtterance(cleanText, text, options)
  }

  private playSingleUtterance(cleanText: string, originalText: string, options?: {
    voice?: SpeechSynthesisVoice
    rate?: number
    pitch?: number
    volume?: number
    onStart?: () => void
    onEnd?: () => void
    autoPlay?: boolean
  }) {
    try {
      console.log('Creating utterance:', { cleanTextLength: cleanText.length })
      
      const utterance = new SpeechSynthesisUtterance(cleanText)
      
      // Set voice parameters with defaults
      utterance.rate = options?.rate ? Math.max(0.1, Math.min(2.0, options.rate)) : 1.0
      utterance.pitch = options?.pitch ? Math.max(0, Math.min(2.0, options.pitch)) : 1.0
      utterance.volume = options?.volume ? Math.max(0, Math.min(1.0, options.volume)) : 0.8

      // Set voice if provided
      if (options?.voice) {
        utterance.voice = options.voice
      } else {
        // Try to use a good default voice
        const voices = speechSynthesis.getVoices()
        const defaultVoice = voices.find(v => v.default && v.lang.startsWith('en')) || 
                           voices.find(v => v.lang.startsWith('en'))
        if (defaultVoice) {
          utterance.voice = defaultVoice
        }
      }

      let hasStarted = false
      let hasEnded = false

      // Set up word highlighting (simplified)
      if (this.highlightingEnabled && this.autoPlayEnabled) {
        this.setupWordHighlighting(originalText, utterance)
      }

      utterance.onstart = () => {
        if (hasStarted) return
        hasStarted = true
        
        console.log('Speech started')
        this.isPlaying = true
        this.isPaused = false
        this.currentText = originalText
        this.retryCount = 0
        options?.onStart?.()
        this.notifyListeners()
      }

      utterance.onend = () => {
        if (hasEnded) return
        hasEnded = true
        
        console.log('Speech ended')
        this.isPlaying = false
        this.isPaused = false
        
        if (this.loopEnabled && this.currentText) {
          const timeout = setTimeout(() => {
            if (this.loopEnabled) {
              this.playText(this.currentText, options)
            } else {
              this.currentText = ""
              this.cleanupHighlighting()
            }
          }, 1000)
          this.cleanupTimeouts.push(timeout)
        } else {
          this.currentText = ""
          this.cleanupHighlighting()
        }
        
        options?.onEnd?.()
        this.notifyListeners()
      }

      utterance.onerror = (event) => {
        // Don't log "canceled" as an error - it's normal user behavior
        if (event.error === 'canceled') {
          console.log('Speech synthesis canceled by user')
          this.isPlaying = false
          this.isPaused = false
          this.currentText = ""
          this.cleanupHighlighting()
          this.notifyListeners()
          return
        }
        
        // Don't log "not-allowed" as an error - it's normal browser autoplay behavior
        if ((event.error as string) === 'not-allowed') {
          console.log('Speech synthesis not allowed - user interaction required for auto-play')
          this.isPlaying = false
          this.isPaused = false
          this.currentText = ""
          this.cleanupHighlighting()
          this.notifyListeners()
          return
        }
        
        console.error('Speech error:', event.error || event)
        
        // Try to recover from certain errors
        if (event.error === 'interrupted' && this.retryCount < 2) {
          console.log('Retrying speech after interruption...')
          this.retryCount++
          setTimeout(() => {
            this.resetSpeechSynthesis()
            setTimeout(() => {
              this.playSingleUtterance(cleanText, originalText, options)
            }, 200)
          }, 100)
          return
        }
        
        // Handle specific error types
        if (event.error === 'network') {
          console.warn('Network error during speech synthesis')
        } else if (event.error === 'synthesis-failed') {
          console.error('Speech synthesis failed - voice may not be available')
        } else if (event.error === 'not-allowed') {
          console.log('Speech synthesis not allowed - user interaction required for auto-play')
          // Don't treat this as a critical error for auto-play
          if (options?.autoPlay) {
            console.log('Auto-play blocked by browser - this is normal behavior')
          } else {
            console.error('Speech synthesis not allowed - check permissions')
          }
        } else if (event.error === 'voice-unavailable') {
          console.error('Selected voice is not available')
        } else {
          console.error('Speech error:', event.error)
        }
        
        this.isPlaying = false
        this.isPaused = false
        this.currentText = ""
        this.retryCount = 0
        this.cleanupHighlighting()
        this.notifyListeners()
      }

      // Timeout fallback
      const timeout = setTimeout(() => {
        if (!hasStarted && !hasEnded) {
          console.warn('Speech timeout - forcing reset')
          this.resetSpeechSynthesis()
          this.isPlaying = false
          this.isPaused = false
          this.currentText = ""
          this.cleanupHighlighting()
          this.notifyListeners()
        }
      }, 10000) // 10 second timeout

      this.cleanupTimeouts.push(timeout)
      this.currentUtterance = utterance
      
      console.log('Starting speech synthesis...')
      speechSynthesis.speak(utterance)
      
      // Additional check to ensure speech starts
      setTimeout(() => {
        if (!hasStarted && !speechSynthesis.speaking) {
          console.warn('Speech did not start, trying to resume...')
          try {
            speechSynthesis.resume()
          } catch (e) {
            console.error('Failed to resume speech:', e)
          }
        }
      }, 1000)
      
    } catch (e) {
      console.error('Error creating utterance:', e)
      this.stop()
    }
  }

  private setupWordHighlighting(originalText: string, utterance: SpeechSynthesisUtterance) {
    try {
      const highlighter = WordHighlighter.getInstance()
      this.currentHighlighter = highlighter.highlightText(originalText)
      
      if (this.currentHighlighter) {
        // Simplified word timing
        const words = originalText.split(/\s+/).filter(word => word.length > 0)
        const averageWordsPerMinute = 150 * (utterance.rate || 1.0)
        const millisecondsPerWord = (60 * 1000) / averageWordsPerMinute
        
        let wordIndex = 0
        
        const highlightNextWord = () => {
          if (wordIndex < words.length && this.isPlaying && this.currentHighlighter) {
            this.currentHighlighter.highlightWord(wordIndex)
            wordIndex++
            
            if (wordIndex < words.length) {
              const timeout = setTimeout(highlightNextWord, millisecondsPerWord)
              this.cleanupTimeouts.push(timeout)
            }
          }
        }
        
        const timeout = setTimeout(highlightNextWord, 500)
        this.cleanupTimeouts.push(timeout)
      }
    } catch (e) {
      console.warn('Error setting up highlighting:', e)
    }
  }

  private cleanupHighlighting() {
    // Clear timeouts
    this.cleanupTimeouts.forEach(timeout => clearTimeout(timeout))
    this.cleanupTimeouts = []
    
    if (this.currentHighlighter) {
      try {
        this.currentHighlighter.cleanup()
      } catch (e) {
        console.warn('Error cleaning up highlighter:', e)
      }
      this.currentHighlighter = null
    }
  }

  pause() {
    try {
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause()
        this.isPaused = true
        this.notifyListeners()
      }
    } catch (e) {
      console.warn('Error pausing speech:', e)
    }
  }

  resume() {
    try {
      if (speechSynthesis.paused) {
        speechSynthesis.resume()
        this.isPaused = false
        this.notifyListeners()
      }
    } catch (e) {
      console.warn('Error resuming speech:', e)
    }
  }

  stop() {
    try {
      speechSynthesis.cancel()
      this.isPlaying = false
      this.isPaused = false
      this.currentText = ""
      this.cleanupHighlighting()
      this.notifyListeners()
    } catch (e) {
      console.warn('Error stopping speech:', e)
    }
  }

  restart() {
    if (this.currentText) {
      this.playText(this.currentText)
    }
  }

  readCurrentPage() {
    const pageContent = this.extractPageContent()
    if (pageContent) {
      this.playText(pageContent, { autoPlay: true })
    }
  }

  // Method to read specific text content with global settings
  async readContentWithSettings(text: string) {
    if (!text) return
    
    const cleanText = this.cleanTextForSpeech(text)
    if (cleanText.trim().length === 0) return
    
    // Try Cloud TTS first if handler is registered
    if (this.cloudTTSHandler) {
      try {
        const success = await this.cloudTTSHandler(cleanText)
        if (success) {
          console.log('Used Cloud TTS for auto-reading')
          return
        }
      } catch (error) {
        console.warn('Cloud TTS failed, falling back to browser TTS:', error)
      }
    }
    
    // Fall back to browser TTS
    this.playText(cleanText, { 
      autoPlay: true,
      onStart: () => {
        console.log('Auto-reading content with browser TTS')
      }
    })
  }

  // Simplified and safe page content extraction
  private extractPageContent(): string {
    if (typeof window === 'undefined') return ''
    
    try {
      // First try to find quiz-specific content with more targeted selectors
      const quizContentSelectors = [
        // Specific quiz content selectors
        '.QuestionFeedbackDisplay',
        '[data-audio-content="true"]',
        '[data-question-content="true"]',
        '.quiz-content',
        '.question-text',
        '.question-explanation',
        '.question-feedback'
      ]
      
      for (const selector of quizContentSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          const text = element.textContent || ''
          if (text.trim().length > 50) {
            return this.cleanTextForSpeech(text.slice(0, 3000))
          }
        }
      }
      
      // If no quiz-specific content found, try general content areas
      // but exclude navigation, header, footer elements
      const contentSelectors = [
        'main',
        '[role="main"]',
        'article',
        '.content',
        '.prose'
      ]
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector)
        // Skip if no element found
        if (!element) continue
        
        // Create a clone to manipulate without affecting the actual DOM
        const clone = element.cloneNode(true) as HTMLElement
        
        // Remove navigation, header, footer, and other UI elements from clone
        const elementsToRemove = clone.querySelectorAll(
          'nav, header, footer, .breadcrumb, .breadcrumbs, .navigation, .menu, .controls, ' +
          '.logo, .branding, .site-header, .site-footer, .nav-links, .user-menu, ' + 
          '[role="navigation"], [role="banner"], [role="contentinfo"], ' +
          '.skip-link, .back-link, .auth-buttons, .theme-toggle'
        )
        
        elementsToRemove.forEach(el => {
          try {
            el.parentNode?.removeChild(el)
          } catch (e) {
            // Ignore errors if element can't be removed
          }
        })
        
        const text = clone.textContent || ''
        if (text.trim().length > 50) {
          return this.cleanTextForSpeech(text.slice(0, 3000))
        }
      }
      
      // Fallback to headings and paragraphs (limited)
      // but exclude those in navigation, header, footer
      const elements = document.querySelectorAll('h1, h2, h3, p')
      let text = ''
      let count = 0
      
      for (const element of elements) {
        if (count >= 15) break // Increased limit slightly
        
        // Skip elements in navigation, header, footer, etc.
        if (element.closest('nav, header, footer, .breadcrumb, .breadcrumbs, .navigation, .menu, .controls, .logo, .branding, .site-header, .site-footer')) {
          continue
        }
        
        const elementText = element.textContent?.trim() || ''
        if (elementText.length > 10) {
          text += elementText + '. '
          count++
        }
      }
      
      return text.length > 50 ? this.cleanTextForSpeech(text.slice(0, 3000)) : ''
    } catch (e) {
      console.warn('Error extracting page content:', e)
      return ''
    }
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentText: this.currentText,
      autoPlayEnabled: this.autoPlayEnabled,
      loopEnabled: this.loopEnabled,
      highlightingEnabled: this.highlightingEnabled
    }
  }

  // Public methods for external audio control (Cloud TTS integration)
  setPlayingState(playing: boolean, paused: boolean = false) {
    this.isPlaying = playing
    this.isPaused = paused
    this.notifyListeners()
  }

  getCurrentText(): string {
    return this.currentText
  }

  // Register Cloud TTS handler from UI controls
  setCloudTTSHandler(handler: ((text: string) => Promise<boolean>) | null) {
    this.cloudTTSHandler = handler
  }

  // Simplified text cleaning
  private cleanTextForSpeech(text: string): string {
    try {
      return text
        // Remove markdown formatting
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        
        // Add basic pauses
        .replace(/\.\s+/g, '. ')
        .replace(/\?\s+/g, '? ')
        .replace(/!\s+/g, '! ')
        .replace(/:\s+/g, ': ')
        .replace(/;\s+/g, '; ')
        .replace(/,\s+/g, ', ')
        
        // Handle common abbreviations
        .replace(/\bU\.S\./g, 'United States')
        .replace(/\bU\.K\./g, 'United Kingdom')
        .replace(/\bDr\./g, 'Doctor')
        .replace(/\bMr\./g, 'Mister')
        .replace(/\bMrs\./g, 'Missus')
        .replace(/\bMs\./g, 'Miss')
        
        // Clean up
        .replace(/\s+/g, ' ')
        .trim()
    } catch (e) {
      console.warn('Error cleaning text:', e)
      return text.slice(0, 1000) // Fallback to limited text
    }
  }
}

// Hook to use the global audio manager
export function useGlobalAudio() {
  const manager = GlobalAudioManager.getInstance()
  const [state, setState] = useState(manager.getState())

  useEffect(() => {
    const updateState = () => setState(manager.getState())
    manager.addListener(updateState)
    
    // Initialize settings from localStorage
    try {
      manager.setAutoPlay(manager.getAutoPlay())
      manager.setLoop(manager.getLoop())
      manager.setHighlighting(manager.getHighlighting())
    } catch (e) {
      console.warn('Error initializing audio settings:', e)
    }
    
    return () => manager.removeListener(updateState)
  }, [manager])

  // Create a version of readContentWithSettings that uses UI settings
  const readContentWithUISettings = useCallback(async (text: string) => {
    if (!text) return
    
    // If auto-play is disabled, don't read
    if (!state.autoPlayEnabled) return
    
    // Use the manager's method which will try Cloud TTS if configured
    await manager.readContentWithSettings(text)
  }, [manager, state.autoPlayEnabled])

  return {
    ...state,
    playText: useCallback((text: string, options?: Parameters<typeof manager.playText>[1]) => {
      manager.recordUserInteraction()
      return manager.playText(text, options)
    }, [manager]),
    readCurrentPage: useCallback(() => {
      manager.recordUserInteraction()
      return manager.readCurrentPage()
    }, [manager]),
    readContentWithSettings: readContentWithUISettings,
    pause: useCallback(() => {
      manager.recordUserInteraction()
      return manager.pause()
    }, [manager]),
    resume: useCallback(() => {
      manager.recordUserInteraction()
      return manager.resume()
    }, [manager]),
    stop: useCallback(() => {
      manager.recordUserInteraction()
      return manager.stop()
    }, [manager]),
    restart: useCallback(() => {
      manager.recordUserInteraction()
      return manager.restart()
    }, [manager]),
    setAutoPlay: useCallback((enabled: boolean) => {
      manager.recordUserInteraction()
      return manager.setAutoPlay(enabled)
    }, [manager]),
    setLoop: useCallback((enabled: boolean) => {
      manager.recordUserInteraction()
      return manager.setLoop(enabled)
    }, [manager]),
    setHighlighting: useCallback((enabled: boolean) => {
      manager.recordUserInteraction()
      return manager.setHighlighting(enabled)
    }, [manager])
  }
}

export function GlobalAudioControls({ className }: GlobalAudioControlsProps) {
  const {
    isPlaying,
    isPaused,
    currentText,
    autoPlayEnabled,
    loopEnabled,
    highlightingEnabled,
    playText,
    readCurrentPage,
    pause,
    resume,
    stop,
    restart,
    setAutoPlay,
    setLoop,
    setHighlighting
  } = useGlobalAudio()

  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { trackEngagement } = useAnalytics()
  const [isSupported, setIsSupported] = useState(false)
  const manager = GlobalAudioManager.getInstance()
  const [isOpen, setIsOpen] = useState(false)
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRate] = useState([1.0])
  const [pitch, setPitch] = useState([1.0])
  const [volume, setVolume] = useState([0.8])
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [isInQuiz, setIsInQuiz] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<{
    voiceCount: number
    speaking: boolean
    pending: boolean
    paused: boolean
    lastUpdate: string
  } | null>(null)
  const [useCloudTTS, setUseCloudTTS] = useState(true) // Default to premium
  const [targetLanguage, setTargetLanguage] = useState('en-US')
  const [voiceType, setVoiceType] = useState<'CHIRP3_HD'>('CHIRP3_HD')
  const [voiceGender, setVoiceGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL'>('FEMALE')
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(false)
  const [isCloudTTSLoading, setIsCloudTTSLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<{ charactersUsed: number; estimatedCost: string } | null>(null)
  const previousVolumeRef = useRef(0.8)
  const router = useRouter()

  // Register Cloud TTS handler with the global manager
  useEffect(() => {
    const cloudTTSHandler = async (text: string): Promise<boolean> => {
      // Only use Cloud TTS if it's enabled and user has access
      if (!useCloudTTS || !user || !(isPremium || isPro)) {
        return false
      }

      try {
        setIsCloudTTSLoading(true)
        
        // Stop any existing browser TTS before starting Cloud TTS
        manager.stop()
        
        const requestBody: any = {
          text,
          targetLanguage,
          voiceGender: voiceGender,
          voiceType: voiceType,
          autoDetectLanguage: autoDetectLanguage,
          speakingRate: rate[0],
          volumeGainDb: (volume[0] - 0.5) * 20
        }
        
        if (voiceType !== 'CHIRP3_HD') {
          requestBody.pitch = pitch[0]
        }
        
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        const result = await response.json()
        
        if (result.success && result.audioContent) {
          await playCloudAudio(result.audioContent, result)
          return true
        }
        
        return false
      } catch (error) {
        console.warn('Cloud TTS auto-play failed:', error)
        return false
      } finally {
        setIsCloudTTSLoading(false)
      }
    }

    manager.setCloudTTSHandler(cloudTTSHandler)
    
    return () => {
      manager.setCloudTTSHandler(null)
    }
  }, [useCloudTTS, user, isPremium, isPro, targetLanguage, voiceGender, voiceType, autoDetectLanguage, rate, pitch, volume, manager])

  // Detect if we're in a quiz page to adjust positioning
  useEffect(() => {
    const checkQuizPage = () => {
      if (typeof window !== 'undefined') {
        setIsInQuiz(window.location.pathname.includes('/quiz/'))
      }
    }
    
    checkQuizPage()
    // Listen for navigation changes
    window.addEventListener('popstate', checkQuizPage)
    
    return () => {
      window.removeEventListener('popstate', checkQuizPage)
    }
  }, [])

  // Check for speech synthesis support and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      
      const loadVoices = () => {
        try {
          const availableVoices = speechSynthesis.getVoices()
          
          console.log('All available voices:', availableVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            localService: v.localService,
            default: v.default
          })))
          
          // Update diagnostics
          setDiagnostics({
            voiceCount: availableVoices.length,
            speaking: speechSynthesis.speaking,
            pending: speechSynthesis.pending,
            paused: speechSynthesis.paused,
            lastUpdate: new Date().toLocaleTimeString()
          })
          
          if (availableVoices.length === 0) {
            setLastError('No voices available. Voices may still be loading...')
            // Try again after a delay
            setTimeout(loadVoices, 1000)
            return
          }
          
          // Filter out low-quality voices and prioritize better ones
          const voiceOptions: VoiceOption[] = availableVoices
            .map(voice => ({
              voice,
              name: voice.name,
              lang: voice.lang,
              quality: getVoiceQuality(voice)
            }))
            .filter(voiceOption => {
              // Only show high and medium quality voices
              if (voiceOption.quality === 'low') return false
              
              // Filter out obviously robotic/poor voices
              const name = voiceOption.name.toLowerCase()
              const badVoicePatterns = [
                'microsoft', 'espeak', 'festival', 'flite', 'pico',
                'robot', 'synthetic', 'computer', 'artificial',
                'speech synthesis', 'tts', 'text-to-speech'
              ]
              
              if (badVoicePatterns.some(pattern => name.includes(pattern))) {
                return false
              }
              
              return true
            })
            .sort((a, b) => {
              // Sort by language (English first), then quality, then name
              if (a.lang.startsWith('en') && !b.lang.startsWith('en')) return -1
              if (!a.lang.startsWith('en') && b.lang.startsWith('en')) return 1
              
              const qualityOrder = { high: 3, medium: 2, low: 1 }
              if (qualityOrder[a.quality] !== qualityOrder[b.quality]) {
                return qualityOrder[b.quality] - qualityOrder[a.quality]
              }
              return a.name.localeCompare(b.name)
            })

          setVoices(voiceOptions)
          
          // Clear error if we have voices now
          if (voiceOptions.length > 0) {
            setLastError(null)
          }
          
          // Set default voice (prefer English, high quality)
          const defaultVoice = voiceOptions.find(v => v.lang.startsWith('en') && v.quality === 'high') || 
                              voiceOptions.find(v => v.lang.startsWith('en')) ||
                              voiceOptions[0]
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.voice)
          }
        } catch (e) {
          console.warn('Error loading voices:', e)
          setLastError(`Voice loading error: ${e instanceof Error ? e.message : 'Unknown error'}`)
        }
      }

      // Load voices immediately
      loadVoices()
      
      // Listen for voice changes (important for async loading)
      speechSynthesis.addEventListener('voiceschanged', loadVoices)
      
      // Fallback: try loading voices again after delays
      setTimeout(loadVoices, 500)
      setTimeout(loadVoices, 2000)
      
      return () => {
        try {
          speechSynthesis.removeEventListener('voiceschanged', loadVoices)
        } catch (e) {
          console.warn('Error removing voice listener:', e)
        }
      }
    } else {
      setIsSupported(false)
      setLastError('Speech synthesis not supported in this browser')
    }
  }, [])

  // Periodically update diagnostics
  useEffect(() => {
    if (!isSupported) return

    const interval = setInterval(() => {
      try {
        setDiagnostics(prev => ({
          voiceCount: prev?.voiceCount || 0,
          speaking: speechSynthesis.speaking,
          pending: speechSynthesis.pending,
          paused: speechSynthesis.paused,
          lastUpdate: new Date().toLocaleTimeString()
        }))
      } catch (e) {
        setLastError(`Diagnostic error: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isSupported])

  const getVoiceQuality = (voice: SpeechSynthesisVoice): 'high' | 'medium' | 'low' => {
    // Simplified quality detection - just basic categorization
    const voiceName = voice.name.toLowerCase()
    const voiceLang = voice.lang.toLowerCase()
    
    // High quality indicators (natural-sounding voices)
    if (voiceName.includes('neural') || 
        voiceName.includes('premium') || 
        voiceName.includes('enhanced') ||
        voiceName.includes('natural') ||
        voiceName.includes('eloquence') ||
        voiceName.includes('vocalizer') ||
        voiceName.includes('nuance')) {
      return 'high'
    }
    
    // Medium quality (standard system voices)
    if (voiceName.includes('microsoft') || 
        voiceName.includes('apple') ||
        voiceName.includes('google') ||
        voiceName.includes('system')) {
      return 'medium'
    }
    
    // Default to low for basic/robotic voices
    return 'low'
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume([previousVolumeRef.current])
    } else {
      previousVolumeRef.current = volume[0]
      setIsMuted(true)
      setVolume([0])
    }
  }

  const handleRecovery = () => {
    try {
      console.log('Manual recovery initiated')
      speechSynthesis.cancel()
      setLastError(null)
      
      setTimeout(() => {
        // Try to read current page as a test
        const testText = "Audio system recovered. Ready to continue."
        playText(testText, { 
          voice: selectedVoice || undefined,
          rate: rate[0],
          pitch: pitch[0],
          volume: volume[0]
        })
      }, 500)
    } catch (e) {
      setLastError(`Recovery failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  const handlePlayWithSettings = () => {
    const textToPlay = currentText || "Testing audio with current settings"
    playText(textToPlay, {
      voice: selectedVoice || undefined,
      rate: rate[0],
      pitch: pitch[0],
      volume: volume[0]
    })
  }

  const handleCloudTTSPlay = async (text: string) => {
    try {
      setLastError(null)
      setIsCloudTTSLoading(true)
      
      // Stop any existing browser TTS before starting Cloud TTS
      manager.stop()
      
      // Chirp 3 HD voices don't support pitch adjustments, so we exclude pitch for premium voices
      const requestBody: any = {
        text,
        targetLanguage,
        voiceGender: voiceGender,
        voiceType: voiceType,
        autoDetectLanguage: autoDetectLanguage,
        speakingRate: rate[0],
        volumeGainDb: (volume[0] - 0.5) * 20
      }
      
      // Only include pitch for non-Chirp3 voices (if we add other voice types later)
      if (voiceType !== 'CHIRP3_HD') {
        requestBody.pitch = pitch[0]
      }
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!result.success) {
        if (result.fallbackMode) {
          console.log('Cloud TTS unavailable, using browser fallback')
          setUseCloudTTS(false)
          playText(text, {
            voice: selectedVoice || undefined,
            rate: rate[0],
            pitch: pitch[0],
            volume: volume[0]
          })
          return
        }
        
        // Handle specific error cases
        if (result.error && result.error.includes('pitch parameters')) {
          setLastError('Chirp 3 HD voices don\'t support pitch adjustment. Using default pitch.')
          // Retry without pitch
          const retryResponse = await fetch('/api/text-to-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...requestBody,
              pitch: undefined
            })
          })
          const retryResult = await retryResponse.json()
          if (retryResult.success && retryResult.audioContent) {
            await playCloudAudio(retryResult.audioContent, retryResult)
            return
          }
        }
        
        throw new Error(result.error || 'Cloud TTS failed')
      }

      // Update usage stats
      if (result.usage) {
        setUsageStats(prev => ({
          charactersUsed: (prev?.charactersUsed || 0) + result.usage.charactersProcessed,
          estimatedCost: result.usage.estimatedCost
        }))
      }

      // Play the audio
      if (result.audioContent) {
        await playCloudAudio(result.audioContent, result)
      }

    } catch (error) {
      console.error('Cloud TTS error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(`Cloud TTS failed: ${errorMessage}`)
      
      // Fallback to browser TTS
      console.log('Falling back to browser TTS')
      setUseCloudTTS(false)
      playText(text, {
        voice: selectedVoice || undefined,
        rate: rate[0],
        pitch: pitch[0],
        volume: volume[0]
      })
    } finally {
      setIsCloudTTSLoading(false)
    }
  }

  const playCloudAudio = async (audioContent: string, result: any) => {
    try {
      const audioBlob = new Blob([
        Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' })
      
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.onloadstart = () => {
        console.log('Cloud TTS audio loading...')
      }
      
      audio.oncanplay = () => {
        console.log('Cloud TTS audio ready to play')
      }
      
      audio.onplay = () => {
        console.log('Cloud TTS audio started')
        // Update global state to reflect playing
        GlobalAudioManager.getInstance().setPlayingState(true, false)
      }
      
      audio.onended = () => {
        console.log('Cloud TTS audio ended')
        URL.revokeObjectURL(audioUrl)
        // Update global state
        GlobalAudioManager.getInstance().setPlayingState(false, false)
      }
      
      audio.onerror = (error) => {
        console.error('Cloud TTS audio playback error:', error)
        setLastError('Audio playback failed - trying browser fallback')
        URL.revokeObjectURL(audioUrl)
        
        // Fallback to browser TTS
        setUseCloudTTS(false)
        const manager = GlobalAudioManager.getInstance()
        playText(manager.getCurrentText() || 'Audio playback failed', {
          voice: selectedVoice || undefined,
          rate: rate[0],
          pitch: pitch[0],
          volume: volume[0]
        })
      }
      
      audio.onpause = () => {
        console.log('Cloud TTS audio paused')
        GlobalAudioManager.getInstance().setPlayingState(true, true)
      }
      
      // Set volume
      audio.volume = volume[0]
      
      await audio.play()
      
      // Show translation info if available
      if (result.translatedText && result.detectedLanguage) {
        console.log(`Translated from ${result.detectedLanguage}: "${result.translatedText}"`)
      }
      
    } catch (playError) {
      console.error('Error playing cloud audio:', playError)
      setLastError('Failed to play audio - using browser fallback')
      
             // Fallback to browser TTS
       setUseCloudTTS(false)
       playText(GlobalAudioManager.getInstance().getCurrentText() || 'Audio error', {
         voice: selectedVoice || undefined,
         rate: rate[0],
         pitch: pitch[0],
         volume: volume[0]
       })
    }
  }

  const handlePlayWithCurrentSettings = () => {
    const textToPlay = currentText || "Testing audio with current settings"
    
    if (useCloudTTS) {
      handleCloudTTSPlay(textToPlay)
    } else {
      playText(textToPlay, {
        voice: selectedVoice || undefined,
        rate: rate[0],
        pitch: pitch[0],
        volume: volume[0]
      })
    }
  }

  // Track audio events with analytics integration
  const handleAudioPlay = (contentType: 'quiz_question' | 'explanation' | 'hint', userInitiated: boolean) => {
    const startTime = Date.now()
    
    // Track when audio finishes or is stopped
    const handleAudioEnd = (completionPercentage: number) => {
      const duration = (Date.now() - startTime) / 1000
      
      trackEngagement.audioContentPlayed({
        content_type: contentType,
        duration_seconds: duration,
        completion_percentage: completionPercentage,
        user_initiated: userInitiated,
        accessibility_feature: isAccessibilityEnabled()
      })
    }

    return handleAudioEnd
  }

  const isAccessibilityEnabled = () => {
    // Check if user has accessibility preferences enabled
    try {
      const prefs = localStorage.getItem('accessibilityPreferences')
      if (prefs) {
        const parsed = JSON.parse(prefs)
        return parsed.audioEnabled || parsed.autoPlayQuestions || parsed.autoPlayAnswers
      }
    } catch (e) {
      console.warn('Error checking accessibility preferences:', e)
    }
    return false
  }

  // Enhanced play function with analytics
  const handlePlayWithAnalytics = (text: string, contentType: 'quiz_question' | 'explanation' | 'hint' = 'quiz_question') => {
    const audioEndHandler = handleAudioPlay(contentType, true)
    
    playText(text, {
      voice: selectedVoice || undefined,
      rate: rate[0],
      pitch: pitch[0],
      volume: volume[0],
      onStart: () => {
        console.log(`🎵 Started playing ${contentType}`)
      },
      onEnd: () => {
        audioEndHandler(100) // Assume 100% completion for manual plays
      }
    })
  }

  // Enhanced auto-play with analytics
  const handleAutoPlayWithAnalytics = () => {
    if (!currentText) {
      readCurrentPage()
    } else {
      const audioEndHandler = handleAudioPlay('explanation', false)
      restart()
      // Track completion when audio naturally ends
      setTimeout(() => {
        audioEndHandler(100)
      }, (currentText.length / 10) * 1000) // Rough estimation of reading time
    }
  }

  if (!isSupported || !isVisible) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed right-6 z-50 transition-all duration-300 ease-out",
        // Position higher when in mobile quiz to avoid footer
        isInQuiz && isMinimized 
          ? "bottom-20" // Higher position to avoid mobile footer in quiz
          : "bottom-6", // Normal position
        isMinimized ? "w-14 h-14" : "w-80",
        className
      )}>
        <div className="bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-slate-100 dark:border-slate-900 rounded-2xl shadow-xl">
          {isMinimized ? (
            // Minimized state - clean single button
            <div className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={currentText ? (isPlaying ? (isPaused ? resume : pause) : restart) : readCurrentPage}
                    className="w-6 h-6 p-0 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    {isPlaying ? (
                      isPaused ? <Play className="h-3 w-3 text-slate-900 dark:text-white" /> : <Pause className="h-3 w-3 text-slate-900 dark:text-white" />
                    ) : currentText ? (
                      <Play className="h-3 w-3 text-slate-900 dark:text-white" />
                    ) : (
                      <Headphones className="h-3 w-3 text-slate-900 dark:text-white" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                  {currentText ? (isPlaying ? (isPaused ? "Resume" : "Pause") : "Play") : "Read current page"}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(false)}
                    className="absolute -top-1 -right-1 w-4 h-4 p-0 rounded-full bg-white dark:bg-black border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <Maximize2 className="h-2 w-2 text-slate-900 dark:text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                  Expand controls
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            // Full state - clean, minimal design matching dashboard
            <div className="p-6 space-y-6">
              {/* Clean Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Headphones className="h-5 w-5 text-slate-900 dark:text-white" />
                  <h3 className="text-lg font-light text-slate-900 dark:text-white tracking-tight">Audio Controls</h3>
                </div>
                
                <div className="flex space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMinimized(true)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <Minimize2 className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      Minimize
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsVisible(false)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <X className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      Hide controls
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Error display - clean design */}
              {lastError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-700 dark:text-red-400 font-light">{lastError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLastError(null)}
                      className="h-6 w-6 p-0 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecovery}
                    className="mt-3 h-8 text-sm w-full border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Fix Audio System
                  </Button>
                </div>
              )}

              {/* Current status - minimal design */}
              {currentText && (
                <div className="text-center space-y-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-light bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                    {isPlaying ? (isPaused ? 'Paused' : 'Playing') : 'Ready'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-light truncate">
                    {currentText.slice(0, 50)}...
                  </p>
                </div>
              )}

              {/* Main Controls - clean Apple-style */}
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={restart}
                        disabled={!currentText}
                        className="h-10 w-10 p-0 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4 text-slate-900 dark:text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      Restart
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          manager.recordUserInteraction()
                          if (currentText) {
                            if (isPlaying) {
                              if (isPaused) {
                                resume()
                              } else {
                                pause()
                              }
                            } else {
                              restart()
                            }
                          } else {
                            readCurrentPage()
                          }
                        }}
                        className="h-14 w-14 p-0 rounded-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                      >
                        {isPlaying ? (
                          isPaused ? <Play className="h-6 w-6 text-white dark:text-black" /> : <Pause className="h-6 w-6 text-white dark:text-black" />
                        ) : currentText ? (
                          <Play className="h-6 w-6 text-white dark:text-black" />
                        ) : (
                          <Headphones className="h-6 w-6 text-white dark:text-black" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      {currentText ? (isPlaying ? (isPaused ? "Resume" : "Pause") : "Play") : "Read current page"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={readCurrentPage}
                        className="h-10 w-10 p-0 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <span className="text-lg">📄</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      Read current page
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Clean toggle controls */}
                <div className="flex items-center justify-center space-x-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoPlay(!autoPlayEnabled)}
                        className={cn(
                          "h-8 w-8 p-0 rounded-full transition-colors",
                          autoPlayEnabled 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-black" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      Auto-play: {autoPlayEnabled ? 'ON' : 'OFF'}
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLoop(!loopEnabled)}
                        className={cn(
                          "h-8 w-8 p-0 rounded-full transition-colors",
                          loopEnabled 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-black" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <Repeat className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      Loop: {loopEnabled ? 'ON' : 'OFF'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Volume Control - clean design */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="h-8 w-8 p-0 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        {isMuted || volume[0] === 0 ? (
                          <VolumeX className="h-4 w-4 text-slate-900 dark:text-white" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-slate-900 dark:text-white" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      {isMuted ? "Unmute" : "Mute"}
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="flex-1">
                    <Slider
                      value={volume}
                      onValueChange={(value: number[]) => {
                        setVolume(value)
                        setIsMuted(value[0] === 0)
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light w-8 text-right">
                    {Math.round(volume[0] * 100)}
                  </span>
                </div>
              </div>

              {/* Settings */}
              <div className="border-t border-slate-100 dark:border-slate-900 pt-4">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-center h-8 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400 mr-2" />
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-light">Settings</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-black border border-slate-100 dark:border-slate-900 text-slate-900 dark:text-white">
                      Audio settings
                    </TooltipContent>
                  </Tooltip>
                  
                  <DropdownMenuContent 
                    align="end" 
                    className="w-80 bg-white dark:bg-black border border-slate-100 dark:border-slate-900 rounded-lg shadow-xl"
                  >
                    <DropdownMenuLabel className="text-slate-900 dark:text-white font-light">Audio Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                    
                    {/* Test button */}
                    <div className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayWithCurrentSettings}
                        className="w-full text-sm h-8 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        🎵 Test Audio
                      </Button>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                    
                    {/* Word highlighting toggle */}
                    <div className="p-3">
                      <label className="flex items-center space-x-3 text-sm font-light">
                        <input
                          type="checkbox"
                          checked={highlightingEnabled}
                          onChange={(e) => setHighlighting(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-slate-500"
                        />
                        <span className="text-slate-900 dark:text-white">Word highlighting</span>
                      </label>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                    
                    {/* Voice quality notice - clean design */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg mx-3 my-2">
                      <div className="text-sm text-slate-700 dark:text-slate-300 font-light space-y-2">
                        <div className="font-medium">🎯 For Best Quality:</div>
                        <div>• Enable Google Cloud TTS below (premium voices)</div>
                        <div>• Or install better system voices in your OS</div>
                        <div>• Current browser voices: {voices.length} (filtered from 200+)</div>
                      </div>
                    </div>

                    {/* Voice Options - Clean Toggle */}
                    <div className="p-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-light text-slate-900 dark:text-white">
                          Voice Options
                        </label>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-light">
                            {useCloudTTS ? 'Premium' : 'Basic'}
                          </span>
                          <Switch
                            checked={useCloudTTS}
                            onCheckedChange={setUseCloudTTS}
                            className="data-[state=checked]:bg-slate-900 dark:data-[state=checked]:bg-white"
                          />
                        </div>
                      </div>

                      {/* Basic Browser Voices */}
                      {!useCloudTTS && (
                        <div className="space-y-3">
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-2 h-2 bg-slate-900 dark:bg-white rounded-full"></div>
                              <span className="text-sm font-light text-slate-900 dark:text-white">
                                Browser Voices (Free)
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-light mb-3">
                              Standard system voices available on your device
                            </p>
                            
                            <select
                              value={selectedVoice?.name || ''}
                              onChange={(e) => {
                                const voice = voices.find(v => v.voice.name === e.target.value)?.voice
                                setSelectedVoice(voice || null)
                              }}
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent font-light"
                            >
                              <option value="">Auto-select best voice</option>
                              {voices
                                .filter(voiceOption => {
                                  const quality = getVoiceQuality(voiceOption.voice)
                                  return quality === 'high' || quality === 'medium'
                                })
                                .slice(0, 10)
                                .map((voiceOption) => (
                                  <option key={voiceOption.voice.name} value={voiceOption.voice.name}>
                                    {voiceOption.name} ({voiceOption.voice.lang})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Premium Chirp 3: HD Voices */}
                      {useCloudTTS && (
                        <div className="space-y-3">
                          {(user && (isPremium || isPro)) ? (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-2 h-2 bg-slate-900 dark:bg-white rounded-full"></div>
                                <span className="text-sm font-light text-slate-900 dark:text-white">
                                  ✨ Google Chirp 3: HD Voices (Ultra Premium)
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-light mb-3">
                                🎯 LLM-powered voices with unparalleled realism and emotional resonance
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 font-light mb-3">
                                Features: Aoede, Puck, Kore, Charon + 26 more premium voices
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 font-light mb-4 italic">
                                Note: Chirp 3 HD voices use optimized pitch settings for best quality
                              </p>
                              
                              {/* Language Selection */}
                              <div className="space-y-3">
                                <label className="text-xs font-light text-slate-900 dark:text-white">
                                  Target Language
                                </label>
                                <select
                                  value={targetLanguage}
                                  onChange={(e) => setTargetLanguage(e.target.value)}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent font-light"
                                >
                                  <option value="en-US">English (US)</option>
                                  <option value="en-GB">English (UK)</option>
                                  <option value="en-AU">English (Australia)</option>
                                  <option value="es-US">Spanish (US)</option>
                                  <option value="es-ES">Spanish (Spain)</option>
                                  <option value="fr-FR">French (France)</option>
                                  <option value="de-DE">German</option>
                                  <option value="it-IT">Italian</option>
                                  <option value="pt-BR">Portuguese (Brazil)</option>
                                  <option value="ja-JP">Japanese</option>
                                  <option value="ko-KR">Korean</option>
                                  <option value="zh-CN">Chinese (Mandarin)</option>
                                </select>
                              </div>

                              {/* Voice Quality */}
                              <div className="space-y-3 mt-4">
                                <label className="text-xs font-light text-slate-900 dark:text-white">
                                  Voice Quality
                                </label>
                                <select
                                  value={voiceType}
                                  onChange={(e) => setVoiceType(e.target.value as 'CHIRP3_HD')}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent font-light"
                                >
                                  <option value="CHIRP3_HD">✨ Chirp 3: HD (Ultra Premium)</option>
                                </select>
                              </div>

                              {/* Voice Gender */}
                              <div className="space-y-3 mt-4">
                                <label className="text-xs font-light text-slate-900 dark:text-white">
                                  Voice Gender
                                </label>
                                <select
                                  value={voiceGender}
                                  onChange={(e) => setVoiceGender(e.target.value as 'MALE' | 'FEMALE' | 'NEUTRAL')}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent font-light"
                                >
                                  <option value="FEMALE">Female</option>
                                  <option value="MALE">Male</option>
                                  <option value="NEUTRAL">Neutral</option>
                                </select>
                              </div>

                              {/* Auto-detect toggle */}
                              <div className="flex items-center space-x-3 mt-4">
                                <input
                                  type="checkbox"
                                  id="autoDetect"
                                  checked={autoDetectLanguage}
                                  onChange={(e) => setAutoDetectLanguage(e.target.checked)}
                                  className="rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-slate-500"
                                />
                                <label htmlFor="autoDetect" className="text-xs text-slate-700 dark:text-slate-300 font-light">
                                  Auto-detect and translate
                                </label>
                              </div>

                              {/* Test Button */}
                              <Button
                                onClick={() => handleCloudTTSPlay("Welcome to Chirp 3 HD voices! Experience the future of text-to-speech with unparalleled realism and emotional depth.")}
                                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black text-sm py-2 font-light transition-colors"
                              >
                                {isCloudTTSLoading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-black mr-2"></div>
                                    Testing...
                                  </>
                                ) : (
                                  <>✨ Test Chirp 3: HD</>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center space-x-2 mb-3">
                                <Crown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <span className="text-sm font-light text-slate-900 dark:text-white">
                                  Premium Voices Available
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-light mb-4">
                                Upgrade to access Google Chirp 3: HD voices with LLM-powered realism
                              </p>
                              <Button
                                onClick={() => router.push('/upgrade-to-lifetime')}
                                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black text-sm py-2 font-light transition-colors"
                              >
                                Upgrade for Premium Voices
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// Quick access button to show the controls if hidden
export function GlobalAudioToggle() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // This could be used to show the controls if they're hidden
              // For now, it's just a placeholder
            }}
            className="fixed bottom-6 right-6 z-40 h-12 w-12 p-0 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg"
          >
            <Headphones className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Show audio controls</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 