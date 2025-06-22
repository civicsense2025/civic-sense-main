'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Shield, 
  Database,
  Mail,
  Globe,
  Key,
  Bell,
  Users,
  FileText,
  Brain,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

interface SystemSettings {
  general: {
    site_name: string
    site_description: string
    admin_email: string
    support_email: string
    timezone: string
    language: string
    maintenance_mode: boolean
    registration_enabled: boolean
  }
  security: {
    password_min_length: number
    require_email_verification: boolean
    session_timeout_minutes: number
    max_login_attempts: number
    enable_2fa: boolean
    allowed_domains: string[]
    rate_limit_requests_per_minute: number
  }
  content: {
    auto_approve_events: boolean
    ai_content_generation_enabled: boolean
    bias_analysis_enabled: boolean
    fact_checking_enabled: boolean
    user_content_moderation: 'strict' | 'moderate' | 'lenient'
    max_quiz_attempts_per_day: number
  }
  notifications: {
    email_notifications_enabled: boolean
    admin_alert_threshold: number
    user_engagement_alerts: boolean
    system_health_alerts: boolean
    weekly_reports_enabled: boolean
  }
  integrations: {
    openai_api_key: string
    anthropic_api_key: string
    sendgrid_api_key: string
    analytics_tracking_id: string
    webhook_url: string
  }
  performance: {
    cache_duration_minutes: number
    max_concurrent_ai_jobs: number
    database_backup_frequency: 'daily' | 'weekly' | 'monthly'
    log_retention_days: number
  }
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // In a real implementation, this would load from your settings table
      // For now, we'll use mock data with reasonable defaults
      const mockSettings: SystemSettings = {
        general: {
          site_name: 'CivicSense',
          site_description: 'Civic education that politicians don\'t want you to have',
          admin_email: 'admin@civicsense.com',
          support_email: 'support@civicsense.com',
          timezone: 'America/New_York',
          language: 'en',
          maintenance_mode: false,
          registration_enabled: true
        },
        security: {
          password_min_length: 8,
          require_email_verification: true,
          session_timeout_minutes: 60,
          max_login_attempts: 5,
          enable_2fa: false,
          allowed_domains: [],
          rate_limit_requests_per_minute: 100
        },
        content: {
          auto_approve_events: false,
          ai_content_generation_enabled: true,
          bias_analysis_enabled: true,
          fact_checking_enabled: true,
          user_content_moderation: 'moderate',
          max_quiz_attempts_per_day: 50
        },
        notifications: {
          email_notifications_enabled: true,
          admin_alert_threshold: 10,
          user_engagement_alerts: true,
          system_health_alerts: true,
          weekly_reports_enabled: true
        },
        integrations: {
          openai_api_key: process.env.OPENAI_API_KEY || '',
          anthropic_api_key: process.env.ANTHROPIC_API_KEY || '',
          sendgrid_api_key: process.env.SENDGRID_API_KEY || '',
          analytics_tracking_id: process.env.ANALYTICS_TRACKING_ID || '',
          webhook_url: ''
        },
        performance: {
          cache_duration_minutes: 60,
          max_concurrent_ai_jobs: 5,
          database_backup_frequency: 'daily',
          log_retention_days: 30
        }
      }

