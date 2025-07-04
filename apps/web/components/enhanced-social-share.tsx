"use client"

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { useToast } from "../../components/ui"
import { useAuth } from "../../components/ui"
import { Share2, Download, Eye, TrendingUp, Settings, Zap, Copy, X } from 'lucide-react'
import { 
  generateImageUrl, 
  generateImageSet, 
  downloadImage, 
  trackImageUsage,
  validateImageParams,
  CUSTOM_THEMES,
  VISUAL_VARIANTS,
  IMAGE_TEMPLATES,
  abTestManager,
  type ImageGenerationParams,
  type PerformanceMetrics
} from '@civicsense/business-logic/services/image'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface EnhancedSocialShareProps {
  title: string
  description?: string
  score?: number
  totalQuestions?: number
  emoji?: string
  category?: string
  type?: 'quiz' | 'result' | 'topic' | 'achievement'
  userName?: string
  badge?: string
  url?: string
  className?: string
  
  // A/B Testing & Customization
  enableABTesting?: boolean
  allowCustomization?: boolean
  defaultTheme?: keyof typeof CUSTOM_THEMES
  defaultVariant?: keyof typeof VISUAL_VARIANTS
  
  // Analytics
  trackEngagement?: boolean
  onAnalyticsUpdate?: (metrics: PerformanceMetrics) => void
}

