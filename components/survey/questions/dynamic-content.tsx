"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "./star-rating"
import { ScaleRating } from "./scale-rating"
import { TextInput } from "./text-input"
import { cn } from "@/lib/utils"
import { Loader2, AlertCircle } from "lucide-react"

interface DynamicContentConfig {
  contentType: 'quiz_question' | 'article' | 'topic' | 'custom'
  contentId?: string
  apiEndpoint?: string
  displayFields: string[] // Which fields to display from the fetched content
  questionType: 'rating_stars' | 'scale' | 'text' | 'multiple_choice'
  questionPrompt: string // e.g., "Rate this question:", "How useful is this content?"
  scaleConfig?: {
    min: number
    max: number
    labels: { min: string; max: string }
  }
}

interface DynamicContentProps {
  questionId: string
  config: DynamicContentConfig
  value?: any
  onChange: (value: any) => void
  className?: string
}

interface ContentData {
  id: string
  title?: string
  question?: string
  content?: string
  description?: string
  category?: string
  difficulty?: string
  [key: string]: any
}

export function DynamicContent({ 
  questionId, 
  config, 
  value, 
  onChange, 
  className 
}: DynamicContentProps) {
  const [content, setContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dynamic content
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      setError(null)

      try {
        let url: string
        
        if (config.apiEndpoint) {
          url = config.apiEndpoint
        } else if (config.contentType && config.contentId) {
          // Build URL based on content type
          switch (config.contentType) {
            case 'quiz_question':
              url = `/api/questions/${config.contentId}`
              break
            case 'article':
              url = `/api/articles/${config.contentId}`
              break
            case 'topic':
              url = `/api/topics/${config.contentId}`
              break
            default:
              throw new Error('Invalid content type or missing API endpoint')
          }
        } else {
          throw new Error('Content configuration is incomplete')
        }

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`)
        }

        const data = await response.json()
        setContent(data.question || data.article || data.topic || data)
      } catch (err) {
        console.error('Error fetching dynamic content:', err)
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [config])

  const renderContent = () => {
    if (!content) return null

    return (
      <Card className="mb-6 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {config.displayFields.map((field, index) => {
              const fieldValue = content[field]
              if (!fieldValue) return null

              return (
                <div key={index} className="space-y-2">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                    {field.replace('_', ' ')}:
                  </div>
                  <div 
                    className="text-base text-slate-900 dark:text-white leading-relaxed"
                    data-question-content="true"
                  >
                    {typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)}
                  </div>
                </div>
              )
            })}

            {/* Additional metadata */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-2">
                {content.category && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    {content.category}
                  </span>
                )}
                {content.difficulty && (
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded-full">
                    Difficulty: {content.difficulty}
                  </span>
                )}
                {content.id && (
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                    ID: {content.id}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderQuestionInput = () => {
    switch (config.questionType) {
      case 'rating_stars':
        return (
          <StarRating
            questionId={questionId}
            value={typeof value === 'number' ? value : 0}
            onChange={onChange}
            maxStars={5}
          />
        )

      case 'scale':
        return (
          <ScaleRating
            questionId={questionId}
            min={config.scaleConfig?.min || 1}
            max={config.scaleConfig?.max || 5}
            value={typeof value === 'number' ? value : undefined}
            onChange={onChange}
            labels={config.scaleConfig?.labels}
          />
        )

      case 'text':
        return (
          <TextInput
            questionId={questionId}
            type="textarea"
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            placeholder="Share your thoughts..."
            maxLength={1000}
          />
        )

      case 'multiple_choice':
        // For multiple choice, we'd need to define options in the config
        return (
          <div className="text-center text-slate-500 dark:text-slate-400">
            Multiple choice not yet implemented for dynamic content
          </div>
        )

      default:
        return (
          <div className="text-center text-slate-500 dark:text-slate-400">
            Unknown question type: {config.questionType}
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)} data-audio-content="true">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400">Loading content...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)} data-audio-content="true">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <div className="space-y-2">
              <p className="text-red-600 dark:text-red-400 font-medium">Failed to load content</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)} data-audio-content="true">
      {/* Dynamic Content Display */}
      {renderContent()}

      {/* Question Prompt */}
      <div className="text-center space-y-2">
        <h4 className="text-lg font-medium text-slate-900 dark:text-white" data-question-content="true">
          {config.questionPrompt}
        </h4>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
      </div>

      {/* Question Input */}
      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          {renderQuestionInput()}
        </div>
      </div>

      {/* Helpful context */}
      {value && (
        <div className="text-center mt-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="inline-flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-full">
            <span>Thanks for your feedback!</span>
            <span className="animate-bounce">🙏</span>
          </div>
        </div>
      )}

      {/* Content metadata for context */}
      {content && (
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>Your feedback helps improve our {config.contentType.replace('_', ' ')} content</p>
          {config.contentType === 'quiz_question' && (
            <p>Question ratings help us create better learning experiences</p>
          )}
        </div>
      )}
    </div>
  )
} 