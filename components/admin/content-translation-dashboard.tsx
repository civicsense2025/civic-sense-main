"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLanguage } from '@/components/providers/language-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle, Clock, Globe, RefreshCw, Search, Settings, TrendingUp, Users, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ContentStats {
  contentType: string
  totalItems: number
  translatedItems: Record<string, number>
  pendingItems: Record<string, number>
  inProgressItems: Record<string, number>
  errorItems: Record<string, number>
}

interface TranslationJob {
  id: string
  contentType: string
  contentId: string
  targetLanguage: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'review_needed'
  progress: number
  startedAt?: string
  completedAt?: string
  error?: string
  estimatedCompletion?: string
}

interface ContentItem {
  id: string
  title: string
  type: string
  wordCount: number
  languages: string[]
  lastUpdated: string
  priority: 'high' | 'medium' | 'low'
  status: string
}

const CONTENT_TYPES = [
  { value: 'questions', label: 'Quiz Questions', icon: '❓', priority: 1 },
  { value: 'question_topics', label: 'Topics', icon: '📚', priority: 2 },
  { value: 'surveys', label: 'Surveys', icon: '📋', priority: 3 },
  { value: 'survey_questions', label: 'Survey Questions', icon: '❔', priority: 3 },
  { value: 'assessment_questions', label: 'Assessment Questions', icon: '📝', priority: 2 },
  { value: 'public_figures', label: 'Public Figures', icon: '👤', priority: 4 },
  { value: 'glossary', label: 'Glossary Terms', icon: '📖', priority: 4 }
]

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', priority: 1 },
  { code: 'fr', name: 'French', flag: '🇫🇷', priority: 2 },
  { code: 'de', name: 'German', flag: '🇩🇪', priority: 3 },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', priority: 2 },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', priority: 4 },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', priority: 3 },
  { code: 'it', name: 'Italian', flag: '🇮🇹', priority: 4 },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', priority: 4 },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', priority: 5 },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', priority: 5 }
]

