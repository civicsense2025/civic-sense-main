'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, BookOpen, Target, Lightbulb, Star } from 'lucide-react'
import { LessonStep } from '@/types/lesson-steps'

interface LessonStepContentProps {
  step: LessonStep
  onUpdateProgress?: (updates: any) => void
  className?: string
}

export function LessonStepContent({ 
  step, 
  onUpdateProgress,
  className 
}: LessonStepContentProps) {
  const [userRating, setUserRating] = useState<number | null>(
    step.progress?.understanding_rating || null
  )

  const handleRatingChange = (rating: number) => {
    setUserRating(rating)
    onUpdateProgress?.({ understanding_rating: rating })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Media Content */}
      {step.media_url && (
        <Card>
          <CardContent className="p-0">
            {step.media_type === 'image' && (
              <img
                src={step.media_url}
                alt={step.title}
                className="w-full h-64 object-cover rounded-t-lg"
              />
            )}
            {step.media_type === 'video' && (
              <video
                src={step.media_url}
                controls
                className="w-full h-64 rounded-t-lg"
                poster={step.media_url.replace(/\.[^/.]+$/, '_poster.jpg')}
              >
                Your browser does not support the video tag.
              </video>
            )}
            {step.media_type === 'audio' && (
              <div className="p-6">
                <audio
                  src={step.media_url}
                  controls
                  className="w-full"
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <div className="prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: step.content }} />
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      {step.learning_objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {step.learning_objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Concepts */}
      {step.key_concepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Key Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {step.key_concepts.map((concept, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {step.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {step.resources.map((resource, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    {resource.type === 'article' && <BookOpen className="h-5 w-5 text-blue-600" />}
                    {resource.type === 'video' && <div className="h-5 w-5 bg-red-600 rounded" />}
                    {resource.type === 'document' && <div className="h-5 w-5 bg-gray-600 rounded" />}
                    {resource.type === 'website' && <ExternalLink className="h-5 w-5 text-green-600" />}
                    {resource.type === 'tool' && <div className="h-5 w-5 bg-purple-600 rounded" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{resource.title}</h4>
                    {resource.description && (
                      <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                    )}
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      View Resource
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Understanding Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-orange-600" />
            How well do you understand this step?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={userRating === rating ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRatingChange(rating)}
                className="w-12 h-12"
              >
                {rating}
              </Button>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="mr-4">1 = Need more help</span>
            <span>5 = Completely understand</span>
          </div>
          {userRating && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {userRating <= 2 && "That's okay! Consider reviewing the resources or reaching out for help."}
                {userRating === 3 && "Good progress! You might want to review the key concepts again."}
                {userRating >= 4 && "Excellent! You have a strong understanding of this material."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 