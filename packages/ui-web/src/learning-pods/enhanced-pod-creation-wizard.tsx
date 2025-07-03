"use client"

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Sparkles,
  ArrowRight, 
  ArrowLeft,
  Palette,
  Smile,
  Crown,
  Target,
  Users,
  Globe,
  Zap,
  Heart,
  Star,
  Trophy,
  Calendar,
  Shield,
  BookOpen,
  MessageSquare,
  CheckCircle,
  Wand2,
  Rocket,
  PartyPopper,
  Lightbulb,
  Accessibility,
  Languages
} from 'lucide-react'
import { cn } from '../../utils'
import { useToast } from "../components/ui/use-toast"

interface PodTheme {
  id: string
  name: string
  display_name: string
  emoji: string
  primary_color: string
  secondary_color?: string
  description: string
  unlock_condition?: string
  is_seasonal: boolean
}

interface CreateFormData {
  // Basic Info
  podName: string
  podType: string
  customTypeLabel: string
  familyName: string
  description: string
  
  // Personality & Vibe
  personalityType: 'competitive' | 'collaborative' | 'exploratory' | 'structured'
  focusAreas: string[]
  engagementLevel: 'casual' | 'moderate' | 'intensive'
  
  // Customization
  podEmoji: string
  podColor: string
  themeId?: string
  podSlug: string
  podMotto: string
  accessibilityMode: 'standard' | 'high_contrast' | 'sensory_friendly'
  
  // Features & Safety
  contentFilterLevel: 'none' | 'light' | 'moderate' | 'strict'
  canAccessMultiplayer: boolean
  canAccessChat: boolean
  canShareProgress: boolean
  requireParentApproval: boolean
  
  // Partnership
  partnershipStatus: 'open' | 'closed' | 'invite_only'
}

interface EnhancedPodCreationWizardProps {
  onComplete: (formData: CreateFormData) => void
  onCancel: () => void
}

