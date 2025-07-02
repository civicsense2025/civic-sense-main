'use client'

import { useState } from 'react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Input } from '@civicsense/ui-web/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@civicsense/ui-web/components/ui/select'
import { Textarea } from '@civicsense/ui-web/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@civicsense/ui-web/components/ui/alert'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { CheckCircle, XCircle, Mail, Send, AlertTriangle } from 'lucide-react'

interface TestResult {
  success: boolean
  messageId?: string
  error?: string
  testData?: any
  apiKeyStatus?: any
}

export default function TestMailerLitePage() {
  const [emailType, setEmailType] = useState('welcome')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [apiStatus, setApiStatus] = useState<any>(null)

  const emailTypes = [
    { value: 'welcome', label: 'Welcome Email', description: 'New user welcome message' },
    { value: 'achievement', label: 'Achievement Email', description: 'Quiz achievement celebration' },
    { value: 'level_up', label: 'Level Up Email', description: 'User level advancement' },
    { value: 'streak', label: 'Streak Email', description: 'Learning streak milestone' },
    { value: 'pod_invitation', label: 'Pod Invitation', description: 'Learning pod invitation' },
    { value: 'weekly_digest', label: 'Weekly Digest', description: 'Personalized weekly summary' },
    { value: 're_engagement', label: 'Re-engagement', description: 'User re-activation email' },
    { value: 'civic_news_alert', label: 'Civic News Alert', description: 'Breaking civic news' }
  ]

  const testApiConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-email', {
        method: 'GET'
      })
      const data = await response.json()
      setApiStatus(data)
    } catch (error) {
      setApiStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
    setIsLoading(false)
  }

  const sendTestEmail = async () => {
    if (!recipientEmail || !recipientName) {
      alert('Please fill in recipient email and name')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailType,
          recipientEmail,
          recipientName,
          customMessage: customMessage || undefined
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              MailerLite Integration Test
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the CivicSense email system with real MailerLite integration and comprehensive analytics tracking.
          </p>
        </div>

        {/* API Status Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              API Connection Status
            </CardTitle>
            <CardDescription>
              Check if the MailerLite API is properly configured and accessible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testApiConnection} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : 'Test API Connection'}
            </Button>

            {apiStatus && (
              <Alert className={apiStatus.status === 'ok' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiStatus.status === 'ok')}
                  <AlertTitle>
                    API Status: <span className={getStatusColor(apiStatus.status)}>{apiStatus.status}</span>
                  </AlertTitle>
                </div>
                <AlertDescription className="mt-2">
                  <div className="space-y-2">
                    <p><strong>Service:</strong> {apiStatus.service || 'Unknown'}</p>
                    <p><strong>Timestamp:</strong> {apiStatus.timestamp || 'Unknown'}</p>
                    {apiStatus.availableEmailTypes && (
                      <div>
                        <p><strong>Available Email Types:</strong></p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {apiStatus.availableEmailTypes.map((type: string) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {apiStatus.error && (
                      <p className="text-red-600"><strong>Error:</strong> {apiStatus.error}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Email Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Email
            </CardTitle>
            <CardDescription>
              Send a test email using the MailerLite service with CivicSense branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Type</label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  {emailTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Recipient Email</label>
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Recipient Name</label>
                <Input
                  placeholder="Test User"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Custom Message (Optional)</label>
              <Textarea
                placeholder="Optional custom message to include in the email..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendTestEmail} 
              disabled={isLoading || !recipientEmail || !recipientName}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.success)}
                Email Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Success/Error Status */}
                <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertTitle className="flex items-center gap-2">
                    {getStatusIcon(result.success)}
                    {result.success ? 'Email Sent Successfully!' : 'Email Failed to Send'}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    {result.success ? (
                      <div>
                        <p>Your test email was sent successfully via MailerLite.</p>
                        {result.messageId && (
                          <p className="mt-1 text-sm"><strong>Message ID:</strong> {result.messageId}</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p>Failed to send email. Please check the configuration.</p>
                        {result.error && (
                          <p className="mt-1 text-sm text-red-700"><strong>Error:</strong> {result.error}</p>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                {/* API Key Status */}
                {result.apiKeyStatus && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">API Key Status</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Success:</strong> {result.apiKeyStatus.success ? 'Yes' : 'No'}</p>
                      <p><strong>Message:</strong> {result.apiKeyStatus.message}</p>
                      {result.apiKeyStatus.error && (
                        <p className="text-red-600"><strong>Error:</strong> {result.apiKeyStatus.error}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Test Data */}
                {result.testData && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Generated Test Data</h4>
                    <div className="text-sm space-y-2">
                      <p><strong>Subject:</strong> {result.testData.subject}</p>
                      <p><strong>Email Type:</strong> {emailType}</p>
                      <p><strong>User Name:</strong> {result.testData.user_name}</p>
                      {result.testData.achievement_title && (
                        <p><strong>Achievement:</strong> {result.testData.achievement_title}</p>
                      )}
                      {result.testData.streak_count && (
                        <p><strong>Streak Count:</strong> {result.testData.streak_count}</p>
                      )}
                      {result.testData.new_level && (
                        <p><strong>New Level:</strong> {result.testData.new_level} - {result.testData.level_title}</p>
                      )}
                      {result.testData.pod_name && (
                        <p><strong>Pod Name:</strong> {result.testData.pod_name}</p>
                      )}
                      {result.testData.personal_note_from_founder && (
                        <div>
                          <p><strong>Personal Note from Tán:</strong></p>
                          <p className="italic text-gray-700 mt-1">"{result.testData.personal_note_from_founder}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Development Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Development Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✅ Integration Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• MailerLite transactional email API</li>
                  <li>• CivicSense brand voice and messaging</li>
                  <li>• Comprehensive test data generation</li>
                  <li>• Error handling and validation</li>
                  <li>• Analytics tracking integration</li>
                  <li>• Survey integration for feedback</li>
                  <li>• Personalized content based on user data</li>
                  <li>• HTML email generation with branding</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🔧 Configuration</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Development Mode:</strong> Emails will be simulated if MAILERLITE_API_KEY is not configured.</li>
                  <li>• <strong>Production Mode:</strong> Real emails sent via MailerLite API.</li>
                  <li>• <strong>Analytics:</strong> All email events are tracked for performance monitoring.</li>
                  <li>• <strong>Templates:</strong> Uses MailerLite's transactional email system.</li>
                  <li>• <strong>Personalization:</strong> Dynamic content based on user civic journey.</li>
                  <li>• <strong>Branding:</strong> Consistent CivicSense voice and messaging.</li>
                  <li>• <strong>Webhooks:</strong> Configure MailerLite webhooks to track email delivery, opens, and clicks in real-time.</li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This test page is for development and testing purposes only. In production, emails are triggered automatically by user actions and system events.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 