export function EnhancedSocialShare({
  title,
  description,
  score,
  totalQuestions,
  emoji = '🏛️',
  category,
  type = 'quiz',
  userName,
  badge,
  url,
  className,
  enableABTesting = true,
  allowCustomization = true,
  defaultTheme = 'default',
  defaultVariant = 'bold',
  trackEngagement = true,
  onAnalyticsUpdate
}: EnhancedSocialShareProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  
  // User customization state
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof CUSTOM_THEMES>(defaultTheme)
  const [selectedVariant, setSelectedVariant] = useState<keyof typeof VISUAL_VARIANTS>(defaultVariant)
  const [showCustomization, setShowCustomization] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [generationMetrics, setGenerationMetrics] = useState<{
    generationTime: number
    cacheHit: boolean
    variant: string
    theme: string
  } | null>(null)
  const [darkMode, setDarkMode] = useState<'auto' | 'light' | 'dark'>('auto')

  // A/B Testing integration
  useEffect(() => {
    if (enableABTesting && user?.id) {
      const testVariant = abTestManager.getVariantForUser('visual-variant-test', user.id)
      const testTheme = abTestManager.getVariantForUser('theme-messaging-test', user.id)
      
      setSelectedVariant(testVariant as keyof typeof VISUAL_VARIANTS)
      setSelectedTheme(testTheme as keyof typeof CUSTOM_THEMES)
    }
  }, [enableABTesting, user?.id])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPopoverOpen(false)
      }
    }

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isPopoverOpen])

  // Generate stable session ID (only once per component mount)
  const sessionId = useMemo(() => 
    `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
    []
  )

  // Memoized base parameters
  const baseParams: ImageGenerationParams = useMemo(() => ({
    template: 'quiz-thumbnail',
    title,
    description,
    score,
    totalQuestions,
    emoji,
    category,
    type,
    userName,
    badge,
    variant: selectedVariant,
    theme: selectedTheme,
    userId: user?.id,
    sessionId
  }), [title, description, score, totalQuestions, emoji, category, type, userName, badge, selectedVariant, selectedTheme, user?.id, sessionId])

  // Memoized validation with auto-truncation
  const validation = useMemo(() => 
    validateImageParams(baseParams), 
    [baseParams]
  )
  const validationErrors = validation.errors
  const sanitizedParams = validation.sanitizedParams
  const isValid = validationErrors.length === 0

  // Generate optimized image set for multiple platforms
  const generateImageSet = useCallback((baseParams: Partial<ImageGenerationParams>) => {
    const templates: Array<keyof typeof IMAGE_TEMPLATES> = [
      'quiz-thumbnail', 'instagram-story', 'instagram-post', 
      'twitter-card', 'facebook-post', 'linkedin-post'
    ]
    
    const imageSet: Record<string, string> = {}
    
    templates.forEach(template => {
      const finalParams = {
        template,
        title,
        description,
        score,
        totalQuestions,
        type,
        emoji,
        userId: user?.id,
        theme: selectedTheme,
        variant: selectedVariant,
        darkMode: darkMode === 'auto' ? (template.includes('story') ? 'dark' : 'light') : darkMode,
        ...baseParams
      }
      
      imageSet[template] = generateImageUrl(finalParams)
    })
    
    return imageSet
  }, [title, description, score, totalQuestions, type, emoji, user?.id, selectedTheme, selectedVariant, darkMode])

  // Memoized image set generation using sanitized parameters
  const imageSet = useMemo(() => {
    const adjustedType = sanitizedParams.type === 'topic' || sanitizedParams.type === 'achievement' ? 'quiz' : sanitizedParams.type
    return generateImageSet({
      ...sanitizedParams,
      type: adjustedType
    })
  }, [generateImageSet, sanitizedParams])

  // --- Engagement batching to avoid excessive updates ---
  const metricsBufferRef = useRef<Partial<PerformanceMetrics>>({})
  const flushTimerRef = useRef<number | null>(null)

  const flushMetricsBuffer = useCallback(() => {
    if (!onAnalyticsUpdate) return
    const buffered = metricsBufferRef.current
    metricsBufferRef.current = {}
    onAnalyticsUpdate(buffered as PerformanceMetrics)
    flushTimerRef.current = null
  }, [onAnalyticsUpdate])

  const bufferMetricUpdate = useCallback((partial: Partial<PerformanceMetrics>) => {
    // merge into buffer
    const current = metricsBufferRef.current
    metricsBufferRef.current = {
      templateUsage: {
        ...(current.templateUsage || {}),
        ...(partial.templateUsage || {})
      },
      variantPerformance: {
        ...(current.variantPerformance || {}),
        ...(partial.variantPerformance || {})
      },
      themePopularity: {
        ...(current.themePopularity || {}),
        ...(partial.themePopularity || {})
      }
    }
    // schedule flush if not already scheduled
    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(flushMetricsBuffer, 500)
    }
  }, [flushMetricsBuffer])

  const trackEngagementEvent = useCallback((
    platform: string, 
    action: 'view' | 'click' | 'share' | 'download'
  ): void => {
    if (!trackEngagement) return
    
    // Fire-and-forget network call to avoid blocking UI / update loops
    trackImageUsage({
      template: platform,
      variant: selectedVariant,
      theme: selectedTheme,
      userId: user?.id,
      engagementType: action
    }).catch(console.warn)
    
    if (onAnalyticsUpdate) {
      bufferMetricUpdate({
        templateUsage: { [platform]: 1 },
        variantPerformance: {
          [selectedVariant]: { usage: 1, avgGenerationTime: 0, errorRate: 0 }
        },
        themePopularity: { [selectedTheme]: 1 }
      })
    }
  }, [selectedVariant, selectedTheme, user?.id, trackEngagement, onAnalyticsUpdate, bufferMetricUpdate])

  // Share to platform
  const shareToPopular = useCallback((platform: string, imageUrl: string) => {
    trackEngagementEvent(platform, 'share')
    
    const shareUrl = url || window.location.href
    const themeData = CUSTOM_THEMES[selectedTheme]
    const shareText = `${title} | ${themeData.messaging} - CivicSense`
    
    const shareUrls = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
    }
    
    const targetUrl = shareUrls[platform as keyof typeof shareUrls]
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    }
    
    const platformNames = {
      x: 'X (Twitter)',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      reddit: 'Reddit',
      email: 'Email'
    }
    
    toast({
      title: "Share initiated",
      description: `Opening ${platformNames[platform as keyof typeof platformNames] || platform} share dialog...`,
      duration: 2000
    })
    
    setIsPopoverOpen(false)
  }, [title, selectedTheme, url, trackEngagementEvent, toast])

  // Download image
  const handleDownload = useCallback(async (template: keyof typeof IMAGE_TEMPLATES) => {
    if (!isValid) {
      toast({
        title: "Cannot download",
        description: "Please fix validation errors first",
        variant: "destructive"
      })
      return
    }
    
    const startTime = Date.now()
    
    trackEngagementEvent(template, 'download')
    
    const imageUrl = generateImageUrl({ ...sanitizedParams, template, darkMode })
    const filename = `civicsense-${type}-${template}-${Date.now()}.svg`
    
    await downloadImage(imageUrl, filename, user?.id)
    
    const downloadTime = Date.now() - startTime
    setGenerationMetrics({
      generationTime: downloadTime,
      cacheHit: downloadTime < 1000, // Assume cache hit if very fast
      variant: selectedVariant,
      theme: selectedTheme
    })
    
    toast({
      title: "Download started",
      description: `${template} image downloaded successfully`,
      duration: 3000
    })
  }, [isValid, sanitizedParams, type, user?.id, selectedVariant, selectedTheme, trackEngagementEvent, toast, darkMode])

  // Copy link
  const copyLink = useCallback(async (template: keyof typeof IMAGE_TEMPLATES) => {
    try {
      const imageUrl = generateImageUrl({ ...sanitizedParams, template, darkMode })
      trackEngagementEvent(template, 'click')
      
      await navigator.clipboard.writeText(imageUrl)
      
      toast({
        title: "Link copied",
        description: "Image URL copied to clipboard",
        duration: 2000
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      })
    }
  }, [sanitizedParams, trackEngagementEvent, toast, darkMode])

  // Preview image
  const handlePreview = useCallback((template: keyof typeof IMAGE_TEMPLATES) => {
    const imageUrl = generateImageUrl({ ...sanitizedParams, template, darkMode })
    setPreviewImage(imageUrl)
    trackEngagementEvent(template, 'view')
  }, [sanitizedParams, trackEngagementEvent, darkMode])

  // Platform icons as components
  const PlatformIcon = ({ platform }: { platform: string }) => {
    const iconStyle = "w-4 h-4 mr-2"
    
    switch (platform) {
      case 'x':
        return (
          <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
          </svg>
        )
      case 'facebook':
        return (
          <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      case 'linkedin':
        return (
          <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        )
      default:
        return <Share2 className={iconStyle} />
    }
  }

  if (!isValid) {
    return (
      <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
        <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Image Generation Errors:</p>
        <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
          {validationErrors.map((error: string, index: number) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Share Button */}
      <Button 
        variant="outline" 
        className="w-full sm:w-auto bg-white dark:bg-slate-800 border-authority-blue-300 dark:border-slate-600 text-authority-blue-700 dark:text-slate-300 hover:bg-authority-blue-50 dark:hover:bg-slate-700 font-medium"
        onClick={() => setIsPopoverOpen(true)}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Your {type === 'result' ? 'Score' : 'Knowledge'}
        {selectedVariant !== 'bold' && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {selectedVariant}
          </Badge>
        )}
      </Button>

      {/* Popover Overlay */}
      {isPopoverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsPopoverOpen(false)}
          />
          
          {/* Popover Content */}
          <div 
            ref={popoverRef}
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-authority-blue-50 dark:bg-slate-700 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-authority-blue-900 dark:text-white">
                  Share to Social Media
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPopoverOpen(false)}
                  className="h-8 w-8 p-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Share Options */}
            <div className="p-4 bg-white dark:bg-slate-800">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => shareToPopular('x', imageSet['twitter-card'])}
                  className="justify-start h-auto py-3 px-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <PlatformIcon platform="x" />
                  <div className="text-left">
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">X</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">1200x675</div>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => shareToPopular('facebook', imageSet['facebook-post'])}
                  className="justify-start h-auto py-3 px-3 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <PlatformIcon platform="facebook" />
                  <div className="text-left">
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">Facebook</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">1200x630</div>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => shareToPopular('linkedin', imageSet['linkedin-post'])}
                  className="justify-start h-auto py-3 px-3 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <PlatformIcon platform="linkedin" />
                  <div className="text-left">
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">LinkedIn</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">1200x627</div>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview('instagram-story')}
                  className="justify-start h-auto py-3 px-3 hover:bg-pink-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <PlatformIcon platform="instagram" />
                  <div className="text-left">
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">Instagram</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Story & Post</div>
                  </div>
                </Button>
              </div>
              
              {/* Download Options */}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mb-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                  Download Images
                </h4>
                
                <div className="space-y-2">
                  {Object.entries(IMAGE_TEMPLATES).map(([template, dimensions]) => (
                    <Button
                      key={template}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(template as keyof typeof IMAGE_TEMPLATES)}
                      className="w-full justify-start h-auto py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <Download className="w-4 h-4 mr-3" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm capitalize text-slate-900 dark:text-slate-100">
                          {template.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {dimensions.width}x{dimensions.height} • {dimensions.platform}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Advanced Options */}
              {allowCustomization && (
                <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomization(!showCustomization)}
                    className="w-full justify-start h-auto py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    <span>Customize Design</span>
                    {showCustomization && <Badge variant="outline" className="ml-auto">Active</Badge>}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customization Panel */}
      {showCustomization && allowCustomization && (
        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Customize Your Image</h3>
            <Badge variant="outline" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Live Preview
            </Badge>
          </div>
          
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Style Variant Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Style</Label>
                <Select value={selectedVariant} onValueChange={(value) => setSelectedVariant(value as 'bold' | 'subtle' | 'urgent')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Theme</Label>
                <Select value={selectedTheme} onValueChange={(value) => setSelectedTheme(value as 'educator' | 'family' | 'activist' | 'professional' | 'default')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="educator">Educator</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="activist">Activist</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dark Mode Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Color Mode</Label>
                <Select value={darkMode} onValueChange={(value: 'auto' | 'light' | 'dark') => setDarkMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Smart)</SelectItem>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          
          {/* Preview */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreview('quiz-thumbnail')}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyLink('quiz-thumbnail')}
              className="flex-1"
            >
              Copy Link
            </Button>
          </div>
        </div>
      )}

      {/* Performance Metrics Display */}
      {generationMetrics && (
        <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
          <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-green-800 dark:text-green-300">Generation Time</div>
              <div className="text-green-600 dark:text-green-400">{generationMetrics.generationTime}ms</div>
            </div>
            <div>
              <div className="font-medium text-green-800 dark:text-green-300">Cache Status</div>
              <div className="text-green-600 dark:text-green-400">
                {generationMetrics.cacheHit ? 'Hit' : 'Miss'}
              </div>
            </div>
            <div>
              <div className="font-medium text-green-800 dark:text-green-300">Config</div>
              <div className="text-green-600 dark:text-green-400">
                {generationMetrics.variant} • {generationMetrics.theme}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 max-w-4xl max-h-full overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Image Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewImage(null)}>
                ×
              </Button>
            </div>
            <img 
              src={previewImage} 
              alt="Generated image preview" 
              className="max-w-full h-auto rounded border"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Compact Share Buttons for space-constrained layouts
export function QuickShareButtons({
  title,
  type = 'quiz',
  score,
  totalQuestions,
  userId
}: {
  title: string
  type?: 'quiz' | 'result'
  score?: number
  totalQuestions?: number
  userId?: string
}) {
  const { toast } = useToast()
  
  const shareToTwitter = useCallback(async () => {
    const params: ImageGenerationParams = {
      template: 'twitter-card',
      title,
      type,
      score,
      totalQuestions,
      userId,
      variant: 'bold',
      theme: 'default'
    }
    
    const imageUrl = generateImageUrl(params)
    const shareText = `Just ${type === 'result' ? `scored ${score}% on` : 'took'} "${title}" on CivicSense! 🏛️ #CivicEducation #Democracy`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`
    
    window.open(twitterUrl, '_blank', 'width=600,height=400')
    
    // Track usage
    await trackImageUsage({
      template: 'twitter-card',
      userId,
      engagementType: 'share'
    })
    
    toast({
      title: "Sharing to X",
      description: "Opening X with your custom image",
      duration: 2000
    })
  }, [title, type, score, totalQuestions, userId, toast])

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={shareToTwitter}>
        <Share2 className="w-4 h-4 mr-1" />
        X
      </Button>
    </div>
  )
}

// Social Share with Preview for immediate visual feedback
export function SocialShareWithPreview({
  title,
  description,
  type = 'quiz',
  template = 'quiz-thumbnail',
  ...props
}: EnhancedSocialShareProps & {
  template?: keyof typeof IMAGE_TEMPLATES
}) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const { user } = useAuth()

  // Memoize the params to prevent unnecessary re-generations
  const imageParams = useMemo((): ImageGenerationParams => ({
    template,
    title,
    description,
    type,
    userId: user?.id,
    variant: 'bold',
    theme: 'default',
    ...props
  }), [template, title, description, type, user?.id, props])

  useEffect(() => {
    setImageUrl(generateImageUrl(imageParams))
  }, [imageParams])

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
        <div className="aspect-[1200/630] bg-white dark:bg-gray-800 rounded border dark:border-gray-600 overflow-hidden">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Social share preview" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          Preview: {template.replace('-', ' ')} format
        </div>
      </div>
      
      {/* Enhanced Share Component */}
      <EnhancedSocialShare
        title={title}
        description={description}
        type={type}
        {...props}
      />
    </div>
  )
} 