"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui"
import { Button } from "../../components/ui"
import { Calendar, Home, Crown, ArrowLeft } from "lucide-react"

export default function CancelPage() {
  const router = useRouter()

  const handleContinueToQuizzes = () => {
    router.push('/')
  }

  const handleViewPremium = () => {
    router.push('/premium')
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            No worries! Your payment was cancelled and you haven't been charged.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            You can always upgrade to Premium later when you're ready to unlock advanced features like custom learning decks, detailed analytics, and spaced repetition.
          </p>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Continue Learning for Free
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              You still have access to daily civic quizzes, basic progress tracking, and community features.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleContinueToQuizzes} className="flex-1 sm:flex-none">
              <Home className="h-4 w-4 mr-2" />
              Continue with Free Plan
            </Button>
            <Button variant="outline" onClick={handleViewPremium} className="flex-1 sm:flex-none">
              <Crown className="h-4 w-4 mr-2" />
              View Premium Features
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <Button variant="ghost" onClick={handleGoBack} className="text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 