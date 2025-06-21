"use client"

import { useState, useEffect } from "react"
import { NPCPersonality } from "@/lib/multiplayer-npcs"
import { QuestionTimer } from "@/components/quiz/question-timer"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, Sword, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuestionPhaseProps {
  opponent: NPCPersonality
  question: {
    id: string
    question: string
    options: string[]
    correctAnswer: string
    explanation?: string
    difficulty: 'easy' | 'medium' | 'hard'
  }
  timeLimit: number
  onAnswer: (answer: string, timeSpent: number) => void
  playerScore: number
  opponentScore: number
}

export function QuestionPhase({
  opponent,
  question,
  timeLimit,
  onAnswer,
  playerScore,
  opponentScore
}: QuestionPhaseProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [powerUpUsed, setPowerUpUsed] = useState<string | null>(null)
  const [isTimerActive, setIsTimerActive] = useState(true)

  useEffect(() => {
    if (selectedAnswer) {
      onAnswer(selectedAnswer, timeSpent)
    }
  }, [selectedAnswer, timeSpent, onAnswer])

  const handlePowerUp = (type: string) => {
    if (powerUpUsed) return
    setPowerUpUsed(type)
    // Implement power-up effects
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <BattlePlayerPanel
          name="You"
          score={playerScore}
          emoji="👤"
        />
        <div className="text-2xl font-bold">VS</div>
        <BattlePlayerPanel
          name={opponent.name}
          score={opponentScore}
          emoji={opponent.emoji}
          isNPC
        />
      </div>

      <QuestionTimer
        initialTime={timeLimit}
        isActive={isTimerActive}
        onTimeUp={() => {
          if (!selectedAnswer) {
            setSelectedAnswer('timeout')
            setTimeSpent(timeLimit)
          }
          setIsTimerActive(false)
        }}
      />

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{question.question}</h3>
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option) => (
            <Button
              key={option}
              onClick={() => {
                if (!selectedAnswer) {
                  setSelectedAnswer(option)
                  setIsTimerActive(false)
                }
              }}
              variant={selectedAnswer === option ? "default" : "outline"}
              className="w-full justify-start text-left"
              disabled={!!selectedAnswer}
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="w-32"
          onClick={() => handlePowerUp('shield')}
          disabled={!!powerUpUsed || !!selectedAnswer}
        >
          <Shield className="mr-2 h-4 w-4" />
          Shield
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-32"
          onClick={() => handlePowerUp('sword')}
          disabled={!!powerUpUsed || !!selectedAnswer}
        >
          <Sword className="mr-2 h-4 w-4" />
          Sword
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-32"
          onClick={() => handlePowerUp('brain')}
          disabled={!!powerUpUsed || !!selectedAnswer}
        >
          <Brain className="mr-2 h-4 w-4" />
          Brain
        </Button>
      </div>
    </div>
  )
} 