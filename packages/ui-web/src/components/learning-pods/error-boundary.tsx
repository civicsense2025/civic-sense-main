"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class LearningPodsErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Learning Pods Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-0 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-lg font-light text-red-700 dark:text-red-300 flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-red-600 dark:text-red-400 font-light">
              We encountered an error while loading the learning pods. This might be because the database hasn't been set up yet.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => this.setState({ hasError: false })}
                variant="outline"
                className="gap-2 border-red-200 dark:border-red-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <p className="text-sm text-red-500 dark:text-red-400 font-light">
                Run database migrations to enable full functionality
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <LearningPodsErrorBoundary>
        <Component {...props} />
      </LearningPodsErrorBoundary>
    )
  }
} 