"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { QuizResults } from "./quiz-results"
import { MultipleChoiceQuestion } from "./question-types/multiple-choice"
import { TrueFalseQuestion } from "./question-types/true-false"
import { ShortAnswerQuestion } from "./question-types/short-answer"
import { FillInBlankQuestion } from "./question-types/fill-in-blank"
import { MatchingQuestion } from "./question-types/matching"
import { OrderingQuestion } from "./question-types/ordering"
import { QuestionFeedbackDisplay } from "./question-feedback-display"
import { QuestionTimer, useQuestionTimer } from "./question-timer"
import { BoostCommandBar } from "./boost-command-bar"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Lightbulb, SkipForward, ArrowRight, Flame, Snowflake, RotateCcw, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/quiz-data"
import { quizDatabase } from "@/lib/quiz-database"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { useGamification } from "@/hooks/useGamification"
import type { BoostEffects } from "@/lib/game-boosts"
import { BoostManager } from "@/lib/game-boosts"
import { enhancedProgressOperations } from "@/lib/enhanced-gamification"

interface QuizEngineProps {
  questions: QuizQuestion[]
  topicId: string
  onComplete: () => void
}

interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
}

// Utility function to shuffle an array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Utility function to ensure questions are unique and valid
function validateAndDeduplicateQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>()
  const uniqueQuestions: QuizQuestion[] = []
  
  for (const question of questions) {
    // Create a unique key based on question content and number
    const questionKey = `${question.topic_id}-${question.question_number}-${question.question.slice(0, 50)}`
    
    if (!seen.has(questionKey)) {
      seen.add(questionKey)
      uniqueQuestions.push(question)
    } else {
      console.warn(`Duplicate question detected and removed:`, {
        topic_id: question.topic_id,
        question_number: question.question_number,
        question_preview: question.question.slice(0, 50) + '...'
      })
    }
  }
  
  console.log(`Question validation: ${questions.length} input → ${uniqueQuestions.length} unique questions`)
  return uniqueQuestions
}

