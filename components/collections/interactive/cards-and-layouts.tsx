'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowRight,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react'
import type { 
  InteractiveComponentProps,
  IntroCardConfig,
  SwipeCardsConfig,
  InfoCardsConfig,
  ProgressCardsConfig
} from './types'

// ============================================================================
// INTRO CARD COMPONENT
// ============================================================================

interface IntroCardProps extends InteractiveComponentProps {
  config: IntroCardConfig
}

export function IntroCard({ config, title, content, onComplete }: IntroCardProps) {
  return (
    <Card 
      className="relative overflow-hidden"
      style={{ backgroundColor: config.background_color + '10' }}
    >
      <div 
        className="absolute inset-0 opacity-5"
        style={{ backgroundColor: config.background_color }}
      />
      <CardContent className="relative p-8 text-center">
        <div className="text-6xl mb-4">{config.emoji}</div>
        <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">
          {title}
        </h2>
        <p className="text-lg text-gray-100 mb-4 drop-shadow">
          {config.subtitle}
        </p>
        <div className="text-gray-200 leading-relaxed mb-6 drop-shadow">
          {content}
        </div>
        {config.fact && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
            <div className="text-white font-semibold text-lg">
              {config.fact}
            </div>
          </div>
        )}
        <Button 
          onClick={onComplete}
          className="bg-white text-gray-900 hover:bg-gray-100"
        >
          Continue Learning
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SWIPE CARDS COMPONENT
// ============================================================================

interface SwipeCardsProps extends InteractiveComponentProps {
  config: SwipeCardsConfig
}

export function SwipeCards({ config, onComplete }: SwipeCardsProps) {
  const [currentCard, setCurrentCard] = useState(0)
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]))

  const handleNext = () => {
    if (currentCard < config.cards.length - 1) {
      const nextCard = currentCard + 1
      setCurrentCard(nextCard)
      setViewedCards(prev => new Set([...prev, nextCard]))
    }
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
    }
  }

  const allViewed = viewedCards.size === config.cards.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Compare and Contrast</CardTitle>
          <div className="text-sm text-gray-500">
            {currentCard + 1} of {config.cards.length}
          </div>
        </div>
        <Progress value={((currentCard + 1) / config.cards.length) * 100} />
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {config.cards[currentCard].title}
          </h3>
          <div className="text-gray-700 whitespace-pre-line">
            {config.cards[currentCard].content}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCard === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {config.cards.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  viewedCards.has(index) ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentCard < config.cards.length - 1 ? (
            <Button onClick={handleNext}>
              Next Card
            </Button>
          ) : (
            <Button 
              onClick={onComplete}
              disabled={!allViewed}
              className={allViewed ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {allViewed ? 'Complete' : 'View All Cards'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// INFO CARDS COMPONENT
// ============================================================================

interface InfoCardsProps extends InteractiveComponentProps {
  config: InfoCardsConfig
}

export function InfoCards({ config, title, onComplete }: InfoCardsProps) {
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set())

  const handleCardClick = (index: number) => {
    setViewedCards(prev => new Set([...prev, index]))
  }

  const allViewed = viewedCards.size === config.cards.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Information Cards'}</CardTitle>
        <p className="text-gray-600">Click each card to explore the information</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {config.cards.map((card, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-md ${
                viewedCards.has(index) 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleCardClick(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {card.icon && <span className="text-2xl">{card.icon}</span>}
                  <h4 className="font-semibold text-lg">{card.title}</h4>
                  {viewedCards.has(index) && (
                    <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                  )}
                </div>
                <p className="text-gray-700 text-sm">{card.content}</p>
                {card.color && (
                  <div 
                    className="mt-2 h-1 rounded"
                    style={{ backgroundColor: card.color }}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Explored {viewedCards.size} of {config.cards.length} cards
          </div>
          <Button 
            onClick={onComplete}
            disabled={!allViewed}
            className={allViewed ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {allViewed ? 'Continue' : 'Explore All Cards'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// PROGRESS CARDS COMPONENT
// ============================================================================

interface ProgressCardsProps extends InteractiveComponentProps {
  config: ProgressCardsConfig
}

export function ProgressCards({ config, title, onComplete }: ProgressCardsProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(config.steps.map((step, index) => step.completed ? index : -1).filter(i => i >= 0))
  )

  const handleStepToggle = (index: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const allCompleted = completedSteps.size === config.steps.length
  const progressPercentage = (completedSteps.size / config.steps.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          {title || 'Progress Tracker'}
        </CardTitle>
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-sm text-gray-600">
            {completedSteps.size} of {config.steps.length} steps completed ({Math.round(progressPercentage)}%)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {config.steps.map((step, index) => {
            const isCompleted = completedSteps.has(index)
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => handleStepToggle(index)}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm mt-1 ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                    {step.description}
                  </p>
                </div>
                <Badge variant={isCompleted ? "default" : "secondary"} className="ml-2">
                  {isCompleted ? 'Done' : 'Pending'}
                </Badge>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Click steps to mark them as complete
          </div>
          <Button 
            onClick={onComplete}
            disabled={!allCompleted}
            className={allCompleted ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {allCompleted ? 'All Steps Complete!' : `${config.steps.length - completedSteps.size} Remaining`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 