// Dynamic Image Generation Service for CivicSense
// Generates brand-compliant thumbnails and social media images for quiz content
// Includes A/B testing, user customization, performance monitoring, and video preparation
// Updated with enhanced safe zone support following social media best practices

// CivicSense Brand Colors - Exact brand specification from guidelines
export const BRAND_COLORS = {
  // Primary palette
  authorityBlue: '#1E3A8A',  // Deep, serious blue for credibility and trust
  actionRed: '#DC2626',      // Urgent red for critical information and calls-to-action
  truthWhite: '#FFFFFF',     // Clean background suggesting transparency and clarity
  
  // Secondary palette
  evidenceGray: '#6B7280',   // Supporting information and subtle elements
  verifiedGreen: '#059669',  // Confirmed facts, successful actions
  warningAmber: '#D97706',   // Misinformation alerts, complex topics requiring attention
  
  // Extended palette
  darkBlue: '#1e2e5f',
  lightBlue: '#eff6ff'
} as const

// A/B Testing Visual Variants
export const VISUAL_VARIANTS = {
  'bold': { 
    emphasis: 'high', 
    colorIntensity: 1.0,
    fontWeight: 700,
    contrastBoost: 1.1,
    description: 'High-impact, confident presentation'
  },
  'subtle': { 
    emphasis: 'medium', 
    colorIntensity: 0.8,
    fontWeight: 600,
    contrastBoost: 0.9,
    description: 'Refined, approachable presentation'
  },
  'urgent': { 
    emphasis: 'high', 
    colorIntensity: 1.2,
    fontWeight: 800,
    contrastBoost: 1.3,
    description: 'Maximum urgency and action-orientation'
  }
} as const

// User Customization Themes
export const CUSTOM_THEMES = {
  'educator': {
    accentColor: BRAND_COLORS.verifiedGreen,
    messaging: 'Empowering civic education',
    icon: '🎓',
    audience: 'Teachers, professors, educational institutions',
    focusArea: 'Learning and knowledge building'
  },
  'family': {
    accentColor: BRAND_COLORS.actionRed,
    messaging: 'Building civic knowledge together',
    icon: '👨‍👩‍👧‍👦',
    audience: 'Parents, families, household learning',
    focusArea: 'Multi-generational civic engagement'
  },
  'activist': {
    accentColor: BRAND_COLORS.warningAmber,
    messaging: 'Knowledge is power',
    icon: '✊',
    audience: 'Community organizers, advocacy groups',
    focusArea: 'Action-oriented civic participation'
  },
  'professional': {
    accentColor: BRAND_COLORS.authorityBlue,
    messaging: 'Professional civic leadership',
    icon: '💼',
    audience: 'Business leaders, policy professionals',
    focusArea: 'Professional development and civic responsibility'
  },
  'default': {
    accentColor: BRAND_COLORS.authorityBlue,
    messaging: 'Civic education that politicians don\'t want you to have',
    icon: '🏛️',
    audience: 'General public, civic learners',
    focusArea: 'Democratic participation and power understanding'
  }
} as const

// Image Templates with exact dimensions for social platforms
// Updated with safe zone considerations
export const IMAGE_TEMPLATES = {
  'quiz-thumbnail': { 
    width: 1200, 
    height: 630, 
    platform: 'Open Graph / Twitter Card',
    safeZones: { top: 63, bottom: 76, left: 96, right: 96 } // 10% + 2% buffer
  },
  'instagram-story': { 
    width: 1080, 
    height: 1920, 
    platform: 'Instagram Story',
    safeZones: { top: 307, bottom: 422, left: 65, right: 65 } // 16% top, 22% bottom, 6% sides
  },
  'instagram-post': { 
    width: 1080, 
    height: 1080, 
    platform: 'Instagram Square Post',
    safeZones: { top: 108, bottom: 130, left: 86, right: 86 } // 10% + 2% buffer
  },
  'twitter-card': { 
    width: 1200, 
    height: 675, 
    platform: 'Twitter Card',
    safeZones: { top: 68, bottom: 81, left: 96, right: 96 } // Conservative 8% + 2% buffer
  },
  'facebook-post': { 
    width: 1200, 
    height: 630, 
    platform: 'Facebook Post',
    safeZones: { top: 63, bottom: 76, left: 96, right: 96 } // 10% + 2% buffer
  },
  'linkedin-post': { 
    width: 1200, 
    height: 627, 
    platform: 'LinkedIn Post',
    safeZones: { top: 63, bottom: 75, left: 96, right: 96 } // Professional platform - conservative
  }
} as const

