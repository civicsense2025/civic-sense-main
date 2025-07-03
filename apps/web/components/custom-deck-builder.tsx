"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@civicsense/ui-web"
import { usePremium } from '@civicsense/business-logic/hooks/usePremium'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { PremiumGate } from "@/components/premium-gate"
import { aiDeckBuilder, type AIEnhancedDeck } from '@civicsense/shared/ai-deck-builder'
import { 
  BookOpen, Plus, Search, Filter, Tag, 
  Calendar, Users, Settings, Save, 
  Trash2, Edit, Copy, Share2,
  Crown, Sparkles, Target, Brain, TrendingUp,
  Wand2, Lightbulb, Clock, CheckCircle
} from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'

interface CustomDeckBuilderProps {
  className?: string
  onClose?: () => void
}

interface DeckQuestion {
  id: string
  question: string
  category: string
  difficulty: number
  tags: string[]
  selected: boolean
}

interface CustomDeck {
  id?: string
  name: string
  description: string
  type: 'mixed' | 'category_specific' | 'difficulty_focused' | 'topic_based' | 'ai_generated'
  categories: string[]
  difficultyRange: [number, number]
  tags: string[]
  questionCount: number
  questions: DeckQuestion[]
  isPublic: boolean
  createdAt?: string
  updatedAt?: string
  aiGenerated?: boolean
  learningPath?: string[]
  aiRecommendations?: string[]
}

const DECK_TYPES = [
  {
    id: 'ai_generated' as const,
    name: 'AI-Powered Deck',
    description: 'Let AI create the perfect deck for you',
    icon: <Wand2 className="h-4 w-4" />,
    premium: true
  },
  {
    id: 'mixed' as const,
    name: 'Mixed Topics',
    description: 'Questions from various civic topics',
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: 'category_specific' as const,
    name: 'Category Focused',
    description: 'Deep dive into specific categories',
    icon: <Target className="h-4 w-4" />
  },
  {
    id: 'difficulty_focused' as const,
    name: 'Difficulty Training',
    description: 'Progressive difficulty levels',
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'topic_based' as const,
    name: 'Current Events',
    description: 'Based on recent civic topics',
    icon: <Calendar className="h-4 w-4" />
  }
]

const CATEGORIES = [
  'Government', 'Elections', 'Economy', 'Foreign Policy', 'Justice',
  'Civil Rights', 'Environment', 'Local Issues', 'Constitutional Law',
  'National Security', 'Public Policy', 'Historical Precedent'
]

const DIFFICULTY_LABELS = ['', 'Recall', 'Comprehension', 'Analysis', 'Evaluation']

const LEARNING_OBJECTIVES = [
  'General improvement',
  'Prepare for citizenship test',
  'Strengthen weak areas',
  'Challenge myself with harder questions',
  'Review recent topics',
  'Focus on specific categories',
  'Quick review session',
  'Deep learning session'
]