      setSettings(mockSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load system settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      // In a real implementation, this would save to your settings table
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: 'Success',
        description: 'System settings saved successfully'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save system settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return

    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }))
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const testConnection = async (service: string) => {
    try {
      // Mock connection test
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Connection Test',
        description: `${service} connection successful`
      })
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: `Failed to connect to ${service}`,
        variant: 'destructive'
      })
    }
  }

  const exportSettings = () => {
    if (!settings) return

    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `civicsense-settings-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        setSettings(importedSettings)
        toast({
          title: 'Success',
          description: 'Settings imported successfully'
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Invalid settings file',
          variant: 'destructive'
        })
      }
    }
    reader.readAsText(file)
  }

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importSettings}
          />
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>
                Basic site configuration and general preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    value={settings.general.site_name}
                    onChange={(e) => updateSetting('general', 'site_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={settings.general.admin_email}
                    onChange={(e) => updateSetting('general', 'admin_email', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={settings.general.site_description}
                  onChange={(e) => updateSetting('general', 'site_description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select 
                    value={settings.general.language} 
                    onValueChange={(value) => updateSetting('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable site access for maintenance
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={settings.general.maintenance_mode}
                    onCheckedChange={(checked) => updateSetting('general', 'maintenance_mode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="registration-enabled">User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register accounts
                    </p>
                  </div>
                  <Switch
                    id="registration-enabled"
                    checked={settings.general.registration_enabled}
                    onCheckedChange={(checked) => updateSetting('general', 'registration_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Configure authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password-length">Minimum Password Length</Label>
                  <Input
                    id="password-length"
                    type="number"
                    min="6"
                    max="20"
                    value={settings.security.password_min_length}
                    onChange={(e) => updateSetting('security', 'password_min_length', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="15"
                    max="1440"
                    value={settings.security.session_timeout_minutes}
                    onChange={(e) => updateSetting('security', 'session_timeout_minutes', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSetting('security', 'max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="rate-limit">Rate Limit (requests/minute)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.security.rate_limit_requests_per_minute}
                    onChange={(e) => updateSetting('security', 'rate_limit_requests_per_minute', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-verification">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify their email before accessing the platform
                    </p>
                  </div>
                  <Switch
                    id="email-verification"
                    checked={settings.security.require_email_verification}
                    onCheckedChange={(checked) => updateSetting('security', 'require_email_verification', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-2fa">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to enable 2FA for enhanced security
                    </p>
                  </div>
                  <Switch
                    id="enable-2fa"
                    checked={settings.security.enable_2fa}
                    onCheckedChange={(checked) => updateSetting('security', 'enable_2fa', checked)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="allowed-domains">Allowed Domains (one per line)</Label>
                <Textarea
                  id="allowed-domains"
                  value={settings.security.allowed_domains.join('\n')}
                  onChange={(e) => updateSetting('security', 'allowed_domains', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="example.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to allow all domains
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Content Management</span>
              </CardTitle>
              <CardDescription>
                Configure content moderation and AI features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="moderation-level">Content Moderation Level</Label>
                  <Select 
                    value={settings.content.user_content_moderation} 
                    onValueChange={(value: any) => updateSetting('content', 'user_content_moderation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict - Manual approval required</SelectItem>
                      <SelectItem value="moderate">Moderate - AI + human review</SelectItem>
                      <SelectItem value="lenient">Lenient - AI review only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max-quiz-attempts">Max Quiz Attempts per Day</Label>
                  <Input
                    id="max-quiz-attempts"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.content.max_quiz_attempts_per_day}
                    onChange={(e) => updateSetting('content', 'max_quiz_attempts_per_day', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-approve-events">Auto-approve Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve user-submitted events
                    </p>
                  </div>
                  <Switch
                    id="auto-approve-events"
                    checked={settings.content.auto_approve_events}
                    onCheckedChange={(checked) => updateSetting('content', 'auto_approve_events', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-content-generation">AI Content Generation</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered content generation features
                    </p>
                  </div>
                  <Switch
                    id="ai-content-generation"
                    checked={settings.content.ai_content_generation_enabled}
                    onCheckedChange={(checked) => updateSetting('content', 'ai_content_generation_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bias-analysis">Bias Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered bias detection in articles
                    </p>
                  </div>
                  <Switch
                    id="bias-analysis"
                    checked={settings.content.bias_analysis_enabled}
                    onCheckedChange={(checked) => updateSetting('content', 'bias_analysis_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="fact-checking">Fact Checking</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered fact verification
                    </p>
                  </div>
                  <Switch
                    id="fact-checking"
                    checked={settings.content.fact_checking_enabled}
                    onCheckedChange={(checked) => updateSetting('content', 'fact_checking_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Configure system alerts and user notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="alert-threshold">Admin Alert Threshold</Label>
                <Input
                  id="alert-threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.notifications.admin_alert_threshold}
                  onChange={(e) => updateSetting('notifications', 'admin_alert_threshold', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Number of pending items before triggering admin alerts
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system email notifications
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email_notifications_enabled}
                    onCheckedChange={(checked) => updateSetting('notifications', 'email_notifications_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="engagement-alerts">User Engagement Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify admins of significant engagement changes
                    </p>
                  </div>
                  <Switch
                    id="engagement-alerts"
                    checked={settings.notifications.user_engagement_alerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'user_engagement_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="health-alerts">System Health Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify admins of system performance issues
                    </p>
                  </div>
                  <Switch
                    id="health-alerts"
                    checked={settings.notifications.system_health_alerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'system_health_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weekly-reports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Send weekly analytics reports to admins
                    </p>
                  </div>
                  <Switch
                    id="weekly-reports"
                    checked={settings.notifications.weekly_reports_enabled}
                    onCheckedChange={(checked) => updateSetting('notifications', 'weekly_reports_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>API Integrations</span>
              </CardTitle>
              <CardDescription>
                Configure third-party service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="openai-key"
                      type={showSecrets.openai ? 'text' : 'password'}
                      value={settings.integrations.openai_api_key}
                      onChange={(e) => updateSetting('integrations', 'openai_api_key', e.target.value)}
                      placeholder="sk-..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecret('openai')}
                    >
                      {showSecrets.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('OpenAI')}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="anthropic-key"
                      type={showSecrets.anthropic ? 'text' : 'password'}
                      value={settings.integrations.anthropic_api_key}
                      onChange={(e) => updateSetting('integrations', 'anthropic_api_key', e.target.value)}
                      placeholder="sk-ant-..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecret('anthropic')}
                    >
                      {showSecrets.anthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('Anthropic')}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="sendgrid-key"
                      type={showSecrets.sendgrid ? 'text' : 'password'}
                      value={settings.integrations.sendgrid_api_key}
                      onChange={(e) => updateSetting('integrations', 'sendgrid_api_key', e.target.value)}
                      placeholder="SG..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecret('sendgrid')}
                    >
                      {showSecrets.sendgrid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('SendGrid')}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="analytics-id">Analytics Tracking ID</Label>
                  <Input
                    id="analytics-id"
                    value={settings.integrations.analytics_tracking_id}
                    onChange={(e) => updateSetting('integrations', 'analytics_tracking_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={settings.integrations.webhook_url}
                    onChange={(e) => updateSetting('integrations', 'webhook_url', e.target.value)}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Settings</span>
              </CardTitle>
              <CardDescription>
                Configure caching, backups, and system performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cache-duration">Cache Duration (minutes)</Label>
                  <Input
                    id="cache-duration"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.performance.cache_duration_minutes}
                    onChange={(e) => updateSetting('performance', 'cache_duration_minutes', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="max-ai-jobs">Max Concurrent AI Jobs</Label>
                  <Input
                    id="max-ai-jobs"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.performance.max_concurrent_ai_jobs}
                    onChange={(e) => updateSetting('performance', 'max_concurrent_ai_jobs', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backup-frequency">Database Backup Frequency</Label>
                  <Select 
                    value={settings.performance.database_backup_frequency} 
                    onValueChange={(value: any) => updateSetting('performance', 'database_backup_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="log-retention">Log Retention (days)</Label>
                  <Input
                    id="log-retention"
                    type="number"
                    min="7"
                    max="365"
                    value={settings.performance.log_retention_days}
                    onChange={(e) => updateSetting('performance', 'log_retention_days', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">System Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Database</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Cache</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>AI Services</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Email Service</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Warning
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 