// Video Generation Preparation - Future-ready parameter structure
export interface VideoGenerationParams {
  template: 'quiz-intro' | 'result-celebration' | 'topic-explainer' | 'achievement-unlock'
  duration: 15 | 30 | 60 // seconds
  style: 'kinetic-typography' | 'animated-graphics' | 'slideshow'
  voiceover: boolean
  music: boolean
  captions: boolean
  // Inherit all image parameters for consistency
  title: string
  description?: string
  score?: number
  totalQuestions?: number
  emoji?: string
  theme?: keyof typeof CUSTOM_THEMES
  variant?: keyof typeof VISUAL_VARIANTS
}

export interface ImageGenerationParams {
  template: keyof typeof IMAGE_TEMPLATES
  title: string
  description?: string
  score?: number
  totalQuestions?: number
  emoji?: string
  category?: string
  type?: 'quiz' | 'result' | 'topic' | 'achievement'
  userName?: string
  badge?: string
  
  // A/B Testing and Customization
  variant?: keyof typeof VISUAL_VARIANTS
  theme?: keyof typeof CUSTOM_THEMES
  darkMode?: 'auto' | 'light' | 'dark' | string // Support string for API compatibility
  
  // Analytics and Performance Tracking
  userId?: string
  sessionId?: string
  abTestId?: string
  
  // Brand Compliance Overrides (advanced users only)
  customBrandColors?: Partial<typeof BRAND_COLORS>
  customMessaging?: string
}

// Performance Monitoring Interface
export interface PerformanceMetrics {
  generationTime: number
  templateUsage: Record<string, number>
  variantPerformance: Record<string, {
    usage: number
    avgGenerationTime: number
    errorRate: number
  }>
  themePopularity: Record<string, number>
  errorsByType: Record<string, number>
}

// A/B Testing Framework
export class ImageABTestManager {
  private currentTests: Map<string, {
    variants: string[]
    allocation: Record<string, number>
    startDate: Date
    endDate: Date
  }>
  
  constructor() {
    this.currentTests = new Map()
  }
  
  // Create new A/B test
  createTest(testName: string, variants: string[], allocation: Record<string, number>) {
    this.currentTests.set(testName, {
      variants,
      allocation,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })
  }
  
  // Get variant for user (consistent assignment)
  getVariantForUser(testName: string, userId: string): string {
    const test = this.currentTests.get(testName)
    if (!test) return 'default'
    
    // Use hash of userId for consistent assignment
    const hash = this.hashUserId(userId)
    const threshold = hash % 100
    
    let cumulative = 0
    for (const [variant, percentage] of Object.entries(test.allocation)) {
      cumulative += percentage
      if (threshold < cumulative) {
        return variant
      }
    }
    
    return test.variants[0] // fallback
  }
  
  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

// Global A/B test manager instance
export const abTestManager = new ImageABTestManager()

// Initialize default A/B tests
abTestManager.createTest('visual-variant-test', ['bold', 'subtle', 'urgent'], {
  'bold': 40,
  'subtle': 30,
  'urgent': 30
})

abTestManager.createTest('theme-messaging-test', ['default', 'educator', 'activist'], {
  'default': 50,
  'educator': 25,
  'activist': 25
})

export function generateImageUrl(params: ImageGenerationParams): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.one'
  
  // Validate and sanitize parameters (auto-truncate long descriptions)
  const { errors, sanitizedParams } = validateImageParams(params)
  
  // Log validation errors but don't block generation
  if (errors.length > 0) {
    console.warn('Image generation validation warnings:', errors)
  }
  
