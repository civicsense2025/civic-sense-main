"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'

export function GoogleTTSTest() {
  const [text, setText] = useState('Hello! This is a test of Google Cloud Text-to-Speech.')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testTTS = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: 'en-US',
          voiceGender: 'FEMALE',
          voiceType: 'NEURAL2',
          autoDetectLanguage: true
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success && data.audioContent) {
        // Play the audio
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' })
        
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
        }
        
        await audio.play()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const testTranslation = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Hola, ¿cómo estás? Este es un test de traducción.',
          targetLanguage: 'en-US',
          voiceGender: 'FEMALE',
          voiceType: 'NEURAL2',
          autoDetectLanguage: true
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success && data.audioContent) {
        // Play the audio
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' })
        
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
        }
        
        await audio.play()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Google Cloud TTS Test</CardTitle>
        <CardDescription>
          Test the Google Cloud Text-to-Speech integration with translation support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Text to synthesize:
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testTTS} 
            disabled={isLoading || !text.trim()}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : '🎵 Test TTS'}
          </Button>
          
          <Button 
            onClick={testTranslation} 
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Processing...' : '🌍 Test Translation'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {result && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg">
            <h4 className="font-medium mb-2">Result:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Success:</strong> {result.success ? '✅' : '❌'}</div>
              {result.detectedLanguage && (
                <div><strong>Detected Language:</strong> {result.detectedLanguage}</div>
              )}
              {result.translatedText && (
                <div><strong>Translated Text:</strong> "{result.translatedText}"</div>
              )}
              {result.voiceUsed && (
                <div><strong>Voice Used:</strong> {result.voiceUsed}</div>
              )}
              {result.usage && (
                <div>
                  <strong>Usage:</strong> {result.usage.charactersProcessed} characters, 
                  estimated cost: {result.usage.estimatedCost}
                </div>
              )}
              {result.fallbackMode && (
                <div className="text-yellow-600 dark:text-yellow-400">
                  <strong>Note:</strong> Using fallback mode (Google Cloud TTS not configured)
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p><strong>Setup Required:</strong></p>
          <p>1. Set up Google Cloud project with TTS and Translation APIs enabled</p>
          <p>2. Create service account with appropriate permissions</p>
          <p>3. Set environment variables: GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS</p>
          <p>4. Install dependencies: @google-cloud/text-to-speech @google-cloud/translate</p>
        </div>
      </CardContent>
    </Card>
  )
} 