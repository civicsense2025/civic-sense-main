'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { MessageSquare, Save, CheckCircle } from 'lucide-react'

interface ReflectionComponentProps {
  prompts: string[]
  onSubmit?: (response: string) => void
  initialResponse?: string
  className?: string
}

export function ReflectionComponent({
  prompts,
  onSubmit,
  initialResponse = '',
  className
}: ReflectionComponentProps) {
  const [response, setResponse] = useState(initialResponse)
  const [submitted, setSubmitted] = useState(!!initialResponse)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setResponse(initialResponse)
    setSubmitted(!!initialResponse)
  }, [initialResponse])

  const handleSubmit = async () => {
    if (!response.trim()) return
    
    setSaving(true)
    try {
      await onSubmit?.(response)
      setSubmitted(true)
    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setSaving(false)
    }
  }

  const wordCount = response.trim().split(/\s+/).filter(word => word.length > 0).length
  const minWords = 50 // Minimum words for a meaningful reflection

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-600" />
          Reflection
          {submitted && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reflection Prompts */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Consider these questions:</h4>
          <ul className="space-y-2">
            {prompts.map((prompt, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                <span className="text-gray-700">{prompt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Response Textarea */}
        <div className="space-y-2">
          <label htmlFor="reflection-response" className="block text-sm font-medium text-gray-700">
            Your Reflection
          </label>
          <Textarea
            id="reflection-response"
            placeholder="Take your time to think deeply about these questions. Your reflection helps reinforce your learning and connect new knowledge to your own experiences..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="min-h-[150px] resize-none"
            disabled={saving}
          />
          
          {/* Word Count and Guidelines */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {wordCount} words
              {wordCount < minWords && (
                <span className="text-orange-600 ml-1">
                  (aim for at least {minWords} words)
                </span>
              )}
            </span>
            <span>Take your time - quality reflection enhances learning</span>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Reflection Tips:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Connect new concepts to your existing knowledge and experiences</li>
            <li>• Consider how this information might change your perspective</li>
            <li>• Think about practical applications in your civic life</li>
            <li>• Be honest about what you found challenging or surprising</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {submitted ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Reflection saved
              </span>
            ) : (
              'Your reflection will be saved automatically'
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!response.trim() || saving || submitted}
            className="min-w-[100px]"
          >
            {saving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : submitted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Reflection
              </>
            )}
          </Button>
        </div>

        {/* Encouragement for deeper thinking */}
        {wordCount >= minWords && !submitted && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              Great reflection! You're engaging deeply with the material. 
              Consider how you might apply these insights in your civic participation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 