  // Use sanitized parameters (with auto-truncated description if needed)
  const finalParams = { ...sanitizedParams }
  
  const searchParams = new URLSearchParams()
  
  // Apply A/B testing if user ID provided
  if (finalParams.userId && !finalParams.variant) {
    finalParams.variant = abTestManager.getVariantForUser('visual-variant-test', finalParams.userId) as keyof typeof VISUAL_VARIANTS
  }
  
  if (finalParams.userId && !finalParams.theme) {
    finalParams.theme = abTestManager.getVariantForUser('theme-messaging-test', finalParams.userId) as keyof typeof CUSTOM_THEMES
  }
  
  // Add session ID for analytics
  if (!finalParams.sessionId) {
    finalParams.sessionId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Add all parameters to the URL
  Object.entries(finalParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  })
  
  return `${baseUrl}/api/generate-image?${searchParams.toString()}`
}

// Enhanced generation functions with A/B testing and customization
export function generateQuizThumbnail(options: {
  title: string
  description?: string
  emoji?: string
  category?: string
  userId?: string
  theme?: keyof typeof CUSTOM_THEMES
  variant?: keyof typeof VISUAL_VARIANTS
}): string {
  return generateImageUrl({
    template: 'quiz-thumbnail',
    type: 'quiz',
    ...options
  })
}

export function generateQuizResultImage(options: {
  title: string
  score: number
  totalQuestions: number
  userName?: string
  template?: keyof typeof IMAGE_TEMPLATES
  userId?: string
  theme?: keyof typeof CUSTOM_THEMES
  variant?: keyof typeof VISUAL_VARIANTS
}): string {
  return generateImageUrl({
    template: options.template || 'quiz-thumbnail',
    type: 'result',
    title: options.title,
    score: options.score,
    totalQuestions: options.totalQuestions,
    userName: options.userName,
    description: `${options.score}% on ${options.totalQuestions} questions`,
    userId: options.userId,
    theme: options.theme,
    variant: options.variant
  })
}

export function generateInstagramStory(options: {
  title: string
  description?: string
  score?: number
  totalQuestions?: number
  emoji?: string
  userName?: string
  userId?: string
  theme?: keyof typeof CUSTOM_THEMES
  variant?: keyof typeof VISUAL_VARIANTS
}): string {
  return generateImageUrl({
    template: 'instagram-story',
    type: options.score ? 'result' : 'quiz',
    ...options
  })
}

export function generateAchievementImage(options: {
  title: string
  badge: string
  userName?: string
  template?: keyof typeof IMAGE_TEMPLATES
  userId?: string
  theme?: keyof typeof CUSTOM_THEMES
  variant?: keyof typeof VISUAL_VARIANTS
}): string {
  return generateImageUrl({
    template: options.template || 'quiz-thumbnail',
    type: 'achievement',
    title: options.title,
    badge: options.badge,
    userName: options.userName,
    emoji: '🏆',
    userId: options.userId,
    theme: options.theme,
    variant: options.variant
  })
}

// Utility for creating multiple image variants at once with A/B testing
export function generateImageSet(baseOptions: {
  title: string
  description?: string
  score?: number
  totalQuestions?: number
  emoji?: string
  userName?: string
  type?: 'quiz' | 'result'
  userId?: string
  theme?: keyof typeof CUSTOM_THEMES
  variant?: keyof typeof VISUAL_VARIANTS
}): Record<string, string> {
  const templates: Array<keyof typeof IMAGE_TEMPLATES> = [
    'quiz-thumbnail',
    'instagram-story', 
    'instagram-post',
    'twitter-card',
    'facebook-post',
    'linkedin-post'
  ]
  
  const imageSet: Record<string, string> = {}
  
  templates.forEach(template => {
    imageSet[template] = generateImageUrl({
      template,
      ...baseOptions
    })
  })
  
  return imageSet
}

