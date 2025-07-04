"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, RotateCcw, Share2, TrendingUp, Clock, Star, Target } from "lucide-react"
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useToast } from "../../components/ui"
import { cn } from '@civicsense/business-logic/utils'
import type { QuizResults } from '@civicsense/types/quiz'
import type { TopicMetadata } from '@civicsense/types/quiz'

interface QuizResultsSimpleProps {
  results: QuizResults
  topic: TopicMetadata
  gameMode?: string
  onRetake?: () => void
  onContinue?: () => void
  className?: string
}

export function QuizResultsSimple({
  results,
  topic,
  gameMode = 'standard',
  onRetake,
  onContinue,
  className
}: QuizResultsSimpleProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Calculate performance tier
  const getPerformanceTier = (score: number) => {
    if (score >= 90) return {
      tier: "Civic Scholar",
      icon: "🏛️",
      color: "from-emerald-500 to-teal-600",
      message: "You understand how power actually works!"
    }
    if (score >= 80) return {
      tier: "Democracy Defender", 
      icon: "🛡️",
      color: "from-blue-500 to-indigo-600",
      message: "You're harder to manipulate!"
    }
    if (score >= 70) return {
      tier: "Truth Seeker",
      icon: "🔍", 
      color: "from-purple-500 to-violet-600",
      message: "You're asking the right questions!"
    }
    if (score >= 60) return {
      tier: "Civic Learner",
      icon: "📚",
      color: "from-amber-500 to-orange-600", 
      message: "You're building democratic knowledge!"
    }
    return {
      tier: "Getting Started",
      icon: "🌱",
      color: "from-slate-500 to-gray-600",
      message: "Every expert was once a beginner!"
    }
  }

  const performance = getPerformanceTier(results.score)

  const handleRetake = () => {
    onRetake?.()
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      router.push('/dashboard')
    }
  }

  const handleShare = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const quizUrl = `${baseUrl}/quiz/${topic.topic_id}`
    const shareText = `I just scored ${results.score}% on "${topic.topic_title}" - ${performance.tier}! 🏛️ Test your civic knowledge on CivicSense.`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'CivicSense Quiz Results',
          text: shareText,
          url: quizUrl
        })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${quizUrl}`)
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard"
        })
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950",
      "flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/50 to-blue-900/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{topic.emoji}</div>
              <div>
                <h1 className="text-xl font-light text-white">Quiz Complete</h1>
                <p className="text-sm text-slate-300 font-light">{topic.topic_title}</p>
              </div>
            </div>
            
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium",
              `bg-gradient-to-r ${performance.color}`
            )}>
              <span className="text-lg">{performance.icon}</span>
              <span className="text-sm font-medium">{performance.tier}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          
          {/* Hero Score */}
          <div className="text-center space-y-6">
            <div className="relative">
              <div className={cn(
                "w-40 h-40 mx-auto rounded-full flex items-center justify-center text-5xl font-light text-white mb-6",
                `bg-gradient-to-br ${performance.color} shadow-2xl`
              )}>
                {results.score}%
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-light text-white">
                {performance.message}
              </h2>
              <p className="text-xl text-slate-300 font-light">
                {results.correctAnswers} out of {results.totalQuestions} correct
              </p>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-white">Accuracy</span>
                </div>
                <div className="text-2xl font-light text-white">
                  {Math.round((results.correctAnswers / results.totalQuestions) * 100)}%
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Time</span>
                </div>
                <div className="text-2xl font-light text-white">
                  {Math.round((results.timeTaken || 0) / 60)}m
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Questions</span>
                </div>
                <div className="text-2xl font-light text-white">
                  {results.totalQuestions}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">Rating</span>
                </div>
                <div className="text-2xl font-light text-white">
                  {results.score >= 90 ? '⭐⭐⭐' : results.score >= 70 ? '⭐⭐' : '⭐'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Civic Impact */}
          <Card className="border-0 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-light text-white">Your Democratic Impact</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-light text-red-400">
                    {Math.floor(results.score / 20)}
                  </div>
                  <div className="text-sm text-slate-300">Misconceptions Corrected</div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-2xl font-light text-orange-400">
                    {Math.floor(results.correctAnswers / 3)}
                  </div>
                  <div className="text-sm text-slate-300">Uncomfortable Truths</div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-2xl font-light text-green-400">
                    +{Math.min(results.score, 100)}
                  </div>
                  <div className="text-sm text-slate-300">Knowledge Gain</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-primary/20 rounded-lg border border-primary/30">
                <p className="text-sm text-primary-foreground font-light">
                  <strong>Democracy Impact:</strong> You're now harder to manipulate and better equipped to hold power accountable.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleContinue}
              size="lg"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Continue Learning
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            {onRetake && (
              <Button
                onClick={handleRetake}
                variant="outline"
                size="lg"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 