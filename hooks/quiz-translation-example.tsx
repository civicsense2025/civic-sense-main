/**
 * Example usage of the quiz translation hook in components
 * This file demonstrates best practices for implementing translations
 */

import React, { useState } from 'react'
import { useQuizTranslation, useTranslatedQuiz } from './useQuizTranslation'
import { useLanguage } from '@/components/providers/language-provider'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

// Example 1: Basic quiz component with automatic translation
export function TranslatedQuizExample() {
  // Assume we fetch questions from the database
  const [questions] = useState([
    {
      id: '1',
      question: 'What is the capital of France?',
      explanation: 'Paris has been the capital of France since 987 AD.',
      hint: 'Think of the Eiffel Tower',
      option_a: 'London',
      option_b: 'Berlin', 
      option_c: 'Paris',
      option_d: 'Madrid',
      correct_answer: 'c'
    }
  ])

  // Use the hook to automatically translate questions
  const { questions: translatedQuestions, isTranslating } = useTranslatedQuiz(questions, {
    autoTranslate: true,
    cacheResults: true
  })

  if (isTranslating) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" />
        <span>Translating questions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {translatedQuestions.map((question) => (
        <div key={question.id} className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">{question.question}</h3>
          
          <div className="space-y-2">
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              A) {question.option_a}
            </button>
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              B) {question.option_b}
            </button>
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              C) {question.option_c}
            </button>
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              D) {question.option_d}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>💡 Hint: {question.hint}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Example 2: Manual translation with save functionality
export function QuizEditorWithTranslation() {
  const { 
    translateQuestion, 
    saveQuestionTranslation,
    isTranslating,
    currentLanguage 
  } = useQuizTranslation()
  
  const [question, setQuestion] = useState({
    id: '123',
    question: 'What is the capital of France?',
    explanation: 'Paris has been the capital of France since 987 AD.',
    hint: 'Think of the Eiffel Tower',
    option_a: 'London',
    option_b: 'Berlin',
    option_c: 'Paris',
    option_d: 'Madrid'
  })
  
  const [translatedQuestion, setTranslatedQuestion] = useState<any>(question)
  const [targetLanguage, setTargetLanguage] = useState('es')

  const handleTranslate = async () => {
    const translated = await translateQuestion(question, targetLanguage)
    setTranslatedQuestion(translated)
  }

  const handleSaveTranslation = async (field: string) => {
    const success = await saveQuestionTranslation(
      question.id,
      field,
      targetLanguage,
      translatedQuestion[field] || ''
    )
    
    if (success) {
      alert(`Translation saved for ${field}!`)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <select 
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
        </select>
        
        <Button 
          onClick={handleTranslate}
          disabled={isTranslating}
        >
          {isTranslating ? 'Translating...' : 'Translate Question'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Original */}
        <div>
          <h3 className="font-semibold mb-4">Original (English)</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Question</label>
              <p className="mt-1 p-3 bg-gray-50 rounded">{question.question}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Explanation</label>
              <p className="mt-1 p-3 bg-gray-50 rounded">{question.explanation}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Options</label>
              <div className="mt-1 space-y-2">
                <p className="p-2 bg-gray-50 rounded">A) {question.option_a}</p>
                <p className="p-2 bg-gray-50 rounded">B) {question.option_b}</p>
                <p className="p-2 bg-gray-50 rounded">C) {question.option_c}</p>
                <p className="p-2 bg-gray-50 rounded">D) {question.option_d}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Translated */}
        <div>
          <h3 className="font-semibold mb-4">Translated ({targetLanguage})</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Question</label>
              <div className="mt-1 flex gap-2">
                <p className="flex-1 p-3 bg-blue-50 rounded">{translatedQuestion.question}</p>
                <Button 
                  size="sm"
                  onClick={() => handleSaveTranslation('question')}
                >
                  Save
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Explanation</label>
              <div className="mt-1 flex gap-2">
                <p className="flex-1 p-3 bg-blue-50 rounded">{translatedQuestion.explanation}</p>
                <Button 
                  size="sm"
                  onClick={() => handleSaveTranslation('explanation')}
                >
                  Save
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Options</label>
              <div className="mt-1 space-y-2">
                <div className="flex gap-2">
                  <p className="flex-1 p-2 bg-blue-50 rounded">A) {translatedQuestion.option_a}</p>
                  <Button size="sm" onClick={() => handleSaveTranslation('option_a')}>Save</Button>
                </div>
                <div className="flex gap-2">
                  <p className="flex-1 p-2 bg-blue-50 rounded">B) {translatedQuestion.option_b}</p>
                  <Button size="sm" onClick={() => handleSaveTranslation('option_b')}>Save</Button>
                </div>
                <div className="flex gap-2">
                  <p className="flex-1 p-2 bg-blue-50 rounded">C) {translatedQuestion.option_c}</p>
                  <Button size="sm" onClick={() => handleSaveTranslation('option_c')}>Save</Button>
                </div>
                <div className="flex gap-2">
                  <p className="flex-1 p-2 bg-blue-50 rounded">D) {translatedQuestion.option_d}</p>
                  <Button size="sm" onClick={() => handleSaveTranslation('option_d')}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example 3: Integration with existing quiz engine