// Performance monitoring utilities
export async function trackImageUsage(params: {
  template: string
  variant?: string
  theme?: string
  userId?: string
  engagementType: 'view' | 'click' | 'share' | 'download'
}): Promise<void> {
  if (typeof window === 'undefined') return
  
  try {
    await fetch('/api/image-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      })
    })
  } catch (error) {
    console.warn('Failed to track image usage:', error)
  }
}

// Helper for getting optimal image dimensions for different platforms
export function getImageDimensions(template: keyof typeof IMAGE_TEMPLATES) {
  return IMAGE_TEMPLATES[template]
}

// Helper for getting meta tags for social sharing with A/B testing
export function generateSocialMetaTags(imageUrl: string, options: {
  title: string
  description: string
  url?: string
  variant?: keyof typeof VISUAL_VARIANTS
  theme?: keyof typeof CUSTOM_THEMES
}) {
  const siteUrl = options.url || (typeof window !== 'undefined' ? window.location.href : '')
  
  // Customize description based on theme
  const themeData = CUSTOM_THEMES[options.theme || 'default']
  const enhancedDescription = `${options.description} | ${themeData.messaging}`
  
  return {
    // Open Graph
    'og:title': options.title,
    'og:description': enhancedDescription,
    'og:image': imageUrl,
    'og:url': siteUrl,
    'og:type': 'website',
    'og:site_name': 'CivicSense',
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': options.title,
    'twitter:description': enhancedDescription,
    'twitter:image': imageUrl,
    'twitter:site': '@civicsense',
    
    // Generic meta
    'description': enhancedDescription,
    'image': imageUrl,
    
    // Custom meta for tracking
    'civicsense:variant': options.variant || 'default',
    'civicsense:theme': options.theme || 'default'
  }
}

// Enhanced download function with analytics tracking
export async function downloadImage(imageUrl: string, filename: string, userId?: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('downloadImage can only be called on the client side')
  }
  
  try {
    // Track download attempt
    await trackImageUsage({
      template: 'download',
      userId,
      engagementType: 'download'
    })
    
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download image:', error)
    throw error
  }
}

// Enhanced validation with auto-truncation instead of errors
export function validateImageParams(params: Partial<ImageGenerationParams>): { 
  errors: string[], 
  sanitizedParams: ImageGenerationParams 
} {
  const errors: string[] = []
  const sanitizedParams = { ...params } as ImageGenerationParams
  
  if (!params.title || params.title.trim().length === 0) {
    errors.push('Title is required')
    // Provide a fallback title to maintain type safety
    sanitizedParams.title = 'CivicSense Quiz'
  } else {
    sanitizedParams.title = params.title
  }
  
  // Auto-truncate title if too long instead of erroring
  if (sanitizedParams.title.length > 100) {
    sanitizedParams.title = sanitizedParams.title.substring(0, 97) + '...'
  }
  
  // Auto-truncate description with smart word-based truncation
  if (params.description && params.description.length > 200) {
    // Smart truncation: preserve beginning, break at word boundaries
    const words = params.description.split(' ')
    let truncated = ''
    let wordIndex = 0
    
    // Keep adding words until we approach the limit
    while (wordIndex < words.length && (truncated + words[wordIndex] + ' ').length <= 197) {
      truncated += words[wordIndex] + ' '
      wordIndex++
    }
    
    // If we didn't fit all words, add ellipsis
    if (wordIndex < words.length) {
      truncated = truncated.trim() + '...'
    } else {
      truncated = truncated.trim()
    }
    
    sanitizedParams.description = truncated
  }
  
  // Ensure required template field has a default
  if (!sanitizedParams.template) {
    sanitizedParams.template = 'quiz-thumbnail'
  }
  
  if (params.score !== undefined && (params.score < 0 || params.score > 100)) {
    errors.push('Score must be between 0 and 100')
  }
  
  if (params.totalQuestions !== undefined && params.totalQuestions < 1) {
    errors.push('Total questions must be at least 1')
  }
  
  if (params.template && !IMAGE_TEMPLATES[params.template]) {
    errors.push(`Invalid template: ${params.template}`)
  }
  
  if (params.variant && !VISUAL_VARIANTS[params.variant]) {
    errors.push(`Invalid variant: ${params.variant}`)
  }
  
  if (params.theme && !CUSTOM_THEMES[params.theme]) {
    errors.push(`Invalid theme: ${params.theme}`)
  }
  
  return { errors, sanitizedParams }
}

