"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/admin-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Users, 
  Calendar, 
  Database,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  Settings,
  Camera,
  Brain,
  RefreshCw,
  Target,
  Globe,
  Archive,
  Image,
  BookOpen,
  School,
  Activity,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface SourceQualityMetric {
  source_system: string
  total_documents: number
  summary_completeness: number
  full_text_completeness: number
  avg_content_quality: number
  last_sync: string
  sync_status: 'active' | 'error' | 'deprecated'
}

interface EntityStats {
  legislative_documents: number
  congressional_proceedings: number
  civic_analyses: number
  extracted_entities: number
  total_sources: number
  total_photos: number
  quiz_topics_generated: number
  quiz_questions_generated: number
}

interface RecentSync {
  id: string
  source_system: string
  entity_type: string
  processed: number
  succeeded: number
  failed: number
  timestamp: string
  errors: string[]
}

interface CongressSession {
  congress_number: number
  session_name: string
  start_year: number
  end_year: number
  is_current: boolean
  members_synced: number
  bills_synced: number
  hearings_synced: number
  photos_downloaded: number
}

interface PhotoStats {
  total_photos: number
  congress_119_photos: number
  congress_118_photos: number
  congress_117_photos: number
  optimized_versions: number
  storage_used_mb: number
  failed_downloads: number
  pending_updates: number
}

interface QuizGenerationStats {
  total_topics_generated: number
  total_questions_generated: number
  bills_processed: number
  hearings_processed: number
  committee_docs_processed: number
  avg_questions_per_topic: number
  last_generation: string
}

