"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  generateQuizThumbnail, 
  generateQuizResultImage, 
  generateInstagramStory,
  generateImageSet,
  downloadImage,
  IMAGE_TEMPLATES,
  IMAGE_PRESETS,
  type ImageGenerationParams,
  BRAND_COLORS,
  VISUAL_VARIANTS,
  CUSTOM_THEMES,
  generateImageUrl,
  prepareVideoParams,
  generateVideoUrl,
  abTestManager,
  type PerformanceMetrics
} from "@/lib/image-generator"
import { EnhancedSocialShare, SocialShareWithPreview, QuickShareButtons } from "@/components/enhanced-social-share"
import { useToast } from "@/hooks/use-toast"
import { Download, RefreshCw, Share2, Image as ImageIcon, AlertCircle, Eye, TrendingUp, Zap, BarChart3, Users, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth/auth-provider"

// Move testQuizzes outside component to prevent recreation
const testQuizzes = [
  {
    title: "Constitutional Rights Quiz",
    description: "Test your knowledge of fundamental constitutional protections",
    emoji: "📜",
    category: "Constitution",
    type: "quiz" as const,
    score: undefined as number | undefined,
    totalQuestions: undefined as number | undefined,
    badge: undefined as string | undefined
  },
  {
    title: "Voting Rights Assessment",
    description: "Understanding the evolution of voting rights in America",
    emoji: "🗳️",
    category: "Elections",
    type: "result" as const,
    score: 85 as number | undefined,
    totalQuestions: 20 as number | undefined,
    badge: undefined as string | undefined
  },
  {
    title: "Local Government Powers",
    description: "How municipal and county governments affect your daily life",
    emoji: "🏢",
    category: "Local Politics",
    type: "topic" as const,
    score: undefined as number | undefined,
    totalQuestions: undefined as number | undefined,
    badge: undefined as string | undefined
  },
  {
    title: "Civic Engagement Master",
    description: "You've completed 10 quizzes and understand how power really works!",
    emoji: "🏆",
    category: "Achievement",
    type: "achievement" as const,
    score: undefined as number | undefined,
    totalQuestions: undefined as number | undefined,
    badge: "Power Dynamics Expert" as string | undefined
  }
]

export default function TestDynamicImages() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [selectedTab, setSelectedTab] = useState('showcase')
  const [performanceMetrics, setPerformanceMetrics] = useState<Partial<PerformanceMetrics>>({})
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  const loadAnalytics = useCallback(async () => {
    if (!user) return
    
    setIsLoadingAnalytics(true)
    try {
      const response = await fetch('/api/image-analytics?timeframe=7d')
      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData(data.data)
      }
    } catch (error) {
      console.warn('Failed to load analytics:', error)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }, [user])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const handleAnalyticsUpdate = useCallback((metrics: Partial<PerformanceMetrics>) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      templateUsage: {
        ...prev.templateUsage,
        ...metrics.templateUsage
      },
      variantPerformance: {
        ...prev.variantPerformance,
        ...metrics.variantPerformance
      },
      themePopularity: {
        ...prev.themePopularity,
        ...metrics.themePopularity
      }
    }))
  }, [])

  const testABFramework = useCallback(() => {
    const userId = user?.id || 'demo_user'
    const variant = abTestManager.getVariantForUser('visual-variant-test', userId)
    const theme = abTestManager.getVariantForUser('theme-messaging-test', userId)
    
    toast({
      title: "A/B Test Assignment",
      description: `Assigned to variant: ${variant}, theme: ${theme}`,
      duration: 3000
    })
  }, [user?.id, toast])

  // Memoize theme preview images to prevent re-generation
  const themePreviewImages = useMemo(() => {
    return Object.entries(CUSTOM_THEMES).map(([key, theme]) => ({
      key,
      theme,
      imageUrl: generateImageUrl({
        template: 'quiz-thumbnail',
        title: 'Sample Quiz',
        description: 'Theme preview',
        emoji: theme.icon,
        theme: key as keyof typeof CUSTOM_THEMES,
        variant: 'bold'
      })
    }))
  }, [])

  // Memoize variant preview images to prevent re-generation
  const variantPreviewImages = useMemo(() => {
    return Object.entries(VISUAL_VARIANTS).map(([key, variant]) => ({
      key,
      variant,
      imageUrl: generateImageUrl({
        template: 'quiz-thumbnail',
        title: 'Congressional Power Quiz',
        description: 'How Congress really exercises power',
        emoji: '🏛️',
        variant: key as keyof typeof VISUAL_VARIANTS,
        theme: 'default'
      })
    }))
  }, [])

  // Memoize video preview data to prevent re-generation  
  const videoPreviewData = useMemo(() => {
    return testQuizzes.slice(0, 2).map((quiz, index) => ({
      quiz,
      videoParams: prepareVideoParams({
        template: 'quiz-thumbnail',
        title: quiz.title,
        description: quiz.description,
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        emoji: quiz.emoji,
        type: quiz.type
      })
    }))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-authority-blue-900">
            🏛️ CivicSense Dynamic Image Generator
          </h1>
          <p className="text-lg text-evidence-gray-700 max-w-3xl mx-auto">
            Advanced image generation system with A/B testing, user customization, 
            performance monitoring, and exact brand compliance for civic education content.
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="outline" className="bg-white">
              <Zap className="w-3 h-3 mr-1" />
              Real-time Analytics
            </Badge>
            <Badge variant="outline" className="bg-white">
              <TrendingUp className="w-3 h-3 mr-1" />
              A/B Testing
            </Badge>
            <Badge variant="outline" className="bg-white">
              <Globe className="w-3 h-3 mr-1" />
              Multi-platform
            </Badge>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="showcase">Component Showcase</TabsTrigger>
            <TabsTrigger value="themes">Theme Gallery</TabsTrigger>
            <TabsTrigger value="variants">Visual Variants</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
            <TabsTrigger value="video">Video Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="showcase" className="space-y-6">
            <div className="grid gap-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Enhanced Social Share Components
                  </CardTitle>
                  <CardDescription>
                    Interactive sharing with A/B testing, customization, and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {testQuizzes.map((quiz, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{quiz.title}</h3>
                          <p className="text-gray-600 text-sm">{quiz.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{quiz.category}</Badge>
                            <Badge variant="outline">{quiz.type}</Badge>
                            {quiz.score && (
                              <Badge variant="default">{quiz.score}% Score</Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-2xl">{quiz.emoji}</span>
                      </div>
                      
                      <EnhancedSocialShare
                        title={quiz.title}
                        description={quiz.description}
                        score={quiz.score}
                        totalQuestions={quiz.totalQuestions}
                        emoji={quiz.emoji}
                        category={quiz.category}
                        type={quiz.type}
                        badge={quiz.badge}
                        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                        enableABTesting={true}
                        allowCustomization={true}
                        trackEngagement={true}
                        onAnalyticsUpdate={handleAnalyticsUpdate}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Share with Live Preview</CardTitle>
                  <CardDescription>
                    Immediate visual feedback with customization options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SocialShareWithPreview
                    title="Understanding Congressional Power"
                    description="Learn how Congress actually exercises power vs. what the textbooks teach"
                    type="quiz"
                    emoji="🏛️"
                    template="quiz-thumbnail"
                    enableABTesting={true}
                    allowCustomization={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Share Buttons</CardTitle>
                  <CardDescription>
                    Compact sharing for space-constrained layouts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Quiz Result Example</h4>
                    <QuickShareButtons
                      title="Voting Rights Knowledge Test"
                      type="result"
                      score={92}
                      totalQuestions={15}
                      userId={user?.id}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Quiz Topic Example</h4>
                    <QuickShareButtons
                      title="How Your City Council Really Works"
                      type="quiz"
                      userId={user?.id}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    A/B Testing Framework
                  </CardTitle>
                  <CardDescription>
                    Test different visual approaches and messaging strategies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={testABFramework} variant="outline">
                    Test A/B Assignment Algorithm
                  </Button>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-sm">Visual Variant Test</div>
                      <div className="text-xs text-gray-600">Bold: 40% | Subtle: 30% | Urgent: 30%</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-sm">Theme Messaging Test</div>
                      <div className="text-xs text-gray-600">Default: 50% | Educator: 25% | Activist: 25%</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-sm">User Assignment</div>
                      <div className="text-xs text-gray-600">Consistent hash-based distribution</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="themes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Customization Themes</CardTitle>
                <CardDescription>
                  Tailored messaging and design for different audiences
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themePreviewImages.map(({ key, theme, imageUrl }) => (
                  <div key={key} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{theme.icon}</span>
                      <div>
                        <h3 className="font-semibold capitalize">{key}</h3>
                        <p className="text-sm text-gray-600">{theme.audience}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Focus:</span> {theme.focusArea}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Message:</span> "{theme.messaging}"
                      </div>
                      <div 
                        className="w-full h-3 rounded"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                    </div>
                    
                    <div className="aspect-[2/1] bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={imageUrl}
                        alt={`${key} theme preview`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visual Style Variants</CardTitle>
                <CardDescription>
                  A/B test different visual approaches for maximum engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {variantPreviewImages.map(({ key, variant, imageUrl }) => (
                  <div key={key} className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg capitalize">{key}</h3>
                      <p className="text-sm text-gray-600">{variant.description}</p>
                      <div className="flex justify-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Emphasis: {variant.emphasis}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Weight: {variant.fontWeight}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="aspect-[4/3] bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={imageUrl}
                        alt={`${key} variant preview`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div>Color Intensity: {variant.colorIntensity}x</div>
                      <div>Contrast Boost: {variant.contrastBoost}x</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Real-time Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Live tracking of image generation and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-authority-blue-600"></div>
                    </div>
                  ) : analyticsData ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analyticsData.summary.totalGenerations}
                        </div>
                        <div className="text-sm text-gray-600">Total Generations</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analyticsData.summary.averageGenerationTime.toFixed(0)}ms
                        </div>
                        <div className="text-sm text-gray-600">Avg Generation Time</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {analyticsData.summary.errorRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Error Rate</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {Object.keys(analyticsData.metrics.templateUsage).length}
                        </div>
                        <div className="text-sm text-gray-600">Active Templates</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Analytics data not available (requires admin access)
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Template Usage Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(IMAGE_TEMPLATES).map(([template, config]) => {
                                             const usage = analyticsData?.metrics.templateUsage[template] || 0
                       const templateUsageValues = Object.values(analyticsData?.metrics.templateUsage || {}) as number[]
                       const maxUsage = templateUsageValues.length > 0 ? Math.max(...templateUsageValues) : 0
                       const percentage = maxUsage > 0 ? (usage / maxUsage) * 100 : 0
                      
                      return (
                        <div key={template} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize">
                              {template.replace('-', ' ')} ({config.platform})
                            </span>
                            <span className="text-gray-600">{usage} uses</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {Object.keys(performanceMetrics).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Session Performance Tracking</CardTitle>
                    <CardDescription>
                      Real-time metrics from your current session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {performanceMetrics.templateUsage && Object.entries(performanceMetrics.templateUsage).map(([template, count]) => (
                        <div key={template} className="text-center p-3 bg-gray-50 rounded">
                          <div className="font-semibold">{count}</div>
                          <div className="text-xs text-gray-600 capitalize">
                            {template.replace('-', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Video Generation Preview (Future)
                </CardTitle>
                <CardDescription>
                  Prepared architecture for video content generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videoPreviewData.map(({ quiz, videoParams }, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold">{quiz.title}</h3>
                        <p className="text-sm text-gray-600">{quiz.description}</p>
                      </div>
                      
                      <div className="aspect-video bg-gradient-to-br from-authority-blue-100 to-authority-blue-200 rounded-lg flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <span className="text-4xl">{quiz.emoji}</span>
                          <div className="text-sm font-medium text-authority-blue-800">
                            Video Preview Coming Soon
                          </div>
                          <div className="text-xs text-authority-blue-600">
                            {videoParams.duration}s • {videoParams.style}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-1 text-gray-600">
                        <div>Template: {videoParams.template}</div>
                        <div>Style: {videoParams.style}</div>
                        <div>Duration: {videoParams.duration} seconds</div>
                        <div>Features: {[
                          videoParams.music && 'Music',
                          videoParams.captions && 'Captions',
                          videoParams.voiceover && 'Voiceover'
                        ].filter(Boolean).join(', ')}</div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          const videoUrl = generateVideoUrl(videoParams)
                          toast({
                            title: "Video Generation Ready",
                            description: "API endpoint prepared for future implementation",
                            duration: 3000
                          })
                        }}
                      >
                        Generate Video (Demo)
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-800">Video Generation Architecture</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    The video generation system is architecturally prepared with consistent parameter 
                    structures, template mapping, and API endpoints. Implementation can be added 
                    seamlessly using the existing image generation patterns.
                  </p>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            🏛️ CivicSense Dynamic Image Generator - Civic education that politicians don't want you to have
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <span>Analytics Integrated</span>
            <span>A/B Testing Ready</span>
            <span>Brand Compliant</span>
            <span>Performance Monitored</span>
          </div>
        </div>

      </div>
    </div>
  )
} 