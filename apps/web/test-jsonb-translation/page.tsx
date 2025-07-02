'use client'

import { useState } from 'react'
import { useQuizTranslation } from '@civicsense/shared/hooks/useQuizTranslation'
import { useLanguage } from '@civicsense/ui-web/components/providers/language-provider'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@civicsense/ui-web/components/ui/select'
import { Loader2 } from 'lucide-react'

// Sample quiz data for testing
const sampleQuestions = [
  {
    id: '1',
    question: 'What is the capital of the United States?',
    explanation: 'Washington, D.C. has been the capital of the United States since 1800.',
    hint: 'Think of the first president',
    option_a: 'New York',
    option_b: 'Los Angeles',
    option_c: 'Washington, D.C.',
    option_d: 'Chicago',
    correct_answer: 'c',
    translations: {
      question: {
        es: { text: '¿Cuál es la capital de los Estados Unidos?', autoTranslated: true },
        fr: { text: 'Quelle est la capitale des États-Unis?', autoTranslated: true }
      },
      explanation: {
        es: { text: 'Washington, D.C. ha sido la capital de los Estados Unidos desde 1800.', autoTranslated: true }
      }
    }
  },
  {
    id: '2',
    question: 'Who was the first President of the United States?',
    explanation: 'George Washington served as the first President from 1789 to 1797.',
    hint: 'His face is on the one dollar bill',
    option_a: 'Thomas Jefferson',
    option_b: 'George Washington',
    option_c: 'Benjamin Franklin',
    option_d: 'John Adams',
    correct_answer: 'b'
  }
]

export default function TestJSONBTranslationPage() {
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage()
  const { 
    translateQuestion, 
    saveQuestionTranslation, 
    isTranslating 
  } = useQuizTranslation()
  
  const [selectedQuestion, setSelectedQuestion] = useState(sampleQuestions[0])
  const [translatedQuestion, setTranslatedQuestion] = useState<any>(null)
  const [saveStatus, setSaveStatus] = useState<string>('')

  const handleTranslate = async () => {
    setSaveStatus('')
    const translated = await translateQuestion(selectedQuestion, currentLanguage)
    setTranslatedQuestion(translated)
  }

  const handleSaveField = async (field: string) => {
    if (!translatedQuestion) return
    
    setSaveStatus(`Saving ${field}...`)
    const success = await saveQuestionTranslation(
      selectedQuestion.id,
      field,
      currentLanguage,
      translatedQuestion[field] || ''
    )
    
    setSaveStatus(success ? `✅ ${field} saved!` : `❌ Failed to save ${field}`)
  }

  const displayQuestion = translatedQuestion || selectedQuestion

  return (
    <div className="container max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">JSONB Translation System Test</h1>
      
      {/* Language Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Language Settings</CardTitle>
          <CardDescription>Select a language to test translations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={currentLanguage} onValueChange={setLanguage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.emoji} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span className="text-sm text-muted-foreground">
              Current language: <strong>{currentLanguage}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Question Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Question</CardTitle>
          <CardDescription>Choose a question to translate</CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedQuestion.id} 
            onValueChange={(id) => {
              const q = sampleQuestions.find(q => q.id === id)
              if (q) {
                setSelectedQuestion(q)
                setTranslatedQuestion(null)
                setSaveStatus('')
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sampleQuestions.map(q => (
                <SelectItem key={q.id} value={q.id}>
                  {q.question.substring(0, 50)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Translation Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Translation</CardTitle>
          <CardDescription>
            Translate the selected question to {currentLanguage.toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleTranslate}
            disabled={isTranslating || currentLanguage === 'en'}
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              'Translate Question'
            )}
          </Button>
          
          {saveStatus && (
            <p className="mt-2 text-sm">{saveStatus}</p>
          )}
        </CardContent>
      </Card>

      {/* Display Original vs Translated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <Card>
          <CardHeader>
            <CardTitle>Original (English)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Question</h4>
              <p className="text-sm bg-muted p-3 rounded">{selectedQuestion.question}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Explanation</h4>
              <p className="text-sm bg-muted p-3 rounded">{selectedQuestion.explanation}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Hint</h4>
              <p className="text-sm bg-muted p-3 rounded">{selectedQuestion.hint}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Options</h4>
              <div className="space-y-2">
                <p className="text-sm bg-muted p-2 rounded">A) {selectedQuestion.option_a}</p>
                <p className="text-sm bg-muted p-2 rounded">B) {selectedQuestion.option_b}</p>
                <p className="text-sm bg-muted p-2 rounded">C) {selectedQuestion.option_c}</p>
                <p className="text-sm bg-muted p-2 rounded">D) {selectedQuestion.option_d}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Translated */}
        <Card>
          <CardHeader>
            <CardTitle>Translated ({currentLanguage.toUpperCase()})</CardTitle>
            <CardDescription>
              {translatedQuestion ? 'Click save to persist translations' : 'Click translate to see results'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold">Question</h4>
                {translatedQuestion && currentLanguage !== 'en' && (
                  <Button size="sm" variant="outline" onClick={() => handleSaveField('question')}>
                    Save
                  </Button>
                )}
              </div>
              <p className="text-sm bg-blue-50 p-3 rounded">
                {displayQuestion.question}
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold">Explanation</h4>
                {translatedQuestion && currentLanguage !== 'en' && (
                  <Button size="sm" variant="outline" onClick={() => handleSaveField('explanation')}>
                    Save
                  </Button>
                )}
              </div>
              <p className="text-sm bg-blue-50 p-3 rounded">
                {displayQuestion.explanation}
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold">Hint</h4>
                {translatedQuestion && currentLanguage !== 'en' && (
                  <Button size="sm" variant="outline" onClick={() => handleSaveField('hint')}>
                    Save
                  </Button>
                )}
              </div>
              <p className="text-sm bg-blue-50 p-3 rounded">
                {displayQuestion.hint}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Options</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm bg-blue-50 p-2 rounded flex-1 mr-2">
                    A) {displayQuestion.option_a}
                  </p>
                  {translatedQuestion && currentLanguage !== 'en' && (
                    <Button size="sm" variant="outline" onClick={() => handleSaveField('option_a')}>
                      Save
                    </Button>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm bg-blue-50 p-2 rounded flex-1 mr-2">
                    B) {displayQuestion.option_b}
                  </p>
                  {translatedQuestion && currentLanguage !== 'en' && (
                    <Button size="sm" variant="outline" onClick={() => handleSaveField('option_b')}>
                      Save
                    </Button>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm bg-blue-50 p-2 rounded flex-1 mr-2">
                    C) {displayQuestion.option_c}
                  </p>
                  {translatedQuestion && currentLanguage !== 'en' && (
                    <Button size="sm" variant="outline" onClick={() => handleSaveField('option_c')}>
                      Save
                    </Button>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm bg-blue-50 p-2 rounded flex-1 mr-2">
                    D) {displayQuestion.option_d}
                  </p>
                  {translatedQuestion && currentLanguage !== 'en' && (
                    <Button size="sm" variant="outline" onClick={() => handleSaveField('option_d')}>
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Translations */}
      {selectedQuestion.translations && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Existing JSONB Translations</CardTitle>
            <CardDescription>
              These translations are stored in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-auto text-xs">
              {JSON.stringify(selectedQuestion.translations, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 