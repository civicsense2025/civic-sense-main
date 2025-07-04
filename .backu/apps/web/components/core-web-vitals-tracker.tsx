"use client"

import { useEffect, useState } from 'react'
import { debug } from '@civicsense/business-logic/utils/debug-config'

// ============================================================================
// CORE WEB VITALS PERFORMANCE TRACKER
// ============================================================================

interface VitalsMetrics {
  FCP?: number  // First Contentful Paint
  LCP?: number  // Largest Contentful Paint
  FID?: number  // First Input Delay
  CLS?: number  // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  INP?: number  // Interaction to Next Paint (new Core Web Vital)
}

interface WebVitalsMetric {
  value: number
  rating?: 'good' | 'needs-improvement' | 'poor'
}

/**
 * Core Web Vitals tracker component for monitoring performance improvements
 * Only runs in development mode to track optimization progress
 */
export function CoreWebVitalsTracker() {
  const [metrics, setMetrics] = useState<VitalsMetrics>({})
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasWebVitals, setHasWebVitals] = useState(false)

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    let mounted = true

    // Dynamically import web-vitals with error handling
    const loadWebVitals = async () => {
      try {
        const webVitalsModule = await import('web-vitals')
        
        if (!mounted) return
        
        setHasWebVitals(true)
        setIsLoaded(true)

        // Log metrics with color coding
        const logMetric = (name: string, value: number) => {
          const thresholds = {
            FCP: { good: 1800, needsImprovement: 3000 },
            LCP: { good: 2500, needsImprovement: 4000 },
            FID: { good: 100, needsImprovement: 300 },
            CLS: { good: 0.1, needsImprovement: 0.25 },
            TTFB: { good: 800, needsImprovement: 1800 },
            INP: { good: 200, needsImprovement: 500 }
          }

          const threshold = thresholds[name as keyof typeof thresholds]
          let rating = 'poor'
          let emoji = '🔴'
          
          if (threshold) {
            if (value <= threshold.good) {
              rating = 'good'
              emoji = '🟢'
            } else if (value <= threshold.needsImprovement) {
              rating = 'needs-improvement'
              emoji = '🟡'
            }
          }

          debug.log('analytics', `${emoji} ${name}: ${Math.round(value * 100) / 100}ms (${rating})`)
        }

        // Set up metrics collection
        try {
          // Cumulative Layout Shift
          if ('onCLS' in webVitalsModule && typeof webVitalsModule.onCLS === 'function') {
            webVitalsModule.onCLS((metric: WebVitalsMetric) => {
              if (!mounted) return
              setMetrics(prev => ({ ...prev, CLS: metric.value }))
              logMetric('CLS', metric.value)
            })
          }

          // First Contentful Paint
          if ('onFCP' in webVitalsModule && typeof webVitalsModule.onFCP === 'function') {
            webVitalsModule.onFCP((metric: WebVitalsMetric) => {
              if (!mounted) return
              setMetrics(prev => ({ ...prev, FCP: metric.value }))
              logMetric('FCP', metric.value)
            })
          }

          // First Input Delay
          if ('onFID' in webVitalsModule && typeof webVitalsModule.onFID === 'function') {
            webVitalsModule.onFID((metric: WebVitalsMetric) => {
              if (!mounted) return
              setMetrics(prev => ({ ...prev, FID: metric.value }))
              logMetric('FID', metric.value)
            })
          }

          // Largest Contentful Paint
          if ('onLCP' in webVitalsModule && typeof webVitalsModule.onLCP === 'function') {
            webVitalsModule.onLCP((metric: WebVitalsMetric) => {
              if (!mounted) return
              setMetrics(prev => ({ ...prev, LCP: metric.value }))
              logMetric('LCP', metric.value)
            })
          }

          // Time to First Byte
          if ('onTTFB' in webVitalsModule && typeof webVitalsModule.onTTFB === 'function') {
            webVitalsModule.onTTFB((metric: WebVitalsMetric) => {
              if (!mounted) return
              setMetrics(prev => ({ ...prev, TTFB: metric.value }))
              logMetric('TTFB', metric.value)
            })
          }

          // Interaction to Next Paint (new Core Web Vital) - check if available
          if ('onINP' in webVitalsModule && typeof webVitalsModule.onINP === 'function') {
            webVitalsModule.onINP((metric: WebVitalsMetric) => {
              if (!mounted) return
              setMetrics(prev => ({ ...prev, INP: metric.value }))
              logMetric('INP', metric.value)
            })
          }

          debug.log('analytics', '🚀 Core Web Vitals tracking initialized')
          
        } catch (metricsError) {
          debug.log('analytics', '⚠️ Error setting up metrics collection:', metricsError)
        }

      } catch (importError) {
        debug.log('analytics', '⚠️ web-vitals package not available:', importError)
        setIsLoaded(true) // Still mark as loaded to prevent infinite loading
      }
    }

    loadWebVitals()

    return () => {
      mounted = false
    }
  }, [])

  // Don't render anything in production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="p-3 rounded-lg border bg-muted text-sm font-mono">
        📊 Loading Web Vitals...
      </div>
    )
  }

  // Show unavailable state
  if (!hasWebVitals) {
    return (
      <div className="p-3 rounded-lg border bg-muted text-sm font-mono text-muted-foreground">
        📊 Web Vitals: N/A
      </div>
    )
  }

  // Render metrics display
  const metricsCount = Object.keys(metrics).length
  
  return (
    <div className="p-3 rounded-lg border bg-muted">
      <div className="font-semibold text-sm mb-3 flex items-center gap-2">
        📊 Core Web Vitals ({metricsCount})
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm font-mono">
        {metrics.FCP && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">FCP:</span>
            <span>{Math.round(metrics.FCP)}ms</span>
          </div>
        )}
        {metrics.LCP && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">LCP:</span>
            <span>{Math.round(metrics.LCP)}ms</span>
          </div>
        )}
        {metrics.FID && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">FID:</span>
            <span>{Math.round(metrics.FID)}ms</span>
          </div>
        )}
        {metrics.CLS && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">CLS:</span>
            <span>{Math.round(metrics.CLS * 1000) / 1000}</span>
          </div>
        )}
        {metrics.TTFB && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">TTFB:</span>
            <span>{Math.round(metrics.TTFB)}ms</span>
          </div>
        )}
        {metrics.INP && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">INP:</span>
            <span>{Math.round(metrics.INP)}ms</span>
          </div>
        )}
      </div>
      
      {metricsCount === 0 && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Collecting metrics...
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PERFORMANCE OPTIMIZATION SUGGESTIONS
// ============================================================================

/**
 * Analyzes current performance and suggests optimizations
 */
export function usePerformanceOptimizations() {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const analyzePage = () => {
      const newSuggestions: string[] = []

      // Check for images without dimensions
      const images = document.querySelectorAll('img:not([width]):not([height])')
      if (images.length > 0) {
        newSuggestions.push(`${images.length} images missing dimensions (causes layout shifts)`)
      }

      // Check for unoptimized images
      const largeImages = Array.from(document.querySelectorAll('img')).filter(img => {
        return img.naturalWidth > 1920 || img.naturalHeight > 1080
      })
      if (largeImages.length > 0) {
        newSuggestions.push(`${largeImages.length} images larger than 1920x1080 (consider optimization)`)
      }

      // Check for render-blocking resources
      const blockingScripts = document.querySelectorAll('script:not([async]):not([defer])')
      if (blockingScripts.length > 3) {
        newSuggestions.push(`${blockingScripts.length} potentially render-blocking scripts`)
      }

      // Check font loading
      const fontFaces = Array.from(document.fonts)
      const unloadedFonts = fontFaces.filter(font => font.status !== 'loaded')
      if (unloadedFonts.length > 0) {
        newSuggestions.push(`${unloadedFonts.length} fonts still loading (may cause FOUT)`)
      }

      setSuggestions(newSuggestions)

      if (newSuggestions.length > 0) {
        console.group('⚡ Performance Optimization Suggestions')
        newSuggestions.forEach(suggestion => console.log(`• ${suggestion}`))
        console.groupEnd()
      }
    }

    // Analyze after page loads
    const timer = setTimeout(analyzePage, 2000)
    return () => clearTimeout(timer)
  }, [])

  return suggestions
} 