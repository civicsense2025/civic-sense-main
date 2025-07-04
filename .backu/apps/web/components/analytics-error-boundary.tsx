'use client'

import React from 'react'
import { useAnalytics } from '../lib/analytics/analytics'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo?: React.ErrorInfo }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
    
    this.setState({ error, errorInfo })
    
    // Call the onError prop if provided
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} />
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              We've encountered an unexpected error. The issue has been reported and we're working to fix it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:opacity-80 transition-opacity"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component to use analytics hook
export function AnalyticsErrorBoundary({ 
  children, 
  fallback,
  contextInfo = {}
}: { 
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo?: React.ErrorInfo }>
  contextInfo?: Record<string, any>
}) {
  const { trackError } = useAnalytics()

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Track the error through analytics
    trackError('react_error_boundary', error.message, {
      stack: error.stack?.slice(0, 1000), // Limit stack trace length
      componentStack: errorInfo.componentStack?.slice(0, 1000),
      errorName: error.name,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      ...contextInfo
    })

    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 React Error Boundary - Error tracked:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        contextInfo
      })
    }
  }

  return (
    <ErrorBoundary onError={handleError} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}

// Specialized error boundaries for different parts of the app
export function QuizErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsErrorBoundary 
      contextInfo={{ 
        feature: 'quiz_engine',
        critical: true 
      }}
      fallback={({ error }) => (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Quiz Error
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              There was an issue loading this quiz. Please try refreshing the page or selecting a different topic.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-4 py-2 bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:opacity-80 transition-opacity"
              >
                Reload Quiz
              </button>
              <button
                onClick={() => window.history.back()}
                className="block w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </AnalyticsErrorBoundary>
  )
}

export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsErrorBoundary 
      contextInfo={{ 
        feature: 'authentication',
        critical: true 
      }}
      fallback={({ error }) => (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Authentication Error
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              There was an issue with authentication. Please try signing in again.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:opacity-80 transition-opacity"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </AnalyticsErrorBoundary>
  )
}

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsErrorBoundary 
      contextInfo={{ 
        feature: 'dashboard',
        critical: false 
      }}
      fallback={({ error }) => (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Dashboard Error
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Some dashboard features may not be working properly. Core functionality is still available.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:opacity-80 transition-opacity"
            >
              Refresh Dashboard
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </AnalyticsErrorBoundary>
  )
} 