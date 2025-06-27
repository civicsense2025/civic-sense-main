"use client"

import React from 'react'
import type { QuizQuestion } from '@/lib/types/quiz'
import { MultipleChoiceQuestion } from '@/components/quiz/question-types/multiple-choice'
import { TrueFalseQuestion } from '@/components/quiz/question-types/true-false'
import { ShortAnswerQuestion } from '@/components/quiz/question-types/short-answer'
import { FillInBlankQuestion } from '@/components/quiz/question-types/fill-in-blank'
import { MatchingQuestion } from '@/components/quiz/question-types/matching'
import { OrderingQuestion } from '@/components/quiz/question-types/ordering'
import { CrosswordQuestion } from '@/components/quiz/question-types/crossword'

interface QuestionRendererProps {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  selectedAnswer?: string
  showExplanation?: boolean
  practiceMode?: boolean
}

export function QuizQuestion({
  question,
  onAnswer,
  selectedAnswer,
  showExplanation = false,
  practiceMode = false
}: QuestionRendererProps) {
  if (!question) {
    return (
      <div className="text-center text-muted-foreground">
        Loading question...
      </div>
    )
  }

  switch (question.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          onAnswerSelect={onAnswer}
          selectedAnswer={selectedAnswer || null}
          showCorrectAnswer={showExplanation}
          isPracticeMode={practiceMode}
        />
      )
    
    case 'true_false':
      return (
        <TrueFalseQuestion
          question={question}
          onAnswerSelect={onAnswer}
          selectedAnswer={selectedAnswer || null}
          showCorrectAnswer={showExplanation}
          isPracticeMode={practiceMode}
        />
      )
    
    case 'short_answer':
      return (
        <ShortAnswerQuestion
          question={question}
          selectedAnswer={selectedAnswer || null}
          isSubmitted={false}
          onSelectAnswer={onAnswer}
        />
      )
    
    case 'fill_in_blank':
      return (
        <FillInBlankQuestion
          question={question}
          onAnswerSelect={onAnswer}
          practiceMode={practiceMode}
        />
      )
    
    case 'matching':
      return (
        <MatchingQuestion
          question={question}
          onAnswerSelect={onAnswer}
          practiceMode={practiceMode}
        />
      )
    
    case 'ordering':
      return (
        <OrderingQuestion
          question={question}
          onAnswerSelect={onAnswer}
          practiceMode={practiceMode}
        />
      )
    
    case 'crossword':
      return (
        <CrosswordQuestion
          question={question}
          onAnswerSelect={(words: any) => onAnswer(JSON.stringify(words))}
          practiceMode={practiceMode}
        />
      )
    
    default:
      return (
        <div className="text-center text-muted-foreground">
          Unsupported question type: {(question as any).type}
        </div>
      )
  }
} 