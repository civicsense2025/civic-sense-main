"use client"

import { useState } from "react"
import type { QuizQuestion } from "@/lib/quiz-data"
import { MultipleChoiceQuestion } from "./question-types/multiple-choice"
import { TrueFalseQuestion } from "./question-types/true-false"
import { ShortAnswerQuestion } from "./question-types/short-answer"
import { QuizResults } from "./quiz-results"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, HelpCircle, ExternalLink } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface QuizEngineProps {
  questions: QuizQuestion[]
  topicId: string
  onComplete: () => void
}

interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
}

export function QuizEngine({ questions, topicId, onComplete }: QuizEngineProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerSubmitted) {
      setSelectedAnswer(answer)
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return

    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: selectedAnswer,
      isCorrect,
    }

    setUserAnswers([...userAnswers, newAnswer])
    setIsAnswerSubmitted(true)
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setShowResults(true)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setIsAnswerSubmitted(false)
      setShowHint(false)
    }
  }

  const handleFinishQuiz = () => {
    onComplete()
  }

  if (showResults) {
    return <QuizResults userAnswers={userAnswers} questions={questions} onFinish={handleFinishQuiz} topicId={topicId} />
  }

  const renderQuestion = () => {
    switch (currentQuestion.question_type) {
      case "multiple_choice":
        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      case "true_false":
        return (
          <TrueFalseQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      case "short_answer":
        return (
          <ShortAnswerQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitted={isAnswerSubmitted}
            onSelectAnswer={handleAnswerSelect}
          />
        )
      default:
        return <div>Unsupported question type</div>
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-medium">Category: {currentQuestion.category}</div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex-grow">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold mb-2">{currentQuestion.question}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowHint(!showHint)} className="ml-2">
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Show hint</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentQuestion.hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {showHint && (
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg mt-2 text-sm">
              <strong>Hint:</strong> {currentQuestion.hint}
            </div>
          )}
        </div>

        {renderQuestion()}

        {isAnswerSubmitted && (
          <div className="mt-6">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl">
              <p className="font-semibold mb-2">
                {selectedAnswer === currentQuestion.correct_answer ? "✅ Correct!" : "❌ Incorrect"}
              </p>
              <p className="text-sm mb-4">{currentQuestion.explanation}</p>

              {/* Show sources directly */}
              {currentQuestion.sources.length > 0 && (
                <div className="mt-3 border-t border-slate-200 dark:border-slate-600 pt-3">
                  <p className="text-xs font-medium mb-2">Learn more:</p>
                  <div className="space-y-2 text-sm">
                    {currentQuestion.sources.map((source, index) => (
                      <div key={index} className="flex items-center">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center text-xs"
                        >
                          {source.name}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        {!isAnswerSubmitted ? (
          <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer} className="rounded-xl">
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} className="rounded-xl">
            {isLastQuestion ? "See Results" : "Next Question"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
