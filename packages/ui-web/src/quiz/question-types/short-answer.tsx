"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import type { QuizQuestion } from '@civicsense/shared/quiz-data'
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { cn } from "../../utils"

/**
 * IMPORTANT: This component exports `checkAnswerIntelligently` which MUST be used
 * by your quiz engine for answer validation. Using simple string comparison will
 * cause mismatches between the real-time feedback and final scoring.
 * 
 * Example usage in your quiz engine:
 * import { checkAnswerIntelligently } from '@/components/short-answer'
 * const isCorrect = checkAnswerIntelligently(userAnswer, correctAnswer)
 */

interface ShortAnswerQuestionProps {
  question: QuizQuestion
  selectedAnswer: string | null
  isSubmitted: boolean
  onSelectAnswer: (answer: string) => void
}

// Simple Levenshtein distance calculation
const getLevenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,    // deletion
        matrix[j - 1][i] + 1,    // insertion
        matrix[j - 1][i - 1] + indicator  // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Enhanced answer validation that returns detailed feedback
export const checkAnswerDetailed = (userAnswer: string, correctAnswer: string): 'correct' | 'partially_correct' | 'incorrect' => {
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      // Remove punctuation and extra spaces
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      // Remove articles
      .replace(/\b(a|an|the)\b/g, '')
      .trim()
      // Handle common number variations (bidirectional)
      .replace(/\b(first|1st)\b/g, '1st')
      .replace(/\b(second|2nd)\b/g, '2nd')
      .replace(/\b(third|3rd)\b/g, '3rd')
      .replace(/\b(fourth|4th)\b/g, '4th')
      .replace(/\b(fifth|5th)\b/g, '5th')
      .replace(/\b(sixth|6th)\b/g, '6th')
      .replace(/\b(seventh|7th)\b/g, '7th')
      .replace(/\b(eighth|8th)\b/g, '8th')
      .replace(/\b(ninth|9th)\b/g, '9th')
      .replace(/\b(tenth|10th)\b/g, '10th')
      .replace(/\b(eleventh|11th)\b/g, '11th')
      .replace(/\b(twelfth|12th)\b/g, '12th')
      .replace(/\b(thirteenth|13th)\b/g, '13th')
      .replace(/\b(fourteenth|14th)\b/g, '14th')
      .replace(/\b(fifteenth|15th)\b/g, '15th')
      .replace(/\b(sixteenth|16th)\b/g, '16th')
      .replace(/\b(seventeenth|17th)\b/g, '17th')
      .replace(/\b(eighteenth|18th)\b/g, '18th')
      .replace(/\b(nineteenth|19th)\b/g, '19th')
      .replace(/\b(twentieth|20th)\b/g, '20th')
      // Handle written numbers
      .replace(/\b(one|1)\b/g, '1')
      .replace(/\b(two|2)\b/g, '2')
      .replace(/\b(three|3)\b/g, '3')
      .replace(/\b(four|4)\b/g, '4')
      .replace(/\b(five|5)\b/g, '5')
      .replace(/\b(six|6)\b/g, '6')
      .replace(/\b(seven|7)\b/g, '7')
      .replace(/\b(eight|8)\b/g, '8')
      .replace(/\b(nine|9)\b/g, '9')
      .replace(/\b(ten|10)\b/g, '10')
      .replace(/\b(eleven|11)\b/g, '11')
      .replace(/\b(twelve|12)\b/g, '12')
      .replace(/\b(thirteen|13)\b/g, '13')
      .replace(/\b(fourteen|14)\b/g, '14')
      .replace(/\b(fifteen|15)\b/g, '15')
      .replace(/\b(sixteen|16)\b/g, '16')
      .replace(/\b(seventeen|17)\b/g, '17')
      .replace(/\b(eighteen|18)\b/g, '18')
      .replace(/\b(nineteen|19)\b/g, '19')
      .replace(/\b(twenty|20)\b/g, '20')
      // Handle common name variations (like Emmanuel Macron vs Macron)
      .replace(/\b(emmanuel|emanuel)\s+(macron)\b/g, 'macron')
      .replace(/\b(donald)\s+(trump)\b/g, 'trump')
      .replace(/\b(joe|joseph)\s+(biden)\b/g, 'biden')
      .replace(/\b(barack)\s+(obama)\b/g, 'obama')
      .replace(/\b(hillary)\s+(clinton)\b/g, 'clinton')
      .replace(/\b(bernie)\s+(sanders)\b/g, 'sanders')
      .replace(/\b(elizabeth)\s+(warren)\b/g, 'warren')
      .replace(/\b(kamala)\s+(harris)\b/g, 'harris')
      .replace(/\b(mike|michael)\s+(pence)\b/g, 'pence')
      .replace(/\b(nancy)\s+(pelosi)\b/g, 'pelosi')
      .replace(/\b(mitch)\s+(mcconnell)\b/g, 'mcconnell')
      .replace(/\b(chuck|charles)\s+(schumer)\b/g, 'schumer')
      .replace(/\b(alexandria)\s+(ocasio-cortez|ocasio cortez|aoc)\b/g, 'ocasio-cortez')
      .replace(/\b(ted)\s+(cruz)\b/g, 'cruz')
      .replace(/\b(marco)\s+(rubio)\b/g, 'rubio')
      .replace(/\b(lindsey)\s+(graham)\b/g, 'graham')
      // Handle common abbreviations and variations
      .replace(/\b(doctor|dr)\b/g, 'dr')
      .replace(/\b(mister|mr)\b/g, 'mr')
      .replace(/\b(missus|mrs)\b/g, 'mrs')
      .replace(/\b(miss|ms)\b/g, 'ms')
      .replace(/\b(saint|st)\b/g, 'st')
      .replace(/\b(mount|mt)\b/g, 'mt')
      .replace(/\b(president|pres)\b/g, 'president')
      .replace(/\b(senator|sen)\b/g, 'senator')
      .replace(/\b(representative|rep)\b/g, 'representative')
      .replace(/\b(governor|gov)\b/g, 'governor')
      .replace(/\b(united states|usa|us)\b/g, 'us')
      .replace(/\b(supreme court|scotus)\b/g, 'supreme court')
      // Handle pluralization (basic)
      .replace(/s\b/g, '')
      // Handle hyphenation
      .replace(/-/g, ' ')
      // Final cleanup
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const normalizedUser = normalize(userAnswer)
  const normalizedCorrect = normalize(correctAnswer)
  
  // Exact match after normalization - CORRECT
  if (normalizedUser === normalizedCorrect) return 'correct'
  
  // Check if answers are essentially the same (after removing common words)
  const removeCommonWords = (text: string) => {
    const commonWords = ['is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over']
    return text.split(' ').filter(word => !commonWords.includes(word)).join(' ')
  }
  
  const coreUser = removeCommonWords(normalizedUser)
  const coreCorrect = removeCommonWords(normalizedCorrect)
  
  // Core content exact match - CORRECT
  if (coreUser === coreCorrect && coreUser.length > 0) return 'correct'
  
  // Check if words are just reordered (for 2-3 word answers) - CORRECT
  const userWords = normalizedUser.split(' ').filter(w => w.length > 0).sort()
  const correctWords = normalizedCorrect.split(' ').filter(w => w.length > 0).sort()
  if (userWords.length > 1 && userWords.join(' ') === correctWords.join(' ')) return 'correct'
  
  // Enhanced Levenshtein distance for typos - CORRECT (strict)
  const distance = getLevenshteinDistance(normalizedUser, normalizedCorrect)
  
  // Very short answers (1-3 chars) need exact match
  if (normalizedCorrect.length <= 3) {
    return distance === 0 ? 'correct' : 'incorrect'
  }
  
  // Short answers (4-6 chars) allow 1 typo for CORRECT
  if (normalizedCorrect.length <= 6) {
    if (distance === 0) return 'correct'
    if (distance === 1) return 'correct'
    return 'incorrect'
  }
  
  // Medium answers (7-12 chars) allow up to 2 typos for CORRECT
  if (normalizedCorrect.length <= 12) {
    if (distance <= 2) return 'correct'
    return 'incorrect'
  }
  
  // For longer answers, be more strict about CORRECT vs PARTIALLY CORRECT
  const userWordSet = new Set(normalizedUser.split(' ').filter(w => w.length > 1))
  const correctWordSet = new Set(normalizedCorrect.split(' ').filter(w => w.length > 1))
  
  // Calculate word overlap
  const intersection = new Set([...userWordSet].filter(word => correctWordSet.has(word)))
  const wordOverlapRatio = correctWordSet.size > 0 ? intersection.size / correctWordSet.size : 0
  
  // For multi-word answers, be very strict about what counts as "correct"
  if (correctWordSet.size > 1) {
    // Must have ALL key words for CORRECT (95%+ overlap)
    if (wordOverlapRatio >= 0.95) {
      // Check length similarity for final validation
      const lengthRatio = Math.min(normalizedUser.length, normalizedCorrect.length) / 
                         Math.max(normalizedUser.length, normalizedCorrect.length)
      if (lengthRatio >= 0.8) return 'correct'
    }
    
    // Has significant key words but not complete - PARTIALLY CORRECT
    if (wordOverlapRatio >= 0.5 && intersection.size >= 1) {
      return 'partially_correct'
    }
    
    // Check if user answer is contained in correct answer (partial match)
    if (normalizedCorrect.includes(normalizedUser) && normalizedUser.length >= 3) {
      return 'partially_correct'
    }
  } else {
    // Single word answers - use edit distance
    const maxAllowedDistance = Math.ceil(normalizedCorrect.length * 0.15) // Stricter: 15%
    if (distance <= maxAllowedDistance) return 'correct'
  }
  
  return 'incorrect'
}