export function QuizEngineIntegration({ initialQuestions }: { initialQuestions: any[] }) {
  const { currentLanguage } = useLanguage()
  const { questions: translatedQuestions, isTranslating } = useTranslatedQuiz(
    initialQuestions,
    { autoTranslate: true }
  )
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const currentQuestion = translatedQuestions[currentQuestionIndex]

  // Show loading state while translating
  if (isTranslating && currentLanguage !== 'en') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading quiz in {currentLanguage.toUpperCase()}...</p>
      </div>
    )
  }

  return (
    <div className="quiz-container">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {translatedQuestions.length}
          </span>
          <span className="text-sm text-gray-600">
            Language: {currentLanguage.toUpperCase()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / translatedQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {currentQuestion && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">
            {currentQuestion.question}
          </h2>

          {/* Render question options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option: { id: string; text: string }) => (
              <button
                key={option.id}
                className="w-full p-4 text-left border rounded-lg hover:border-blue-500 transition"
              >
                {option.text}
              </button>
            ))}
          </div>

          {/* Show hint if needed */}
          {currentQuestion.hint && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">💡 Hint:</span> {currentQuestion.hint}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => setCurrentQuestionIndex(Math.min(translatedQuestions.length - 1, currentQuestionIndex + 1))}
          disabled={currentQuestionIndex === translatedQuestions.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

// Example 4: Batch translation management for admin
export function AdminTranslationManager() {
  const { 
    translateQuestions,
    saveQuestionTranslations,
    isTranslating 
  } = useQuizTranslation()
  
  const [questions] = useState<Array<{
    id: string
    question: string
    explanation: string
    hint: string
    option_a?: string
    option_b?: string
    option_c?: string
    option_d?: string
  }>>([
    // Your questions array
  ])
  
  const [selectedLanguages, setSelectedLanguages] = useState(['es', 'fr'])
  const [translationProgress, setTranslationProgress] = useState(0)

  const handleBatchTranslate = async () => {
    setTranslationProgress(0)
    
    for (let i = 0; i < selectedLanguages.length; i++) {
      const language = selectedLanguages[i]
      
      // Translate all questions for this language
      const translatedQuestions = await translateQuestions(questions, language)
      
      // Save translations to database
      for (const [index, question] of questions.entries()) {
        const translated = translatedQuestions[index]
        
        await saveQuestionTranslations(question.id, {
          question: { [language]: translated.question || '' },
          explanation: { [language]: translated.explanation || '' },
          hint: { [language]: translated.hint || '' },
          option_a: { [language]: translated.option_a || '' },
          option_b: { [language]: translated.option_b || '' },
          option_c: { [language]: translated.option_c || '' },
          option_d: { [language]: translated.option_d || '' }
        })
      }
      
      setTranslationProgress((i + 1) / selectedLanguages.length * 100)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Batch Translation Manager</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Languages to Translate
          </label>
          <div className="grid grid-cols-4 gap-3">
            {['es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'].map(lang => (
              <label key={lang} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLanguages([...selectedLanguages, lang])
                    } else {
                      setSelectedLanguages(selectedLanguages.filter(l => l !== lang))
                    }
                  }}
                  className="mr-2"
                />
                {lang.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">
            {questions.length} questions × {selectedLanguages.length} languages = {questions.length * selectedLanguages.length} translations
          </p>
          
          <Button
            onClick={handleBatchTranslate}
            disabled={isTranslating || selectedLanguages.length === 0}
            className="w-full"
          >
            {isTranslating ? 'Translating...' : 'Start Batch Translation'}
          </Button>
        </div>

        {translationProgress > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Translation Progress</span>
              <span>{Math.round(translationProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${translationProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 