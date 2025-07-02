import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export const runtime = 'edge'

// CivicSense Brand Colors - Exact brand specification
const BRAND_COLORS = {
  authorityBlue: '#1E3A8A',
  actionRed: '#DC2626', 
  truthWhite: '#FFFFFF',
  evidenceGray: '#6B7280',
  verifiedGreen: '#059669',
  warningAmber: '#D97706',
  darkBlue: '#1e2e5f',
  lightBlue: '#eff6ff'
} as const

// Image Templates with exact dimensions
const IMAGE_TEMPLATES = {
  'quiz-thumbnail': { width: 1200, height: 630 },
  'instagram-story': { width: 1080, height: 1920 },
  'instagram-post': { width: 1080, height: 1080 },
  'twitter-card': { width: 1200, height: 675 },
  'facebook-post': { width: 1200, height: 630 },
  'linkedin-post': { width: 1200, height: 627 }
} as const

// A/B Testing Variants
const VISUAL_VARIANTS = {
  'bold': { emphasis: 'high', colorIntensity: 1.0 },
  'subtle': { emphasis: 'medium', colorIntensity: 0.8 },
  'urgent': { emphasis: 'high', colorIntensity: 1.2 }
} as const

// User Customization Themes
const CUSTOM_THEMES = {
  'educator': {
    accentColor: BRAND_COLORS.verifiedGreen,
    messaging: 'Empowering civic education',
    icon: '🎓'
  },
  'family': {
    accentColor: BRAND_COLORS.actionRed,
    messaging: 'Building civic knowledge together',
    icon: '👨‍👩‍👧‍👦'
  },
  'activist': {
    accentColor: BRAND_COLORS.warningAmber,
    messaging: 'Knowledge is power',
    icon: '✊'
  },
  'professional': {
    accentColor: BRAND_COLORS.authorityBlue,
    messaging: 'Professional civic leadership',
    icon: '💼'
  },
  'default': {
    accentColor: BRAND_COLORS.authorityBlue,
    messaging: 'Civic education that politicians don\'t want you to have',
    icon: '🏛️'
  }
} as const

interface ImageParams {
  template: keyof typeof IMAGE_TEMPLATES
  title: string
  description?: string
  score?: string
  totalQuestions?: string
  emoji?: string
  category?: string
  type?: 'quiz' | 'result' | 'topic' | 'achievement'
  userName?: string
  badge?: string
  variant?: keyof typeof VISUAL_VARIANTS
  theme?: keyof typeof CUSTOM_THEMES
  userId?: string
  sessionId?: string
  darkMode?: string // 'true' | 'false' | 'auto'
}

