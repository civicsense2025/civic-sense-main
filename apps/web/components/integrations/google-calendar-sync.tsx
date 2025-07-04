/**
 * Google Calendar Sync Component
 * 
 * Provides UI for users to sync CivicSense topics and news to their Google Calendar
 * Includes sync options, status display, and connection management
 */

"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Clock,
  ExternalLink,
  Settings,
  Zap
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import { useAuth } from "../../components/ui"
import { toast } from 'sonner'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SyncOptions {
  includeBreakingNews: boolean
  includeFeaturedTopics: boolean
  includeAllTopics: boolean
  timeZone?: string
}

interface SyncStatus {
  hasGoogleAccess: boolean
  isEnabled: boolean
  syncOptions: SyncOptions
  recentSyncs: any[]
  lastSyncAt: string | null
}

interface SyncResult {
  success: boolean
  syncedCount: number
  skippedCount: number
  errors: string[]
  calendarId: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GoogleCalendarSync() {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({
    includeBreakingNews: true,
    includeFeaturedTopics: true,
    includeAllTopics: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  // Load sync status on component mount
  useEffect(() => {
    if (user) {
      loadSyncStatus()
    }
  }, [user])

  // Check for OAuth success/error in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const googleAuth = urlParams.get('google_auth')
    const authError = urlParams.get('error')
    const service = urlParams.get('service')

    if (googleAuth === 'success' && service === 'calendar') {
      toast.success('Google Calendar connected successfully!', {
        description: 'You can now sync CivicSense topics to your calendar.'
      })
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('google_auth')
      newUrl.searchParams.delete('service')
      window.history.replaceState({}, '', newUrl.toString())
    } else if (authError) {
      toast.error('Google Calendar connection failed', {
        description: `Error: ${authError.replace(/_/g, ' ')}`
      })
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [])

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  const loadSyncStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/integrations/google-calendar/sync')
      
      if (!response.ok) {
        throw new Error('Failed to load sync status')
      }

      const status = await response.json()
      setSyncStatus(status)
      
      // Update local sync options with server settings
      if (status.syncOptions) {
        setSyncOptions(prev => ({ ...prev, ...status.syncOptions }))
      }
    } catch (error) {
      console.error('Error loading sync status:', error)
      toast.error('Failed to load calendar sync status')
    } finally {
      setIsLoading(false)
    }
  }

  const performSync = async () => {
    try {
      setIsSyncing(true)
      
      const response = await fetch('/api/integrations/google-calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncOptions),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresAuth) {
          toast.error('Google Calendar access required', {
            description: result.details,
            action: {
              label: 'Connect Google',
              onClick: () => {
                const returnUrl = encodeURIComponent(window.location.href)
                window.location.href = `/api/integrations/google/auth?service=calendar&returnUrl=${returnUrl}`
              }
            }
          })
          return
        }
        
        throw new Error(result.details || result.error || 'Sync failed')
      }

      setLastSyncResult(result.result)
      toast.success(result.message)
      
      // Reload status to show updated sync time
      await loadSyncStatus()
      
    } catch (error) {
      console.error('Calendar sync error:', error)
      toast.error('Calendar sync failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSyncOptionChange = (option: keyof SyncOptions, value: boolean) => {
    setSyncOptions(prev => {
      const updated = { ...prev, [option]: value }
      
      // If "All Topics" is enabled, disable the specific filters
      if (option === 'includeAllTopics' && value) {
        updated.includeBreakingNews = false
        updated.includeFeaturedTopics = false
      }
      
      // If a specific filter is enabled, disable "All Topics"
      if ((option === 'includeBreakingNews' || option === 'includeFeaturedTopics') && value) {
        updated.includeAllTopics = false
      }
      
      return updated
    })
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderConnectionStatus = () => {
    if (!syncStatus) return null

    if (!syncStatus.hasGoogleAccess) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your Google account to sync topics to Google Calendar.
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto ml-2"
              onClick={() => {
                const returnUrl = encodeURIComponent(window.location.href)
                window.location.href = `/api/integrations/google/auth?service=calendar&returnUrl=${returnUrl}`
              }}
            >
              Connect Google Account
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Google Calendar connected successfully
        </AlertDescription>
      </Alert>
    )
  }

  const renderSyncOptions = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Breaking News</label>
            <p className="text-xs text-muted-foreground">
              Sync urgent political developments and breaking news
            </p>
          </div>
          <Switch
            checked={syncOptions.includeBreakingNews}
            onCheckedChange={(checked) => handleSyncOptionChange('includeBreakingNews', checked)}
            disabled={syncOptions.includeAllTopics}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Featured Topics</label>
            <p className="text-xs text-muted-foreground">
              Sync curated essential civic education topics
            </p>
          </div>
          <Switch
            checked={syncOptions.includeFeaturedTopics}
            onCheckedChange={(checked) => handleSyncOptionChange('includeFeaturedTopics', checked)}
            disabled={syncOptions.includeAllTopics}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">All Topics</label>
            <p className="text-xs text-muted-foreground">
              Sync all daily topics (last 30 days)
            </p>
          </div>
          <Switch
            checked={syncOptions.includeAllTopics}
            onCheckedChange={(checked) => handleSyncOptionChange('includeAllTopics', checked)}
          />
        </div>
      </div>
    </div>
  )

  const renderSyncHistory = () => {
    if (!syncStatus?.recentSyncs?.length) return null

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Recent Syncs</h4>
        <div className="space-y-2">
          {syncStatus.recentSyncs.slice(0, 3).map((sync: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(sync.synced_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {sync.synced_count} synced
                </Badge>
                {sync.skipped_count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {sync.skipped_count} skipped
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLastSyncResult = () => {
    if (!lastSyncResult) return null

    return (
      <Alert className={cn(
        lastSyncResult.success 
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" 
          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      )}>
        {lastSyncResult.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={cn(
          lastSyncResult.success 
            ? "text-green-700 dark:text-green-300" 
            : "text-red-700 dark:text-red-300"
        )}>
          {lastSyncResult.success ? (
            <div>
              Successfully synced {lastSyncResult.syncedCount} topics to your calendar
              {lastSyncResult.skippedCount > 0 && ` (${lastSyncResult.skippedCount} skipped)`}
            </div>
          ) : (
            <div>
              Sync failed: {lastSyncResult.errors[0] || 'Unknown error'}
              {lastSyncResult.errors.length > 1 && ` (+${lastSyncResult.errors.length - 1} more)`}
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Please sign in to sync topics to Google Calendar
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading calendar sync status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Google Calendar Sync</CardTitle>
          </div>
          <CardDescription>
            Add CivicSense topics and news to your Google Calendar to stay informed about civic education topics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderConnectionStatus()}
          
          {syncStatus?.hasGoogleAccess && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Sync Options
                  </h4>
                </div>
                {renderSyncOptions()}
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={performSync}
                  disabled={isSyncing || (!syncOptions.includeBreakingNews && !syncOptions.includeFeaturedTopics && !syncOptions.includeAllTopics)}
                  className="flex items-center gap-2"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isSyncing ? 'Syncing...' : 'Sync to Calendar'}
                </Button>

                {syncStatus.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(syncStatus.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>

              {renderLastSyncResult()}
              {renderSyncHistory()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 