export default function CongressionalAdminPage() {
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [entityStats, setEntityStats] = useState<EntityStats | null>(null)
  const [sourceQuality, setSourceQuality] = useState<SourceQualityMetric[]>([])
  const [recentSyncs, setRecentSyncs] = useState<RecentSync[]>([])
  const [congressSessions, setCongressSessions] = useState<CongressSession[]>([])
  const [photoStats, setPhotoStats] = useState<PhotoStats | null>(null)
  const [quizStats, setQuizStats] = useState<QuizGenerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedCongress, setSelectedCongress] = useState<number>(119)
  const [syncProgress, setSyncProgress] = useState<{ [key: string]: number }>({})
  const [activeTab, setActiveTab] = useState('overview')

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard?error=admin_access_denied')
      return
    }
  }, [adminLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData()
    }
  }, [isAdmin])

  // Don't render anything while checking admin access
  if (adminLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Don't render anything for non-admin users
  if (!isAdmin) {
    return null
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all congressional data in parallel
      const [
        statsResponse, 
        qualityResponse, 
        syncsResponse,
        congressSessionsResponse,
        photoStatsResponse,
        quizStatsResponse
      ] = await Promise.all([
        fetch('/api/admin/congressional/stats'),
        fetch('/api/admin/congressional/source-quality'),
        fetch('/api/admin/congressional/sync-history'),
        fetch('/api/admin/congressional/congress-sessions'),
        fetch('/api/admin/congressional/photos/stats'),
        fetch('/api/admin/congressional/quiz-stats')
      ])
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setEntityStats(stats.data)
      }
      
      if (qualityResponse.ok) {
        const quality = await qualityResponse.json()
        setSourceQuality(Array.isArray(quality.data) ? quality.data : [])
      } else {
        console.warn('Failed to load source quality data')
        setSourceQuality([])
      }
      
      if (syncsResponse.ok) {
        const syncs = await syncsResponse.json()
        setRecentSyncs(syncs.data)
      }

      if (congressSessionsResponse.ok) {
        const sessions = await congressSessionsResponse.json()
        setCongressSessions(sessions.data)
      }

      if (photoStatsResponse.ok) {
        const photos = await photoStatsResponse.json()
        setPhotoStats(photos.data)
      }

      if (quizStatsResponse.ok) {
        const quiz = await quizStatsResponse.json()
        setQuizStats(quiz.data)
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (sourceSystem: string) => {
    try {
      setSyncing(true)
      
      const response = await fetch('/api/admin/congressional/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_system: sourceSystem,
          sync_type: 'incremental',
          days_back: 7
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await loadDashboardData() // Refresh data
      } else {
        console.error('Sync failed:', result.error)
      }
      
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleMultiCongressSync = async (congressNumbers: number[]) => {
    try {
      setSyncing(true)
      setSyncProgress({})
      
      const response = await fetch('/api/admin/sync/congressional-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncBills: true,
          syncMembers: true,
          syncHearings: true,
          syncCommitteeDocuments: true,
          generateEvents: true,
          extractEntities: true,
          congressNumbers,
          limit: 100
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Multi-congress sync completed:', result.results)
        await loadDashboardData()
      } else {
        console.error('❌ Multi-congress sync failed:', result.error)
      }
      
    } catch (error) {
      console.error('Multi-congress sync error:', error)
    } finally {
      setSyncing(false)
      setSyncProgress({})
    }
  }

  const handlePhotoProcessing = async (congressNumber?: number) => {
    try {
      setSyncing(true)
      
      const response = await fetch('/api/admin/congressional/photos/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          congress_number: congressNumber || selectedCongress,
          force_refresh: false
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Photo processing completed:', result.results)
        await loadDashboardData()
      } else {
        console.error('❌ Photo processing failed:', result.error)
      }
      
    } catch (error) {
      console.error('Photo processing error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleQuizGeneration = async () => {
    try {
      setSyncing(true)
      
      const response = await fetch('/api/admin/congressional/generate-quiz-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          process_bills: true,
          process_hearings: true,
          process_committee_docs: true,
          congress_number: selectedCongress,
          max_documents: 50
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Quiz generation completed:', result.results)
        await loadDashboardData()
      } else {
        console.error('❌ Quiz generation failed:', result.error)
      }
      
    } catch (error) {
      console.error('Quiz generation error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getSourceStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'deprecated': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQualityScore = (completeness: number, quality: number) => {
    const combined = (completeness * 0.4) + (quality * 0.6)
    if (combined >= 80) return { score: 'Excellent', color: 'text-green-600' }
    if (combined >= 60) return { score: 'Good', color: 'text-blue-600' }
    if (combined >= 40) return { score: 'Fair', color: 'text-yellow-600' }
    return { score: 'Poor', color: 'text-red-600' }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Congressional Data Management
        </h1>
        <p className="text-slate-600">
          Entity-based congressional data from multiple sources
        </p>
      </div>

                {/* Entity Stats */}
          {entityStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Bills & Resolutions</CardTitle>
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-slate-900">
                    {entityStats.legislative_documents.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Legislative documents
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Hearings & Proceedings</CardTitle>
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-slate-900">
                    {entityStats.congressional_proceedings.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Congressional proceedings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">CivicSense Analyses</CardTitle>
                    <BarChart3 className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-slate-900">
                    {entityStats.civic_analyses.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    AI-generated analyses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Extracted Entities</CardTitle>
                    <Users className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-slate-900">
                    {entityStats.extracted_entities.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    People & organizations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Member Photos</CardTitle>
                    <Camera className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-green-600">
                    {entityStats.total_photos.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Downloaded & optimized
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Quiz Topics</CardTitle>
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-blue-600">
                    {entityStats.quiz_topics_generated.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Generated from docs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Quiz Questions</CardTitle>
                    <School className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-purple-600">
                    {entityStats.quiz_questions_generated.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Educational content
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Data Sources</CardTitle>
                    <Database className="h-4 w-4 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold text-slate-900">
                    {entityStats.total_sources}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Active source connections
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

                {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sync">Multi-Congress Sync</TabsTrigger>
              <TabsTrigger value="photos">Photo Management</TabsTrigger>
              <TabsTrigger value="quiz">Quiz Generation</TabsTrigger>
              <TabsTrigger value="sources">Source Quality</TabsTrigger>
              <TabsTrigger value="entities">Entity Explorer</TabsTrigger>
            </TabsList>

                    {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Congress Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Congress Sessions</CardTitle>
                    <CardDescription>
                      Multi-congress data management and synchronization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {congressSessions.length > 0 ? (
                        congressSessions.map((session, index) => (
                          <div key={`session-${session.congress_number}-${index}`} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-slate-900">
                                  {session.congress_number}th Congress
                                </h3>
                                {session.is_current && (
                                  <Badge className="bg-green-100 text-green-700">Current</Badge>
                                )}
                              </div>
                              <span className="text-sm text-slate-500">
                                {session.start_year}-{session.end_year}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-slate-500">Members</div>
                                <div className="font-semibold">{session.members_synced}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Bills</div>
                                <div className="font-semibold">{session.bills_synced}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Hearings</div>
                                <div className="font-semibold">{session.hearings_synced}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Photos</div>
                                <div className="font-semibold">{session.photos_downloaded}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No congress sessions data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Photo Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Photo Management Statistics</CardTitle>
                    <CardDescription>
                      Local photo storage and optimization status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {photoStats ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                              {photoStats.total_photos}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Photos</div>
                          </div>
                          <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round(photoStats.storage_used_mb)}MB
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Storage Used</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">119th Congress</span>
                            <Badge variant="secondary">{photoStats.congress_119_photos}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">118th Congress</span>
                            <Badge variant="secondary">{photoStats.congress_118_photos}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">117th Congress</span>
                            <Badge variant="secondary">{photoStats.congress_117_photos}</Badge>
                          </div>
                        </div>

                        {photoStats.failed_downloads > 0 && (
                          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-700 dark:text-red-300">
                                {photoStats.failed_downloads} photos failed to download
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No photo statistics available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quiz Generation Statistics */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Educational Content Generation</CardTitle>
                    <CardDescription>
                      Quiz topics and questions generated from congressional documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {quizStats ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {quizStats.total_topics_generated}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Topics Generated</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {quizStats.total_questions_generated}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Questions Generated</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {quizStats.avg_questions_per_topic.toFixed(1)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Avg per Topic</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <div className="text-xl font-bold text-orange-600">
                              {quizStats.bills_processed + quizStats.hearings_processed + quizStats.committee_docs_processed}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Documents Processed</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Bills Processed</span>
                              <Badge variant="outline">{quizStats.bills_processed}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Hearings Processed</span>
                              <Badge variant="outline">{quizStats.hearings_processed}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Committee Docs</span>
                              <Badge variant="outline">{quizStats.committee_docs_processed}</Badge>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-sm text-slate-600 mb-2">Last Generation</div>
                            <div className="text-sm font-medium">
                              {quizStats.last_generation ? 
                                format(new Date(quizStats.last_generation), 'MMM d, yyyy h:mm a') : 
                                'No recent generation'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No quiz generation statistics available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Photo Management Tab */}
            <TabsContent value="photos" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Photo Processing Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Congressional Photo Management</CardTitle>
                    <CardDescription>
                      Local photo storage with multi-resolution optimization for all congressional members
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Congress Selection for Photos */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Congress for Photo Processing</label>
                      <Select value={selectedCongress.toString()} onValueChange={(value) => setSelectedCongress(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="119">119th Congress (2025-2027) - Current</SelectItem>
                          <SelectItem value="118">118th Congress (2023-2025)</SelectItem>
                          <SelectItem value="117">117th Congress (2021-2023)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Photo Processing Options */}
                    <div className="space-y-3">
                      <Button 
                        onClick={() => handlePhotoProcessing(selectedCongress)}
                        disabled={syncing}
                        className="w-full justify-start"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Process Photos for {selectedCongress}th Congress
                      </Button>
                      
                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            // Process photos for all congress sessions
                            for (const congress of [117, 118, 119]) {
                              await handlePhotoProcessing(congress)
                            }
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Process All Congress Photos (117th-119th)
                      </Button>
                      
                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            const response = await fetch('/api/admin/congressional/photos/refresh', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                congress_number: selectedCongress,
                                force_refresh: true,
                                check_updates_only: false
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadDashboardData()
                            }
                          } catch (error) {
                            console.error('Photo refresh error:', error)
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Force Refresh Photos ({selectedCongress}th)
                      </Button>

                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            const response = await fetch('/api/admin/congressional/photos/cleanup', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                remove_outdated: true,
                                remove_failed: true,
                                congress_number: selectedCongress
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadDashboardData()
                            }
                          } catch (error) {
                            console.error('Photo cleanup error:', error)
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Cleanup Old Photos
                      </Button>
                    </div>
                    
                    {syncing && (
                      <div className="text-sm text-slate-600 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                        Processing congressional photos...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Photo Storage Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Photo Storage Details</CardTitle>
                    <CardDescription>
                      Local file structure: public/images/congress/{'{congress_number}'}/{'{bioguide_id}'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {photoStats ? (
                      <div className="space-y-4">
                        {/* Storage Overview */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">
                              {photoStats.total_photos}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Original Photos</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div className="text-xl font-bold text-green-600">
                              {photoStats.optimized_versions}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Optimized Versions</div>
                          </div>
                        </div>

                        {/* Photo Optimization Details */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-slate-900">Photo Optimization</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Thumbnail (150x150)</span>
                              <Badge variant="secondary">{photoStats.total_photos} files</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Medium (300x300)</span>
                              <Badge variant="secondary">{photoStats.total_photos} files</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Large (600x600)</span>
                              <Badge variant="secondary">{photoStats.total_photos} files</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Storage by Congress */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-slate-900">Storage by Congress</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">119th Congress</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{photoStats.congress_119_photos}</Badge>
                                <span className="text-xs text-slate-500">
                                  ~{Math.round(photoStats.congress_119_photos * 4 * 0.05)}MB
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">118th Congress</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{photoStats.congress_118_photos}</Badge>
                                <span className="text-xs text-slate-500">
                                  ~{Math.round(photoStats.congress_118_photos * 4 * 0.05)}MB
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">117th Congress</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{photoStats.congress_117_photos}</Badge>
                                <span className="text-xs text-slate-500">
                                  ~{Math.round(photoStats.congress_117_photos * 4 * 0.05)}MB
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Issues and Maintenance */}
                        {(photoStats.failed_downloads > 0 || photoStats.pending_updates > 0) && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-slate-900">Issues & Maintenance</h4>
                            {photoStats.failed_downloads > 0 && (
                              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <span className="text-sm text-red-700 dark:text-red-300">
                                    {photoStats.failed_downloads} photos failed to download
                                  </span>
                                </div>
                              </div>
                            )}
                            {photoStats.pending_updates > 0 && (
                              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                                    {photoStats.pending_updates} photos need updates
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* File Structure Info */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Local File Structure</h4>
                          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                            <div>public/images/congress/</div>
                            <div>&nbsp;&nbsp;├── 119/</div>
                            <div>&nbsp;&nbsp;&nbsp;&nbsp;├── A000001/</div>
                            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── thumbnail.jpg (150x150)</div>
                            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── medium.jpg (300x300)</div>
                            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── large.jpg (600x600)</div>
                            <div>&nbsp;&nbsp;├── 118/ ...</div>
                            <div>&nbsp;&nbsp;└── 117/ ...</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No photo statistics available</p>
                        <p className="text-xs mt-1">Process photos to see details here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Quiz Generation Tab */}
            <TabsContent value="quiz" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quiz Generation Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Educational Content Generation</CardTitle>
                    <CardDescription>
                      Generate quiz topics and questions from congressional documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Congress Selection for Quiz */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Congress for Content Generation</label>
                      <Select value={selectedCongress.toString()} onValueChange={(value) => setSelectedCongress(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="119">119th Congress (2025-2027) - Current</SelectItem>
                          <SelectItem value="118">118th Congress (2023-2025)</SelectItem>
                          <SelectItem value="117">117th Congress (2021-2023)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Generation Options */}
                    <div className="space-y-3">
                      <Button 
                        onClick={handleQuizGeneration}
                        disabled={syncing}
                        className="w-full justify-start"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Quiz Content from All Documents
                      </Button>
                      
                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            const response = await fetch('/api/admin/congressional/generate-quiz-content', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                process_bills: true,
                                process_hearings: false,
                                process_committee_docs: false,
                                congress_number: selectedCongress,
                                max_documents: 25
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadDashboardData()
                            }
                          } catch (error) {
                            console.error('Bills quiz generation error:', error)
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate from Bills Only
                      </Button>

                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            const response = await fetch('/api/admin/congressional/generate-quiz-content', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                process_bills: false,
                                process_hearings: true,
                                process_committee_docs: true,
                                congress_number: selectedCongress,
                                max_documents: 15
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadDashboardData()
                            }
                          } catch (error) {
                            console.error('Hearings quiz generation error:', error)
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Generate from Hearings & Docs
                      </Button>

                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            const response = await fetch('/api/admin/congressional/optimize-quiz-content', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                congress_number: selectedCongress,
                                enhance_existing: true,
                                add_difficulty_levels: true,
                                improve_explanations: true
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadDashboardData()
                            }
                          } catch (error) {
                            console.error('Quiz optimization error:', error)
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Optimize Existing Content
                      </Button>
                    </div>
                    
                    {syncing && (
                      <div className="text-sm text-slate-600 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                        Generating educational content from congressional documents...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quiz Generation Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Generation Statistics</CardTitle>
                    <CardDescription>
                      Educational content performance and metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {quizStats ? (
                      <div className="space-y-4">
                        {/* Generation Overview */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">
                              {quizStats.total_topics_generated}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Topics</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <div className="text-xl font-bold text-purple-600">
                              {quizStats.total_questions_generated}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Questions</div>
                          </div>
                        </div>

                        {/* Document Processing Stats */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-slate-900">Document Processing</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Bills Processed</span>
                              <Badge variant="outline">{quizStats.bills_processed}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Hearings Processed</span>
                              <Badge variant="outline">{quizStats.hearings_processed}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Committee Documents</span>
                              <Badge variant="outline">{quizStats.committee_docs_processed}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Avg Questions/Topic</span>
                              <Badge variant="secondary">{quizStats.avg_questions_per_topic.toFixed(1)}</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Quality Metrics */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-slate-900">Content Quality</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Key Takeaways Extracted</span>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Power Dynamics Analysis</span>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Difficulty Levels</span>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Source Attribution</span>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                        </div>

                        {/* Last Generation Info */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Last Generation</h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {quizStats.last_generation ? 
                              format(new Date(quizStats.last_generation), 'MMM d, yyyy h:mm a') : 
                              'No recent generation activity'
                            }
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <School className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No quiz statistics available</p>
                        <p className="text-xs mt-1">Generate content to see metrics here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Source Quality Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Source Quality Metrics</CardTitle>
              <CardDescription>
                Compare data completeness and quality across different sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(sourceQuality) && sourceQuality.length > 0 ? sourceQuality.map((source) => {
                  const quality = getQualityScore(source.summary_completeness, source.avg_content_quality)
                  
                  return (
                    <div key={source.source_system} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-slate-900">
                            {source.source_system.replace('_', ' ').toUpperCase()}
                          </h3>
                          <Badge className={getSourceStatusColor(source.sync_status)}>
                            {source.sync_status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`text-sm font-medium ${quality.color}`}>
                            {quality.score}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => handleSync(source.source_system)}
                            disabled={syncing}
                          >
                            <Zap className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                            Sync Now
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500">Documents</div>
                          <div className="font-semibold">{source.total_documents.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Summary Completeness</div>
                          <div className="font-semibold">{Math.round(source.summary_completeness * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Full Text Available</div>
                          <div className="font-semibold">{Math.round(source.full_text_completeness * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Avg Quality Score</div>
                          <div className="font-semibold">{Math.round(source.avg_content_quality)}/100</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-500">
                        Last sync: {format(new Date(source.last_sync), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center py-8 text-slate-500">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No source quality data available</p>
                    <p className="text-xs mt-1">Data will appear here after sync operations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

                    {/* Multi-Congress Sync Tab */}
            <TabsContent value="sync" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Multi-Congress Sync Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Multi-Congress Sync Management</CardTitle>
                    <CardDescription>
                      Sync data across multiple congressional sessions with enhanced AI analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Congress Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Congress Session</label>
                      <Select value={selectedCongress.toString()} onValueChange={(value) => setSelectedCongress(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="119">119th Congress (2025-2027) - Current</SelectItem>
                          <SelectItem value="118">118th Congress (2023-2025)</SelectItem>
                          <SelectItem value="117">117th Congress (2021-2023)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sync Options */}
                    <div className="space-y-3">
                      <Button 
                        onClick={() => handleMultiCongressSync([selectedCongress])}
                        disabled={syncing}
                        className="w-full justify-start"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Sync Selected Congress ({selectedCongress}th) - Full
                      </Button>
                      
                      <Button 
                        onClick={() => handleMultiCongressSync([117, 118, 119])}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Sync All Congress Sessions (117th-119th)
                      </Button>
                      
                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            const response = await fetch('/api/admin/sync/congressional-enhanced', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                syncBills: true,
                                syncMembers: false,
                                syncHearings: false,
                                congressNumbers: [selectedCongress],
                                limit: 25
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadDashboardData()
                            }
                          } catch (error) {
                            console.error('Sync error:', error)
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Sync Bills Only (Congress.gov)
                      </Button>

                      <Button 
                        onClick={async () => {
                          setSyncing(true)
                          try {
                            const response = await fetch('/api/admin/sync/congressional-enhanced', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                syncBills: false,
                                syncMembers: false,
                                syncHearings: true,
                                syncCommitteeDocuments: true,
                                congressNumbers: [selectedCongress],
                                generateEvents: true,
                                extractEntities: true,
                                limit: 10
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadDashboardData()
                            }
                          } catch (error) {
                            console.error('Sync error:', error)
                          } finally {
                            setSyncing(false)
                          }
                        }}
                        disabled={syncing}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Sync Hearings & Docs (GovInfo)
                      </Button>
                    </div>
                    
                    {syncing && (
                      <div className="space-y-3">
                        <div className="text-sm text-slate-600 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                          Processing multi-congress sync with AI analysis...
                        </div>
                        {Object.keys(syncProgress).length > 0 && (
                          <div className="space-y-2">
                            {Object.entries(syncProgress).map(([key, progress]) => (
                              <div key={key}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{key}</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Sync History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sync Activity</CardTitle>
                    <CardDescription>
                      Latest synchronization results across all congress sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSyncs.length > 0 ? (
                        recentSyncs.slice(0, 8).map((sync) => (
                          <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">
                                  {(sync.source_system || 'UNKNOWN').replace('_', ' ').toUpperCase()}
                                </span>
                                {sync.failed > 0 ? (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                {sync.succeeded || 0}/{sync.processed || 0} successful • {sync.entity_type || 'Unknown'}
                              </div>
                              {sync.errors && sync.errors.length > 0 && (
                                <div className="text-xs text-red-600">
                                  {sync.errors.length} errors
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {sync.timestamp ? format(new Date(sync.timestamp), 'MMM d, h:mm a') : 'No timestamp'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No recent sync activity</p>
                          <p className="text-xs mt-1">Start a sync to see activity here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

        {/* Entity Explorer Tab */}
        <TabsContent value="entities" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/congressional/documents">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Documents
                  </Button>
                </Link>
                <Link href="/admin/congressional/proceedings">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Browse Proceedings
                  </Button>
                </Link>
                <Link href="/admin/congressional/analysis">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Content Analysis
                  </Button>
                </Link>
                <Link href="/admin/congressional/entities">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Extracted Entities
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Entity-Based Benefits</CardTitle>
                <CardDescription>
                  How the new architecture improves data management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Source Independence</h4>
                      <p className="text-sm text-slate-600">
                        Add new data sources without changing core schema
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Data Deduplication</h4>
                      <p className="text-sm text-slate-600">
                        Automatically merge data from multiple sources
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Quality Tracking</h4>
                      <p className="text-sm text-slate-600">
                        Compare completeness and accuracy across sources
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Unified Analysis</h4>
                      <p className="text-sm text-slate-600">
                        Generate CivicSense content for any entity type
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 