export function CustomDeckBuilder({ className, onClose }: CustomDeckBuilderProps) {
  const { user } = useAuth()
  const { hasFeatureAccess, trackFeatureUsage, limits } = usePremium()
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  
  // Deck creation state
  const [deck, setDeck] = useState<CustomDeck>({
    name: '',
    description: '',
    type: 'ai_generated',
    categories: [],
    difficultyRange: [1, 4],
    tags: [],
    questionCount: 20,
    questions: [],
    isPublic: false,
    aiGenerated: false
  })
  
  // AI-specific state
  const [learningObjective, setLearningObjective] = useState('General improvement')
  const [timeConstraint, setTimeConstraint] = useState(30)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [aiGeneratedDeck, setAiGeneratedDeck] = useState<AIEnhancedDeck | null>(null)
  
  // Available questions and filtering
  const [availableQuestions, setAvailableQuestions] = useState<DeckQuestion[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<DeckQuestion[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
  
  // Existing decks
  const [existingDecks, setExistingDecks] = useState<CustomDeck[]>([])

  useEffect(() => {
    if (!hasFeatureAccess('custom_decks')) {
      setShowPremiumGate(true)
      return
    }
    
    loadAvailableQuestions()
    loadExistingDecks()
  }, [hasFeatureAccess])

  useEffect(() => {
    if (deck.type !== 'ai_generated') {
      filterQuestions()
    }
  }, [availableQuestions, searchQuery, filterCategory, filterDifficulty, deck.categories, deck.difficultyRange, deck.type])

  const loadAvailableQuestions = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would fetch from your questions API
      // For now, we'll use mock data
      const mockQuestions: DeckQuestion[] = [
        {
          id: '1',
          question: 'What is the primary role of the Electoral College?',
          category: 'Elections',
          difficulty: 2,
          tags: ['electoral-college', 'voting', 'constitution'],
          selected: false
        },
        {
          id: '2',
          question: 'Which amendment guarantees freedom of speech?',
          category: 'Constitutional Law',
          difficulty: 1,
          tags: ['first-amendment', 'free-speech', 'bill-of-rights'],
          selected: false
        },
        {
          id: '3',
          question: 'Analyze the impact of gerrymandering on democratic representation.',
          category: 'Elections',
          difficulty: 4,
          tags: ['gerrymandering', 'representation', 'democracy'],
          selected: false
        },
        // Add more mock questions...
      ]
      
      setAvailableQuestions(mockQuestions)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExistingDecks = async () => {
    try {
      // In a real implementation, this would fetch user's existing decks
      const mockDecks: CustomDeck[] = [
        {
          id: '1',
          name: 'Constitutional Fundamentals',
          description: 'Core constitutional principles and amendments',
          type: 'category_specific',
          categories: ['Constitutional Law'],
          difficultyRange: [1, 3],
          tags: ['constitution', 'amendments', 'fundamentals'],
          questionCount: 15,
          questions: [],
          isPublic: false,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20'
        }
      ]
      
      setExistingDecks(mockDecks)
    } catch (error) {
      console.error('Error loading existing decks:', error)
    }
  }

  const handleGenerateAIDeck = async () => {
    if (!user) return

    setIsGeneratingAI(true)
    try {
      const deckRequest = {
        name: deck.name || 'AI-Generated Deck',
        description: deck.description,
        targetQuestionCount: deck.questionCount,
        categories: deck.categories.length > 0 ? deck.categories : undefined,
        difficultyRange: deck.difficultyRange,
        learningObjective,
        timeConstraint,
        focusAreas
      }

      const aiDeck = await aiDeckBuilder.generateAIEnhancedDeck(user.id, deckRequest)
      setAiGeneratedDeck(aiDeck)
      
      // Update the deck with AI-generated content
      setDeck(prev => ({
        ...prev,
        name: aiDeck.name,
        description: aiDeck.description,
        questions: aiDeck.questions.map(q => ({ ...q, selected: true })),
        aiGenerated: true,
        learningPath: aiDeck.learningPath,
        aiRecommendations: aiDeck.aiRecommendations
      }))

      // Track feature usage
      trackFeatureUsage('custom_decks')
    } catch (error) {
      console.error('Error generating AI deck:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const filterQuestions = () => {
    let filtered = availableQuestions

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(q => q.category === filterCategory)
    }

    // Apply difficulty filter
    if (filterDifficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === parseInt(filterDifficulty))
    }

    // Apply deck category filter
    if (deck.categories.length > 0) {
      filtered = filtered.filter(q => deck.categories.includes(q.category))
    }

    // Apply difficulty range filter
    filtered = filtered.filter(q => 
      q.difficulty >= deck.difficultyRange[0] && 
      q.difficulty <= deck.difficultyRange[1]
    )

    setFilteredQuestions(filtered)
  }

  const handleSaveDeck = async () => {
    if (!hasFeatureAccess('custom_decks')) {
      setShowPremiumGate(true)
      return
    }

    // Check limits
    if (limits && limits.custom_decks_limit !== null && limits.custom_decks_limit !== -1 && existingDecks.length >= limits.custom_decks_limit) {
      // Show upgrade prompt
      setShowPremiumGate(true)
      return
    }

    setIsSaving(true)
    try {
      // Track feature usage
      await trackFeatureUsage('custom_decks')
      
      // In a real implementation, this would save to your API
      console.log('Saving deck:', deck)
      
      // Reset form
      setDeck({
        name: '',
        description: '',
        type: 'mixed',
        categories: [],
        difficultyRange: [1, 4],
        tags: [],
        questionCount: 20,
        questions: [],
        isPublic: false
      })
      
      // Reload existing decks
      await loadExistingDecks()
      
      // Switch to manage tab
      setActiveTab("manage")
      
    } catch (error) {
      console.error('Error saving deck:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDeck = async (deckId: string) => {
    try {
      // In a real implementation, this would delete from your API
      setExistingDecks(prev => prev.filter(d => d.id !== deckId))
    } catch (error) {
      console.error('Error deleting deck:', error)
    }
  }

  const handleQuestionToggle = (questionId: string) => {
    setAvailableQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, selected: !q.selected }
          : q
      )
    )
    
    // Update deck questions
    setDeck(prev => {
      const question = availableQuestions.find(q => q.id === questionId)
      if (!question) return prev
      
      const isCurrentlySelected = prev.questions.some(q => q.id === questionId)
      
      if (isCurrentlySelected) {
        // Remove question
        return {
          ...prev,
          questions: prev.questions.filter(q => q.id !== questionId)
        }
      } else {
        // Add question
        return {
          ...prev,
          questions: [...prev.questions, { ...question, selected: true }]
        }
      }
    })
  }

  if (!hasFeatureAccess('custom_decks')) {
    return (
      <>
        <Card className={cn("border-dashed border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/10 dark:to-amber-950/10", className)}>
          <CardContent className="p-8 text-center">
            <Crown className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-6">
              Create unlimited custom learning decks with Premium or Pro subscription.
            </p>
            <Button 
              onClick={() => setShowPremiumGate(true)}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
        
        <PremiumGate
          feature="custom_decks"
          isOpen={showPremiumGate}
          onClose={() => setShowPremiumGate(false)}
          title="Custom Learning Decks"
          description="Create personalized study collections tailored to your learning goals"
        />
      </>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span>Custom Deck Builder</span>
            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </h2>
          <p className="text-muted-foreground">
            Create personalized study collections from our question library
          </p>
        </div>
        
        {limits && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              Decks: {existingDecks.length} / {(limits?.custom_decks_limit === -1 || limits?.custom_decks_limit === null) ? '∞' : limits?.custom_decks_limit || 0}
            </p>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Deck</TabsTrigger>
          <TabsTrigger value="questions">Select Questions</TabsTrigger>
          <TabsTrigger value="manage">Manage Decks</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deck Configuration</CardTitle>
              <CardDescription>
                Set up your custom learning deck with specific parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deck-name">Deck Name</Label>
                  <Input
                    id="deck-name"
                    value={deck.name}
                    onChange={(e) => setDeck(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Constitutional Law Basics"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deck-type">Deck Type</Label>
                  <Select 
                    value={deck.type} 
                    onValueChange={(value: CustomDeck['type']) => setDeck(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DECK_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center space-x-2">
                            {type.icon}
                            <div>
                              <div className="font-medium">{type.name}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deck-description">Description</Label>
                <Textarea
                  id="deck-description"
                  value={deck.description}
                  onChange={(e) => setDeck(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this deck covers and its learning objectives..."
                  rows={3}
                />
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label>Categories</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CATEGORIES.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={deck.categories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setDeck(prev => ({ ...prev, categories: [...prev.categories, category] }))
                          } else {
                            setDeck(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }))
                          }
                        }}
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Range */}
              <div className="space-y-3">
                <Label>Difficulty Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-difficulty" className="text-sm">Minimum</Label>
                    <Select 
                      value={deck.difficultyRange[0].toString()} 
                      onValueChange={(value) => setDeck(prev => ({ 
                        ...prev, 
                        difficultyRange: [parseInt(value), prev.difficultyRange[1]] 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(level => (
                          <SelectItem key={level} value={level.toString()}>
                            {DIFFICULTY_LABELS[level]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="max-difficulty" className="text-sm">Maximum</Label>
                    <Select 
                      value={deck.difficultyRange[1].toString()} 
                      onValueChange={(value) => setDeck(prev => ({ 
                        ...prev, 
                        difficultyRange: [prev.difficultyRange[0], parseInt(value)] 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(level => (
                          <SelectItem key={level} value={level.toString()}>
                            {DIFFICULTY_LABELS[level]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public-deck"
                  checked={deck.isPublic}
                  onCheckedChange={(checked) => setDeck(prev => ({ ...prev, isPublic: !!checked }))}
                />
                <Label htmlFor="public-deck">
                  Make this deck public for other users to discover
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {/* Question Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Question Selection</span>
                <Badge variant="outline">
                  {deck.questions.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Questions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by content or tags..."
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Filter by Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Filter by Difficulty</Label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      {[1, 2, 3, 4].map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          {DIFFICULTY_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading questions...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No questions found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms to find more questions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredQuestions.map(question => (
                <Card 
                  key={question.id} 
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    question.selected 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                      : "hover:border-gray-300"
                  )}
                  onClick={() => handleQuestionToggle(question.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={question.selected}
                        onChange={() => handleQuestionToggle(question.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">{question.question}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <Badge variant="outline">{question.category}</Badge>
                          <span>{DIFFICULTY_LABELS[question.difficulty]}</span>
                          <div className="flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span>{question.tags.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Custom Decks</h3>
            <Button onClick={() => setActiveTab("create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Deck
            </Button>
          </div>

          {existingDecks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No custom decks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first custom deck to get started with personalized learning.
                </p>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Deck
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingDecks.map(existingDeck => (
                <Card key={existingDeck.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{existingDeck.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {existingDeck.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {existingDeck.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{existingDeck.questionCount} questions</span>
                      <span>Updated {existingDeck.updatedAt}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {existingDeck.categories.slice(0, 3).map(category => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {existingDeck.categories.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{existingDeck.categories.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3 mr-1" />
                        Clone
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => existingDeck.id && handleDeleteDeck(existingDeck.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {activeTab === "create" && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {deck.questions.length} questions selected
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDeck}
              disabled={!deck.name || deck.questions.length === 0 || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Deck"}
            </Button>
          </div>
        </div>
      )}

      <PremiumGate
        feature="custom_decks"
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        title="Custom Learning Decks"
        description="Create unlimited personalized study collections"
      />
    </div>
  )
} 