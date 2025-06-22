"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NPCBattleEngine } from "@/components/multiplayer/game-modes/npc-battle-engine"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { useGuestAccess } from "@/hooks/useGuestAccess"
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
  const { hasFeatureAccess } = usePremium()
  const { recordQuizAttempt } = useGuestAccess()
  const [showPremiumGate, setShowPremiumGate] = useState(false)

  // Check premium access
  useEffect(() => {
    if (!hasFeatureAccess('npc_battle')) {
      setShowPremiumGate(true)
    }
  }, [hasFeatureAccess])

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