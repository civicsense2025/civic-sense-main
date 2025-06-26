"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  TrendingUp
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

export default function CongressionalAdminPage() {
  const [entityStats, setEntityStats] = useState<EntityStats | null>(null)
  const [sourceQuality, setSourceQuality] = useState<SourceQualityMetric[]>([])
  const [recentSyncs, setRecentSyncs] = useState<RecentSync[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, these would be separate API calls
      const [statsResponse, qualityResponse, syncsResponse] = await Promise.all([
        fetch('/api/admin/congressional/stats'),
        fetch('/api/admin/congressional/source-quality'),
        fetch('/api/admin/congressional/sync-history')
      ])
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setEntityStats(stats.data)
      }
      
      if (qualityResponse.ok) {
        const quality = await qualityResponse.json()
        setSourceQuality(quality.data)
      }
      
      if (syncsResponse.ok) {
        const syncs = await syncsResponse.json()
        setRecentSyncs(syncs.data)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sources">Source Quality</TabsTrigger>
          <TabsTrigger value="sync">Sync Management</TabsTrigger>
          <TabsTrigger value="entities">Entity Explorer</TabsTrigger>
        </TabsList>

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
                {sourceQuality.map((source) => {
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
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Management Tab */}
        <TabsContent value="sync" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sync Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Management</CardTitle>
                <CardDescription>
                  Control data synchronization from various sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
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
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Sync Bills from Congress.gov
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
                            syncHearings: true,
                            syncCommitteeDocuments: true,
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
                    <Calendar className="h-4 w-4 mr-2" />
                    Sync Hearings & Documents from GovInfo
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
                            syncMembers: true,
                            syncHearings: true,
                            syncCommitteeDocuments: true,
                            generateEvents: true,
                            extractEntities: true,
                            limit: 50
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
                    <Database className="h-4 w-4 mr-2" />
                    Full Sync (All Sources with AI Analysis)
                  </Button>
                </div>
                
                {syncing && (
                  <div className="text-sm text-slate-600 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                    Processing sync with AI analysis...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sync History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Activity</CardTitle>
                <CardDescription>
                  Latest synchronization results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSyncs.length > 0 ? (
                    recentSyncs.slice(0, 5).map((sync) => (
                      <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {sync.source_system.replace('_', ' ').toUpperCase()}
                            </span>
                            {sync.failed > 0 ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {sync.succeeded}/{sync.processed} successful
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(sync.timestamp), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent sync activity</p>
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