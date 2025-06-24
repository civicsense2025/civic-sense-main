'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Link, 
  Search, 
  Zap, 
  Brain,
  Sparkles,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Network,
  Filter,
  ArrowRight,
  Plus,
  Minus,
  X,
  ChevronRight,
  ChevronDown,
  Globe,
  BookOpen,
  Users,
  Target,
  Settings,
  Play,
  Pause,
  Activity,
  Layers,
  GitBranch,
  Radar,
  Save,
  Edit3,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentItem {
  id: string
  type: 'question_topic' | 'question' | 'skill' | 'glossary_term' | 'event' | 'public_figure'
  title: string
  content: string
  categories: string[]
  created_at: string
  relationship_count?: number
}

interface ContentRelationship {
  id: string
  source: ContentItem
  target: ContentItem
  type: 'semantic' | 'topical' | 'hierarchical' | 'temporal' | 'causal'
  strength: number
  description: string
  auto_generated: boolean
  created_at?: string
  updated_at?: string
}

interface DuplicationWarning {
  id: string
  content_type: string
  existing_content: ContentItem
  similarity_score: number
  warning_level: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  suggested_action: 'merge' | 'enhance_existing' | 'differentiate' | 'cancel_creation'
  auto_detected: boolean
}

interface AnalysisResult {
  relationships_found: number
  relationships_created: number
  duplication_warnings: DuplicationWarning[]
  items_analyzed: number
  processing_time: number
  confidence_score: number
}

