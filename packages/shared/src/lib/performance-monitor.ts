// Performance monitoring utility for CivicSense
// Tracks Core Web Vitals and provides optimization recommendations

export interface PerformanceMetrics {
  FCP: number // First Contentful Paint
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
  TTFB: number // Time to First Byte
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Initialize performance monitoring
  init() {
    if (typeof window === 'undefined') return

    // Observe Core Web Vitals
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.measureFCP()
    this.measureTTFB()
  }

  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEventTiming
      this.metrics.LCP = lastEntry.startTime
      this.reportMetric('LCP', lastEntry.startTime)
    })
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming
        this.metrics.FID = fidEntry.processingStart - fidEntry.startTime
        this.reportMetric('FID', this.metrics.FID)
      })
    })
    observer.observe({ entryTypes: ['first-input'] })
  }

  private observeCLS() {
    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const layoutShift = entry as any
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value
        }
      })
      this.metrics.CLS = clsValue
      this.reportMetric('CLS', clsValue)
    })
    observer.observe({ entryTypes: ['layout-shift'] })
  }

  private measureFCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        this.metrics.FCP = fcpEntry.startTime
        this.reportMetric('FCP', fcpEntry.startTime)
      }
    })
    observer.observe({ entryTypes: ['paint'] })
  }

  private measureTTFB() {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      this.metrics.TTFB = navigationEntry.responseStart - navigationEntry.fetchStart
      this.reportMetric('TTFB', this.metrics.TTFB)
    }
  }

  private reportMetric(name: string, value: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏃‍♂️ Performance Metric: ${name} = ${Math.round(value)}ms`)
      
      // Provide optimization suggestions
      switch (name) {
        case 'LCP':
          if (value > 2500) {
            console.warn('⚠️ LCP is slow. Consider optimizing images and critical CSS.')
          }
          break
        case 'FID':
          if (value > 100) {
            console.warn('⚠️ FID is slow. Consider reducing JavaScript execution time.')
          }
          break
        case 'CLS':
          if (value > 0.1) {
            console.warn('⚠️ CLS is high. Ensure images have dimensions and avoid layout shifts.')
          }
          break
        case 'TTFB':
          if (value > 600) {
            console.warn('⚠️ TTFB is slow. Consider server optimization or CDN.')
          }
          break
      }
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send to Vercel Analytics or other monitoring service
      const event = {
        name: `performance_${name.toLowerCase()}`,
        value: Math.round(value),
        url: window.location.pathname
      }
      
      // You can integrate with your analytics service here
      console.log('Performance metric:', event)
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  // Check if page meets performance standards
  isPerformant(): boolean {
    const { LCP, FID, CLS } = this.metrics
    return (
      (LCP === undefined || LCP <= 2500) &&
      (FID === undefined || FID <= 100) &&
      (CLS === undefined || CLS <= 0.1)
    )
  }
}

// Auto-initialize performance monitoring
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    PerformanceMonitor.getInstance().init()
  })
}

export const performanceMonitor = PerformanceMonitor.getInstance() 