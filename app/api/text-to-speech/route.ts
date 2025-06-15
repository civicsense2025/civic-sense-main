import { NextRequest, NextResponse } from 'next/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { TranslationServiceClient } from '@google-cloud/translate'

// This would be the Google Cloud TTS + Translation implementation
// Currently disabled - would require Google Cloud API keys

interface TTSRequest {
  text: string
  targetLanguage?: string
  voiceGender?: 'MALE' | 'FEMALE' | 'NEUTRAL'
  voiceType?: 'STANDARD' | 'WAVENET' | 'NEURAL2'
  autoDetectLanguage?: boolean
  speakingRate?: number
  pitch?: number
  volumeGainDb?: number
}

interface TTSResponse {
  success: boolean
  audioContent?: string
  detectedLanguage?: string
  translatedText?: string
  voiceUsed?: string
  error?: string
  usage?: {
    charactersProcessed: number
    estimatedCost: string
  }
}

// Initialize clients
let ttsClient: TextToSpeechClient | null = null
let translateClient: TranslationServiceClient | null = null

function initializeClients() {
  try {
    console.log('Initializing Google Cloud clients...')
    
    // Detect environment - prioritize local development credentials
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'
    const hasLocalCredentials = process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL
    const hasWorkloadIdentity = process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const hasServiceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS
    
    console.log('Environment detection:', {
      isProduction,
      hasLocalCredentials,
      hasWorkloadIdentity,
      hasServiceAccountKey
    })
    
    // For local development, prioritize individual environment variables
    if (!isProduction && hasLocalCredentials) {
      console.log('Using individual service account environment variables (local development)')
      
      const credentials = {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL!,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }
      
      ttsClient = new TextToSpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials,
      })
      
      translateClient = new TranslationServiceClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials,
      })
      
      console.log('✅ Clients initialized with individual credentials (local dev)')
      return true
    }
    
    // For production, prioritize Workload Identity Federation
    if (isProduction && hasWorkloadIdentity) {
      console.log('Using Workload Identity Federation authentication (production)')
      
      const authConfig = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      }
      
      ttsClient = new TextToSpeechClient(authConfig)
      translateClient = new TranslationServiceClient(authConfig)
      
      console.log('✅ Clients initialized with Workload Identity Federation (production)')
      return true
    }
    
    // Fallback to service account key authentication (if available)
    if (hasServiceAccountKey) {
      console.log('Using service account key authentication (fallback)')
      
      ttsClient = new TextToSpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      })
      
      translateClient = new TranslationServiceClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      })
      
      console.log('✅ Clients initialized with service account key (fallback)')
      return true
    }
    
    // Final fallback: try any available method
    if (hasWorkloadIdentity) {
      console.log('Attempting Workload Identity Federation as final fallback')
      
      const authConfig = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      }
      
      ttsClient = new TextToSpeechClient(authConfig)
      translateClient = new TranslationServiceClient(authConfig)
      
      console.log('✅ Clients initialized with Workload Identity Federation (final fallback)')
      return true
    }
    
    if (hasLocalCredentials) {
      console.log('Attempting individual credentials as final fallback')
      
      const credentials = {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL!,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }
      
      ttsClient = new TextToSpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials,
      })
      
      translateClient = new TranslationServiceClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials,
      })
      
      console.log('✅ Clients initialized with individual credentials (final fallback)')
      return true
    }
    
    console.warn('❌ No valid authentication method found. Available methods:')
    console.warn('  - Individual credentials (GOOGLE_CLOUD_PRIVATE_KEY + GOOGLE_CLOUD_CLIENT_EMAIL)')
    console.warn('  - Workload Identity Federation (GOOGLE_WORKLOAD_IDENTITY_PROVIDER + GOOGLE_SERVICE_ACCOUNT_EMAIL)')
    console.warn('  - Service Account Key (GOOGLE_APPLICATION_CREDENTIALS)')
    return false
    
  } catch (error) {
    console.error('❌ Failed to initialize Google Cloud clients:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()
    const { 
      text, 
      targetLanguage = 'en-US', 
      voiceGender = 'NEUTRAL',
      voiceType = 'NEURAL2',
      autoDetectLanguage = true,
      speakingRate = 1.0,
      pitch = 0.0,
      volumeGainDb = 0.0
    } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Text is required'
      }, { status: 400 })
    }

    // Initialize Google Cloud clients
    const clientsInitialized = initializeClients()
    
    if (!clientsInitialized) {
      return NextResponse.json({
        success: false,
        error: 'Google Cloud TTS not configured. Using browser fallback.',
        fallbackMode: true,
        usage: {
          charactersProcessed: text.length,
          estimatedCost: '$0.00 (fallback mode)'
        }
      })
    }

    // Auto-detect language if requested
    let detectedLanguage = 'en'
    let textToSpeak = text
    
    if (autoDetectLanguage && translateClient) {
      try {
        console.log('Detecting language...')
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
        if (!projectId) {
          throw new Error('Project ID not configured')
        }
        
        const [detectionResponse] = await translateClient.detectLanguage({
          parent: `projects/${projectId}/locations/global`,
          content: text
        })
        
        if (detectionResponse.languages && detectionResponse.languages.length > 0) {
          detectedLanguage = detectionResponse.languages[0].languageCode || 'en'
          console.log(`Detected language: ${detectedLanguage}`)
        }
        
        // Translate if source and target languages are different
        if (detectedLanguage !== targetLanguage.split('-')[0]) {
          console.log(`Translating from ${detectedLanguage} to ${targetLanguage}...`)
          const [translationResponse] = await translateClient.translateText({
            parent: `projects/${projectId}/locations/global`,
            contents: [text],
            mimeType: 'text/plain',
            sourceLanguageCode: detectedLanguage,
            targetLanguageCode: targetLanguage.split('-')[0]
          })
          
          if (translationResponse.translations && translationResponse.translations.length > 0) {
            textToSpeak = translationResponse.translations[0].translatedText || text
            console.log(`Translated text: ${textToSpeak}`)
          }
        }
      } catch (error) {
        console.warn('Translation failed, using original text:', error)
        detectedLanguage = 'unknown'
      }
    }

    // Step 2: Text-to-Speech synthesis
    if (!ttsClient) {
      throw new Error('TTS client not initialized')
    }

    // Prepare the synthesis request
    const synthesisRequest = {
      input: { text: textToSpeak },
      voice: {
        languageCode: targetLanguage,
        ssmlGender: voiceGender as any,
        name: getVoiceName(targetLanguage, voiceGender, voiceType)
      },
      audioConfig: {
        audioEncoding: 'MP3' as any,
        speakingRate: Math.max(0.25, Math.min(4.0, speakingRate)),
        pitch: Math.max(-20.0, Math.min(20.0, pitch)),
        volumeGainDb: Math.max(-96.0, Math.min(16.0, volumeGainDb)),
        effectsProfileId: ['telephony-class-application'], // Optimize for speech
      },
    }

    console.log('Synthesizing speech with request:', {
      textLength: textToSpeak.length,
      language: targetLanguage,
      voice: synthesisRequest.voice.name,
      gender: voiceGender
    })

    // Perform the text-to-speech request
    const [response] = await ttsClient.synthesizeSpeech(synthesisRequest)

    if (!response.audioContent) {
      throw new Error('No audio content received from Google Cloud TTS')
    }

    // Convert audio content to base64
    const audioBase64 = Buffer.from(response.audioContent).toString('base64')

    // Calculate usage and cost
    const charactersProcessed = textToSpeak.length
    const estimatedCost = calculateEstimatedCost(charactersProcessed, voiceType)

    const result: TTSResponse = {
      success: true,
      audioContent: audioBase64,
      detectedLanguage,
      translatedText: textToSpeak,
      voiceUsed: synthesisRequest.voice.name || `${targetLanguage}-${voiceGender}-${voiceType}`,
      usage: {
        charactersProcessed,
        estimatedCost
      }
    }

    console.log(`TTS synthesis successful: ${charactersProcessed} characters, estimated cost: ${estimatedCost}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in TTS API:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallbackMode: true
    }, { status: 500 })
  }
}

function calculateEstimatedCost(characters: number, voiceType: string): string {
  // Google Cloud TTS pricing (as of 2024)
  const rates = {
    'STANDARD': 4.00, // $4.00 per 1M characters
    'WAVENET': 16.00, // $16.00 per 1M characters  
    'NEURAL2': 16.00  // $16.00 per 1M characters
  }
  
  const ratePerMillion = rates[voiceType as keyof typeof rates] || rates.STANDARD
  const cost = (characters / 1000000) * ratePerMillion
  
  if (cost < 0.01) {
    return '$0.00'
  }
  
  return `$${cost.toFixed(4)}`
}

function getVoiceName(languageCode: string, gender: string, voiceType: string): string {
  // Map to specific Google Cloud voice names for better quality
  const voiceMap: Record<string, Record<string, Record<string, string>>> = {
    'en-US': {
      'FEMALE': {
        'NEURAL2': 'en-US-Neural2-F',
        'WAVENET': 'en-US-Wavenet-F',
        'STANDARD': 'en-US-Standard-C'
      },
      'MALE': {
        'NEURAL2': 'en-US-Neural2-D',
        'WAVENET': 'en-US-Wavenet-D', 
        'STANDARD': 'en-US-Standard-D'
      },
      'NEUTRAL': {
        'NEURAL2': 'en-US-Neural2-F',
        'WAVENET': 'en-US-Wavenet-F',
        'STANDARD': 'en-US-Standard-C'
      }
    },
    'es-ES': {
      'FEMALE': {
        'NEURAL2': 'es-ES-Neural2-C',
        'WAVENET': 'es-ES-Wavenet-C',
        'STANDARD': 'es-ES-Standard-A'
      },
      'MALE': {
        'NEURAL2': 'es-ES-Neural2-B',
        'WAVENET': 'es-ES-Wavenet-B',
        'STANDARD': 'es-ES-Standard-B'
      }
    },
    'fr-FR': {
      'FEMALE': {
        'NEURAL2': 'fr-FR-Neural2-A',
        'WAVENET': 'fr-FR-Wavenet-A',
        'STANDARD': 'fr-FR-Standard-A'
      },
      'MALE': {
        'NEURAL2': 'fr-FR-Neural2-B',
        'WAVENET': 'fr-FR-Wavenet-B',
        'STANDARD': 'fr-FR-Standard-B'
      }
    }
  }
  
  return voiceMap[languageCode]?.[gender]?.[voiceType] || `${languageCode}-${voiceType}-A`
}

// GET endpoint to list available voices
export async function GET(request: NextRequest) {
  try {
    const clientsInitialized = initializeClients()
    
    if (!clientsInitialized || !ttsClient) {
      return NextResponse.json({
        success: false,
        error: 'Google Cloud TTS not configured',
        voices: []
      })
    }

    // List available voices
    const [result] = await ttsClient.listVoices({})
    
    const voices = result.voices?.map(voice => ({
      name: voice.name,
      languageCodes: voice.languageCodes,
      ssmlGender: voice.ssmlGender,
      naturalSampleRateHertz: voice.naturalSampleRateHertz
    })) || []

    return NextResponse.json({
      success: true,
      voices,
      totalVoices: voices.length
    })

  } catch (error) {
    console.error('Error listing voices:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      voices: []
    }, { status: 500 })
  }
} 