export default function ContentRelationshipsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  
  // Core state
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [relationships, setRelationships] = useState<ContentRelationship[]>([])
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicationWarning[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  
  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoMode, setIsAutoMode] = useState(true)
  const [selectedContentType, setSelectedContentType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'network' | 'list' | 'grid'>('list')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    duplicates: true,
    relationships: true,
    insights: true
  })

  // Edit relationship state
  const [editingRelationship, setEditingRelationship] = useState<ContentRelationship | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Handle tab changes with URL updates
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('tab', tabValue)
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  // Update tab from URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

  useEffect(() => {
    loadInitialData()
    if (isAutoMode) {
      runAutomaticAnalysis()
    }
  }, [])

  const loadInitialData = async () => {
    try {
      console.log('🔄 Loading content relationships data...')
      
      // Load existing relationships and content
      const response = await fetch('/api/admin/content-relationships')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Relationships data loaded:', data)
        setRelationships(data.relationships || [])
      }
    } catch (error) {
      console.error('❌ Failed to load initial data:', error)
    }
  }

  const runAutomaticAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      console.log('🧠 Starting automatic content analysis...')
      
      const response = await fetch('/api/admin/content-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyze_all',
          auto_mode: true,
          detect_duplicates: true
        })
      })
      
      const data = await response.json()
      console.log('🧠 Analysis result:', data)
      
      if (data.success) {
        setAnalysisResults(data.result)
        setDuplicateWarnings(data.result.duplication_warnings || [])
        // Note: relationships from analysis are not auto-saved yet
        console.log('✅ Analysis completed successfully')
      } else {
        console.error('❌ Analysis failed:', data.error)
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveRelationships = async () => {
    if (!analysisResults || analysisResults.relationships_found === 0) {
      console.warn('⚠️ No relationships to save')
      return
    }

    setIsSaving(true)
    try {
      console.log('💾 Saving discovered relationships...')
      
      const response = await fetch('/api/admin/content-relationships/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysis_result: analysisResults,
          save_relationships: true,
          save_duplicates: true
        })
      })
      
      const data = await response.json()
      console.log('💾 Save result:', data)
      
      if (data.success) {
        // Refresh the relationships list
        await loadInitialData()
        console.log('✅ Relationships saved successfully')
      } else {
        console.error('❌ Failed to save relationships:', data.error)
      }
    } catch (error) {
      console.error('❌ Failed to save relationships:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRelationship = async (relationshipId: string) => {
    try {
      console.log('🗑️ Deleting relationship:', relationshipId)
      
      const response = await fetch(`/api/admin/content-relationships/${relationshipId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove from local state
        setRelationships(prev => prev.filter(r => r.id !== relationshipId))
        console.log('✅ Relationship deleted successfully')
      } else {
        console.error('❌ Failed to delete relationship')
      }
    } catch (error) {
      console.error('❌ Error deleting relationship:', error)
    }
  }

  const updateRelationship = async (updatedRelationship: ContentRelationship) => {
    try {
      console.log('✏️ Updating relationship:', updatedRelationship.id)
      
      const response = await fetch(`/api/admin/content-relationships/${updatedRelationship.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRelationship)
      })
      
      if (response.ok) {
        // Update local state
        setRelationships(prev => 
          prev.map(r => r.id === updatedRelationship.id ? updatedRelationship : r)
        )
        setIsEditDialogOpen(false)
        setEditingRelationship(null)
        console.log('✅ Relationship updated successfully')
      } else {
        console.error('❌ Failed to update relationship')
      }
    } catch (error) {
      console.error('❌ Error updating relationship:', error)
    }
  }

  const openEditDialog = (relationship: ContentRelationship) => {
    setEditingRelationship({ ...relationship })
    setIsEditDialogOpen(true)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-700'
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-700'
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700'
      case 'low': return 'bg-blue-500/10 border-blue-500/20 text-blue-700'
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-700'
    }
  }

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'semantic': return <Brain className="h-4 w-4" />
      case 'topical': return <BookOpen className="h-4 w-4" />
      case 'hierarchical': return <GitBranch className="h-4 w-4" />
      case 'temporal': return <Activity className="h-4 w-4" />
      case 'causal': return <ArrowRight className="h-4 w-4" />
      default: return <Link className="h-4 w-4" />
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'question_topic': return <Target className="h-4 w-4" />
      case 'question': return <BookOpen className="h-4 w-4" />
      case 'skill': return <Zap className="h-4 w-4" />
      case 'glossary_term': return <Globe className="h-4 w-4" />
      case 'event': return <Activity className="h-4 w-4" />
      case 'public_figure': return <Users className="h-4 w-4" />
      default: return <Layers className="h-4 w-4" />
    }
  }

  // Filter relationships based on search and content type
  const filteredRelationships = relationships.filter(relationship => {
    const matchesSearch = searchQuery === '' || 
      relationship.source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      relationship.target.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      relationship.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedContentType === 'all' ||
      relationship.source.type === selectedContentType ||
      relationship.target.type === selectedContentType
    
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Floating Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Content Relationships
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  AI-powered content analysis and connection discovery
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/20 dark:border-slate-700/50 backdrop-blur-sm">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-Analysis</label>
                <Switch 
                  checked={isAutoMode} 
                  onCheckedChange={setIsAutoMode}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              
              {analysisResults && analysisResults.relationships_found > 0 && !isSaving && (
                <Button
                  onClick={saveRelationships}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Relationships
                </Button>
              )}
              
              <Button
                onClick={runAutomaticAnalysis}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Tabs with query params */}
        <div className="flex items-center justify-between">
          <div className="flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-800/50 rounded-xl p-1">
            {[
              { value: 'overview', label: 'Overview & Analysis', icon: BarChart3 },
              { value: 'duplicates', label: 'Duplicates', icon: AlertTriangle },
              { value: 'relationships', label: 'Relationships', icon: Network }
            ].map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? 'default' : 'ghost'}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                  activeTab === tab.value 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'relationships' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search relationships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content Types</SelectItem>
                  <SelectItem value="question_topic">Question Topics</SelectItem>
                  <SelectItem value="glossary_term">Glossary Terms</SelectItem>
                  <SelectItem value="skill">Skills</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="public_figure">Public Figures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Content Items</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {analysisResults?.items_analyzed || '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Layers className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Relationships</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {analysisResults?.relationships_found || relationships.length || '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <GitBranch className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Duplicates Found</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {duplicateWarnings.length || '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Confidence</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {analysisResults?.confidence_score ? `${analysisResults.confidence_score}%` : '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <Radar className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Empty State */}
            {!isAnalyzing && !analysisResults && (
              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Network className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Ready to Analyze Your Content
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    Run the AI analysis to discover relationships, detect duplicates, and get insights about your content structure.
                  </p>
                  <Button
                    onClick={runAutomaticAnalysis}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'duplicates' && (
          <div className="space-y-6">
            {duplicateWarnings.length > 0 ? (
              <div className="space-y-4">
                {duplicateWarnings.map((warning, index) => (
                  <Card key={index} className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    getWarningColor(warning.warning_level)
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getContentTypeIcon(warning.content_type)}
                          <div>
                            <h4 className="font-medium text-sm">{warning.existing_content.title}</h4>
                            <p className="text-xs opacity-75 mt-1">{warning.content_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {warning.similarity_score}% match
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {warning.warning_level}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3 opacity-90">{warning.recommendation}</p>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          {warning.suggested_action.replace('_', ' ')}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-xl">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No Duplicates Found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your content appears to be unique with no significant duplications detected.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="space-y-6">
            {filteredRelationships.length > 0 ? (
              <div className="space-y-3">
                {filteredRelationships.map((relationship, index) => (
                  <Card key={index} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            {getContentTypeIcon(relationship.source.type)}
                            <span className="font-medium">{relationship.source.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRelationshipIcon(relationship.type)}
                            <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                              {relationship.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {getContentTypeIcon(relationship.target.type)}
                            <span className="font-medium">{relationship.target.title}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {relationship.strength}% strength
                          </Badge>
                          {relationship.auto_generated && (
                            <Badge variant="outline" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(relationship)}
                            className="text-xs"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRelationship(relationship.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {relationship.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                          {relationship.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/20 dark:border-slate-800/50 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Network className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No Relationships Found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Run an analysis to discover relationships between your content items.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Edit Relationship Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content Relationship</DialogTitle>
            <DialogDescription>
              Modify the relationship between these content items.
            </DialogDescription>
          </DialogHeader>
          
          {editingRelationship && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Content</Label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {getContentTypeIcon(editingRelationship.source.type)}
                    <span className="font-medium">{editingRelationship.source.title}</span>
                  </div>
                </div>
                <div>
                  <Label>Target Content</Label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {getContentTypeIcon(editingRelationship.target.type)}
                    <span className="font-medium">{editingRelationship.target.title}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Relationship Type</Label>
                <Select 
                  value={editingRelationship.type} 
                  onValueChange={(value) => setEditingRelationship(prev => 
                    prev ? { ...prev, type: value as any } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semantic">Semantic</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical</SelectItem>
                    <SelectItem value="temporal">Temporal</SelectItem>
                    <SelectItem value="causal">Causal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Strength ({editingRelationship.strength}%)</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingRelationship.strength}
                  onChange={(e) => setEditingRelationship(prev => 
                    prev ? { ...prev, strength: parseInt(e.target.value) } : null
                  )}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingRelationship.description}
                  onChange={(e) => setEditingRelationship(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  placeholder="Describe how these content items are related..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingRelationship && updateRelationship(editingRelationship)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 