export function ContentTranslationDashboard() {
  const { supportedLanguages } = useLanguage()
  const supabase = createClient()
  
  // State management
  const [contentStats, setContentStats] = useState<ContentStats[]>([])
  const [activeJobs, setActiveJobs] = useState<TranslationJob[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Bulk translation state
  const [selectedContentType, setSelectedContentType] = useState<string>('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [batchSize, setBatchSize] = useState(25)
  const [translationInProgress, setTranslationInProgress] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')

  // Load initial data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        loadContentStats(),
        loadActiveJobs(),
        loadContentItems()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadContentStats = async () => {
    const stats: ContentStats[] = []
    
    for (const contentType of CONTENT_TYPES) {
      try {
        const { data, error } = await supabase.rpc('get_content_translation_stats', {
          content_type_param: contentType.value
        })
        
        if (!error && data) {
          stats.push(data)
        }
      } catch (err) {
        console.warn(`Failed to load stats for ${contentType.value}:`, err)
      }
    }
    
    setContentStats(stats)
  }

  const loadActiveJobs = async () => {
    const { data, error } = await supabase
      .from('translation_jobs')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (!error && data) {
      setActiveJobs(data)
    }
  }

  const loadContentItems = async () => {
    // This would need custom RPC function to aggregate content from different tables
    const { data, error } = await supabase.rpc('get_translatable_content_summary', {
      search_term: searchTerm || null,
      status_filter: statusFilter === 'all' ? null : statusFilter,
      language_filter: languageFilter === 'all' ? null : languageFilter,
      limit_count: 100
    })
    
    if (!error && data) {
      setContentItems(data)
    }
  }

  const startBulkTranslation = async () => {
    if (!selectedContentType || selectedLanguages.length === 0) {
      setError('Please select content type and target languages')
      return
    }

    try {
      setTranslationInProgress(true)
      setTranslationProgress(0)
      setError(null)

      const response = await fetch('/api/admin/bulk-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: selectedContentType,
          targetLanguages: selectedLanguages,
          batchSize,
          options: {
            overwriteExisting: false,
            priority: 'normal'
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Bulk translation started:', result)

      // Poll for progress updates
      pollTranslationProgress(result.jobIds)
      
      // Refresh data
      await loadDashboardData()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start bulk translation')
    }
  }

  const pollTranslationProgress = (jobIds: string[]) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('translation_jobs')
          .select('status, progress')
          .in('id', jobIds)

        if (data) {
          const totalProgress = data.reduce((sum, job) => sum + (job.progress || 0), 0) / data.length
          setTranslationProgress(totalProgress)

          const allCompleted = data.every(job => 
            ['completed', 'failed'].includes(job.status)
          )

          if (allCompleted) {
            clearInterval(interval)
            setTranslationInProgress(false)
            setTranslationProgress(100)
            await loadDashboardData()
          }
        }
      } catch (err) {
        console.error('Failed to poll translation progress:', err)
      }
    }, 2000)

    // Clear interval after 30 minutes
    setTimeout(() => {
      clearInterval(interval)
      setTranslationInProgress(false)
    }, 30 * 60 * 1000)
  }

  const cancelTranslationJob = async (jobId: string) => {
    try {
      await supabase
        .from('translation_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)

      await loadActiveJobs()
    } catch (err) {
      console.error('Failed to cancel job:', err)
    }
  }

  const retryFailedJob = async (jobId: string) => {
    try {
      await supabase
        .from('translation_jobs')
        .update({ 
          status: 'pending',
          error: null 
        })
        .eq('id', jobId)

      await loadActiveJobs()
    } catch (err) {
      console.error('Failed to retry job:', err)
    }
  }

  const getCompletionPercentage = (stats: ContentStats, language: string): number => {
    const total = stats.totalItems
    const translated = stats.translatedItems[language] || 0
    return total > 0 ? Math.round((translated / total) * 100) : 0
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'failed': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading translation dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Translation Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor bulk content translations across all languages
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bulk-translate">Bulk Translate</TabsTrigger>
          <TabsTrigger value="active-jobs">Active Jobs</TabsTrigger>
          <TabsTrigger value="content-manager">Content Manager</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content Items</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contentStats.reduce((sum, stat) => sum + stat.totalItems, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {CONTENT_TYPES.length} content types
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently translating
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Languages Supported</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{LANGUAGES.length}</div>
                <p className="text-xs text-muted-foreground">
                  Target languages available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    contentStats.reduce((sum, stat) => {
                      const avgForType = LANGUAGES.reduce((langSum, lang) => 
                        langSum + getCompletionPercentage(stat, lang.code), 0) / LANGUAGES.length
                      return sum + avgForType
                    }, 0) / Math.max(contentStats.length, 1)
                  )}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all languages
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Type Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Translation Progress by Content Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {contentStats.map((stats) => {
                  const contentTypeInfo = CONTENT_TYPES.find(ct => ct.value === stats.contentType)
                  return (
                    <div key={stats.contentType} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{contentTypeInfo?.icon}</span>
                          <span className="font-medium">{contentTypeInfo?.label}</span>
                          <Badge variant="secondary">
                            {stats.totalItems.toLocaleString()} items
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {LANGUAGES.slice(0, 5).map((lang) => {
                          const percentage = getCompletionPercentage(stats, lang.code)
                          const translated = stats.translatedItems[lang.code] || 0
                          
                          return (
                            <div key={lang.code} className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <span>{lang.flag}</span>
                                <span className="text-sm">{lang.name}</span>
                              </div>
                              <Progress value={percentage} className="h-2 mb-1" />
                              <div className="text-xs text-gray-600">
                                {translated}/{stats.totalItems} ({percentage}%)
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Translate Tab */}
        <TabsContent value="bulk-translate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Bulk Translation Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Content Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type to translate" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Size */}
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="1"
                    max="100"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 25)}
                  />
                  <p className="text-xs text-gray-600">
                    Number of items to translate per batch (1-100)
                  </p>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <Label>Target Languages</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {LANGUAGES.map((lang) => (
                    <label
                      key={lang.code}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLanguages.includes(lang.code)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          }
                        }}
                        className="rounded"
                      />
                      <span>{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  Select the languages you want to translate content into
                </p>
              </div>

              {/* Translation Options */}
              <div className="space-y-4">
                <Separator />
                <h3 className="font-medium">Translation Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Skip already translated content</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Overwrite existing translations</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Queue for quality review</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">High priority processing</span>
                  </label>
                </div>
              </div>

              {/* Progress Display */}
              {translationInProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Translation Progress</span>
                    <span className="text-sm text-gray-600">{Math.round(translationProgress)}%</span>
                  </div>
                  <Progress value={translationProgress} className="h-2" />
                  <p className="text-xs text-gray-600">
                    Translating {selectedContentType} to {selectedLanguages.length} language(s)...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={startBulkTranslation}
                  disabled={!selectedContentType || selectedLanguages.length === 0 || translationInProgress}
                  className="flex-1"
                >
                  {translationInProgress ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Start Bulk Translation
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => {
                  setSelectedContentType('')
                  setSelectedLanguages([])
                  setBatchSize(25)
                }}>
                  Reset
                </Button>
              </div>

              {/* Estimation */}
              {selectedContentType && selectedLanguages.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Translation Estimate</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Content Type: {CONTENT_TYPES.find(ct => ct.value === selectedContentType)?.label}</div>
                    <div>Target Languages: {selectedLanguages.map(code => 
                      LANGUAGES.find(l => l.code === code)?.name
                    ).join(', ')}</div>
                    <div>Batch Size: {batchSize} items per batch</div>
                    <div className="font-medium">
                      Estimated time: ~{Math.ceil((selectedLanguages.length * batchSize) / 10)} minutes
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Jobs Tab */}
        <TabsContent value="active-jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Translation Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active translation jobs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {CONTENT_TYPES.find(ct => ct.value === job.contentType)?.label} → 
                            {LANGUAGES.find(l => l.code === job.targetLanguage)?.flag} 
                            {LANGUAGES.find(l => l.code === job.targetLanguage)?.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Started {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Unknown'}
                          </div>
                          {job.error && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {job.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {job.status === 'in_progress' && (
                          <div className="text-right">
                            <div className="text-sm font-medium">{job.progress}%</div>
                            <Progress value={job.progress} className="w-20 h-2" />
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {job.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryFailedJob(job.id)}
                            >
                              Retry
                            </Button>
                          )}
                          {job.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelTranslationJob(job.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Manager Tab */}
        <TabsContent value="content-manager" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Content Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Content</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by title or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="translated">Fully Translated</SelectItem>
                      <SelectItem value="partial">Partially Translated</SelectItem>
                      <SelectItem value="untranslated">Not Translated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Language Filter</Label>
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={loadContentItems} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Content Items</CardTitle>
            </CardHeader>
            <CardContent>
              {contentItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content items found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contentItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <Badge variant="secondary">{item.type}</Badge>
                          <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                            {item.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-x-4">
                          <span>{item.wordCount} words</span>
                          <span>Languages: {item.languages.join(', ')}</span>
                          <span>Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button size="sm">
                          <Globe className="h-4 w-4 mr-1" />
                          Translate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 