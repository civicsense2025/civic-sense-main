"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { 
  Share2, Twitter, Facebook, Linkedin, Mail, Copy, CheckCircle, 
  ArrowRight, RotateCcw, TrendingUp, Target, Users, Zap, 
  Clock, Star, Award, Trophy, BookOpen, Brain, Lightbulb 
} from "lucide-react"
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { useToast } from "../../components/ui"
import { cn } from '@civicsense/business-logic/utils'
import { dataService } from '@civicsense/business-logic/services'
import type { QuizResults } from '@civicsense/types/quiz'
import type { TopicMetadata } from '@civicsense/types/quiz'

interface QuizResultsFullscreenProps {
  results: QuizResults
  topic: TopicMetadata
  gameMode?: string
  onRetake?: () => void
  onContinue?: () => void
  showSocialShare?: boolean
  quizAttemptId?: string
  className?: string
}

interface SocialShareData {
  platform: string
  url: string
  text: string
  hashtags: string[]
}

interface PerformanceTier {
  tier: string
  icon: string
  color: string
  message: string
}

interface CivicMetrics {
  misconceptionsCorrected: number
  uncomfortableTruthsRevealed: number
  actionStepsProvided: number
  civicKnowledgeGain: number
}

export function QuizResultsFullscreen({
  results,
  topic,
  gameMode = 'standard',
  onRetake,
  onContinue,
  showSocialShare = true,
  quizAttemptId,
  className
}: QuizResultsFullscreenProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [continueTopics, setContinueTopics] = useState<TopicMetadata[]>([])
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)

  // Calculate performance tier
  const getPerformanceTier = (score: number): PerformanceTier => {
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

  // Calculate civic impact metrics
  const civicMetrics: CivicMetrics = {
    misconceptionsCorrected: Math.floor(results.score / 20),
    uncomfortableTruthsRevealed: Math.floor(results.correctAnswers / 3),
    actionStepsProvided: results.correctAnswers,
    civicKnowledgeGain: Math.min(results.score, 100)
  }

  // Load continue learning topics
  useEffect(() => {
    const loadContinueTopics = async () => {
      try {
        setIsLoadingTopics(true)
        
        // Get today's topics
        const todayTopics = await dataService.getTopicsForDate(new Date())
        const topicsArray = Object.values(todayTopics)
        
        // Filter out current topic and limit to 6
        const otherTopics = topicsArray
          .filter(t => t.topic_id !== topic.topic_id)
          .slice(0, 6)
        
        setContinueTopics(otherTopics)
      } catch (error) {
        console.error('Error loading continue topics:', error)
        setContinueTopics([])
      } finally {
        setIsLoadingTopics(false)
      }
    }

    loadContinueTopics()
  }, [topic.topic_id])

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
      // Track sharing event
      if (quizAttemptId) {
        await fetch('/api/quiz/track-share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId: quizAttemptId,
            platform,
            topicId: topic.topic_id,
            score: results.score
          })
        })
      }

      // Handle different sharing platforms
      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}&hashtags=${shareData.hashtags.join(',')}`,
            '_blank'
          )
          break
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
            '_blank'
          )
          break
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`,
            '_blank'
          )
          break
        case 'copy':
          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
          toast({
            title: "Link copied!",
            description: "Share link copied to clipboard"
          })
          break
        default:
          break
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

  const handleTopicClick = (topicId: string) => {
    router.push(`/quiz/${topicId}`)
  }

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950",
      "flex flex-col overflow-y-auto",
      className
    )}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-900/50 to-blue-900/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Results */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                className="relative"
              >
                <div className={cn(
                  "w-48 h-48 mx-auto rounded-full flex items-center justify-center text-6xl font-light text-white mb-6",
                  `bg-gradient-to-br ${performance.color} shadow-2xl`
                )}>
                  {results.score}%
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-light text-white">
                  {performance.message}
                </h2>
                <p className="text-xl text-slate-300 font-light">
                  {results.correctAnswers} out of {results.totalQuestions} correct
                </p>
              </div>
            </motion.div>

            {/* Performance Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
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
                    {Math.round(results.timeTaken / 60)}m
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium text-white">Streak</span>
                  </div>
                  <div className="text-2xl font-light text-white">
                    {Math.floor(results.correctAnswers / 2)}
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
            </motion.div>

            {/* Civic Impact Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="border-0 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-light text-white">Your Democratic Impact</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-light text-red-400">
                        {civicMetrics.misconceptionsCorrected}
                      </div>
                      <div className="text-sm text-slate-300">Misconceptions Corrected</div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-light text-orange-400">
                        {civicMetrics.uncomfortableTruthsRevealed}
                      </div>
                      <div className="text-sm text-slate-300">Uncomfortable Truths</div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-light text-blue-400">
                        {civicMetrics.actionStepsProvided}
                      </div>
                      <div className="text-sm text-slate-300">Action Steps</div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-light text-green-400">
                        +{civicMetrics.civicKnowledgeGain}
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
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
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

              {showSocialShare && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
            </motion.div>

            {/* Social Share Menu */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('twitter')}
                    className="border-white/20 text-white hover:bg-blue-500/20"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('facebook')}
                    className="border-white/20 text-white hover:bg-blue-600/20"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('linkedin')}
                    className="border-white/20 text-white hover:bg-blue-700/20"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('copy')}
                    className="border-white/20 text-white hover:bg-slate-500/20"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Continue Learning */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-light text-white">Continue Learning</h3>
              </div>

              {isLoadingTopics ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-0 bg-white/5 backdrop-blur-sm animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : continueTopics.length > 0 ? (
                <div className="space-y-4">
                  {continueTopics.map((contineTopic, index) => (
                    <motion.div
                      key={contineTopic.topic_id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + (index * 0.1) }}
                    >
                      <Card 
                        className="border-0 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group"
                        onClick={() => handleTopicClick(contineTopic.topic_id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl group-hover:scale-110 transition-transform">
                              {contineTopic.emoji}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white group-hover:text-primary transition-colors">
                                {contineTopic.topic_title}
                              </h4>
                              {contineTopic.description && (
                                <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                                  {contineTopic.description}
                                </p>
                              )}
                              {contineTopic.categories && contineTopic.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {contineTopic.categories.slice(0, 2).map(category => (
                                    <Badge 
                                      key={category}
                                      variant="secondary" 
                                      className="text-xs bg-white/10 text-slate-300"
                                    >
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-0 bg-white/5 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <Brain className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-300">
                      No more topics for today. You've mastered today's civic learning!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Motivational Message */}
              <Card className="border-dashed border-2 border-white/20 bg-transparent mt-6">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <span className="font-medium text-white">Keep Building Democracy</span>
                  </div>
                  <p className="text-sm text-slate-300 font-light">
                    Every quiz makes you harder to fool and better equipped to hold power accountable. 
                    Your civic knowledge is your democratic power.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 