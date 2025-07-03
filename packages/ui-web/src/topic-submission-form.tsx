'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Loader2 } from 'lucide-react'

interface TopicSubmissionFormProps {
  date: string
}

export function TopicSubmissionForm({ date }: TopicSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      topic_title: formData.get('topic_title'),
      description: formData.get('description'),
      why_this_matters: formData.get('why_this_matters'),
      source_url: formData.get('source_url'),
      date
    }

    try {
      const response = await fetch('/api/topics/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit topic suggestion')
      }

      setIsSuccess(true)
      e.currentTarget.reset()
    } catch (err) {
      setError('Failed to submit topic. Please try again.')
      console.error('Topic submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 text-6xl">🎉</div>
        <h3 className="text-2xl font-bold mb-2">Thanks for your suggestion!</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Our team will review your submission and may add it to our topics list.
        </p>
        <Button onClick={() => setIsSuccess(false)}>Submit another topic</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="topic_title">Topic Title</Label>
        <Input
          id="topic_title"
          name="topic_title"
          placeholder="E.g., Infrastructure Bill Debate"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Briefly describe the topic and its significance..."
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="why_this_matters">Why This Matters</Label>
        <Textarea
          id="why_this_matters"
          name="why_this_matters"
          placeholder="Explain why citizens should care about this topic..."
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="source_url">Source URL (Optional)</Label>
        <Input
          id="source_url"
          name="source_url"
          type="url"
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Topic Suggestion'
        )}
      </Button>
    </form>
  )
} 