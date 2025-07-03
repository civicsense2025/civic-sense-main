"use client"

import { useState } from "react"
import { useAuth } from "@civicsense/ui-web"
import { usePremium } from '@civicsense/business-logic/hooks/usePremium'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { aiDeckBuilder, type AIEnhancedDeck } from '@civicsense/shared/ai-deck-builder'
import { 
  Wand2, Lightbulb, Clock, CheckCircle, 
  Target, Brain, Sparkles, ArrowRight,
  BookOpen, TrendingUp
} from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'

interface AIDeckCreatorProps {
  className?: string
  onDeckCreated?: (deck: AIEnhancedDeck) => void
}

const LEARNING_OBJECTIVES = [
  'Build practical skills I can use immediately',
  'Learn to navigate real-world civic situations', 
  'Develop confidence in civic participation',
  'Master skills that transfer to other areas of life',
  'Prepare for situations I might actually face',
  'Build research and fact-checking abilities',
  'Develop communication and advocacy skills',
  'Learn to protect my rights and help others',
  'Build financial and policy analysis skills',
  'Develop leadership and organizing abilities'
]

const CATEGORIES = [
  'Government', 'Elections', 'Economy', 'Foreign Policy', 'Justice',
  'Civil Rights', 'Environment', 'Local Issues', 'Constitutional Law',
  'National Security', 'Public Policy', 'Historical Precedent'
]

