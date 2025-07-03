"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NPCBattleEngine } from "@/components/multiplayer/game-modes/npc-battle-engine"
import { Header } from '@civicsense/ui-web'
import { useAuth } from '@civicsense/ui-web'
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { subscriptionOperations } from "@/lib/premium"
import type { TopicMetadata, QuizQuestion, MultipleChoiceQuestion } from "@/lib/quiz-data"

interface BattleClientProps {
  topic: TopicMetadata
  questions: QuizQuestion[]
  params: {
    topicId: string
  }
  searchParams: {
    attempt: string
    difficulty?: 'easy' | 'medium' | 'hard'
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    cleverAssignmentId?: string
  }
}

export function BattleClient({
  topic,
  questions,
  params,
  searchParams
}: BattleClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFeatureAccess, subscription, isPremium, isLoading, refreshSubscription } = usePremium()
  const { recordQuizAttempt } = useGuestAccess()
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [directDbCheck, setDirectDbCheck] = useState<{tier?: string, status?: string} | null>(null)

  // Direct database check to bypass any caching issues
  useEffect(() => {
    if (user) {
      subscriptionOperations.getUserSubscription(user.id).then(sub => {
        console.log('🔍 Direct DB subscription check:', sub)
        setDirectDbCheck(sub ? { tier: sub.subscription_tier, status: sub.subscription_status } : null)
      })
    }
  }, [user])

  // Debug current state
  useEffect(() => {
    if (user) {
      console.log('🎮 Battle Mode - Premium Check:', {
        userId: user.id,
        hasSubscription: !!subscription,
        subscriptionTier: subscription?.subscription_tier,
        subscriptionStatus: subscription?.subscription_status,
        directDbTier: directDbCheck?.tier,
        directDbStatus: directDbCheck?.status,
        isPremium,
        isLoading,
        hasNPCBattleAccess: hasFeatureAccess('npc_battle')
      })
    }
  }, [user, subscription, isPremium, isLoading, hasFeatureAccess, directDbCheck])

  // Check premium access
  useEffect(() => {
    // Don't check until loading is complete
    if (isLoading) return
    
    // If direct DB check shows pro/premium, grant access regardless of hook state
    if (directDbCheck && (directDbCheck.tier === 'pro' || directDbCheck.tier === 'premium') && directDbCheck.status === 'active') {
      console.log('✅ Direct DB check: Granting access based on database subscription')
      setShowPremiumGate(false)
      return
    }
    
    // Force a subscription refresh if we have a user but no subscription
    if (user && !subscription) {
      console.log('🔄 No subscription found, refreshing...')
      refreshSubscription()
      return
    }
    
    const hasAccess = hasFeatureAccess('npc_battle')
    console.log('🎯 Final access check:', { hasAccess, isPremium })
    
    if (!hasAccess) {
      setShowPremiumGate(true)
    } else {
      setShowPremiumGate(false)
    }
  }, [hasFeatureAccess, isLoading, user, subscription, isPremium, refreshSubscription, directDbCheck])

  const handleExit = () => {
    router.push(`/quiz/${params.topicId}`)
  }

  // Format questions for the battle engine
  const formattedQuestions = questions
    .filter((q): q is MultipleChoiceQuestion => q.type === 'multiple_choice')
    .map((q, index) => {
      return {
        id: `${q.question}-${index}`, // Create unique ID from question text and index
        question: q.question || '',
        options: q.options,
        correctAnswer: q.correct_answer || '',
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium' // Use question difficulty or default to medium
      }
    })

  if (showPremiumGate) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <PremiumGate
          feature="npc_battle"
          title="NPC Battle Mode"
          description="Challenge AI-powered opponents and test your knowledge in an engaging battle format."
          isOpen={showPremiumGate}
          onClose={handleExit}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NPCBattleEngine
        questions={formattedQuestions}
        difficulty={searchParams.difficulty || 'medium'}
        timeLimit={30}
        onExit={handleExit}
      />
    </div>
  )
} 