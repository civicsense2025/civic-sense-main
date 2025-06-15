"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Search, Wrench, Trash2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrokenSource {
  url: string
  questionId: string
  sourceName: string
  error: string
  statusCode?: number
}

interface MaintenanceResult {
  success: boolean
  action: string
  brokenSources?: BrokenSource[]
  fixedCount?: number
  removedCount?: number
  errors?: string[]
  message: string
}

export function SourceMaintenancePanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MaintenanceResult | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const runMaintenance = async (action: 'scan' | 'fix' | 'remove') => {
    setIsLoading(true)
    setLastAction(action)
    
    try {
      const response = await fetch('/api/source-maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()
      setResults(result)
      
      if (!result.success) {
        console.error('Maintenance failed:', result)
      }
    } catch (error) {
      console.error('Error running maintenance:', error)
      setResults({
        success: false,
        action,
        message: 'Failed to run maintenance',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'scan': return <Search className="h-4 w-4" />
      case 'fix': return <Wrench className="h-4 w-4" />
      case 'remove': return <Trash2 className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'bg-gray-500'
    if (statusCode === 404) return 'bg-red-500'
    if (statusCode >= 400) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <span>Source Maintenance</span>
          </CardTitle>
          <CardDescription>
            Manage broken sources in quiz questions. Scan for 404s, find AI-powered replacements, or remove broken links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => runMaintenance('scan')}
              disabled={isLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Scan Sources</span>
            </Button>
            
            <Button
              onClick={() => runMaintenance('fix')}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Wrench className="h-4 w-4" />
              <span>Fix Broken Sources</span>
            </Button>
            
            <Button
              onClick={() => runMaintenance('remove')}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Remove Broken</span>
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Running {lastAction}... This may take a few minutes.
                </span>
              </div>
            </div>
          )}

          {/* Results */}
          {results && !isLoading && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={cn(
                "flex items-center space-x-2 p-4 rounded-lg",
                results.success 
                  ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" 
                  : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
              )}>
                {results.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(results.action)}
                    <span className="font-medium capitalize">{results.action} Complete</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {results.message}
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              {results.success && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.brokenSources && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {results.brokenSources.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Broken Sources</div>
                    </div>
                  )}
                  
                  {typeof results.fixedCount === 'number' && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {results.fixedCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Fixed</div>
                    </div>
                  )}
                  
                  {typeof results.removedCount === 'number' && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {results.removedCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Removed</div>
                    </div>
                  )}
                  
                  {results.errors && results.errors.length > 0 && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {results.errors.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                  )}
                </div>
              )}

              {/* Broken Sources List */}
              {results.brokenSources && results.brokenSources.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Broken Sources Found:</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.brokenSources.map((source, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          getStatusColor(source.statusCode)
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {source.sourceName}
                            </span>
                            {source.statusCode && (
                              <Badge variant="outline" className="text-xs">
                                {source.statusCode}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 hover:text-primary truncate"
                            >
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{source.url}</span>
                            </a>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Question ID: {source.questionId} • Error: {source.error}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {results.errors && results.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 dark:text-red-400">Errors:</h4>
                  <div className="space-y-1">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <Search className="h-4 w-4 mt-0.5 text-blue-500" />
            <div>
              <strong>Scan Sources:</strong> Check all question sources for 404 errors, timeouts, and other issues. This is read-only and safe to run anytime.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Wrench className="h-4 w-4 mt-0.5 text-green-500" />
            <div>
              <strong>Fix Broken Sources:</strong> Use AI to find replacement sources for broken links. Requires OpenAI API key. This modifies the database.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Trash2 className="h-4 w-4 mt-0.5 text-red-500" />
            <div>
              <strong>Remove Broken:</strong> Remove broken sources without replacement. Use with caution as this permanently deletes source references.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 