// Legacy function for backward compatibility - now uses the detailed check
export const checkAnswerIntelligently = (userAnswer: string, correctAnswer: string): boolean => {
  const result = checkAnswerDetailed(userAnswer, correctAnswer)
  return result === 'correct'
}

export function ShortAnswerQuestion({
  question,
  selectedAnswer,
  isSubmitted,
  onSelectAnswer,
}: ShortAnswerQuestionProps) {
  const [inputValue, setInputValue] = useState("")
  const [showHint, setShowHint] = useState(false)
  
  // Initialize and sync with selectedAnswer
  useEffect(() => {
    if (selectedAnswer !== null) {
      setInputValue(selectedAnswer)
    } else {
      setInputValue("")
    }
  }, [selectedAnswer])

  // Reset when question changes
  useEffect(() => {
    setInputValue("")
    setShowHint(false)
  }, [question.question_number])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    onSelectAnswer(value)
  }, [onSelectAnswer])

  const toggleHint = useCallback(() => {
    setShowHint(prev => !prev)
  }, [])

  // Calculate answer status for real-time feedback
  const answerStatus = inputValue.trim() ? checkAnswerDetailed(inputValue, question.correct_answer) : 'incorrect'
  const isCorrect = isSubmitted && checkAnswerIntelligently(inputValue, question.correct_answer)

  return (
    <div className="space-y-4">
      {/* Main input field */}
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          disabled={isSubmitted}
          placeholder="Type your answer here..."
          className={cn(
            "p-6 text-lg transition-all duration-200 border-2",
            // Default state
            !isSubmitted && "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900",
            // Focus state
            !isSubmitted && "focus:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-950/30 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800",
            // With content
            !isSubmitted && inputValue && "border-blue-400 bg-blue-50/50 dark:bg-blue-900/20",
            // Submitted states
            isSubmitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
            isSubmitted && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
          )}
        />
      </div>

      {/* Real-time feedback while typing */}
      {!isSubmitted && inputValue.trim() && (
        <div className={cn(
          "p-3 rounded-lg border-l-4 transition-all duration-200",
          answerStatus === 'correct' ? "border-green-400 bg-green-50 dark:bg-green-900/20" :
          answerStatus === 'partially_correct' ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" :
          "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
        )}>
          <p className="text-sm">
            {answerStatus === 'correct' ? (
              <span className="text-green-600 font-medium flex items-center">
                <span className="mr-2">🎯</span>
                Perfect! Your answer looks correct.
              </span>
            ) : answerStatus === 'partially_correct' ? (
              <span className="text-yellow-600 font-medium">
                <span className="flex items-center">
                  <span className="mr-2">⚡</span>
                  You're on the right track! Try adding more details.
                </span>
              </span>
            ) : (
              <span className="text-blue-600 font-medium">
                <span className="flex items-center">
                  <span className="mr-2">💭</span>
                  Keep thinking...
                </span>
              </span>
            )}
          </p>
        </div>
      )}

      {/* Hint section */}
      {!isSubmitted && question.hint && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleHint}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
          
          {showHint && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start">
                <span className="mr-2 text-base">💡</span>
                <span className="flex-1">{question.hint}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Answer comparison after submission */}
      {isSubmitted && !isCorrect && (
        <div className="mt-4 p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-200">Your answer:</span>{" "}
              <span className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                {inputValue || "(no answer provided)"}
              </span>
            </p>
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-200">Correct answer:</span>{" "}
              <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded font-medium">
                {question.correct_answer}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}