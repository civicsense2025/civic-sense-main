import { NextRequest, NextResponse } from 'next/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { TranslationServiceClient } from '@google-cloud/translate'

// This would be the Google Cloud TTS + Translation implementation
// Currently disabled - would require Google Cloud API keys

interface TTSRequest {
  text: string
  targetLanguage?: string
  voiceGender?: 'MALE' | 'FEMALE' | 'NEUTRAL'
  voiceType?: 'STANDARD' | 'WAVENET' | 'NEURAL2' | 'CHIRP3_HD'
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
      voiceGender = 'FEMALE', // Default to female for better quality
      voiceType = 'CHIRP3_HD', // Default to highest quality Chirp 3: HD voices
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
    'STANDARD': 4.00,    // $4.00 per 1M characters
    'WAVENET': 16.00,    // $16.00 per 1M characters  
    'NEURAL2': 16.00,    // $16.00 per 1M characters
    'CHIRP3_HD': 32.00   // $32.00 per 1M characters (premium LLM-powered voices)
  }
  
  const ratePerMillion = rates[voiceType as keyof typeof rates] || rates.CHIRP3_HD // Default to premium
  const cost = (characters / 1000000) * ratePerMillion
  
  if (cost < 0.01) {
    return '$0.00'
  }
  
  return `$${cost.toFixed(4)}`
}

