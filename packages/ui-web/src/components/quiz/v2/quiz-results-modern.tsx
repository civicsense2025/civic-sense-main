"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { Share2, Twitter, Facebook, Linkedin, Mail, Copy, CheckCircle, ArrowRight, RotateCcw, TrendingUp, Target, Users, Zap } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { useToast } from "../ui/use-toast"
import { cn } from "@civicsense/shared/lib/utils"
import type { QuizResults } from "@civicsense/shared/lib/types/quiz"
import type { TopicMetadata } from "@civicsense/shared/lib/quiz-data"

interface QuizResultsModernProps {
  results: QuizResults
  topic: TopicMetadata
  gameMode?: string
  onRetake?: () => void
  onContinue?: () => void
  showSocialShare?: boolean
  quizAttemptId?: string
  className?: string
}

interface CivicImpactMetrics {
  misconceptionsCorrected: number
  uncomfortableTruthsRevealed: number
  actionStepsProvided: number
  civicKnowledgeGain: number
}

interface SocialShareData {
  platform: string
  url: string
  text: string
  hashtags?: string[]
}

export function QuizResultsModern({
  results,
  topic,
  gameMode = 'standard',
  onRetake,
  onContinue,
  showSocialShare = true,
  quizAttemptId,
  className
}: QuizResultsModernProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [civicMetrics, setCivicMetrics] = useState<CivicImpactMetrics>({
    misconceptionsCorrected: 0,
    uncomfortableTruthsRevealed: 0,
    actionStepsProvided: 0,
    civicKnowledgeGain: 0
  })

  // Performance tier calculation
  const getPerformanceTier = (score: number) => {
    if (score >= 90) return { tier: 'Civic Scholar', color: 'from-emerald-500 to-teal-500', icon: '🏛️' }
    if (score >= 80) return { tier: 'Democracy Defender', color: 'from-blue-500 to-indigo-500', icon: '⚖️' }
    if (score >= 70) return { tier: 'Informed Citizen', color: 'from-purple-500 to-pink-500', icon: '📚' }
    if (score >= 60) return { tier: 'Rising Advocate', color: 'from-orange-500 to-red-500', icon: '🔥' }
    return { tier: 'Democracy Learner', color: 'from-gray-500 to-slate-500', icon: '🌱' }
  }

  const performance = getPerformanceTier(results.score)

  // Calculate civic impact metrics based on quiz results
  useEffect(() => {
    const calculateCivicMetrics = () => {
      const baseMetrics = {
        misconceptionsCorrected: Math.floor(results.correctAnswers * 0.6), // Assumption: 60% of correct answers address misconceptions
        uncomfortableTruthsRevealed: Math.floor(results.totalQuestions * 0.4), // Each quiz reveals some uncomfortable truths
        actionStepsProvided: Math.min(5, Math.floor(results.score / 20)), // More action steps for higher scores
        civicKnowledgeGain: Math.floor(results.score * 0.8) // Knowledge gain correlates with score
      }
      setCivicMetrics(baseMetrics)
    }

    calculateCivicMetrics()
  }, [results])

  // Trigger confetti for high scores
  useEffect(() => {
    if (results.score >= 80) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#0EA5E9', '#8B5CF6', '#F59E0B']
        })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [results.score])

  const handleRetake = useCallback(() => {
    onRetake?.()
  }, [onRetake])

  const handleContinue = useCallback(() => {
    if (onContinue) {
      onContinue()
    } else {
      router.push('/dashboard')
    }
  }, [onContinue, router])

  const handleSocialShare = useCallback(async (platform: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const quizUrl = `${baseUrl}/quiz/${topic.topic_id}`
    
    const shareData: SocialShareData = {
      platform,
      url: quizUrl,
      text: `I just scored ${results.score}% on "${topic.topic_title}" - ${performance.tier}! 🏛️ Test your civic knowledge on CivicSense.`,
      hashtags: ['CivicEducation', 'Democracy', 'CivicSense']
    }

    try {
      let shareUrl = ''
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}&hashtags=${shareData.hashtags?.join(',')}`
          break
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.text)}`
          break
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(`CivicSense Quiz: ${topic.topic_title}`)}&summary=${encodeURIComponent(shareData.text)}`
          break
        case 'email':
          shareUrl = `mailto:?subject=${encodeURIComponent(`Check out this CivicSense quiz: ${topic.topic_title}`)}&body=${encodeURIComponent(`${shareData.text}\n\n${shareData.url}`)}`
          break
        case 'copy':
          await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
          setCopiedUrl(true)
          setTimeout(() => setCopiedUrl(false), 2000)
          toast({
            title: "Link copied!",
            description: "Share link copied to clipboard"
          })
          break
      }

      if (shareUrl && platform !== 'copy') {
        window.open(shareUrl, '_blank', 'width=600,height=400')
      }

      // Track sharing event
      if (quizAttemptId) {
        await fetch('/api/quiz/track-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizAttemptId,
            platform,
            shareData
          })
        }).catch(console.error)
      }
      
      setShowShareMenu(false)
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: "Sharing failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }, [topic, results.score, performance.tier, quizAttemptId, toast])

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <div className="text-6xl mb-4">{performance.icon}</div>
        
        <h1 className="text-3xl font-bold tracking-tight">
          Quiz Complete!
        </h1>
        
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium",
          `bg-gradient-to-r ${performance.color}`
        )}>
          <span className="text-sm font-medium">{performance.tier}</span>
        </div>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">{topic.topic_title}</h2>
                <p className="text-muted-foreground text-sm">
                  {gameMode === 'speed' ? 'Speed Round' : 
                   gameMode === 'practice' ? 'Practice Mode' : 
                   'Standard Quiz'}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {topic.emoji}
              </Badge>
            </div>

            {/* Main Score Display */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                className="relative"
              >
                <div className={cn(
                  "w-32 h-32 mx-auto rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4",
                  `bg-gradient-to-br ${performance.color}`
                )}>
                  {results.score}%
                </div>
              </motion.div>
              
              <div className="text-sm text-muted-foreground">
                {results.correctAnswers} out of {results.totalQuestions} correct
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Accuracy</span>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round((results.correctAnswers / results.totalQuestions) * 100)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(results.timeTaken / 60)}m
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Civic Impact Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Your Civic Impact</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Misconceptions Corrected</div>
                <div className="text-xl font-bold text-red-600">
                  {civicMetrics.misconceptionsCorrected}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Uncomfortable Truths</div>
                <div className="text-xl font-bold text-orange-600">
                  {civicMetrics.uncomfortableTruthsRevealed}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Action Steps</div>
                <div className="text-xl font-bold text-blue-600">
                  {civicMetrics.actionStepsProvided}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Knowledge Gain</div>
                <div className="text-xl font-bold text-green-600">
                  +{civicMetrics.civicKnowledgeGain}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary">
                <strong>Democracy Impact:</strong> You're now harder to manipulate and better equipped to hold power accountable.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Social Sharing */}
      {showSocialShare && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Share Your Results</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  Spread Civic Knowledge
                </Badge>
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Your Achievement
                </Button>
                
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border rounded-lg shadow-lg z-10"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSocialShare('twitter')}
                          className="justify-start"
                        >
                          <Twitter className="w-4 h-4 mr-2 text-blue-500" />
                          Twitter
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSocialShare('facebook')}
                          className="justify-start"
                        >
                          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                          Facebook
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSocialShare('linkedin')}
                          className="justify-start"
                        >
                          <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                          LinkedIn
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSocialShare('email')}
                          className="justify-start"
                        >
                          <Mail className="w-4 h-4 mr-2 text-gray-600" />
                          Email
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSocialShare('copy')}
                          className="justify-start col-span-2"
                        >
                          {copiedUrl ? (
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2 text-gray-600" />
                          )}
                          {copiedUrl ? 'Copied!' : 'Copy Link'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button
          onClick={handleContinue}
          size="lg"
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Continue Learning
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        {onRetake && (
          <Button
            onClick={handleRetake}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        )}
      </motion.div>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-center"
      >
        <Card className="border-dashed border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">Keep Building Democracy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Every quiz makes you harder to fool and better equipped to hold power accountable. 
              Your civic knowledge is your democratic power.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 