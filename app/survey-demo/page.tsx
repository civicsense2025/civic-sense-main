"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  MultipleChoice, 
  ScaleRating, 
  StarRating, 
  MatrixGrid, 
  TextInput, 
  SliderInput 
} from "@/components/survey/questions"

// Sample questions demonstrating different types
const demoQuestions = [
  {
    id: "1",
    type: "multiple_choice" as const,
    title: "Age Range",
    description: "Select your age group",
    required: true,
    options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
  },
  {
    id: "2", 
    type: "scale_rating" as const,
    title: "How confident do you feel about your understanding of how the U.S. government works?",
    required: true,
    scale: { min: 1, max: 5 },
    labels: { min: "Not confident at all", max: "Very confident" }
  },
  {
    id: "3",
    type: "star_rating" as const, 
    title: "Rate your overall satisfaction with political news coverage",
    description: "Consider accuracy, comprehensiveness, and clarity",
    required: false
  },
  {
    id: "4",
    type: "matrix_grid" as const,
    title: "How much do you trust these institutions to provide accurate information?",
    required: true,
    items: [
      "Traditional news media",
      "Social media platforms", 
      "Government officials",
      "Academic experts",
      "Fact-checking websites"
    ],
    scale: {
      min: 1,
      max: 5,
      labels: { min: "No trust", max: "Complete trust" }
    }
  },
  {
    id: "5",
    type: "slider" as const,
    title: "How often do you actively seek out news about politics? (days per week)",
    required: true,
    min: 0,
    max: 7,
    unit: " days",
    labels: { min: "Never", max: "Daily" }
  },
  {
    id: "6",
    type: "text_area" as const,
    title: "What gives you hope about the future of democracy in America?",
    description: "Share your thoughts - there are no right or wrong answers",
    required: false,
    maxLength: 500
  }
]

export default function SurveyDemo() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})

  const question = demoQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / demoQuestions.length) * 100

  const updateResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const nextQuestion = () => {
    if (currentQuestion < demoQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const renderQuestion = () => {
    const currentValue = responses[question.id]

    switch (question.type) {
      case "multiple_choice":
        return (
          <MultipleChoice
            questionId={question.id}
            options={question.options}
            value={currentValue}
            onChange={(value) => updateResponse(question.id, value)}
          />
        )

      case "scale_rating":
        return (
          <ScaleRating
            questionId={question.id}
            min={question.scale.min}
            max={question.scale.max}
            value={currentValue}
            onChange={(value) => updateResponse(question.id, value)}
            labels={question.labels}
          />
        )

      case "star_rating":
        return (
          <StarRating
            questionId={question.id}
            value={currentValue}
            onChange={(value) => updateResponse(question.id, value)}
            size="lg"
          />
        )

      case "matrix_grid":
        return (
          <MatrixGrid
            questionId={question.id}
            items={question.items}
            scale={question.scale}
            values={currentValue}
            onChange={(values) => updateResponse(question.id, values)}
          />
        )

      case "slider":
        return (
          <SliderInput
            questionId={question.id}
            min={question.min}
            max={question.max}
            value={currentValue || question.min}
            onChange={(value) => updateResponse(question.id, value)}
            labels={question.labels}
            unit={question.unit}
          />
        )

      case "text_area":
        return (
          <TextInput
            questionId={question.id}
            type="textarea"
            value={currentValue || ""}
            onChange={(value) => updateResponse(question.id, value)}
            maxLength={question.maxLength}
            rows={6}
          />
        )

      default:
        return <div>Question type not implemented</div>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-slate-900 dark:text-white mb-2">
            Survey System Demo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-light">
            Modern question types with clean, responsive design
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Question {currentQuestion + 1} of {demoQuestions.length}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {question.type.replace('_', ' ')}
                  </Badge>
                  {question.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-light text-slate-900 dark:text-white leading-relaxed">
                  {question.title}
                </CardTitle>
                {question.description && (
                  <p className="text-slate-600 dark:text-slate-400 font-light">
                    {question.description}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-8">
            {/* Question Component */}
            <div className="min-h-[200px]">
              {renderQuestion()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="px-6"
              >
                Previous
              </Button>

              <div className="flex space-x-2">
                {demoQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentQuestion
                        ? "bg-blue-600 scale-125"
                        : index < currentQuestion
                        ? "bg-green-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextQuestion}
                disabled={currentQuestion === demoQuestions.length - 1}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                {currentQuestion === demoQuestions.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Panel */}
        <Card className="mt-8 bg-slate-100 dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
              Response Data (Debug)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-slate-600 dark:text-slate-400 overflow-auto">
              {JSON.stringify(responses, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 