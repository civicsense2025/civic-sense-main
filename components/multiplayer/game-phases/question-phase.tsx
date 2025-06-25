"use client"

import { useState, useEffect } from "react"
import { NPCPersonality } from "@/lib/multiplayer-npcs"
import { QuestionTimer } from "@/components/quiz/question-timer"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, Sword, Brain, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizQuestion, getQuestionOptions } from "@/lib/types/quiz"

// Updated interface to match props from base-multiplayer-engine
export interface QuestionPhaseProps {
  currentQuestion: QuizQuestion
  gameState: {
    currentQuestionIndex: number
    gamePhase: 'waiting' | 'countdown' | 'question' | 'between_questions' | 'completed'
    showFeedback: boolean
    selectedAnswer: string | null
    isAnswerSubmitted: boolean
    score: number
    correctAnswers: number
    timeSpentSeconds: number
    startTime: number | null
    questionStartTime: number | null
    countdownStartTime?: number
    answeredPlayers?: string[]
  }
  config: {
    name: string
    timePerQuestion: number
    showExplanations: boolean
    allowHints: boolean
    allowBoosts: boolean
    showRealTimeScores?: boolean
    speedBonusEnabled?: boolean
    eliminationMode?: boolean
    collaborativeMode?: boolean
    countdownDuration?: number
  }
  onAnswerSelect: (answer: string) => void
  onSubmitAnswer: (answer: string) => void
  onShowHint: () => void
  isAnswerSubmitted: boolean
  showHint: boolean
}

// Legacy interface for NPC battles (keep for backward compatibility)
export interface NPCQuestionPhaseProps {
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
  currentQuestion,
  gameState,
  config,
  onAnswerSelect,
  onSubmitAnswer,
  onShowHint,
  isAnswerSubmitted,
  showHint
}: QuestionPhaseProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(gameState.selectedAnswer)

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
    onAnswerSelect(answer)
  }

  const handleSubmit = () => {
    if (selectedAnswer) {
      onSubmitAnswer(selectedAnswer)
    }
  }

  // Get question options based on question type
  const questionOptions = getQuestionOptions(currentQuestion)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* Question header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Question {gameState.currentQuestionIndex + 1}
          </h2>
          <p className="text-lg text-muted-foreground">
            {currentQuestion.question}
          </p>
        </div>

        {/* Hint display */}
        {showHint && currentQuestion.hint && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">Hint</span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300">{currentQuestion.hint}</p>
          </div>
        )}

        {/* Answer options */}
        <div className="space-y-3">
          {questionOptions.map((option, index) => (
            <Button
              key={`${currentQuestion.topic_id}-${currentQuestion.question_number}-${index}`}
              onClick={() => handleAnswerSelect(option)}
              variant={selectedAnswer === option ? "default" : "outline"}
              className="w-full justify-start text-left p-4 h-auto min-h-[3rem]"
              disabled={isAnswerSubmitted}
            >
              <div className="flex items-center gap-3 w-full">
                <span className="font-medium text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-left">{option}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Explanation (shown after answer submission) */}
        {isAnswerSubmitted && config.showExplanations && currentQuestion.explanation && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Explanation</h4>
            <p className="text-blue-800 dark:text-blue-200">{currentQuestion.explanation}</p>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {config.allowHints && !showHint && !isAnswerSubmitted && (
          <Button
            variant="outline"
            size="lg"
            onClick={onShowHint}
            className="min-w-32"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Show Hint
          </Button>
        )}

        {selectedAnswer && !isAnswerSubmitted && (
          <Button
            size="lg"
            onClick={handleSubmit}
            className="min-w-32"
          >
            Submit Answer
          </Button>
        )}
      </div>

      {/* Power-ups (if enabled) */}
      {config.allowBoosts && !isAnswerSubmitted && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="min-w-24"
            disabled
          >
            <Shield className="mr-1 h-3 w-3" />
            Shield
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-24"
            disabled
          >
            <Sword className="mr-1 h-3 w-3" />
            Attack
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-24"
            disabled
          >
            <Brain className="mr-1 h-3 w-3" />
            Focus
          </Button>
        </div>
      )}
    </div>
  )
}

// Legacy component for NPC battles
export function NPCQuestionPhase({
  opponent,
  question,
  timeLimit,
  onAnswer,
  playerScore,
  opponentScore
}: NPCQuestionPhaseProps) {
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