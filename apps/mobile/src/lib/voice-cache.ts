// Shared voice cache to prevent redundant loading across components
interface CachedVoices {
  voices: SpeechSynthesisVoice[]
  timestamp: number
  loaded: boolean
}

class VoiceCache {
  private static instance: VoiceCache
  private cache: CachedVoices | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): VoiceCache {
    if (!VoiceCache.instance) {
      VoiceCache.instance = new VoiceCache()
    }
    return VoiceCache.instance
  }

  getEnglishVoices(maxCount: number = 10): SpeechSynthesisVoice[] {
    // Check if we have valid cached voices
    if (this.cache && this.cache.loaded && 
        (Date.now() - this.cache.timestamp) < this.CACHE_DURATION) {
      return this.cache.voices.slice(0, maxCount)
    }

    // Load fresh voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const availableVoices = speechSynthesis.getVoices()
      
      if (availableVoices.length > 0) {
        const englishVoices = availableVoices
          .filter(voice => voice.lang.startsWith('en'))
          .filter(voice => {
            const name = voice.name.toLowerCase()
            return !['espeak', 'festival', 'flite', 'pico', 'robot', 'synthetic'].some(pattern => 
              name.includes(pattern)
            )
          })

        this.cache = {
          voices: englishVoices,
          timestamp: Date.now(),
          loaded: true
        }

        return englishVoices.slice(0, maxCount)
      }
    }

    return []
  }

  isLoaded(): boolean {
    return this.cache?.loaded ?? false
  }

  clearCache(): void {
    this.cache = null
  }
}

export const voiceCache = VoiceCache.getInstance()

// Helper function for components to use
export function useOptimizedVoices(maxCount: number = 10): {
  voices: SpeechSynthesisVoice[]
  isLoaded: boolean
} {
  const voices = voiceCache.getEnglishVoices(maxCount)
  return {
    voices,
    isLoaded: voices.length > 0
  }
} 