async function trackImageGeneration(params: {
  template: string
  type: string
  variant?: string
  theme?: string
  userId?: string
  sessionId?: string
  generationTime: number
  success: boolean
  error?: string
  darkMode?: string
}) {
  try {
    const supabase = await createClient()
    
    await supabase.from('image_generation_analytics').insert({
      template: params.template,
      content_type: params.type,
      variant: params.variant || 'default',
      theme: params.theme || 'default',
      user_id: params.userId,
      session_id: params.sessionId,
      generation_time_ms: params.generationTime,
      success: params.success,
      error_message: params.error,
      dark_mode: params.darkMode || 'auto',
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.warn('Failed to track image generation:', error)
  }
}

function generateBrandCompliantSVG(params: ImageParams, dimensions: { width: number; height: number }): string {
  const isStoryFormat = params.template === 'instagram-story'
  const variant = VISUAL_VARIANTS[params.variant || 'bold']
  const theme = CUSTOM_THEMES[params.theme || 'default']
  
  // Calculate responsive typography matching dashboard styling
  const titleSize = isStoryFormat ? 48 : 42
  const descriptionSize = isStoryFormat ? 24 : 20
  const logoSize = isStoryFormat ? 32 : 28
  const scoreSize = isStoryFormat ? 56 : 48
  
  // Enhanced padding following social media best practices
  // General rule: 8-10% padding for regular formats, 15% for story formats
  const basePadding = isStoryFormat ? dimensions.width * 0.08 : dimensions.width * 0.08 // Increased from 6% to 8%
  const padding = basePadding
  const contentWidth = dimensions.width - (padding * 2)
  
  // Platform-specific safe zones to prevent interface cutoff
  let topSafeZone, bottomSafeZone, leftSafeZone, rightSafeZone
  
  if (isStoryFormat) {
    // Instagram/Facebook Stories: 14% top, 20% bottom safe zones
    // Plus extra margin for interface elements
    topSafeZone = dimensions.height * 0.16 // 16% from top (14% + 2% buffer)
    bottomSafeZone = dimensions.height * 0.22 // 22% from bottom (20% + 2% buffer)
    leftSafeZone = dimensions.width * 0.06 // 6% from left
    rightSafeZone = dimensions.width * 0.06 // 6% from right
  } else {
    // Regular posts: Conservative 10% safe zones all around
    topSafeZone = dimensions.height * 0.1
    bottomSafeZone = dimensions.height * 0.12 // Slightly larger for bottom interface elements
    leftSafeZone = dimensions.width * 0.08
    rightSafeZone = dimensions.width * 0.08
  }
  
  const verticalSpacing = isStoryFormat ? 60 : 48
  
  // Central reference point - adjusted for safe zones
  const safeContentHeight = dimensions.height - topSafeZone - bottomSafeZone
  const safeCenterY = topSafeZone + (safeContentHeight / 2)
  
  // For quiz/topic sharing: title at top safe zone, description centered in safe area
  // For result sharing: score at top safe zone, content centered in safe area
  const isResultSharing = params.score && params.totalQuestions && params.type === 'result'
  
  let titleY, descY, scoreCardY
  
  if (isResultSharing) {
    // Result sharing: score at top safe zone, content centered in safe area
    scoreCardY = topSafeZone + 20
    titleY = safeCenterY - titleSize * 0.5
    descY = titleY + titleSize + 20
  } else {
    // Quiz sharing: title at top safe zone, description centered in safe area
    titleY = topSafeZone + 20
    descY = safeCenterY - descriptionSize
    scoreCardY = topSafeZone + 20 // Initialize for consistency, though not used
  }
  
  // Enhanced safe content width
  const safeContentWidth = dimensions.width - leftSafeZone - rightSafeZone
  const safeContentX = leftSafeZone
  
  // Brand positioning - within bottom safe zone
  const brandY = dimensions.height - bottomSafeZone - 60
  const taglineY = dimensions.height - bottomSafeZone - 30
  const watermarkY = dimensions.height - bottomSafeZone - 10
  
  // Enhanced color scheme with dark mode support
  // Dark mode optimized for better visibility on dark backgrounds and platform dark modes
  const isDarkMode = params.darkMode === 'true' || (params.darkMode === 'auto' && isStoryFormat)
  
  let backgroundColor, textColor, mutedTextColor, borderColor, accentColor
  
  if (isDarkMode) {
    // Dark mode: Optimized for dark backgrounds and platform dark modes
    backgroundColor = '#0f172a' // Deep slate for contrast
    textColor = '#f8fafc' // Near white for readability
    mutedTextColor = '#cbd5e1' // Light slate for secondary text
    borderColor = '#334155' // Subtle border that works on dark
    accentColor = '#60a5fa' // Lighter blue for better contrast on dark
  } else {
    // Light mode: Optimized for light backgrounds and standard viewing
    backgroundColor = '#ffffff' // Pure white
    textColor = '#0f172a' // Deep slate for contrast
    mutedTextColor = '#64748b' // Medium slate for secondary text
    borderColor = '#e2e8f0' // Light border
    accentColor = BRAND_COLORS.authorityBlue // Standard brand blue
  }
  
  const svg = `
    <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Clean typography definition matching dashboard -->
        <style>
          .title-text { 
            font-family: 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', sans-serif;
            font-weight: 300;
            font-size: ${titleSize}px;
            line-height: 1.2;
            letter-spacing: -0.025em;
          }
          .body-text { 
            font-family: 'Space Mono', 'Monaco', 'Courier New', monospace;
            font-weight: 400;
            font-size: ${descriptionSize}px;
            line-height: 1.5;
            letter-spacing: 0em;
          }
          .brand-text { 
            font-family: 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', sans-serif;
            font-weight: 500;
            font-size: ${logoSize}px;
            letter-spacing: -0.025em;
          }
          .score-text { 
            font-family: 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', sans-serif;
            font-weight: 300;
            font-size: ${scoreSize}px;
            letter-spacing: -0.025em;
          }
          .caption-text { 
            font-family: 'Space Mono', 'Monaco', 'Courier New', monospace;
            font-weight: 400;
            font-size: ${descriptionSize * 0.8}px;
            letter-spacing: 0em;
          }
        </style>
      </defs>
      
      <!-- Clean background - no gradients -->
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      
      <!-- Subtle border for structure -->
      <rect x="0" y="0" width="${dimensions.width}" height="${dimensions.height}" 
            fill="none" stroke="${borderColor}" stroke-width="1"/>
      
      <!-- Title with clean typography - positioned within safe zones -->
      <foreignObject x="${safeContentX}" y="${titleY}" width="${safeContentWidth}" height="${titleSize * 2.5}">
        <div xmlns="http://www.w3.org/1999/xhtml" class="title-text" style="
          color: ${textColor};
          text-align: center;
          word-wrap: break-word;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 0 ${isStoryFormat ? '20px' : '10px'};
        ">
          ${params.title}
        </div>
      </foreignObject>
      
      <!-- Description with clean styling - positioned within safe zones -->
      ${params.description ? `
        <foreignObject x="${safeContentX}" y="${descY}" width="${safeContentWidth}" height="${isStoryFormat ? descriptionSize * 8 : descriptionSize * 6}">
          <div xmlns="http://www.w3.org/1999/xhtml" class="body-text" style="
            color: ${mutedTextColor};
            text-align: center;
            word-wrap: break-word;
            word-break: break-word;
            hyphens: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            line-height: ${isStoryFormat ? '1.6' : '1.4'};
            padding: 0 ${isStoryFormat ? '30px' : '20px'};
            font-size: ${isStoryFormat ? descriptionSize * 1.1 : descriptionSize}px;
            max-width: 100%;
            overflow-wrap: break-word;
          ">
            ${params.description}
          </div>
        </foreignObject>
      ` : ''}
      
      <!-- Score display with clean card design - positioned within safe zones -->
      ${params.score && params.totalQuestions && params.type === 'result' ? `
        <rect x="${dimensions.width / 2 - 160}" y="${scoreCardY}" 
              width="320" height="80" 
              fill="${backgroundColor}" 
              stroke="${borderColor}" 
              stroke-width="2" 
              rx="8"/>
        
        <!-- Score percentage on the left -->
        <text x="${dimensions.width / 2 - 80}" y="${scoreCardY + 50}" 
              class="score-text"
              fill="${accentColor}" 
              text-anchor="middle">
          ${params.score}%
        </text>
        
        <!-- Score details on the right, centered vertically -->
        <text x="${dimensions.width / 2 + 40}" y="${scoreCardY + 38}" 
              class="caption-text"
              fill="${mutedTextColor}" 
              text-anchor="middle">
          Your Score
        </text>
        <text x="${dimensions.width / 2 + 40}" y="${scoreCardY + 58}" 
              class="caption-text"
              fill="${mutedTextColor}" 
              text-anchor="middle">
          ${params.totalQuestions} questions
        </text>
      ` : ''}
      
      <!-- Brand wordmark above tagline - positioned within bottom safe zone -->
      <text x="${dimensions.width / 2}" y="${brandY}" 
            class="brand-text"
            fill="${accentColor}" 
            text-anchor="middle">
        CivicSense
      </text>
      
      <!-- Tagline - positioned within bottom safe zone -->
      <text x="${dimensions.width / 2}" y="${taglineY}" 
            class="caption-text"
            fill="${mutedTextColor}" 
            text-anchor="middle">
        Democracy, Decoded Daily
      </text>
      
      <!-- Minimal watermark - positioned within bottom safe zone -->
      <text x="${dimensions.width - rightSafeZone}" y="${watermarkY}" 
            class="caption-text"
            fill="${mutedTextColor}" 
            text-anchor="end" 
            opacity="0.7">
        civicsense.one
      </text>
    </svg>
  `
  
  return svg
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let success = false
  let error: string | undefined
  
  try {
    const { searchParams } = new URL(request.url)
    
    const params: ImageParams = {
      template: (searchParams.get('template') as keyof typeof IMAGE_TEMPLATES) || 'quiz-thumbnail',
      title: searchParams.get('title') || 'CivicSense Quiz',
      description: searchParams.get('description') || undefined,
      score: searchParams.get('score') || undefined,
      totalQuestions: searchParams.get('totalQuestions') || undefined,
      emoji: searchParams.get('emoji') || '🏛️',
      category: searchParams.get('category') || 'Civics',
      type: (searchParams.get('type') as 'quiz' | 'result' | 'topic' | 'achievement') || 'quiz',
      userName: searchParams.get('userName') || undefined,
      badge: searchParams.get('badge') || undefined,
      variant: (searchParams.get('variant') as keyof typeof VISUAL_VARIANTS) || 'bold',
      theme: (searchParams.get('theme') as keyof typeof CUSTOM_THEMES) || 'default',
      userId: searchParams.get('userId') || undefined,
      sessionId: searchParams.get('sessionId') || undefined,
      darkMode: searchParams.get('darkMode') || 'auto'
    }

    // Extract values for analytics tracking
    const darkModeValue = params.darkMode

    // Validate template
    if (!IMAGE_TEMPLATES[params.template]) {
      throw new Error(`Invalid template: ${params.template}`)
    }

    const dimensions = IMAGE_TEMPLATES[params.template]
    const svg = generateBrandCompliantSVG(params, dimensions)
    
    success = true
    const generationTime = Date.now() - startTime
    
    // Track analytics (non-blocking)
    trackImageGeneration({
      template: params.template,
      type: params.type || 'quiz',
      variant: params.variant,
      theme: params.theme,
      userId: params.userId,
      sessionId: params.sessionId,
      generationTime,
      success: true,
      darkMode: darkModeValue
    }).catch(console.warn)

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Enhanced caching
        'X-Generation-Time': `${generationTime}ms`,
        'X-Template': params.template,
        'X-Variant': params.variant || 'default',
        'X-Dark-Mode': darkModeValue || 'auto'
      },
    })
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
    const generationTime = Date.now() - startTime
    const darkModeValue = new URL(request.url).searchParams.get('darkMode') || 'auto'
    
    console.error('Image generation failed:', error)
    
    // Track failed generation
    trackImageGeneration({
      template: 'error',
      type: 'error',
      generationTime,
      success: false,
      error,
      darkMode: darkModeValue
    }).catch(console.warn)
    
    // Return clean, minimal error SVG matching dashboard styling with proper safe zones
    const isDarkModeError = darkModeValue === 'true' || (darkModeValue === 'auto')
    const errorBgColor = isDarkModeError ? '#0f172a' : '#ffffff'
    const errorTextColor = isDarkModeError ? '#f8fafc' : '#0f172a'
    const errorMutedColor = isDarkModeError ? '#cbd5e1' : '#64748b'
    const errorBorderColor = isDarkModeError ? '#334155' : '#e2e8f0'
    const errorAccentColor = isDarkModeError ? '#60a5fa' : BRAND_COLORS.authorityBlue
    
    const errorSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .error-title { 
              font-family: 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', sans-serif;
              font-weight: 300;
              font-size: 32px;
              letter-spacing: -0.025em;
            }
            .error-body { 
              font-family: 'Space Mono', 'Monaco', 'Courier New', monospace;
              font-weight: 400;
              font-size: 18px;
              line-height: 1.5;
            }
          </style>
        </defs>
        <!-- Clean background with dark mode support -->
        <rect width="100%" height="100%" fill="${errorBgColor}"/>
        
        <!-- Subtle border -->
        <rect x="0" y="0" width="1200" height="630" 
              fill="none" stroke="${errorBorderColor}" stroke-width="1"/>
        
        <!-- Brand name - positioned with safe zone -->
        <text x="600" y="180" class="error-title" fill="${errorAccentColor}" text-anchor="middle">CivicSense</text>
        
        <!-- Brand icon -->
        <text x="600" y="260" font-size="64" text-anchor="middle">🏛️</text>
        
        <!-- Error message -->
        <text x="600" y="330" class="error-body" fill="${errorMutedColor}" text-anchor="middle">Image generation temporarily unavailable</text>
        
        <!-- Tagline at bottom with safe zone margin -->
        <text x="600" y="540" class="error-body" fill="${errorMutedColor}" text-anchor="middle">Democracy, Decoded Daily</text>
        
        <!-- Minimal watermark with safe zone -->
        <text x="1100" y="580" class="error-body" fill="${errorMutedColor}" text-anchor="end" opacity="0.7" font-size="14">civicsense.one</text>
      </svg>
    `
    
    return new Response(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
        'X-Generation-Time': `${generationTime}ms`,
        'X-Error': 'generation-failed'
      },
      status: 200 // Return 200 to avoid broken images
    })
  }
} 