export function QuizEngine({ questions, topicId, onComplete }: QuizEngineProps) {
  const { user } = useAuth()
  
  // Global audio integration
  const { autoPlayEnabled, playText } = useGlobalAudio()
  
  // Enhanced gamification integration
  const { updateProgress, currentStreak, currentLevel } = useGamification()
  
  // Validate, deduplicate, and randomize questions once when component mounts
  const randomizedQuestions = useMemo(() => {
    console.log(`=== QUIZ ENGINE QUESTION PROCESSING ===`)
    console.log(`Input questions for topic ${topicId}:`, questions.length)
    
    // Handle edge case of no questions
    if (!questions || questions.length === 0) {
      console.error(`No questions provided for topic ${topicId}`)
      return []
    }
    
    // First, validate and deduplicate questions
    const validatedQuestions = validateAndDeduplicateQuestions(questions)
    
    // Handle edge case where all questions were duplicates
    if (validatedQuestions.length === 0) {
      console.error(`All questions were duplicates or invalid for topic ${topicId}`)
      return []
    }
    
    // Then shuffle them
    const shuffled = shuffleArray(validatedQuestions)
    
    console.log(`Final randomized questions:`, shuffled.length)
    console.log(`Question numbers:`, shuffled.map(q => q.question_number))
    console.log(`Question types:`, shuffled.map(q => q.question_type))
    
    // Validate that each question has required fields
    const validQuestions = shuffled.filter(q => {
      const isValid = q.question && q.question_type && q.correct_answer
      if (!isValid) {
        console.warn(`Invalid question filtered out:`, {
          topic_id: q.topic_id,
          question_number: q.question_number,
          has_question: !!q.question,
          has_type: !!q.question_type,
          has_answer: !!q.correct_answer
        })
      }
      return isValid
    })
    
    console.log(`Valid questions after filtering: ${validQuestions.length}`)
    return validQuestions
  }, [questions, topicId])

  // Handle case where no valid questions are available
  if (randomizedQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
          <p className="text-muted-foreground mb-6">
            This quiz doesn't have any valid questions yet. Please try another topic.
          </p>
          <Button onClick={onComplete} className="rounded-xl">
            Back to Topics
          </Button>
        </div>
      </div>
    )
  }
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showFeedback, setShowFeedback] = useState(false)
  const [streak, setStreak] = useState(0)
  const [animateProgress, setAnimateProgress] = useState(false)
  const [quizStartTime] = useState(Date.now())
  
  // Boost system state
  const [boostManager] = useState(() => BoostManager.getInstance())
  const [userXP, setUserXP] = useState(0)
  const [currentBoostEffects, setCurrentBoostEffects] = useState<BoostEffects>({
    extraTimeSeconds: 0,
    xpMultiplier: 1,
    autoHintEnabled: false,
    secondChanceAvailable: false,
    streakProtected: false,
    answerRevealAvailable: false,
    timeFreezeAvailable: false,
    luckyGuessChance: 0
  })
  const [hasUsedSecondChance, setHasUsedSecondChance] = useState(false)
  const [answerRevealUsed, setAnswerRevealUsed] = useState(false)
  const [timeFrozen, setTimeFrozen] = useState(false)

  // Use the timer hook with boost extra time
  const initialTime = 60 + currentBoostEffects.extraTimeSeconds
  const { timeLeft, isActive: isTimerActive, resetTimer, stopTimer } = useQuestionTimer(initialTime)

  const currentQuestion = randomizedQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === randomizedQuestions.length - 1
  const progress = ((currentQuestionIndex + 1) / randomizedQuestions.length) * 100

  // Log current question for debugging
  useEffect(() => {
    if (currentQuestion) {
      console.log(`=== RENDERING QUESTION ${currentQuestionIndex + 1}/${randomizedQuestions.length} ===`)
      console.log(`Question ID: ${currentQuestion.topic_id}-${currentQuestion.question_number}`)
      console.log(`Question Type: ${currentQuestion.question_type}`)
      console.log(`Question Preview: ${currentQuestion.question.slice(0, 100)}...`)
      console.log(`Correct Answer: ${currentQuestion.correct_answer}`)
    }
  }, [currentQuestion, currentQuestionIndex, randomizedQuestions.length])

  // Load partial quiz state on mount
  useEffect(() => {
    if (!user) return

    const partialState = quizDatabase.loadPartialQuizState(user.id, topicId)
    if (partialState) {
      setCurrentQuestionIndex(partialState.currentQuestionIndex)
      setUserAnswers(partialState.userAnswers)
      // Note: We don't restore the exact start time to avoid confusion
    }
    
    // Initialize boost system and load user XP
    boostManager.initialize(user.id)
    loadUserXP()
  }, [user, topicId, boostManager])

  // Load user XP from gamification system
  const loadUserXP = async () => {
    if (!user) return
    
    try {
      const stats = await enhancedProgressOperations.getComprehensiveStats(user.id)
      setUserXP(stats.totalXp || 0)
    } catch (error) {
      console.error('Error loading user XP:', error)
      setUserXP(0)
    }
  }

  // Boost handlers
  const handleBoostActivated = (effects: BoostEffects) => {
    setCurrentBoostEffects(effects)
    
    // Apply automatic effects
    if (effects.autoHintEnabled && !showHint) {
      setShowHint(true)
    }
    
    console.log('🚀 Boost effects activated:', effects)
  }

  const handleUseTimeFreeze = () => {
    if (!user || !currentBoostEffects.timeFreezeAvailable) return
    
    setTimeFrozen(true)
    stopTimer()
    
    // Unfreeze after 10 seconds
    setTimeout(() => {
      setTimeFrozen(false)
      // Resume timer if question not submitted
      if (!isAnswerSubmitted) {
        resetTimer()
      }
    }, 10000)
    
    // Consume the boost use
    boostManager.useBoost(user.id, 'time_freeze')
    
    console.log('❄️ Time frozen for 10 seconds')
  }

  const handleUseAnswerReveal = () => {
    if (!user || !currentBoostEffects.answerRevealAvailable || answerRevealUsed) return
    
    setAnswerRevealUsed(true)
    boostManager.useBoost(user.id, 'answer_reveal')
    
    console.log('🔍 Answer reveal used')
  }

  const handleUseSecondChance = () => {
    if (!user || !currentBoostEffects.secondChanceAvailable || hasUsedSecondChance) return
    
    // Reset the question state for a retry
    setSelectedAnswer(null)
    setIsAnswerSubmitted(false)
    setShowFeedback(false)
    setAnswerRevealUsed(false)
    setHasUsedSecondChance(true)
    
    // Reset timer
    resetTimer()
    
    // Consume the boost
    boostManager.useBoost(user.id, 'second_chance')
    
    console.log('🔄 Second chance activated')
  }

  // Save partial state whenever answers change
  useEffect(() => {
    if (!user || userAnswers.length === 0) return

    const partialState = {
      currentQuestionIndex,
      userAnswers,
      startTime: quizStartTime
    }

    quizDatabase.savePartialQuizState(user.id, topicId, partialState)
  }, [user, topicId, currentQuestionIndex, userAnswers, quizStartTime])

  // Keyboard shortcuts - FIXED: Simplified dependencies and improved responsiveness
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Don't handle shortcuts after answer is submitted
      if (isAnswerSubmitted) return

      // Add debug logging to track key events
      console.log('Key pressed:', event.key, 'Answer submitted:', isAnswerSubmitted, 'Selected answer:', selectedAnswer)

      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          event.stopPropagation()
          if (selectedAnswer && !isAnswerSubmitted) {
            console.log('Submitting answer via Enter key:', selectedAnswer)
            handleSubmitAnswer()
          }
          break
        case ' ':
          event.preventDefault()
          event.stopPropagation()
          setShowHint(prev => !prev)
          break
        case '1':
        case '2':
        case '3':
        case '4':
          if (currentQuestion?.question_type === 'multiple_choice') {
            event.preventDefault()
            event.stopPropagation()
            const optionIndex = parseInt(event.key) - 1
            const options = [
              currentQuestion.option_a,
              currentQuestion.option_b,
              currentQuestion.option_c,
              currentQuestion.option_d
            ].filter(Boolean)
            
            if (optionIndex < options.length) {
              const optionId = String.fromCharCode(65 + optionIndex) // A, B, C, D
              console.log('Selecting option via keyboard:', optionId)
              handleAnswerSelect(optionId)
            }
          }
          break
        case 't':
        case 'T':
          if (currentQuestion?.question_type === 'true_false') {
            event.preventDefault()
            event.stopPropagation()
            console.log('Selecting True via keyboard')
            handleAnswerSelect('True')
          }
          break
        case 'f':
        case 'F':
          if (currentQuestion?.question_type === 'true_false') {
            event.preventDefault()
            event.stopPropagation()
            console.log('Selecting False via keyboard')
            handleAnswerSelect('False')
          }
          break
        case 's':
        case 'S':
          if (event.ctrlKey || event.metaKey) return // Don't interfere with save shortcuts
          event.preventDefault()
          event.stopPropagation()
          console.log('Skipping question via keyboard')
          handleSkipQuestion()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAnswer, isAnswerSubmitted, currentQuestion?.question_type, currentQuestion?.option_a, currentQuestion?.option_b, currentQuestion?.option_c, currentQuestion?.option_d])

  // Reset question state when moving to next question
  useEffect(() => {
    console.log('Resetting question state for question index:', currentQuestionIndex)
    setSelectedAnswer(null)
    setIsAnswerSubmitted(false)
    setShowHint(false)
    setShowFeedback(false)
    setQuestionStartTime(Date.now())
    resetTimer()
    
    // Auto-play question if global autoplay is enabled - with better timing
    if (autoPlayEnabled && currentQuestion?.question) {
      // Shorter delay and better error handling
      const timer = setTimeout(() => {
        try {
          playText(currentQuestion.question, { autoPlay: true })
        } catch (error) {
          console.warn('Auto-play failed:', error)
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [currentQuestionIndex, resetTimer]) // Added resetTimer to dependencies

  // Separate effect for audio auto-play to prevent conflicts
  useEffect(() => {
    if (autoPlayEnabled && currentQuestion?.question && currentQuestionIndex >= 0) {
      const timer = setTimeout(() => {
        try {
          playText(currentQuestion.question, { autoPlay: true })
        } catch (error) {
          console.warn('Auto-play failed:', error)
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [currentQuestionIndex, autoPlayEnabled, playText])

  const handleTimeUp = () => {
    if (isAnswerSubmitted) return
    
    console.log('Time up for question:', currentQuestion?.question_number)
    stopTimer()
    
    // Auto-submit with no answer
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: "timeout",
      isCorrect: false,
      timeSpent
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
  }

  const handleSkipQuestion = () => {
    if (isAnswerSubmitted) {
      console.log('Skip blocked: answer already submitted')
      return
    }
    
    console.log('Skipping question:', currentQuestion?.question_number)
    stopTimer()
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: "skipped",
      isCorrect: false,
      timeSpent
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setSelectedAnswer("skipped")
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
  }

  const handleAnswerSelect = (answer: string) => {
    if (isAnswerSubmitted) {
      console.log('Answer selection blocked: already submitted')
      return
    }
    console.log('Selecting answer:', answer)
    setSelectedAnswer(answer)
  }

  const handleInteractiveAnswer = (answer: string, isCorrect: boolean) => {
    if (isAnswerSubmitted) {
      console.log('Interactive answer blocked: already submitted')
      return
    }
    
    console.log('Interactive answer:', answer, 'Correct:', isCorrect)
    setSelectedAnswer(answer)
    stopTimer()
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer,
      isCorrect,
      timeSpent
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
    
    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
    
    // Animate progress bar
    setAnimateProgress(true)
    setTimeout(() => setAnimateProgress(false), 1000)
    
    // Log question response for enhanced gamification tracking
    console.log('🎮 Question response:', {
      questionId: currentQuestion.question_number,
      category: currentQuestion.category,
      isCorrect,
      timeSpent,
      difficulty: currentQuestion.tags?.includes('advanced') ? 3 : 
                  currentQuestion.tags?.includes('intermediate') ? 2 : 1
    })
    
    // Auto-play explanation if global autoplay is enabled
    if (autoPlayEnabled && currentQuestion?.explanation) {
      // Delay to let the feedback UI render first
      setTimeout(() => {
        try {
          playText(currentQuestion.explanation, { autoPlay: true })
        } catch (error) {
          console.warn('Auto-play explanation failed:', error)
        }
      }, 1000)
    }
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) {
      console.log('Submit blocked:', { selectedAnswer, isAnswerSubmitted })
      return
    }
    
    console.log('Submitting answer:', selectedAnswer)
    stopTimer()
    
    // Determine if answer is correct based on question type
    let isCorrect = false
    if (currentQuestion.question_type === 'short_answer') {
      isCorrect = selectedAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim()
    } else if (currentQuestion.question_type === 'true_false') {
      isCorrect = selectedAnswer.toLowerCase() === currentQuestion.correct_answer.toLowerCase()
    } else {
      isCorrect = selectedAnswer === currentQuestion.correct_answer
    }
    
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.question_number,
      answer: selectedAnswer,
      isCorrect,
      timeSpent
    }
    
    setUserAnswers(prev => [...prev, newAnswer])
    setIsAnswerSubmitted(true)
    setShowFeedback(true)
    
    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
    
    // Animate progress bar
    setAnimateProgress(true)
    setTimeout(() => setAnimateProgress(false), 1000)
    
    // Log question response for enhanced gamification tracking
    console.log('🎮 Question response:', {
      questionId: currentQuestion.question_number,
      category: currentQuestion.category,
      isCorrect,
      timeSpent,
      difficulty: currentQuestion.tags?.includes('advanced') ? 3 : 
                  currentQuestion.tags?.includes('intermediate') ? 2 : 1
    })
    
    // Auto-play explanation if global autoplay is enabled
    if (autoPlayEnabled && currentQuestion?.explanation) {
      // Delay to let the feedback UI render first
      setTimeout(() => {
        try {
          playText(currentQuestion.explanation, { autoPlay: true })
        } catch (error) {
          console.warn('Auto-play explanation failed:', error)
        }
      }, 1000)
    }
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      handleFinishQuiz()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleFinishQuiz = async () => {
    // Update enhanced gamification progress before showing results
    if (user) {
      try {
        const questionResponses = userAnswers.map(answer => {
          const question = randomizedQuestions.find(q => q.question_number === answer.questionId)
          return {
            questionId: answer.questionId.toString(),
            category: question?.category || 'General',
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent
          }
        })

        const quizData = {
          topicId,
          totalQuestions: randomizedQuestions.length,
          correctAnswers: userAnswers.filter(a => a.isCorrect).length,
          timeSpentSeconds: userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0),
          questionResponses
        }

        console.log('🎮 Updating gamification progress:', quizData)
        const results = await updateProgress(quizData)
        console.log('✅ Gamification progress updated successfully:', {
          achievements: results.newAchievements?.length || 0,
          levelUp: results.levelUp || false,
          skillUpdates: results.skillUpdates?.length || 0
        })
      } catch (error) {
        console.error('❌ Failed to update gamification progress:', error)
        // Continue to show results even if gamification update fails
      }
    }
    
    setShowResults(true)
  }

  if (showResults) {
    return (
      <QuizResults
        questions={randomizedQuestions}
        userAnswers={userAnswers}
        onFinish={onComplete}
        topicId={topicId}
      />
    )
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
      case "fill_in_blank":
        return (
          <FillInBlankQuestion
            question={currentQuestion}
            onAnswer={handleInteractiveAnswer}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      case "matching":
        return (
          <MatchingQuestion
            question={currentQuestion}
            onAnswer={handleInteractiveAnswer}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      case "ordering":
        return (
          <OrderingQuestion
            question={currentQuestion}
            onAnswer={handleInteractiveAnswer}
            showHint={showHint}
            disabled={isAnswerSubmitted}
          />
        )
      default:
        return <div>Unsupported question type: {currentQuestion.question_type}</div>
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        {/* Question section - Apple style */}
        <div className="text-center space-y-8">
          {/* Question text - made smaller */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-white leading-tight tracking-tight max-w-4xl mx-auto">
              {currentQuestion.question}
            </h1>
            
            {/* Timer and hint button */}
            <div className="flex items-center justify-center space-x-6">
              {/* Timer - use key to force reset when question changes */}
              <QuestionTimer
                key={`timer-${currentQuestionIndex}`}
                initialTime={60}
                isActive={isTimerActive && !isAnswerSubmitted}
                onTimeUp={handleTimeUp}
              />
              
              <Button 
                variant="ghost" 
                onClick={() => setShowHint(!showHint)} 
                className={cn(
                  "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-light text-sm h-auto p-2",
                  showHint && "text-blue-600 dark:text-blue-400"
                )}
              >
                {showHint ? "Hide hint" : "Show hint"}
              </Button>
            </div>
            
            {/* Hint - clean and minimal */}
            {showHint && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    💡 {currentQuestion.hint}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Question content - only show if answer not submitted */}
          {!isAnswerSubmitted && (
            <div className="max-w-2xl mx-auto">
              {renderQuestion()}
            </div>
          )}

          {/* Feedback section using new component */}
          {isAnswerSubmitted && (
            <QuestionFeedbackDisplay
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              timeLeft={timeLeft}
              isLastQuestion={isLastQuestion}
              onNextQuestion={handleNextQuestion}
            />
          )}
        </div>

        {/* Action buttons - only show when answer not submitted */}
        {!isAnswerSubmitted && (
          <div className="space-y-6">
            {/* Boost Action Buttons */}
            {(currentBoostEffects.timeFreezeAvailable || 
              currentBoostEffects.answerRevealAvailable || 
              currentBoostEffects.secondChanceAvailable) && (
              <div className="flex items-center justify-center gap-3">
                {currentBoostEffects.timeFreezeAvailable && !timeFrozen && (
                  <Button 
                    onClick={handleUseTimeFreeze}
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <Snowflake className="h-4 w-4 mr-1" />
                    Freeze Time
                  </Button>
                )}
                
                {currentBoostEffects.answerRevealAvailable && 
                 !answerRevealUsed && 
                 currentQuestion.question_type === 'multiple_choice' && (
                  <Button 
                    onClick={handleUseAnswerReveal}
                    variant="outline"
                    size="sm"
                    className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Reveal Answer
                  </Button>
                )}
                
                {currentBoostEffects.secondChanceAvailable && 
                 !hasUsedSecondChance && 
                 isAnswerSubmitted && (
                  <Button 
                    onClick={handleUseSecondChance}
                    variant="outline"
                    size="sm"
                    className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Second Chance
                  </Button>
                )}
              </div>
            )}
            
            {/* Main Action Buttons */}
            <div className="flex items-center justify-center gap-6">
              <Button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Skip button clicked')
                  handleSkipQuestion()
                }}
                variant="ghost"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-light"
              >
                Skip
              </Button>
              
              <Button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Submit button clicked', { selectedAnswer, isAnswerSubmitted, timeLeft })
                  handleSubmitAnswer()
                }}
                disabled={!selectedAnswer || timeLeft === 0} 
                className={cn(
                  "rounded-full px-8 py-3 font-light transition-all duration-200",
                  selectedAnswer 
                    ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                )}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        )}

        {/* Gamification display - show streak and level */}
        {user && (
          <div className="fixed top-4 left-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg z-50">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-slate-900 dark:text-slate-100">{currentStreak}</span>
                <span className="text-slate-500 dark:text-slate-400">streak</span>
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="text-xs">
                  Level {currentLevel}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Debug panel - show current state for troubleshooting */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
            <div className="text-xs font-bold mb-2">Debug Info:</div>
            <div>Selected: {selectedAnswer || 'None'}</div>
            <div>Submitted: {isAnswerSubmitted ? 'Yes' : 'No'}</div>
            <div>Timer: {timeLeft}s</div>
            <div>Question: {currentQuestionIndex + 1}/{randomizedQuestions.length}</div>
            <div>Type: {currentQuestion?.question_type}</div>
            <div>Auto-play: {autoPlayEnabled ? 'On' : 'Off'}</div>
            <div>Streak: {currentStreak}</div>
            <div>Level: {currentLevel}</div>
          </div>
        )}

        {/* Keyboard shortcuts - minimal - only show when answer not submitted */}
        {!isAnswerSubmitted && (
          <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-8 hidden md:block">
            <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
              {currentQuestion.question_type === 'multiple_choice' && (
                <>Use <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">1-4</span> to select • </>
              )}
              {currentQuestion.question_type === 'true_false' && (
                <>Use <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">T</span>/<span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">F</span> to select • </>
              )}
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">Enter</span> to submit • 
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">Space</span> for hint
            </p>
          </div>
        )}
      </div>

      {/* Boost Command Bar - Floating */}
      {user && (
        <BoostCommandBar
          userXP={userXP}
          onXPChanged={setUserXP}
          onBoostActivated={handleBoostActivated}
        />
      )}
    </div>
  )
}