export function AIDeckCreator({ className, onDeckCreated }: AIDeckCreatorProps) {
  const { user } = useAuth()
  const { hasFeatureAccess } = usePremium()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDeck, setGeneratedDeck] = useState<AIEnhancedDeck | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [deckName, setDeckName] = useState('')
  const [description, setDescription] = useState('')
  const [learningObjective, setLearningObjective] = useState('General improvement')
  const [skillLearningMode, setSkillLearningMode] = useState<'remediation' | 'advancement' | 'mixed'>('remediation')
  const [questionCount, setQuestionCount] = useState(20)
  const [timeConstraint, setTimeConstraint] = useState(30)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [difficultyRange, setDifficultyRange] = useState<[number, number]>([1, 4])

  const handleGenerateDeck = async () => {
    if (!user) {
      setError('Please sign in to create AI-powered decks')
      return
    }

    if (!hasFeatureAccess('custom_decks')) {
      setError('AI deck creation requires a Premium subscription')
      return
    }

    if (!deckName.trim()) {
      setError('Please enter a deck name')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const deckRequest = {
        name: deckName,
        description: description || undefined,
        targetQuestionCount: questionCount,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        difficultyRange,
        learningObjective,
        timeConstraint,
        focusAreas: selectedCategories,
        skillLearningMode
      }

      const aiDeck = await aiDeckBuilder.generateAIEnhancedDeck(user.id, deckRequest)
      setGeneratedDeck(aiDeck)
      
      if (onDeckCreated) {
        onDeckCreated(aiDeck)
      }
    } catch (err) {
      console.error('Error generating AI deck:', err)
      setError('Failed to generate deck. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const resetForm = () => {
    setDeckName('')
    setDescription('')
    setLearningObjective('General improvement')
    setSkillLearningMode('remediation')
    setQuestionCount(20)
    setTimeConstraint(30)
    setSelectedCategories([])
    setDifficultyRange([1, 4])
    setGeneratedDeck(null)
    setError(null)
  }

  if (generatedDeck) {
    return (
      <Card className={cn("shadow-lg", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span>AI Deck Generated!</span>
              </CardTitle>
              <CardDescription>Your personalized quiz deck is ready</CardDescription>
            </div>
            <Button variant="outline" onClick={resetForm}>
              Create Another
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Deck Overview */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{generatedDeck.name}</h3>
              <p className="text-sm text-muted-foreground">{generatedDeck.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-sm font-medium">{generatedDeck.questions.length}</div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
              
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-sm font-medium">{generatedDeck.estimatedTime}m</div>
                <div className="text-xs text-muted-foreground">Est. Time</div>
              </div>
              
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Target className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <div className="text-sm font-medium">{generatedDeck.difficultyProgression}</div>
                <div className="text-xs text-muted-foreground">Progression</div>
              </div>
              
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Brain className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <div className="text-sm font-medium">{generatedDeck.learningPath.length}</div>
                <div className="text-xs text-muted-foreground">Topics</div>
              </div>
            </div>
          </div>

          {/* Learning Path */}
          {generatedDeck.learningPath.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Learning Path</h4>
              <div className="flex flex-wrap gap-2">
                {generatedDeck.learningPath.map((topic, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {index + 1}. {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {generatedDeck.aiRecommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span>AI Recommendations</span>
              </h4>
              <ul className="space-y-1">
                {generatedDeck.aiRecommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills Focus */}
          {generatedDeck.skillFocus && generatedDeck.skillFocus.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Skills Focus</h4>
              <div className="space-y-2">
                {generatedDeck.skillFocus.map((skill, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {skill.skillName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {skill.questionCount} questions
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {skill.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Outcomes */}
          {generatedDeck.actionableOutcomes && generatedDeck.actionableOutcomes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">What You'll Be Able to Do</h4>
              <div className="space-y-2">
                {generatedDeck.actionableOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                    <span className="text-sm text-green-800 dark:text-green-200">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions Preview */}
          <div className="space-y-2">
            <h4 className="font-medium">Questions Preview</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {generatedDeck.questions.slice(0, 5).map((question, index) => (
                <div key={question.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium flex-1">{question.question}</p>
                    <Badge variant="outline" className="ml-2 text-xs">
                      Level {question.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{question.category}</span>
                    <div className="flex space-x-1">
                      {question.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {/* Show target skills for this question */}
                  {question.targetSkills && question.targetSkills.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground">
                        🎯 Targets: {question.targetSkills.slice(0, 2).join(', ')}
                        {question.targetSkills.length > 2 && ` +${question.targetSkills.length - 2} more`}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {generatedDeck.questions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{generatedDeck.questions.length - 5} more questions...
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button className="flex-1">
              <ArrowRight className="h-4 w-4 mr-2" />
              Start Quiz
            </Button>
            <Button variant="outline">
              Save Deck
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5 text-blue-500" />
          <span>AI Deck Creator</span>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Premium
          </Badge>
        </CardTitle>
        <CardDescription>
          Let AI create a personalized quiz deck based on your learning profile and goals
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deck-name">Deck Name</Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g., Constitutional Law Review"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to focus on?"
              rows={2}
            />
          </div>
        </div>

        {/* Learning Objective */}
        <div className="space-y-2">
          <Label>Learning Objective</Label>
          <Select value={learningObjective} onValueChange={setLearningObjective}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEARNING_OBJECTIVES.map(objective => (
                <SelectItem key={objective} value={objective}>
                  {objective}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skill Learning Mode */}
        <div className="space-y-2">
          <Label>Learning Focus</Label>
          <Select value={skillLearningMode} onValueChange={(value) => setSkillLearningMode(value as 'remediation' | 'advancement' | 'mixed')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remediation">Practice skills I need to improve</SelectItem>
              <SelectItem value="advancement">Build on skills I'm already good at</SelectItem>
              <SelectItem value="mixed">Mix of practice and advancement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quiz Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Number of Questions</Label>
            <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 questions</SelectItem>
                <SelectItem value="15">15 questions</SelectItem>
                <SelectItem value="20">20 questions</SelectItem>
                <SelectItem value="25">25 questions</SelectItem>
                <SelectItem value="30">30 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time Limit</Label>
            <Select value={timeConstraint.toString()} onValueChange={(value) => setTimeConstraint(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <Label>Focus Categories (Optional)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryToggle(category)}
                className="justify-start text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty to let AI choose the best mix for you
          </p>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateDeck} 
          disabled={isGenerating || !deckName.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Analyzing your learning profile...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Wand2 className="h-4 w-4" />
              <span>Generate AI Deck</span>
            </div>
          )}
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            AI will analyze your quiz history and learning patterns to create the perfect deck for you
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 