import { registerService } from './service-registry'
import { mobileAudioService } from '../audio/audio-service'

// Web-compatible audio service fallback
class WebAudioService {
  async initialize(): Promise<void> {
    console.log('WebAudioService: Initialized with limited functionality')
  }

  async playSoundEffect(soundName: string): Promise<void> {
    console.log(`WebAudioService: Would play sound '${soundName}' (not supported on web)`)
  }

  async stopSpeech(): Promise<void> {
    console.log('WebAudioService: Stop speech (not supported on web)')
  }

  async speakText(text: string): Promise<void> {
    console.log(`WebAudioService: Would speak text '${text}' (not supported on web)`)
  }
}

// Register the audio service with platform-specific configuration
registerService('audio', {
  factory: async () => {
    await mobileAudioService.initialize()
    return mobileAudioService
  },
  fallback: () => new WebAudioService(),
  platforms: ['ios', 'android'], // Only available natively
  required: false // Not required - app can function without audio
})

// Export typed service getter
export async function getAudioService(): Promise<typeof mobileAudioService | WebAudioService | null> {
  const { getService } = await import('./service-registry')
  return getService<typeof mobileAudioService | WebAudioService>('audio')
}

// Example usage in components:
/*
import { getAudioService } from '@/lib/services/audio-service-registry'

export function CivicQuizComponent() {
  const playCorrectSound = async () => {
    const audioService = await getAudioService()
    if (audioService) {
      await audioService.playSoundEffect('quiz_correct')
    }
  }

  const speakQuestion = async (text: string) => {
    const audioService = await getAudioService()
    if (audioService) {
      await audioService.speakText(text)
    }
  }

  return (
    <Button onPress={playCorrectSound}>
      Submit Answer
    </Button>
  )
}
*/ 