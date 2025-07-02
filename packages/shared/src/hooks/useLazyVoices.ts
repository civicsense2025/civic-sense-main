"use client"

import { useState, useCallback, useRef } from "react"

interface VoiceOption {
  voice: SpeechSynthesisVoice
  name: string
  lang: string
  quality: 'high' | 'medium' | 'low'
}

interface UseLazyVoicesReturn {
  voices: VoiceOption[]
  isLoaded: boolean
  isLoading: boolean
  loadVoices: () => Promise<void>
  error: string | null
}

// Cache to prevent redundant loading
let voiceCache: VoiceOption[] | null = null
let loadPromise: Promise<VoiceOption[]> | null = null

export function useLazyVoices(): UseLazyVoicesReturn {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadAttempted = useRef(false)

  const getVoiceQuality = useCallback((voice: SpeechSynthesisVoice): 'high' | 'medium' | 'low' => {
    const name = voice.name.toLowerCase()
    
    // High quality indicators (neural, premium voices)
    if (name.includes('neural') || 
        name.includes('premium') || 
        name.includes('enhanced') ||
        name.includes('natural') ||
        name.includes('siri') ||
        name.includes('alex') ||
        name.includes('samantha') ||
        name.includes('eloquence') ||
        name.includes('vocalizer')) {
      return 'high'
    }
    
    // Medium quality indicators
    if (name.includes('compact') || 
        name.includes('microsoft') ||
        name.includes('apple') ||
        name.includes('google') ||
        voice.localService) {
      return 'medium'
    }
    
    return 'low'
  }, [])

  const loadVoicesInternal = useCallback(async (): Promise<VoiceOption[]> => {
    // Return cached voices if available
    if (voiceCache) {
      return voiceCache
    }

    // Return existing promise if already loading
    if (loadPromise) {
      return loadPromise
    }

    // Create new loading promise
    loadPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      let attempts = 0
      const maxAttempts = 3
      
      const attemptLoad = () => {
        attempts++
        
        try {
          const availableVoices = speechSynthesis.getVoices()
          
          if (availableVoices.length === 0) {
            if (attempts < maxAttempts) {
              // Try again after a delay
              setTimeout(attemptLoad, 500 * attempts)
              return
            } else {
              reject(new Error('No voices available after multiple attempts'))
              return
            }
          }

          // Process and filter voices
          const processedVoices: VoiceOption[] = availableVoices
            .filter(voice => voice.lang.startsWith('en')) // Only English voices
            .filter(voice => {
              const name = voice.name.toLowerCase()
              // Filter out low-quality robotic voices
              return !['espeak', 'festival', 'flite', 'pico', 'robot', 'synthetic'].some(pattern => 
                name.includes(pattern)
              )
            })
            .map(voice => ({
              voice,
              name: voice.name,
              lang: voice.lang,
              quality: getVoiceQuality(voice)
            }))
            .sort((a, b) => {
              // Sort by quality (high > medium > low), then by name
              const qualityOrder = { high: 3, medium: 2, low: 1 }
              const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality]
              return qualityDiff !== 0 ? qualityDiff : a.name.localeCompare(b.name)
            })
            .slice(0, 12) // Limit to 12 best voices

          // Cache the result
          voiceCache = processedVoices
          resolve(processedVoices)
          
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(attemptLoad, 500 * attempts)
          } else {
            reject(error)
          }
        }
      }

      // Try immediate load
      attemptLoad()
      
      // Also listen for voiceschanged event (but only once)
      const handleVoicesChanged = () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
        attemptLoad()
      }
      
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
      
      // Cleanup timeout
      setTimeout(() => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
        if (attempts === 0) {
          reject(new Error('Voice loading timeout'))
        }
      }, 5000)
    })

    return loadPromise
  }, [getVoiceQuality])

  const loadVoices = useCallback(async () => {
    if (isLoading || (isLoaded && voices.length > 0)) {
      return // Already loading or loaded
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const loadedVoices = await loadVoicesInternal()
      setVoices(loadedVoices)
      setIsLoaded(true)
      loadAttempted.current = true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load voices'
      setError(errorMessage)
      console.error('Error loading voices:', err)
    } finally {
      setIsLoading(false)
      // Clear the promise so future calls can try again
      loadPromise = null
    }
  }, [isLoading, isLoaded, voices.length, loadVoicesInternal])

  return {
    voices,
    isLoaded,
    isLoading,
    loadVoices,
    error
  }
}

// Utility function to clear the voice cache (for testing or reset)
export function clearVoiceCache() {
  voiceCache = null
  loadPromise = null
} 