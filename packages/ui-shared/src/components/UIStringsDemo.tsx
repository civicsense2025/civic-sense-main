'use client'

import { useQuizStrings, useUIStrings, useCommonStrings, ui } from '../hooks/useUIStrings'

/**
 * Demo component showing different UI strings integration patterns
 * This serves as a reference for converting existing components
 */
export function UIStringsDemo() {
  // Method 1: Specialized hooks for specific areas
  const quizStrings = useQuizStrings()
  const commonStrings = useCommonStrings()

  // Method 2: Direct UI helper functions
  const startQuizText = ui.quiz.startQuiz()

  const handleStartQuiz = () => {
    console.log('Starting quiz...')
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      {/* Demo component temporarily disabled due to missing UI components */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">UI Strings Integration Demo</h2>
        <p className="text-sm text-gray-600">This demo component is temporarily disabled.</p>
        <div className="mt-4 space-y-2">
          <p><strong>Available strings:</strong></p>
          <p>Quiz: {quizStrings.startQuiz}</p>
          <p>Common: {commonStrings.actions.continue}</p>
          <p>UI: {startQuizText}</p>
        </div>
      </div>
    </div>
  )
} 