// Enhanced presets with A/B testing, customization, and dark mode support
export const IMAGE_PRESETS = {
  quizShare: (title: string, options?: {
    emoji?: string
    userId?: string
    theme?: keyof typeof CUSTOM_THEMES
    variant?: keyof typeof VISUAL_VARIANTS
    darkMode?: 'auto' | 'light' | 'dark'
  }): ImageGenerationParams => ({
    template: 'quiz-thumbnail',
    type: 'quiz',
    title,
    emoji: options?.emoji || '🏛️',
    description: 'Test your civic knowledge',
    userId: options?.userId,
    theme: options?.theme,
    variant: options?.variant,
    darkMode: options?.darkMode || 'auto'
  }),
  
  resultShare: (title: string, score: number, totalQuestions: number, options?: {
    userName?: string
    userId?: string
    theme?: keyof typeof CUSTOM_THEMES
    variant?: keyof typeof VISUAL_VARIANTS
    darkMode?: 'auto' | 'light' | 'dark'
  }): ImageGenerationParams => ({
    template: 'quiz-thumbnail',
    type: 'result',
    title,
    score,
    totalQuestions,
    userName: options?.userName,
    emoji: score >= 80 ? '🏆' : score >= 60 ? '📚' : '🤔',
    userId: options?.userId,
    theme: options?.theme,
    variant: options?.variant,
    darkMode: options?.darkMode || 'auto'
  }),
  
  instagramStory: (title: string, options?: {
    score?: number
    totalQuestions?: number
    userId?: string
    theme?: keyof typeof CUSTOM_THEMES
    variant?: keyof typeof VISUAL_VARIANTS
    darkMode?: 'auto' | 'light' | 'dark'
  }): ImageGenerationParams => ({
    template: 'instagram-story',
    type: (options?.score ? 'result' : 'quiz'),
    title,
    score: options?.score,
    totalQuestions: options?.totalQuestions,
    emoji: '🏛️',
    userId: options?.userId,
    theme: options?.theme,
    variant: options?.variant,
    darkMode: options?.darkMode || 'dark' // Default to dark for stories
  }),
  
  achievement: (badge: string, options?: {
    userName?: string
    userId?: string
    theme?: keyof typeof CUSTOM_THEMES
    variant?: keyof typeof VISUAL_VARIANTS
    darkMode?: 'auto' | 'light' | 'dark'
  }): ImageGenerationParams => ({
    template: 'quiz-thumbnail',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    badge,
    userName: options?.userName,
    emoji: '🏆',
    userId: options?.userId,
    theme: options?.theme,
    variant: options?.variant,
    darkMode: options?.darkMode || 'auto'
  })
}

// Video Generation Preparation Functions (Future-ready)
export function prepareVideoParams(imageParams: ImageGenerationParams): VideoGenerationParams {
  // Map image templates to video templates
  const videoTemplate: VideoGenerationParams['template'] = 
    imageParams.type === 'result' ? 'result-celebration' :
    imageParams.type === 'achievement' ? 'achievement-unlock' :
    imageParams.type === 'topic' ? 'topic-explainer' :
    'quiz-intro'

  return {
    template: videoTemplate,
    duration: 30,
    style: 'kinetic-typography',
    voiceover: false,
    music: true,
    captions: true,
    title: imageParams.title,
    description: imageParams.description,
    score: imageParams.score,
    totalQuestions: imageParams.totalQuestions,
    emoji: imageParams.emoji,
    theme: imageParams.theme,
    variant: imageParams.variant
  }
}

export function generateVideoUrl(params: VideoGenerationParams): string {
  // Future implementation - returns placeholder for now
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.one'
  
  return `${baseUrl}/api/generate-video?${new URLSearchParams(params as any).toString()}`
}