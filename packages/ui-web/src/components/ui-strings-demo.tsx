'use client'

import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useQuizStrings, useAuthStrings, useCommonActionStrings, ui } from '@civicsense/shared/hooks/useUIStrings'

/**
 * Demo component showing different UI strings integration patterns
 * This serves as a reference for converting existing components
 */
export function UIStringsDemo() {
  // Method 1: Specialized hooks for specific areas
  const quizStrings = useQuizStrings()
  const authStrings = useAuthStrings()
  const actionStrings = useCommonActionStrings()

  // Method 2: Direct UI helper functions
  const brandName = ui.brand.name()
  const startQuizText = ui.quiz.startQuiz()

  const handleStartQuiz = () => {
    console.log('Starting quiz...')
  }

  const handleSignIn = () => {
    console.log('Signing in...')
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>UI Strings Integration Demo</CardTitle>
          <Badge variant="outline">Reference Implementation</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Method 1: Using specialized hooks */}
          <div className="space-y-3">
            <h3 className="font-semibold">Method 1: Specialized Hooks</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleStartQuiz}>
                {quizStrings.startQuiz}
              </Button>
              <Button variant="outline">
                {quizStrings.continueQuiz}
              </Button>
              <Button variant="ghost">
                {quizStrings.skipQuestion}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSignIn}>
                {authStrings.signIn}
              </Button>
              <Button variant="outline">
                {authStrings.signUp}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost">
                {actionStrings.back}
              </Button>
              <Button>
                {actionStrings.continue}
              </Button>
              <Button variant="outline">
                {actionStrings.retry}
              </Button>
            </div>
          </div>

          {/* Method 2: Direct UI helpers */}
          <div className="space-y-3">
            <h3 className="font-semibold">Method 2: Direct UI Helpers</h3>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium">{brandName}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {ui.brand.tagline()}
              </p>
              <Button className="mt-3" onClick={handleStartQuiz}>
                {startQuizText}
              </Button>
            </div>
          </div>

          {/* Method 3: Common patterns in CivicSense */}
          <div className="space-y-3">
            <h3 className="font-semibold">Method 3: CivicSense Patterns</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">
                {ui.results.continueLearning()}
              </Button>
              <Button variant="outline">
                {ui.quiz.retakeQuiz()}
              </Button>
              <Button variant="ghost">
                {ui.quiz.signInToContinue()}
              </Button>
              <Button variant="outline">
                {ui.quiz.comingSoon()}
              </Button>
            </div>
          </div>

          {/* Loading states */}
          <div className="space-y-3">
            <h3 className="font-semibold">Loading States</h3>
            <div className="flex gap-2">
              <Button disabled>
                {actionStrings.loading}
              </Button>
              <Button disabled>
                {authStrings.signingIn}
              </Button>
              <Button disabled>
                {authStrings.creatingAccount}
              </Button>
            </div>
          </div>

          {/* Messages and feedback */}
          <div className="space-y-3">
            <h3 className="font-semibold">Messages & Feedback</h3>
            <div className="space-y-2">
              <div className="p-2 bg-green-50 text-green-800 rounded text-sm">
                {ui.messages.success()} {ui.messages.wellDone()}
              </div>
              <div className="p-2 bg-blue-50 text-blue-800 rounded text-sm">
                {ui.messages.welcome()} {ui.messages.goodJob()}
              </div>
              <div className="p-2 bg-red-50 text-red-800 rounded text-sm">
                {ui.errors.network()} {ui.errors.tryAgain()}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Code examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Before (hardcoded):</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`<Button>Start Quiz</Button>
<Button>Continue Learning</Button>
<span>Loading...</span>`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">After (UI strings):</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`const quizStrings = useQuizStrings()

<Button>{quizStrings.startQuiz}</Button>
<Button>{ui.results.continueLearning()}</Button>
<span>{actionStrings.loading}</span>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 