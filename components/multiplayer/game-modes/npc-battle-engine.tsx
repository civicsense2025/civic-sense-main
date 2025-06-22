"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NPCPersonality, NPC_PERSONALITIES } from "@/lib/multiplayer-npcs"
import { WaitingPhase } from "../game-phases/waiting-phase"
import { CountdownPhase } from "../game-phases/countdown-phase"
import { QuestionPhase } from "../game-phases/question-phase"
import { CompletedPhase } from "../game-phases/completed-phase"

type GamePhase = 'waiting' | 'countdown' | 'question' | 'completed'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface NPCBattleEngineProps {
  questions: Question[]
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  onExit: () => void
}

export function NPCBattleEngine({
  questions,
  difficulty,
  timeLimit,
  onExit
}: NPCBattleEngineProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<GamePhase>('waiting')
  const [opponent] = useState<NPCPersonality>(() => {
    // Default to Professor Sage if no NPCs match the difficulty
    const defaultNPC = NPC_PERSONALITIES.find(npc => npc.id === 'professor_sage') || NPC_PERSONALITIES[0]
    
    const availableNPCs = NPC_PERSONALITIES.filter(npc => {
      switch (difficulty) {
        case 'easy':
          return npc.skillLevel === 'Beginner'
        case 'medium':
          return npc.skillLevel === 'Intermediate'
        case 'hard':
          return npc.skillLevel === 'Expert'
        default:
          return false
      }
    })
    
    // If no NPCs match the difficulty, use the default NPC
    if (availableNPCs.length === 0) {
      console.warn('No NPCs found for difficulty level:', difficulty)
      return defaultNPC
    }
    
    return availableNPCs[Math.floor(Math.random() * availableNPCs.length)]
  })
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [gameStats, setGameStats] = useState({
    startTime: Date.now(),
    endTime: 0,
    playerAnswers: [] as { questionId: string; answer: string; timeSpent: number }[],
    npcAnswers: [] as { questionId: string; answer: string; timeSpent: number; powerUp: string | null }[]
  })

  const currentQuestion = questions[currentQuestionIndex]

  const calculateNPCResponse = (
    npc: NPCPersonality,
    questionDifficulty: 'easy' | 'medium' | 'hard',
    correctAnswer: string,
    options: string[],
    maxTime: number
  ) => {
    // Calculate response time based on difficulty
    const timeRange = npc.responseTimeRange[questionDifficulty]
    const responseTime = Math.random() * (timeRange.max - timeRange.min) + timeRange.min

    // Determine if NPC answers correctly based on accuracy rate
    const answersCorrectly = Math.random() < npc.accuracyRates[questionDifficulty]

    // Choose power-up based on preferences
    const powerUpRoll = Math.random()
    let powerUp: string | null = null
    let cumulativeProbability = 0

    for (const [type, probability] of Object.entries(npc.powerUpPreferences)) {
      cumulativeProbability += probability
      if (powerUpRoll <= cumulativeProbability) {
        powerUp = type
        break
      }
    }

    // Select answer
    let answer: string
    if (answersCorrectly) {
      answer = correctAnswer
    } else {
      // Choose a random incorrect answer
      const incorrectOptions = options.filter(opt => opt !== correctAnswer)
      answer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)]
    }

    return {
      answer,
      responseTime: Math.min(responseTime, maxTime),
      usedPowerUp: powerUp
    }
  }

  const handleAnswer = async (answer: string, timeSpent: number) => {
    // Record player's answer
    const isCorrect = answer === currentQuestion.correctAnswer
    if (isCorrect) {
      setPlayerScore(prev => prev + Math.max(1000 - timeSpent * 10, 100))
      setCorrectAnswers(prev => prev + 1)
    }

    setGameStats(prev => ({
      ...prev,
      playerAnswers: [...prev.playerAnswers, {
        questionId: currentQuestion.id,
        answer,
        timeSpent
      }]
    }))

    // Calculate NPC's response
    const npcResponse = calculateNPCResponse(
      opponent,
      currentQuestion.difficulty,
      currentQuestion.correctAnswer,
      currentQuestion.options,
      timeLimit
    )

    // Update NPC score
    if (npcResponse.answer === currentQuestion.correctAnswer) {
      setOpponentScore(prev => prev + Math.max(1000 - npcResponse.responseTime * 10, 100))
    }

    setGameStats(prev => ({
      ...prev,
      npcAnswers: [...prev.npcAnswers, {
        questionId: currentQuestion.id,
        answer: npcResponse.answer,
        timeSpent: npcResponse.responseTime,
        powerUp: npcResponse.usedPowerUp
      }]
    }))

    // Move to next question or end game
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setGameStats(prev => ({ ...prev, endTime: Date.now() }))
      setPhase('completed')
    }
  }

  const handlePlayAgain = () => {
    setPhase('waiting')
    setCurrentQuestionIndex(0)
    setPlayerScore(0)
    setOpponentScore(0)
    setCorrectAnswers(0)
    setGameStats({
      startTime: Date.now(),
      endTime: 0,
      playerAnswers: [],
      npcAnswers: []
    })
  }

  const renderPhase = () => {
    switch (phase) {
      case 'waiting':
        return (
          <WaitingPhase
            opponent={opponent}
            onStart={() => setPhase('countdown')}
          />
        )
      case 'countdown':
        return (
          <CountdownPhase
            opponent={opponent}
            onComplete={() => setPhase('question')}
          />
        )
      case 'question':
        return (
          <QuestionPhase
            opponent={opponent}
            question={currentQuestion}
            timeLimit={timeLimit}
            onAnswer={handleAnswer}
            playerScore={playerScore}
            opponentScore={opponentScore}
          />
        )
      case 'completed':
        return (
          <CompletedPhase
            opponent={opponent}
            playerScore={playerScore}
            opponentScore={opponentScore}
            correctAnswers={correctAnswers}
            totalQuestions={questions.length}
            onPlayAgain={handlePlayAgain}
            onExit={onExit}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {renderPhase()}
    </div>
  )
} 