"use client"

import React from 'react'
import { useUIString, useUISection, ui } from '@/hooks/useUIStrings'
import { useTranslatedQuiz } from '@/hooks/useQuizTranslation'
import { useTranslatedEntity } from '@/hooks/useJSONBTranslation'
import { LanguageSwitcher, LanguageStatus, LanguageFlags } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function TranslationTestPage() {
  // Test UI string translations
  const welcomeText = useUIString('messages.welcome')
  const brandName = useUIString('brand.name')
  const brandTagline = useUIString('brand.tagline')
  
  // Test section translations
  const authStrings = useUISection('auth')
  const quizStrings = useUISection('quiz')
  const navStrings = useUISection('navigation')
  
  // Test typed UI helper
  const continueButton = ui.actions.continue()
  const startQuizButton = ui.quiz.startQuiz()
  const homeLink = ui.nav.home()

  // Mock quiz data for testing content translation
  const mockQuestions = [
    {
      id: '1',
      question: 'What is the first amendment to the Constitution?',
      explanation: 'The First Amendment protects freedom of speech, religion, press, assembly, and petition.',
      hint: 'Think about fundamental freedoms',
      option_a: 'Freedom of speech',
      option_b: 'Right to bear arms', 
      option_c: 'Due process',
      option_d: 'Voting rights',
      correct_answer: 'option_a',
      question_type: 'multiple_choice',
      difficulty_level: 2,
      translations: {
        question: {
          es: {
            text: '¿Cuál es la primera enmienda de la Constitución?',
            lastUpdated: '2024-01-15T10:00:00Z',
            autoTranslated: true
          },
          fr: {
            text: 'Quel est le premier amendement à la Constitution?',
            lastUpdated: '2024-01-15T10:00:00Z',
            autoTranslated: true
          }
        },
        explanation: {
          es: {
            text: 'La Primera Enmienda protege la libertad de expresión, religión, prensa, reunión y petición.',
            lastUpdated: '2024-01-15T10:00:00Z',
            autoTranslated: true
          }
        },
        option_a: {
          es: {
            text: 'Libertad de expresión',
            lastUpdated: '2024-01-15T10:00:00Z',
            autoTranslated: true
          }
        }
      }
    },
    {
      id: '2',
      question: 'How many branches of government are there?',
      explanation: 'The U.S. government has three branches: executive, legislative, and judicial.',
      hint: 'Think about separation of powers',
      option_a: 'Two',
      option_b: 'Three',
      option_c: 'Four', 
      option_d: 'Five',
      correct_answer: 'option_b',
      question_type: 'multiple_choice',
      difficulty_level: 1
    }
  ]

  // Test quiz translation
  const { questions: translatedQuestions, isTranslating: isQuizTranslating } = useTranslatedQuiz(mockQuestions)

  // Test entity translation
  const { entity: translatedQuestion, isTranslating: isEntityTranslating } = useTranslatedEntity(
    mockQuestions[0],
    {
      tableName: 'questions',
      fields: [
        { fieldName: 'question' },
        { fieldName: 'explanation' },
        { fieldName: 'hint' },
        { fieldName: 'option_a' },
        { fieldName: 'option_b' },
        { fieldName: 'option_c' },
        { fieldName: 'option_d' }
      ]
    }
  )

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{brandName} Translation Test</h1>
          <p className="text-gray-600 mt-1">{brandTagline}</p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageStatus />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome Message Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{welcomeText}</p>
          <p className="text-sm text-gray-600 mt-2">
            This message should change based on the selected language
          </p>
        </CardContent>
      </Card>

      {/* Language Switcher Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Language Switcher Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Default Switcher</h4>
            <LanguageSwitcher />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Compact Switcher</h4>
            <LanguageSwitcher variant="compact" />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Minimal Switcher</h4>
            <LanguageSwitcher variant="minimal" />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Flag Buttons</h4>
            <LanguageFlags />
          </div>
        </CardContent>
      </Card>

      {/* UI String Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Auth Strings */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Strings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Sign In:</strong> {authStrings.signIn.title}</p>
            <p><strong>Sign Up:</strong> {authStrings.signUp.title}</p>
            <p><strong>Email:</strong> {authStrings.signIn.emailLabel}</p>
            <p><strong>Password:</strong> {authStrings.signIn.passwordLabel}</p>
            <p><strong>Forgot Password:</strong> {authStrings.signIn.forgotPassword}</p>
          </CardContent>
        </Card>

        {/* Quiz Strings */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Strings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Start Quiz:</strong> {quizStrings.startQuiz}</p>
            <p><strong>Next Question:</strong> {quizStrings.nextQuestion}</p>
            <p><strong>Explanation:</strong> {quizStrings.explanation}</p>
            <p><strong>Score:</strong> {quizStrings.score}</p>
            <p><strong>Complete:</strong> {quizStrings.complete}</p>
          </CardContent>
        </Card>

        {/* Navigation Strings */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Strings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Home:</strong> {navStrings.home}</p>
            <p><strong>Dashboard:</strong> {navStrings.dashboard}</p>
            <p><strong>Categories:</strong> {navStrings.categories}</p>
            <p><strong>Multiplayer:</strong> {navStrings.multiplayer}</p>
            <p><strong>Settings:</strong> {navStrings.settings}</p>
          </CardContent>
        </Card>
      </div>

      {/* Typed UI Helpers */}
      <Card>
        <CardHeader>
          <CardTitle>Typed UI Helpers</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button>{continueButton}</Button>
          <Button variant="outline">{startQuizButton}</Button>
          <Button variant="secondary">{homeLink}</Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Content Translation Tests */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Content Translation Tests</h2>

        {/* Quiz Translation Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Quiz Translation Test
              {isQuizTranslating && (
                <Badge variant="secondary">Translating...</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {translatedQuestions.map((question, index) => (
              <div key={question.id} className="border rounded p-4">
                <h4 className="font-medium mb-2">Question {index + 1}</h4>
                <p className="mb-2">{question.question}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <p className="text-sm">A) {question.option_a}</p>
                  <p className="text-sm">B) {question.option_b}</p>
                  <p className="text-sm">C) {question.option_c}</p>
                  <p className="text-sm">D) {question.option_d}</p>
                </div>
                
                {question.hint && (
                  <p className="text-sm text-blue-600">💡 {question.hint}</p>
                )}
                
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">Show Explanation</summary>
                  <p className="text-sm text-gray-600 mt-1">{question.explanation}</p>
                </details>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Entity Translation Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Entity Translation Test (JSONB)
              {isEntityTranslating && (
                <Badge variant="secondary">Translating...</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {translatedQuestion && (
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Translated Question</h4>
                <p className="mb-2">{translatedQuestion.question}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <p className="text-sm">A) {translatedQuestion.option_a}</p>
                  <p className="text-sm">B) {translatedQuestion.option_b}</p>
                  <p className="text-sm">C) {translatedQuestion.option_c}</p>
                  <p className="text-sm">D) {translatedQuestion.option_d}</p>
                </div>
                
                {translatedQuestion.hint && (
                  <p className="text-sm text-blue-600">💡 {translatedQuestion.hint}</p>
                )}
                
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">Show Explanation</summary>
                  <p className="text-sm text-gray-600 mt-1">{translatedQuestion.explanation}</p>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>Switch Languages:</strong> Use the language switcher to change languages</p>
          <p>2. <strong>UI Strings:</strong> All interface text should translate automatically</p>
          <p>3. <strong>Page Translation:</strong> The entire page content will be translated</p>
          <p>4. <strong>Content Translation:</strong> Quiz questions show both stored and runtime translations</p>
          <p>5. <strong>JSONB Translation:</strong> The entity translation test shows JSONB-stored translations</p>
          <p className="text-blue-600">
            <strong>Note:</strong> Translations are generated using DeepL API and cached for performance
          </p>
        </CardContent>
      </Card>
    </div>
  )
}