/**
 * ============================================================================
 * TRANSLATION ADMIN DASHBOARD
 * ============================================================================
 * Comprehensive translation management system for CivicSense with DeepL integration.
 * Provides bulk translation, language management, job tracking, and usage monitoring.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Globe, 
  Languages, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Upload,
  Settings,
  Activity,
  Clock,
  DollarSign,
  FileText,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Language {
  code: string
  name: string
  native: string
  enabled: boolean
  completion_percentage: number
  total_strings: number
  translated_strings: number
}

interface TranslationJob {
  id: string
  content_type: string
  target_languages: string[]
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  progress: number
  total_items: number
  processed_items: number
  created_at: string
  completed_at?: string
  estimated_cost: number
  actual_cost?: number
  error_message?: string
}

interface TranslationStats {
  total_content_items: number
  translated_items: number
  pending_items: number
  languages_enabled: number
  deepl_usage: {
    character_count: number
    character_limit: number
    usage_percentage: number
  }
  monthly_cost: number
  jobs_this_month: number
}

interface ContentType {
  key: string
  name: string
  description: string
  total_items: number
  translatable_fields: string[]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TranslationAdminDashboard() {
  const { toast } = useToast()
  
  // State management
  const [stats, setStats] = useState<TranslationStats | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [jobs, setJobs] = useState<TranslationJob[]>([])
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  
  // Bulk translation state
  const [selectedContentType, setSelectedContentType] = useState<string>('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [batchSize, setBatchSize] = useState(50)
  const [estimatedCost, setEstimatedCost] = useState(0)
  
  // Settings state
  const [deeplApiKey, setDeeplApiKey] = useState('')
  const [deeplKeyStatus, setDeeplKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown')
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [maxMonthlySpend, setMaxMonthlySpend] = useState(100)

  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================

  const loadTranslationStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/translation/stats')
      if (!response.ok) throw new Error('Failed to load translation stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading translation stats:', error)
      toast({
        title: 'Error',
        description: 'Failed to load translation statistics',
        variant: 'destructive'
      })
    }
  }, [toast])

  const loadLanguages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/translation/languages')
      if (!response.ok) throw new Error('Failed to load languages')
      const data = await response.json()
      setLanguages(data.languages || [])
    } catch (error) {
      console.error('Error loading languages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load language settings',
        variant: 'destructive'
      })
    }
  }, [toast])

  const loadTranslationJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/translation/jobs?limit=20')
      if (!response.ok) throw new Error('Failed to load translation jobs')
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Error loading translation jobs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load translation jobs',
        variant: 'destructive'
      })
    }
  }, [toast])

  const loadContentTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/translation/content-types')
      if (!response.ok) throw new Error('Failed to load content types')
      const data = await response.json()
      setContentTypes(data.content_types || [])
    } catch (error) {
      console.error('Error loading content types:', error)
      setContentTypes([
        { key: 'question_topics', name: 'Question Topics', description: 'Quiz topic titles and descriptions', total_items: 0, translatable_fields: ['topic_title', 'description'] },
        { key: 'quiz_questions', name: 'Quiz Questions', description: 'Individual quiz questions and answers', total_items: 0, translatable_fields: ['question_text', 'options', 'explanation'] },
        { key: 'glossary_terms', name: 'Glossary Terms', description: 'Civic terms and definitions', total_items: 0, translatable_fields: ['term', 'definition', 'examples'] },
        { key: 'ui_strings', name: 'UI Strings', description: 'Interface text and labels', total_items: 0, translatable_fields: ['text'] }
      ])
    }
  }, [])

  // Load all data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      await Promise.all([
        loadTranslationStats(),
        loadLanguages(),
        loadTranslationJobs(),
        loadContentTypes()
      ])
      setLoading(false)
    }
    loadAllData()
  }, [loadTranslationStats, loadLanguages, loadTranslationJobs, loadContentTypes])

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleToggleLanguage = async (languageCode: string, enabled: boolean) => {
    setActionLoading(prev => ({ ...prev, [`toggle-${languageCode}`]: true }))
    
    try {
      const response = await fetch('/api/admin/translation/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'toggle',
          language_code: languageCode,
          enabled 
        })
      })
      
      if (!response.ok) throw new Error('Failed to update language setting')
      
      await loadLanguages()
      await loadTranslationStats()
      
      toast({
        title: 'Success',
        description: `${enabled ? 'Enabled' : 'Disabled'} ${languageCode.toUpperCase()} translations`
      })
    } catch (error) {
      console.error('Error toggling language:', error)
      toast({
        title: 'Error',
        description: 'Failed to update language setting',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [`toggle-${languageCode}`]: false }))
    }
  }

  const handleStartBulkTranslation = async () => {
    if (!selectedContentType || selectedLanguages.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select content type and target languages',
        variant: 'destructive'
      })
      return
    }

    setActionLoading(prev => ({ ...prev, 'bulk-translate': true }))
    
    try {
      const response = await fetch('/api/admin/translation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: selectedContentType,
          target_languages: selectedLanguages,
          batch_size: batchSize,
          options: {
            overwrite_existing: false,
            priority: 'normal'
          }
        })
      })
      
      if (!response.ok) throw new Error('Failed to start bulk translation')
      
      const result = await response.json()
      
      toast({
        title: 'Success',
        description: `Started bulk translation job: ${result.job.id}`
      })
      
      // Reset selection and reload data
      setSelectedContentType('')
      setSelectedLanguages([])
      await Promise.all([loadTranslationJobs(), loadTranslationStats()])
      
    } catch (error) {
      console.error('Error starting bulk translation:', error)
      toast({
        title: 'Error',
        description: 'Failed to start bulk translation',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, 'bulk-translate': false }))
    }
  }

  const handleJobAction = async (jobId: string, action: 'pause' | 'resume' | 'cancel') => {
    setActionLoading(prev => ({ ...prev, [`job-${jobId}-${action}`]: true }))
    
    try {
      const response = await fetch(`/api/admin/translation/jobs/${jobId}/${action}`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error(`Failed to ${action} job`)
      
      toast({
        title: 'Success',
        description: `Job ${action}d successfully`
      })
      
      await loadTranslationJobs()
      
    } catch (error) {
      console.error(`Error ${action}ing job:`, error)
      toast({
        title: 'Error',
        description: `Failed to ${action} job`,
        variant: 'destructive'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [`job-${jobId}-${action}`]: false }))
    }
  }

  const testDeepLConnection = async () => {
    if (!deeplApiKey.trim()) {
      setDeeplKeyStatus('invalid')
      return
    }

    setActionLoading(prev => ({ ...prev, 'test-deepl': true }))
    
    try {
      const response = await fetch('/api/admin/translation/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: deeplApiKey })
      })
      
      const result = await response.json()
      setDeeplKeyStatus(result.valid ? 'valid' : 'invalid')
      
      if (result.valid) {
        toast({
          title: 'Success',
          description: 'DeepL API connection successful'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Invalid DeepL API key',
          variant: 'destructive'
        })
      }
    } catch (error) {
      setDeeplKeyStatus('invalid')
      toast({
        title: 'Error',
        description: 'Failed to test DeepL connection',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, 'test-deepl': false }))
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getJobStatusBadge = (status: TranslationJob['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      paused: 'outline',
      completed: 'success',
      failed: 'destructive'
    } as const

    const icons = {
      pending: Clock,
      running: RefreshCw,
      paused: Pause,
      completed: CheckCircle,
      failed: XCircle
    }

    const Icon = icons[status]
    
    return (
      <Badge variant={variants[status] as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const calculateEstimatedCost = useCallback(() => {
    if (!selectedContentType || selectedLanguages.length === 0) return 0
    
    const contentType = contentTypes.find(ct => ct.key === selectedContentType)
    if (!contentType) return 0
    
    // Rough estimation: ~100 characters per item, $20 per 1M characters
    const avgCharsPerItem = 100
    const totalChars = contentType.total_items * avgCharsPerItem * selectedLanguages.length
    const costPerChar = 20 / 1000000 // $20 per million characters
    
    return totalChars * costPerChar
  }, [selectedContentType, selectedLanguages, contentTypes])

  useEffect(() => {
    setEstimatedCost(calculateEstimatedCost())
  }, [calculateEstimatedCost])

  // ============================================================================
  // RENDER LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading translation dashboard...</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Translation Management</h1>
          <p className="text-gray-600">Manage multilingual content with DeepL integration</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_content_items.toLocaleString()}</div>
              <p className="text-xs text-gray-600">
                {stats.translated_items.toLocaleString()} translated
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Languages Enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.languages_enabled}</div>
              <p className="text-xs text-gray-600">
                {languages.length} total available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">DeepL Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deepl_usage.usage_percentage}%</div>
              <Progress value={stats.deepl_usage.usage_percentage} className="mt-2" />
              <p className="text-xs text-gray-600 mt-1">
                {stats.deepl_usage.character_count.toLocaleString()} / {stats.deepl_usage.character_limit.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthly_cost)}</div>
              <p className="text-xs text-gray-600">
                {stats.jobs_this_month} jobs this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bulk-translate">Bulk Translate</TabsTrigger>
          <TabsTrigger value="jobs">Translation Jobs</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Types
                </CardTitle>
                <CardDescription>
                  Translation status by content type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentTypes.map(contentType => {
                  const translatedItems = Math.floor(contentType.total_items * 0.7) // Mock data
                  const completionPercentage = contentType.total_items > 0 
                    ? Math.round((translatedItems / contentType.total_items) * 100)
                    : 0
                  
                  return (
                    <div key={contentType.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{contentType.name}</h4>
                          <p className="text-sm text-gray-600">{contentType.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{completionPercentage}%</div>
                          <div className="text-sm text-gray-600">
                            {translatedItems}/{contentType.total_items} items
                          </div>
                        </div>
                      </div>
                      <Progress value={completionPercentage} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Jobs
                </CardTitle>
                <CardDescription>
                  Latest translation activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.slice(0, 5).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getJobStatusBadge(job.status)}
                          <span className="font-medium">{job.content_type}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {job.target_languages.join(', ')} • {job.processed_items}/{job.total_items} items
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{job.progress}%</div>
                        <div className="text-xs text-gray-600">
                          {job.actual_cost ? formatCurrency(job.actual_cost) : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {jobs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No translation jobs yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bulk Translate Tab */}
        <TabsContent value="bulk-translate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Start Bulk Translation</CardTitle>
              <CardDescription>
                Translate multiple content items across languages using DeepL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map(contentType => (
                        <SelectItem key={contentType.key} value={contentType.key}>
                          {contentType.name} ({contentType.total_items} items)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Languages</Label>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                    {languages.filter(lang => lang.enabled).map(language => (
                      <label key={language.code} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedLanguages.includes(language.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLanguages(prev => [...prev, language.code])
                            } else {
                              setSelectedLanguages(prev => prev.filter(code => code !== language.code))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{language.native} ({language.code})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                    min={1}
                    max={100}
                  />
                  <p className="text-xs text-gray-600">
                    Number of items to process at once (1-100)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Cost</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(estimatedCost)}
                  </div>
                  <p className="text-xs text-gray-600">
                    Based on average content length
                  </p>
                </div>
              </div>

              {selectedContentType && selectedLanguages.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will translate {contentTypes.find(ct => ct.key === selectedContentType)?.total_items || 0} items 
                    into {selectedLanguages.length} language(s). 
                    Estimated cost: {formatCurrency(estimatedCost)}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleStartBulkTranslation}
                disabled={!selectedContentType || selectedLanguages.length === 0 || actionLoading['bulk-translate']}
                className="w-full"
              >
                {actionLoading['bulk-translate'] ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Translation...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Bulk Translation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translation Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Translation Jobs</CardTitle>
              <CardDescription>
                Monitor and manage ongoing translation jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getJobStatusBadge(job.status)}
                          <span className="font-medium">{job.content_type}</span>
                          <span className="text-sm text-gray-600">#{job.id.slice(-8)}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Languages: {job.target_languages.join(', ')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {job.status === 'running' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJobAction(job.id, 'pause')}
                            disabled={actionLoading[`job-${job.id}-pause`]}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {job.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJobAction(job.id, 'resume')}
                            disabled={actionLoading[`job-${job.id}-resume`]}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress: {job.processed_items} / {job.total_items} items</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} />
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                      <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                      <span>Cost: {job.actual_cost ? formatCurrency(job.actual_cost) : `~${formatCurrency(job.estimated_cost)}`}</span>
                    </div>
                    
                    {job.error_message && (
                      <Alert className="mt-3">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{job.error_message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
                
                {jobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">No translation jobs</h3>
                    <p className="text-sm">Start a bulk translation to see jobs here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language Settings</CardTitle>
              <CardDescription>
                Enable or disable languages for translation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {languages.map(language => (
                  <div key={language.code} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">{language.native}</div>
                        <div className="text-sm text-gray-600">{language.name} ({language.code})</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`font-medium ${language.completion_percentage >= 80 ? 'text-green-600' : language.completion_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {language.completion_percentage}% complete
                        </div>
                        <div className="text-sm text-gray-600">
                          {language.translated_strings}/{language.total_strings} strings
                        </div>
                      </div>
                      
                      <Switch
                        checked={language.enabled}
                        onCheckedChange={(checked) => handleToggleLanguage(language.code, checked)}
                        disabled={actionLoading[`toggle-${language.code}`]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DeepL Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>DeepL Configuration</CardTitle>
                <CardDescription>
                  Configure DeepL API integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={deeplApiKey}
                      onChange={(e) => setDeeplApiKey(e.target.value)}
                      placeholder="Enter DeepL API key"
                    />
                    <Button
                      variant="outline"
                      onClick={testDeepLConnection}
                      disabled={actionLoading['test-deepl']}
                    >
                      {actionLoading['test-deepl'] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </Button>
                  </div>
                  {deeplKeyStatus === 'valid' && (
                    <p className="text-sm text-green-600">✓ API key is valid</p>
                  )}
                  {deeplKeyStatus === 'invalid' && (
                    <p className="text-sm text-red-600">✗ Invalid API key</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Translation Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Translation Settings</CardTitle>
                <CardDescription>
                  Configure automatic translation behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-translate new content</Label>
                    <p className="text-sm text-gray-600">
                      Automatically translate new content when published
                    </p>
                  </div>
                  <Switch
                    checked={autoTranslate}
                    onCheckedChange={setAutoTranslate}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Monthly spending limit</Label>
                  <Input
                    type="number"
                    value={maxMonthlySpend}
                    onChange={(e) => setMaxMonthlySpend(parseInt(e.target.value) || 100)}
                    min={0}
                    max={10000}
                  />
                  <p className="text-sm text-gray-600">
                    Maximum monthly cost for translations (USD)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Export/Import */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export and import translation data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Translations
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Translations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export both named and default exports for maximum compatibility
export { TranslationAdminDashboard }
export default TranslationAdminDashboard 