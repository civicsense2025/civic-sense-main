"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@civicsense/ui-web/components/ui/card"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { Badge } from "@civicsense/ui-web/components/ui/badge"
import { Progress } from "@civicsense/ui-web/components/ui/progress"
import { SurveyForm, Survey, SurveyResponse } from "@civicsense/ui-web/components/survey/survey-form"
import { GlobalAudioControls } from "@civicsense/ui-web/components/global-audio-controls"
import { Headphones, ArrowLeft, CheckCircle } from "lucide-react"

// Enhanced CivicSense survey showcasing our distinctive styling and audio integration
const civicSenseSurvey: Survey = {
  id: "civicsense-demo-survey",
  title: "CivicSense Enhanced Survey Experience",
  description: "Experience our next-generation survey platform designed for civic engagement. Notice the audio controls, enhanced accessibility, and bold CivicSense styling.",
  questions: [
    {
      id: "welcome",
      type: "statement",
      question: "🎯 Welcome to CivicSense's Enhanced Survey Platform! This demo showcases our commitment to accessible, beautiful civic education tools. You'll notice audio controls, distinctive styling, enhanced visibility, and smooth interactions. Try the audio button to hear questions read aloud!"
    },
    {
      id: "demographics_age",
      type: "multiple_choice",
      question: "What's your age range?",
      description: "This helps us understand our diverse civic learning community",
      required: true,
      options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
    },
    {
      id: "satisfaction_overall",
      type: "scale",
      question: "How satisfied are you with current civic education resources?",
      description: "Rate your experience with traditional civic learning tools",
      scale_min: 1,
      scale_max: 5,
      scale_labels: { min: "Very Dissatisfied", max: "Very Satisfied" },
      required: true
    },
    {
      id: "content_quality",
      type: "rating_stars",
      question: "How would you rate CivicSense's content quality?",
      description: "Consider accuracy, clarity, and usefulness of our civic education materials"
    },
    {
      id: "confidence_matrix",
      type: "matrix",
      question: "Rate your confidence in these civic knowledge areas",
      description: "How confident do you feel about your knowledge in each area?",
      options: [
        "Understanding how Congress actually works",
        "Knowledge of local government impact on daily life",
        "Ability to evaluate news sources critically",
        "Understanding voting processes and systems",
        "Recognizing political misinformation and bias"
      ],
      matrix_config: {
        scale: {
          min: 1,
          max: 5,
          labels: { min: "Not confident at all", max: "Very confident" }
        }
      },
      required: true
    },
    {
      id: "email_contact",
      type: "email",
      question: "What's your email address?",
      description: "Optional - for follow-up research participation",
      required: false
    },
    {
      id: "improvement_feedback",
      type: "textarea",
      question: "What would you most like to see improved in civic education?",
      description: "Share specific suggestions for making civic learning more effective"
    },
    {
      id: "recommendation_likelihood",
      type: "slider",
      question: "How likely are you to recommend CivicSense?",
      description: "On a scale of 0-100, how likely would you be to recommend us?",
      scale_min: 0,
      scale_max: 100,
      scale_labels: { min: "Not likely at all", max: "Extremely likely" }
    },
    {
      id: "final_confidence",
      type: "yes_no",
      question: "Do you feel more confident about civic engagement after experiencing this enhanced survey platform?",
      description: "This measures whether our design approach improves user confidence"
    }
  ],
  created_at: new Date().toISOString(),
  status: "active",
  allow_anonymous: true,
  allow_partial_responses: true,
  estimated_time: 6
}

export default function SurveyDemo() {
  const [showSurvey, setShowSurvey] = useState(false)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [isComplete, setIsComplete] = useState(false)

  const handleComplete = (surveyResponses: SurveyResponse[]) => {
    setResponses(surveyResponses)
    setIsComplete(true)
    console.log("Survey completed with responses:", surveyResponses)
  }

  const handleSaveProgress = async (surveyResponses: SurveyResponse[]) => {
    setResponses(surveyResponses)
    console.log("Progress saved:", surveyResponses)
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white">
                Survey Complete!
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
                Thank you for experiencing CivicSense's enhanced survey platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Enhanced Styling</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Distinctive visual design that's modern and accessible
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">🔊</div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Audio Integration</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Built-in audio controls for improved accessibility
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Smooth Interactions</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Thoughtful animations and enhanced user experience
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-x-4">
              <Button
                onClick={() => {
                  setShowSurvey(false)
                  setIsComplete(false)
                  setResponses([])
                }}
                variant="outline"
                className="px-8 py-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showSurvey) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowSurvey(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Overview
              </Button>
            </div>
            
            <SurveyForm
              survey={civicSenseSurvey}
              onComplete={handleComplete}
              onSaveProgress={handleSaveProgress}
              existingResponses={responses}
            />
          </div>
        </div>
        
        <GlobalAudioControls />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0 px-4 py-2 font-medium">
              Enhanced Survey Experience
            </Badge>
            <h1 className="text-5xl font-light text-slate-900 dark:text-white tracking-tight">
              CivicSense Survey Platform
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
              Experience our next-generation survey platform designed for civic engagement. 
              Features enhanced styling, audio integration, and accessibility improvements.
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => setShowSurvey(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105"
            >
              <Headphones className="w-5 h-5 mr-3" />
              Experience the Demo Survey
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/10">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 dark:text-white">Distinctive Styling</h3>
              <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Bold, modern design that reflects CivicSense's commitment to truth over comfort.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/10">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto">
                <Headphones className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-900 dark:text-white">Audio Integration</h3>
              <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Built-in audio controls that read questions aloud for improved accessibility.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-600/10">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 dark:text-white">Smooth Interactions</h3>
              <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Thoughtful animations and visual feedback create an engaging experience.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-12 rounded-2xl border border-blue-200 dark:border-blue-800">
          <h2 className="text-3xl font-light text-slate-900 dark:text-white">
            Ready to experience the difference?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Try our enhanced survey platform and see how thoughtful design improves civic engagement.
          </p>
          <Button
            onClick={() => setShowSurvey(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-lg font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105"
          >
            Start the Demo Survey
          </Button>
        </div>
      </div>
    </div>
  )
} 