function getVoiceName(languageCode: string, gender: string, voiceType: string): string {
  // Chirp 3: HD voices - highest quality available (powered by LLMs)
  const chirp3HDVoices: Record<string, Record<string, string[]>> = {
    'en-US': {
      'FEMALE': [
        'en-US-Chirp3-HD-Aoede',      // Elegant, clear
        'en-US-Chirp3-HD-Kore',       // Warm, engaging  
        'en-US-Chirp3-HD-Leda',       // Professional, articulate
        'en-US-Chirp3-HD-Zephyr',     // Gentle, soothing
        'en-US-Chirp3-HD-Autonoe',    // Confident, authoritative
        'en-US-Chirp3-HD-Callirrhoe', // Expressive, dynamic
        'en-US-Chirp3-HD-Despina',    // Friendly, approachable
        'en-US-Chirp3-HD-Erinome',    // Sophisticated, refined
        'en-US-Chirp3-HD-Gacrux',     // Strong, clear
        'en-US-Chirp3-HD-Laomedeia',  // Melodic, pleasant
        'en-US-Chirp3-HD-Pulcherrima',// Beautiful, resonant
        'en-US-Chirp3-HD-Sulafat',    // Bright, energetic
        'en-US-Chirp3-HD-Vindemiatrix', // Rich, full-bodied
        'en-US-Chirp3-HD-Achernar'    // Deep, compelling
      ],
      'MALE': [
        'en-US-Chirp3-HD-Puck',         // Versatile, natural
        'en-US-Chirp3-HD-Charon',       // Deep, authoritative
        'en-US-Chirp3-HD-Fenrir',       // Strong, commanding
        'en-US-Chirp3-HD-Orus',         // Smooth, professional
        'en-US-Chirp3-HD-Achird',       // Clear, articulate
        'en-US-Chirp3-HD-Algenib',      // Warm, friendly
        'en-US-Chirp3-HD-Algieba',      // Rich, resonant
        'en-US-Chirp3-HD-Alnilam',      // Confident, engaging
        'en-US-Chirp3-HD-Enceladus',    // Gentle, approachable
        'en-US-Chirp3-HD-Iapetus',      // Sophisticated, refined
        'en-US-Chirp3-HD-Rasalgethi',   // Dynamic, expressive
        'en-US-Chirp3-HD-Sadachbia',    // Calm, steady
        'en-US-Chirp3-HD-Sadaltager',   // Bright, energetic
        'en-US-Chirp3-HD-Schedar',      // Powerful, compelling
        'en-US-Chirp3-HD-Umbriel',      // Thoughtful, measured
        'en-US-Chirp3-HD-Zubenelgenubi' // Distinctive, memorable
      ],
      'NEUTRAL': ['en-US-Chirp3-HD-Aoede', 'en-US-Chirp3-HD-Puck'] // Best voices for neutral
    },
    'en-GB': {
      'FEMALE': ['en-GB-Chirp3-HD-Aoede', 'en-GB-Chirp3-HD-Kore', 'en-GB-Chirp3-HD-Leda'],
      'MALE': ['en-GB-Chirp3-HD-Puck', 'en-GB-Chirp3-HD-Charon', 'en-GB-Chirp3-HD-Orus'],
      'NEUTRAL': ['en-GB-Chirp3-HD-Aoede']
    },
    'en-AU': {
      'FEMALE': ['en-AU-Chirp3-HD-Aoede', 'en-AU-Chirp3-HD-Kore', 'en-AU-Chirp3-HD-Zephyr'],
      'MALE': ['en-AU-Chirp3-HD-Puck', 'en-AU-Chirp3-HD-Charon', 'en-AU-Chirp3-HD-Fenrir'],
      'NEUTRAL': ['en-AU-Chirp3-HD-Aoede']
    },
    'en-IN': {
      'FEMALE': ['en-IN-Chirp3-HD-Aoede', 'en-IN-Chirp3-HD-Kore'],
      'MALE': ['en-IN-Chirp3-HD-Puck', 'en-IN-Chirp3-HD-Charon'],
      'NEUTRAL': ['en-IN-Chirp3-HD-Aoede']
    },
    'es-US': {
      'FEMALE': ['es-US-Chirp3-HD-Aoede', 'es-US-Chirp3-HD-Kore', 'es-US-Chirp3-HD-Leda'],
      'MALE': ['es-US-Chirp3-HD-Puck', 'es-US-Chirp3-HD-Charon', 'es-US-Chirp3-HD-Orus'],
      'NEUTRAL': ['es-US-Chirp3-HD-Aoede']
    },
    'es-ES': {
      'FEMALE': ['es-ES-Chirp3-HD-Aoede', 'es-ES-Chirp3-HD-Kore', 'es-ES-Chirp3-HD-Zephyr'],
      'MALE': ['es-ES-Chirp3-HD-Puck', 'es-ES-Chirp3-HD-Charon', 'es-ES-Chirp3-HD-Fenrir'],
      'NEUTRAL': ['es-ES-Chirp3-HD-Aoede']
    },
    'fr-FR': {
      'FEMALE': ['fr-FR-Chirp3-HD-Aoede', 'fr-FR-Chirp3-HD-Kore', 'fr-FR-Chirp3-HD-Leda'],
      'MALE': ['fr-FR-Chirp3-HD-Puck', 'fr-FR-Chirp3-HD-Charon', 'fr-FR-Chirp3-HD-Orus'],
      'NEUTRAL': ['fr-FR-Chirp3-HD-Aoede']
    },
    'fr-CA': {
      'FEMALE': ['fr-CA-Chirp3-HD-Aoede', 'fr-CA-Chirp3-HD-Kore'],
      'MALE': ['fr-CA-Chirp3-HD-Puck', 'fr-CA-Chirp3-HD-Charon'],
      'NEUTRAL': ['fr-CA-Chirp3-HD-Aoede']
    },
    'de-DE': {
      'FEMALE': ['de-DE-Chirp3-HD-Aoede', 'de-DE-Chirp3-HD-Kore', 'de-DE-Chirp3-HD-Leda'],
      'MALE': ['de-DE-Chirp3-HD-Puck', 'de-DE-Chirp3-HD-Charon', 'de-DE-Chirp3-HD-Orus'],
      'NEUTRAL': ['de-DE-Chirp3-HD-Aoede']
    },
    'pt-BR': {
      'FEMALE': ['pt-BR-Chirp3-HD-Aoede', 'pt-BR-Chirp3-HD-Kore'],
      'MALE': ['pt-BR-Chirp3-HD-Puck', 'pt-BR-Chirp3-HD-Charon'],
      'NEUTRAL': ['pt-BR-Chirp3-HD-Aoede']
    },
    'it-IT': {
      'FEMALE': ['it-IT-Chirp3-HD-Aoede', 'it-IT-Chirp3-HD-Kore'],
      'MALE': ['it-IT-Chirp3-HD-Puck', 'it-IT-Chirp3-HD-Charon'],
      'NEUTRAL': ['it-IT-Chirp3-HD-Aoede']
    },
    'ja-JP': {
      'FEMALE': ['ja-JP-Chirp3-HD-Aoede', 'ja-JP-Chirp3-HD-Kore'],
      'MALE': ['ja-JP-Chirp3-HD-Puck', 'ja-JP-Chirp3-HD-Charon'],
      'NEUTRAL': ['ja-JP-Chirp3-HD-Aoede']
    },
    'ko-KR': {
      'FEMALE': ['ko-KR-Chirp3-HD-Aoede', 'ko-KR-Chirp3-HD-Kore'],
      'MALE': ['ko-KR-Chirp3-HD-Puck', 'ko-KR-Chirp3-HD-Charon'],
      'NEUTRAL': ['ko-KR-Chirp3-HD-Aoede']
    },
    'cmn-CN': {
      'FEMALE': ['cmn-CN-Chirp3-HD-Aoede', 'cmn-CN-Chirp3-HD-Kore'],
      'MALE': ['cmn-CN-Chirp3-HD-Puck', 'cmn-CN-Chirp3-HD-Charon'],
      'NEUTRAL': ['cmn-CN-Chirp3-HD-Aoede']
    },
    'hi-IN': {
      'FEMALE': ['hi-IN-Chirp3-HD-Aoede', 'hi-IN-Chirp3-HD-Kore'],
      'MALE': ['hi-IN-Chirp3-HD-Puck', 'hi-IN-Chirp3-HD-Charon'],
      'NEUTRAL': ['hi-IN-Chirp3-HD-Aoede']
    },
    'ar-XA': {
      'FEMALE': ['ar-XA-Chirp3-HD-Aoede', 'ar-XA-Chirp3-HD-Kore'],
      'MALE': ['ar-XA-Chirp3-HD-Puck', 'ar-XA-Chirp3-HD-Charon'],
      'NEUTRAL': ['ar-XA-Chirp3-HD-Aoede']
    },
    'nl-NL': {
      'FEMALE': ['nl-NL-Chirp3-HD-Aoede', 'nl-NL-Chirp3-HD-Kore'],
      'MALE': ['nl-NL-Chirp3-HD-Puck', 'nl-NL-Chirp3-HD-Charon'],
      'NEUTRAL': ['nl-NL-Chirp3-HD-Aoede']
    },
    'pl-PL': {
      'FEMALE': ['pl-PL-Chirp3-HD-Aoede', 'pl-PL-Chirp3-HD-Kore'],
      'MALE': ['pl-PL-Chirp3-HD-Puck', 'pl-PL-Chirp3-HD-Charon'],
      'NEUTRAL': ['pl-PL-Chirp3-HD-Aoede']
    },
    'ru-RU': {
      'FEMALE': ['ru-RU-Chirp3-HD-Aoede', 'ru-RU-Chirp3-HD-Kore'],
      'MALE': ['ru-RU-Chirp3-HD-Puck', 'ru-RU-Chirp3-HD-Charon'],
      'NEUTRAL': ['ru-RU-Chirp3-HD-Aoede']
    },
    'th-TH': {
      'FEMALE': ['th-TH-Chirp3-HD-Aoede', 'th-TH-Chirp3-HD-Kore'],
      'MALE': ['th-TH-Chirp3-HD-Puck', 'th-TH-Chirp3-HD-Charon'],
      'NEUTRAL': ['th-TH-Chirp3-HD-Aoede']
    },
    'tr-TR': {
      'FEMALE': ['tr-TR-Chirp3-HD-Aoede', 'tr-TR-Chirp3-HD-Kore'],
      'MALE': ['tr-TR-Chirp3-HD-Puck', 'tr-TR-Chirp3-HD-Charon'],
      'NEUTRAL': ['tr-TR-Chirp3-HD-Aoede']
    },
    'vi-VN': {
      'FEMALE': ['vi-VN-Chirp3-HD-Aoede', 'vi-VN-Chirp3-HD-Kore'],
      'MALE': ['vi-VN-Chirp3-HD-Puck', 'vi-VN-Chirp3-HD-Charon'],
      'NEUTRAL': ['vi-VN-Chirp3-HD-Aoede']
    },
    'uk-UA': {
      'FEMALE': ['uk-UA-Chirp3-HD-Aoede', 'uk-UA-Chirp3-HD-Kore'],
      'MALE': ['uk-UA-Chirp3-HD-Puck', 'uk-UA-Chirp3-HD-Charon'],
      'NEUTRAL': ['uk-UA-Chirp3-HD-Aoede']
    }
  }

  // Legacy high-quality voices as fallback
  const legacyVoices: Record<string, Record<string, Record<string, string>>> = {
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

  // Try Chirp 3: HD voices first (highest quality - LLM powered)
  const chirpVoices = chirp3HDVoices[languageCode]?.[gender] || []
  if (chirpVoices.length > 0) {
    // Use the first (best) Chirp 3: HD voice for the gender
    console.log(`🎯 Using Chirp 3: HD voice: ${chirpVoices[0]}`)
    return chirpVoices[0]
  }
  
  // Fallback to legacy high-quality voices
  const fallbackVoice = legacyVoices[languageCode]?.[gender]?.[voiceType]
  if (fallbackVoice) {
    console.log(`⚡ Using legacy voice: ${fallbackVoice}`)
    return fallbackVoice
  }
  
  // Final fallback to best available Chirp 3: HD voice
  const defaultVoice = 'en-US-Chirp3-HD-Aoede' // Premium female voice as ultimate fallback
  console.log(`🔄 Using default Chirp 3: HD voice: ${defaultVoice}`)
  return defaultVoice
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