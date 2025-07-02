/**
 * Google Calendar Sync Test Page
 * 
 * Demo page to test the Google Calendar sync functionality
 * Shows the sync component and integration status
 */

import { GoogleCalendarSync } from '@civicsense/ui-web/components/integrations/google-calendar-sync'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Calendar, TestTube } from 'lucide-react'

export default function TestCalendarSyncPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TestTube className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Google Calendar Sync Test</h1>
        </div>
        <p className="text-muted-foreground">
          Test the Google Calendar integration that syncs CivicSense topics and news to your calendar
        </p>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            How It Works
          </CardTitle>
          <CardDescription>
            The Google Calendar sync feature adds CivicSense topics and news directly to your calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">What Gets Synced</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Daily civic education topics</li>
                <li>• Breaking news developments</li>
                <li>• Featured educational content</li>
                <li>• Topic descriptions and context</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Calendar Events Include</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Topic title with emoji</li>
                <li>• Detailed description</li>
                <li>• Why this matters explanation</li>
                <li>• Deep link back to CivicSense</li>
                <li>• Category information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Sync Component */}
      <GoogleCalendarSync />

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>
            Helpful information for testing the Google Calendar sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">OAuth Flow</h4>
            <p className="text-sm text-muted-foreground">
              The Google Calendar sync now uses a unified OAuth flow that:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Requests only Google Calendar permissions (not Classroom)</li>
              <li>• Stores tokens securely in the database and cookies</li>
              <li>• Automatically redirects back to this page after authentication</li>
              <li>• Shows success/error messages via toast notifications</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Testing Steps</h4>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>1. Click "Connect Google Account" to authenticate</li>
              <li>2. Grant Google Calendar permissions</li>
              <li>3. Return to this page and see connection status</li>
              <li>4. Configure sync options (breaking news, featured topics, etc.)</li>
              <li>5. Click "Sync to Calendar" to create events</li>
              <li>6. Check your Google Calendar for the "CivicSense - Daily Topics & News" calendar</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Expected Behavior</h4>
            <p className="text-sm text-muted-foreground">
              After successful authentication, you should see:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Green "Google Calendar connected successfully" alert</li>
              <li>• Sync options become available</li>
              <li>• "Sync to Calendar" button becomes enabled</li>
              <li>• Success toast when sync completes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
          <CardDescription>
            Details about how the Google Calendar sync works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">Authentication</h4>
              <p className="text-muted-foreground">
                Uses existing Google OAuth integration from classroom features. 
                Requires Google Calendar API access scope.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Calendar Creation</h4>
              <p className="text-muted-foreground">
                Creates a dedicated "CivicSense - Daily Topics & News" calendar 
                to keep civic education content organized separately.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Event Format</h4>
              <p className="text-muted-foreground">
                Each topic becomes an all-day event with the topic date. 
                Deep links in the location field provide direct access back to the quiz.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Sync Options</h4>
              <p className="text-muted-foreground">
                Users can choose to sync breaking news, featured topics, or all topics from the last 30 days.
                Prevents calendar overload while maintaining relevance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 