export function EnhancedPodCreationWizard({ onComplete, onCancel }: EnhancedPodCreationWizardProps) {
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [availableThemes, setAvailableThemes] = useState<PodTheme[]>([])
  
  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const [formData, setFormData] = useState<CreateFormData>({
    podName: '',
    podType: 'family',
    customTypeLabel: '',
    familyName: '',
    description: '',
    personalityType: 'collaborative',
    focusAreas: [],
    engagementLevel: 'moderate',
    podEmoji: '👥',
    podColor: '#3b82f6',
    podSlug: '',
    podMotto: '',
    accessibilityMode: 'standard',
    contentFilterLevel: 'moderate',
    canAccessMultiplayer: true,
    canAccessChat: false,
    canShareProgress: true,
    requireParentApproval: true,
    partnershipStatus: 'open'
  })

  // Load available themes
  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    try {
      // Mock themes for demo - in real app, fetch from API
      const mockThemes: PodTheme[] = [
        {
          id: 'constitution',
          name: 'constitution',
          display_name: 'Constitutional Scholar',
          emoji: '📜',
          primary_color: '#8B4513',
          secondary_color: '#F4E4BC',
          description: 'Classic theme inspired by founding documents',
          is_seasonal: false
        },
        {
          id: 'democracy',
          name: 'democracy',
          display_name: 'Democratic Spirit',
          emoji: '🗳️',
          primary_color: '#1E40AF',
          secondary_color: '#DBEAFE',
          description: 'Modern democracy and voting theme',
          is_seasonal: false
        },
        {
          id: 'justice',
          name: 'justice',
          display_name: 'Justice League',
          emoji: '⚖️',
          primary_color: '#7C2D12',
          secondary_color: '#FED7AA',
          description: 'Justice and law theme',
          is_seasonal: false
        },
        {
          id: 'halloween_democracy',
          name: 'halloween_democracy',
          display_name: 'Spooky Civics',
          emoji: '🎃',
          primary_color: '#EA580C',
          secondary_color: '#000000',
          description: 'Halloween-themed democracy education',
          is_seasonal: true
        }
      ]
      setAvailableThemes(mockThemes)
    } catch (error) {
      console.error('Error loading themes:', error)
    }
  }

  const updateFormData = (updates: Partial<CreateFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const getPodTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'family': '👨‍👩‍👧‍👦',
      'friends': '👥',
      'classroom': '🏫',
      'study_group': '📚',
      'campaign': '🗳️',
      'organization': '🏢',
      'book_club': '📖',
      'debate_team': '⚖️'
    }
    return iconMap[type] || '👥'
  }

  const getPersonalityIcon = (personality: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'competitive': <Trophy className="h-5 w-5 text-yellow-600" />,
      'collaborative': <Heart className="h-5 w-5 text-pink-600" />,
      'exploratory': <Lightbulb className="h-5 w-5 text-blue-600" />,
      'structured': <BookOpen className="h-5 w-5 text-green-600" />
    }
    return iconMap[personality] || <Users className="h-5 w-5" />
  }

  const focusAreaOptions = [
    { value: 'local_politics', label: 'Local Politics', emoji: '🏛️' },
    { value: 'federal_government', label: 'Federal Government', emoji: '🏢' },
    { value: 'voting_rights', label: 'Voting Rights', emoji: '🗳️' },
    { value: 'constitutional_law', label: 'Constitutional Law', emoji: '📜' },
    { value: 'civic_action', label: 'Civic Action', emoji: '✊' },
    { value: 'civil_rights', label: 'Civil Rights', emoji: '⚖️' },
    { value: 'current_events', label: 'Current Events', emoji: '📰' },
    { value: 'economics', label: 'Economics', emoji: '💰' }
  ]

  const emojiOptions = [
    '👥', '👨‍👩‍👧‍👦', '🏫', '📚', '🗳️', '🏢', '📖', '⚖️', 
    '🌟', '🚀', '🎯', '💎', '🔥', '⚡', '🌈', '🎨',
    '🏛️', '📜', '✊', '🎓', '💪', '🎪', '🎭', '🎊'
  ]

  const colorOptions = [
    { name: 'Ocean Blue', value: '#3b82f6', description: 'Calm and trustworthy' },
    { name: 'Forest Green', value: '#059669', description: 'Natural and growing' },
    { name: 'Royal Purple', value: '#7c3aed', description: 'Creative and wise' },
    { name: 'Sunset Orange', value: '#ea580c', description: 'Energetic and warm' },
    { name: 'Ruby Red', value: '#dc2626', description: 'Passionate and bold' },
    { name: 'Golden Yellow', value: '#d97706', description: 'Optimistic and bright' },
    { name: 'Slate Gray', value: '#475569', description: 'Professional and steady' },
    { name: 'Rose Pink', value: '#e11d48', description: 'Caring and inclusive' }
  ]

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Generate slug if not provided
      if (!formData.podSlug) {
        const slug = formData.podName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        updateFormData({ podSlug: slug })
      }
      
      await onComplete(formData)
      toast({
        title: "🎉 Pod created successfully!",
        description: `Welcome to ${formData.podName}! Your learning journey begins now.`,
      })
    } catch (error) {
      toast({
        title: "Error creating pod",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                What's your pod's vibe?
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Choose the personality that best represents your learning style
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  type: 'collaborative', 
                  title: 'Collaborative', 
                  description: 'We learn together, support each other',
                  icon: <Heart className="h-6 w-6" />,
                  color: 'from-pink-500 to-rose-500'
                },
                { 
                  type: 'competitive', 
                  title: 'Competitive', 
                  description: 'Friendly challenges motivate us',
                  icon: <Trophy className="h-6 w-6" />,
                  color: 'from-yellow-500 to-orange-500'
                },
                { 
                  type: 'exploratory', 
                  title: 'Exploratory', 
                  description: 'We love discovering new ideas',
                  icon: <Lightbulb className="h-6 w-6" />,
                  color: 'from-blue-500 to-cyan-500'
                },
                { 
                  type: 'structured', 
                  title: 'Structured', 
                  description: 'We prefer organized, step-by-step learning',
                  icon: <BookOpen className="h-6 w-6" />,
                  color: 'from-green-500 to-emerald-500'
                }
              ].map((personality) => (
                <Card
                  key={personality.type}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                    formData.personalityType === personality.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  )}
                  onClick={() => updateFormData({ personalityType: personality.type as any })}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto text-white",
                      personality.color
                    )}>
                      {personality.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {personality.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {personality.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                <Palette className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                Pick your power color!
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Choose a color that reflects your pod's energy and personality
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colorOptions.map((color) => (
                <Card
                  key={color.value}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                    formData.podColor === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                  onClick={() => updateFormData({ podColor: color.value })}
                >
                  <CardContent className="p-4 text-center space-y-3">
                    <div 
                      className="w-12 h-12 rounded-full mx-auto border-2 border-white shadow-md"
                      style={{ backgroundColor: color.value }}
                    />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                        {color.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {color.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Custom color picker */}
            <div className="space-y-3">
              <Label>Or choose a custom color:</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.podColor}
                  onChange={(e) => updateFormData({ podColor: e.target.value })}
                  className="w-16 h-12 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  value={formData.podColor}
                  onChange={(e) => updateFormData({ podColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
                <Smile className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                What represents you?
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Pick an emoji that captures your pod's spirit
              </p>
            </div>

            <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => updateFormData({ podEmoji: emoji })}
                  className={cn(
                    "w-12 h-12 rounded-lg border-2 text-2xl hover:scale-110 transition-all duration-200",
                    formData.podEmoji === emoji
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-110'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Theme selection */}
            <div className="space-y-4">
              <Label>Or choose a themed style:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableThemes.filter(theme => !theme.is_seasonal).map((theme) => (
                  <Card
                    key={theme.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                      formData.themeId === theme.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700'
                    )}
                    onClick={() => {
                      updateFormData({ 
                        themeId: theme.id,
                        podEmoji: theme.emoji,
                        podColor: theme.primary_color
                      })
                    }}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: theme.primary_color + '20' }}
                      >
                        {theme.emoji}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {theme.display_name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {theme.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                Create your rally cry!
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Add the basic details that make your pod unique
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Pod Name *</Label>
                <Input
                  value={formData.podName}
                  onChange={(e) => updateFormData({ podName: e.target.value })}
                  placeholder="Smith Family Learning Pod"
                  className="text-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Inspiring Motto</Label>
                <Input
                  value={formData.podMotto}
                  onChange={(e) => updateFormData({ podMotto: e.target.value })}
                  placeholder="Learning together, growing stronger"
                  className="h-12"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  A short phrase that captures your pod's mission
                </p>
              </div>

              <div className="space-y-2">
                <Label>Pod Type</Label>
                <Select 
                  value={formData.podType} 
                  onValueChange={(value) => updateFormData({ podType: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
                    <SelectItem value="friends">👥 Friends</SelectItem>
                    <SelectItem value="classroom">🏫 Classroom</SelectItem>
                    <SelectItem value="study_group">📚 Study Group</SelectItem>
                    <SelectItem value="campaign">🗳️ Political Campaign</SelectItem>
                    <SelectItem value="organization">🏢 Organization</SelectItem>
                    <SelectItem value="book_club">📖 Book Club</SelectItem>
                    <SelectItem value="debate_team">⚖️ Debate Team</SelectItem>
                    <SelectItem value="custom">✨ Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.podType === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom Type Label *</Label>
                  <Input
                    value={formData.customTypeLabel}
                    onChange={(e) => updateFormData({ customTypeLabel: e.target.value })}
                    placeholder="Community Action Group"
                    className="h-12"
                  />
                </div>
              )}

              {formData.podType === 'family' && (
                <div className="space-y-2">
                  <Label>Family Name</Label>
                  <Input
                    value={formData.familyName}
                    onChange={(e) => updateFormData({ familyName: e.target.value })}
                    placeholder="The Smith Family"
                    className="h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Describe what makes your pod special..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                Claim your space!
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Set up sharing, safety, and accessibility preferences
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Custom URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    civicsense.com/pods/
                  </span>
                  <Input
                    value={formData.podSlug}
                    onChange={(e) => updateFormData({ podSlug: e.target.value })}
                    placeholder="smith-family-learners"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Leave blank to auto-generate from pod name
                </p>
              </div>

              <div className="space-y-4">
                <Label>Safety & Content</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Content Filter Level</Label>
                    <Select 
                      value={formData.contentFilterLevel} 
                      onValueChange={(value) => updateFormData({ contentFilterLevel: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🔓 None - All content available</SelectItem>
                        <SelectItem value="light">🟡 Light - Basic filtering</SelectItem>
                        <SelectItem value="moderate">🔵 Moderate - Balanced protection</SelectItem>
                        <SelectItem value="strict">🟢 Strict - Maximum protection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Accessibility Options</Label>
                <Select 
                  value={formData.accessibilityMode} 
                  onValueChange={(value) => updateFormData({ accessibilityMode: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">🌟 Standard - Default experience</SelectItem>
                    <SelectItem value="high_contrast">👀 High Contrast - Enhanced visibility</SelectItem>
                    <SelectItem value="sensory_friendly">🧘 Sensory Friendly - Reduced stimulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Social Features</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Multiplayer Quizzes</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Play interactive quizzes together
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.canAccessMultiplayer}
                      onChange={(e) => updateFormData({ canAccessMultiplayer: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Chat Features</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enable member messaging
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.canAccessChat}
                      onChange={(e) => updateFormData({ canAccessChat: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Progress Sharing</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Share achievements and milestones
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.canShareProgress}
                      onChange={(e) => updateFormData({ canShareProgress: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                Ready to launch! 🚀
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Review your amazing pod before we bring it to life
              </p>
            </div>

            {/* Live Preview */}
            <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Pod Header Preview */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: formData.podColor + '20' }}
                    >
                      {formData.podEmoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-slate-900 dark:text-white">
                        {formData.podName || 'Your Pod Name'}
                      </h3>
                      {formData.podMotto && (
                        <p className="text-slate-500 dark:text-slate-400 italic">
                          "{formData.podMotto}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge style={{ backgroundColor: formData.podColor, color: 'white' }}>
                          {getPodTypeIcon(formData.podType)} {formData.podType}
                        </Badge>
                        <Badge variant="outline">
                          {getPersonalityIcon(formData.personalityType)}
                          {formData.personalityType}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Features Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <Users className="h-5 w-5 mx-auto text-slate-600 dark:text-slate-400" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Collaborative</p>
                    </div>
                    <div className="space-y-1">
                      <Shield className="h-5 w-5 mx-auto text-slate-600 dark:text-slate-400" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {formData.contentFilterLevel} Filter
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Zap className="h-5 w-5 mx-auto text-slate-600 dark:text-slate-400" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formData.canAccessMultiplayer ? 'Multiplayer' : 'Solo Learning'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Accessibility className="h-5 w-5 mx-auto text-slate-600 dark:text-slate-400" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {formData.accessibilityMode.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {formData.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                      {formData.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 space-y-4">
              <h4 className="font-medium text-slate-900 dark:text-white">What happens next?</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Your pod will be created with all your customizations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  You'll get a unique join code to invite members
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Start earning achievements as you learn together
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Unlock new themes and features through engagement
                </li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-light text-slate-900 dark:text-white">
            Create Your Learning Pod
          </h1>
          <Badge variant="outline" className="px-3 py-1">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-8">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index + 1 <= currentStep 
                  ? 'bg-blue-600' 
                  : 'bg-slate-300 dark:bg-slate-600'
              )}
            />
          ))}
        </div>

        <Button
          onClick={currentStep === totalSteps ? handleComplete : nextStep}
          disabled={isLoading || (currentStep === 4 && !formData.podName.trim())}
          className="gap-2"
        >
          {currentStep === totalSteps ? (
            <>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Launch Pod!
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 