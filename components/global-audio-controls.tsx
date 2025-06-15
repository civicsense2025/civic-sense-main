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
        console.error('Speech error:', event)
        
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
      this.playText(pageContent)
    }
  }

  // Simplified and safe page content extraction
  private extractPageContent(): string {
    if (typeof window === 'undefined') return ''
    
    try {
      // Simple content extraction without complex DOM traversal
      const contentSelectors = [
        'main',
        '[role="main"]',
        'article',
        '.content',
        '.prose'
      ]
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          const text = element.textContent || ''
          if (text.trim().length > 50) {
            return this.cleanTextForSpeech(text.slice(0, 2000)) // Limit length
          }
        }
      }
      
      // Fallback to headings and paragraphs (limited)
      const elements = document.querySelectorAll('h1, h2, h3, p')
      let text = ''
      let count = 0
      
      for (const element of elements) {
        if (count >= 10) break // Limit to prevent memory issues
        
        const elementText = element.textContent?.trim() || ''
        if (elementText.length > 10 && !element.closest('nav, header, footer, .menu, .controls')) {
          text += elementText + '. '
          count++
        }
      }
      
      return text.length > 50 ? this.cleanTextForSpeech(text.slice(0, 2000)) : ''
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

  return {
    ...state,
    playText: useCallback((text: string, options?: Parameters<typeof manager.playText>[1]) => 
      manager.playText(text, options), [manager]),
    readCurrentPage: useCallback(() => manager.readCurrentPage(), [manager]),
    pause: useCallback(() => manager.pause(), [manager]),
    resume: useCallback(() => manager.resume(), [manager]),
    stop: useCallback(() => manager.stop(), [manager]),
    restart: useCallback(() => manager.restart(), [manager]),
    setAutoPlay: useCallback((enabled: boolean) => manager.setAutoPlay(enabled), [manager]),
    setLoop: useCallback((enabled: boolean) => manager.setLoop(enabled), [manager]),
    setHighlighting: useCallback((enabled: boolean) => manager.setHighlighting(enabled), [manager])
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
  const [isSupported, setIsSupported] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRate] = useState([1.0])
  const [pitch, setPitch] = useState([1.0])
  const [volume, setVolume] = useState([0.8])
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
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
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          voiceGender: voiceGender,
          voiceType: voiceType,
          autoDetectLanguage: autoDetectLanguage,
          speakingRate: rate[0],
          pitch: pitch[0],
          volumeGainDb: (volume[0] - 0.5) * 20 // Convert 0-1 to -10 to +10 dB
        })
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
        const audioBlob = new Blob([
          Uint8Array.from(atob(result.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' })
        
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onplay = () => {
          console.log('Cloud TTS audio started')
        }
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          console.log('Cloud TTS audio ended')
        }
        
        audio.onerror = (error) => {
          console.error('Cloud TTS audio playback error:', error)
          setLastError('Audio playback failed')
          URL.revokeObjectURL(audioUrl)
        }
        
        await audio.play()
        
        // Show translation info if available
        if (result.translatedText && result.detectedLanguage) {
          console.log(`Translated from ${result.detectedLanguage}: "${result.translatedText}"`)
        }
      }

    } catch (error) {
      console.error('Cloud TTS error:', error)
      setLastError(`Cloud TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Fallback to browser TTS
      setUseCloudTTS(false)
      playText(text, {
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

  if (!isSupported || !isVisible) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out",
        isMinimized ? "w-14 h-14" : "min-w-72",
        className
      )}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-xl">
          {isMinimized ? (
            // Minimized state - just the main control button
            <div className="p-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={currentText ? (isPlaying ? (isPaused ? resume : pause) : restart) : readCurrentPage}
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    {isPlaying ? (
                      isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />
                    ) : currentText ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Headphones className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {currentText ? (isPlaying ? (isPaused ? "Resume" : "Pause") : "Play") : "Read current page"}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(false)}
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
                  >
                    <Maximize2 className="h-2 w-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Expand controls</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            // Full state - more minimal design
            <div className="p-3 space-y-3">
              {/* Minimal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Headphones className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <div className="flex space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAutoPlay(!autoPlayEnabled)}
                          className={cn(
                            "h-6 w-6 p-0 text-xs",
                            autoPlayEnabled && "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          )}
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Auto-play: {autoPlayEnabled ? 'ON' : 'OFF'}</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLoop(!loopEnabled)}
                          className={cn(
                            "h-6 w-6 p-0 text-xs",
                            loopEnabled && "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          )}
                        >
                          <Repeat className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Loop: {loopEnabled ? 'ON' : 'OFF'}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMinimized(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Minimize2 className="h-2 w-2" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Minimize</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsVisible(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hide controls</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Error display */}
              {lastError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-red-600 dark:text-red-400">{lastError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLastError(null)}
                      className="h-4 w-4 p-0 text-red-500"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecovery}
                    className="mt-2 h-6 text-xs w-full"
                  >
                    🔧 Fix Audio
                  </Button>
                </div>
              )}

              {/* Current status - smaller and minimal */}
              {currentText && (
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 truncate">
                  {isPlaying ? (isPaused ? '⏸' : '▶') : '⏹'} {currentText.slice(0, 40)}...
                </div>
              )}

              {/* Main Controls - more compact */}
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={currentText ? (isPlaying ? (isPaused ? resume : pause) : restart) : readCurrentPage}
                      className="flex-shrink-0 h-8"
                    >
                      {isPlaying ? (
                        isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />
                      ) : currentText ? (
                        <Play className="h-3 w-3" />
                      ) : (
                        <Headphones className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {currentText ? (isPlaying ? (isPaused ? "Resume" : "Pause") : "Play") : "Read current page"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={readCurrentPage}
                      className="flex-shrink-0 h-8"
                    >
                      📄
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Read current page</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={restart}
                      disabled={!currentText}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restart</TooltipContent>
                </Tooltip>

                {/* Volume Control - more compact */}
                <div className="flex items-center space-x-1 flex-grow">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        {isMuted || volume[0] === 0 ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                  </Tooltip>
                  
                  <Slider
                    value={volume}
                    onValueChange={(value: number[]) => {
                      setVolume(value)
                      setIsMuted(value[0] === 0)
                    }}
                    min={0}
                    max={1}
                    step={0.1}
                    className="flex-grow"
                  />
                </div>

                {/* Settings */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                  
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Test button */}
                    <div className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayWithCurrentSettings}
                        className="w-full text-xs h-7"
                      >
                        🎵 Test Audio
                      </Button>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Highlighting Toggle */}
                    <div className="p-2">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={highlightingEnabled}
                          onChange={(e) => setHighlighting(e.target.checked)}
                          className="rounded"
                        />
                        <span>Word highlighting</span>
                      </label>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Voice Quality Notice */}
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <div className="font-medium">🎯 For Best Quality:</div>
                        <div>• Enable Google Cloud TTS below (premium voices)</div>
                        <div>• Or install better system voices in your OS</div>
                        <div>• Current browser voices: {voices.length} (filtered from 200+)</div>
                      </div>
                    </div>

                    {/* Voice Selection - Simplified to Basic vs Premium */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Voice Options
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {useCloudTTS ? 'Premium' : 'Basic'}
                          </span>
                          <Switch
                            checked={useCloudTTS}
                            onCheckedChange={setUseCloudTTS}
                          />
                        </div>
                      </div>

                      {/* Basic Browser Voices (Free) */}
                      {!useCloudTTS && (
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Browser Voices (Free)
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                              Standard system voices available on your device
                            </p>
                            
                            {/* Voice Selection Dropdown */}
                            <select
                              value={selectedVoice?.name || ''}
                              onChange={(e) => {
                                const voice = voices.find(v => v.voice.name === e.target.value)?.voice
                                setSelectedVoice(voice || null)
                              }}
                              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Auto-select best voice</option>
                              {voices
                                .filter(voiceOption => {
                                  // Only show decent quality browser voices
                                  const quality = getVoiceQuality(voiceOption.voice)
                                  return quality === 'high' || quality === 'medium'
                                })
                                .slice(0, 10) // Limit to top 10 voices
                                .map((voiceOption) => (
                                  <option key={voiceOption.voice.name} value={voiceOption.voice.name}>
                                    {voiceOption.name} ({voiceOption.voice.lang})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Premium Chirp 3: HD Voices (Members Only) */}
                      {useCloudTTS && (
                        <div className="space-y-3">
                          {(user && (isPremium || isPro)) ? (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  ✨ Google Chirp 3: HD Voices (Ultra Premium)
                                </span>
                              </div>
                              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                                🎯 LLM-powered voices with unparalleled realism and emotional resonance
                              </p>
                              <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                                Features: Aoede, Puck, Kore, Charon + 26 more premium voices
                              </p>
                              
                              {/* Language Selection */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-purple-900 dark:text-purple-100">
                                  Target Language
                                </label>
                                <select
                                  value={targetLanguage}
                                  onChange={(e) => setTargetLanguage(e.target.value)}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                              {/* Voice Quality Selection */}
                              <div className="space-y-2 mt-3">
                                <label className="text-xs font-medium text-purple-900 dark:text-purple-100">
                                  Voice Quality
                                </label>
                                <select
                                  value={voiceType}
                                  onChange={(e) => setVoiceType(e.target.value as 'CHIRP3_HD')}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="CHIRP3_HD">✨ Chirp 3: HD (Ultra Premium - $32/1M chars)</option>
                                </select>
                              </div>

                              {/* Voice Gender */}
                              <div className="space-y-2 mt-3">
                                <label className="text-xs font-medium text-purple-900 dark:text-purple-100">
                                  Voice Gender
                                </label>
                                <select
                                  value={voiceGender}
                                  onChange={(e) => setVoiceGender(e.target.value as 'MALE' | 'FEMALE' | 'NEUTRAL')}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="FEMALE">Female</option>
                                  <option value="MALE">Male</option>
                                  <option value="NEUTRAL">Neutral</option>
                                </select>
                              </div>

                              {/* Auto-detect and translate */}
                              <div className="flex items-center space-x-2 mt-3">
                                <input
                                  type="checkbox"
                                  id="autoDetect"
                                  checked={autoDetectLanguage}
                                  onChange={(e) => setAutoDetectLanguage(e.target.checked)}
                                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="autoDetect" className="text-xs text-purple-700 dark:text-purple-300">
                                  Auto-detect and translate
                                </label>
                              </div>

                              {/* Test Button */}
                              <Button
                                onClick={() => handleCloudTTSPlay("Welcome to Chirp 3 HD voices! Experience the future of text-to-speech with unparalleled realism and emotional depth.")}
                                className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2"
                              >
                                {isCloudTTSLoading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Testing...
                                  </>
                                ) : (
                                  <>✨ Test Chirp 3: HD</>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center space-x-2 mb-2">
                                <Crown className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  Premium Voices Available
                                </span>
                              </div>
                              <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                                Upgrade to access Google Chirp 3: HD voices with LLM-powered realism
                              </p>
                              <Button
                                onClick={() => router.push('/upgrade-to-lifetime')}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2"
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