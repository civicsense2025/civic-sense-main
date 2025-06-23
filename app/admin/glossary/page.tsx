"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Brain,
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Sparkles,
  Download,
  Upload,
  Target,
  Zap,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  Wand2,
  Eye,
  Copy,
  Play,
  Gamepad2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { EnhancedGlossaryGenerator } from '@/components/admin/enhanced-glossary-generator'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  part_of_speech?: string
  category?: string
  examples?: string[]
  synonyms?: string[]
  difficulty_level?: number
  civicsense_priority?: number
  uncomfortable_truth?: string
  power_dynamics?: string[]
  action_steps?: string[]
  source_content?: string
  created_at: string
  updated_at: string
  ai_generated?: boolean
  quality_score?: number
}

interface AIGenerationJob {
  id: string
  type: 'extract_from_content' | 'generate_new' | 'optimize_existing'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  provider: 'openai' | 'anthropic'
  input_data: any
  results?: GlossaryTerm[]
  error?: string
  cost?: number
  created_at: string
}

interface ContentSource {
  id: string
  type: 'topics' | 'questions' | 'articles' | 'custom'
  title: string
  content_preview: string
  selected: boolean
}

export default function AdminGlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [filteredTerms, setFilteredTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('anthropic')
  const [activeTab, setActiveTab] = useState('terms')
  
  // AI Generation states
  const [aiJobs, setAiJobs] = useState<AIGenerationJob[]>([])
  const [contentSources, setContentSources] = useState<ContentSource[]>([])
  const [customContent, setCustomContent] = useState('')
  const [showGenerationDialog, setShowGenerationDialog] = useState(false)
  const [generationType, setGenerationType] = useState<'extract' | 'generate' | 'optimize'>('extract')
  
  // Term editing states
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadTerms()
    loadContentSources()
    loadAIJobs()
  }, [])

  useEffect(() => {
    filterTerms()
  }, [terms, searchQuery, selectedCategory])

  const loadTerms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/glossary/terms')
      const data = await response.json()
      
      if (data.success) {
        setTerms(data.terms)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading terms:', error)
      toast({
        title: "Error",
        description: "Failed to load glossary terms",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadContentSources = async () => {
    try {
      const response = await fetch('/api/admin/glossary/content-sources')
      const data = await response.json()
      
      if (data.success) {
        setContentSources(data.sources)
      }
    } catch (error) {
      console.error('Error loading content sources:', error)
    }
  }

  const loadAIJobs = async () => {
    try {
      const response = await fetch('/api/admin/glossary/ai-jobs')
      const data = await response.json()
      
      if (data.success) {
        setAiJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error loading AI jobs:', error)
    }
  }

  const filterTerms = () => {
    let filtered = terms

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(term => 
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query) ||
        term.category?.toLowerCase().includes(query)
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(term => term.category === selectedCategory)
    }

    setFilteredTerms(filtered)
  }

  const startAIGeneration = async () => {
    try {
      // Map frontend generation types to API enum values
      const typeMapping: Record<'extract' | 'generate' | 'optimize', string> = {
        'extract': 'extract_from_content',
        'generate': 'generate_new',
        'optimize': 'optimize_existing'
      }
      
      const requestData = {
        type: typeMapping[generationType],
        provider: selectedProvider,
        content_sources: generationType === 'extract' ? contentSources.filter(s => s.selected) : [],
        custom_content: generationType === 'generate' ? customContent : '',
        term_ids: generationType === 'optimize' ? terms.filter(t => t.quality_score && t.quality_score < 80).map(t => t.id) : []
      }

      const response = await fetch('/api/admin/glossary/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "AI Generation Started",
          description: `Processing with ${selectedProvider}. Check the AI Jobs tab for progress.`
        })
        setShowGenerationDialog(false)
        loadAIJobs()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error starting AI generation:', error)
      toast({
        title: "Error",
        description: "Failed to start AI generation",
        variant: "destructive"
      })
    }
  }

  const saveTerm = async (term: Partial<GlossaryTerm>) => {
    try {
      const isEditing = term.id
      const url = isEditing ? `/api/admin/glossary/terms/${term.id}` : '/api/admin/glossary/terms'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(term)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Term ${isEditing ? 'updated' : 'created'} successfully`
        })
        setShowEditDialog(false)
        setEditingTerm(null)
        loadTerms()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error saving term:', error)
      toast({
        title: "Error",
        description: "Failed to save term",
        variant: "destructive"
      })
    }
  }

  const deleteTerm = async (termId: string) => {
    if (!confirm('Are you sure you want to delete this term?')) return

    try {
      const response = await fetch(`/api/admin/glossary/terms/${termId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Term deleted successfully"
        })
        loadTerms()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error deleting term:', error)
      toast({
        title: "Error",
        description: "Failed to delete term",
        variant: "destructive"
      })
    }
  }

  const exportGlossary = async () => {
    try {
      const response = await fetch('/api/admin/glossary/export')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `glossary-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting glossary:', error)
      toast({
        title: "Error",
        description: "Failed to export glossary",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const categories = ['all', ...new Set(terms.map(t => t.category).filter(Boolean))] as string[]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Glossary Management</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Glossary Management</h1>
          <p className="text-gray-600">Manage civic education terminology with AI-powered generation</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportGlossary}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => {
            setEditingTerm(null)
            setShowEditDialog(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Term
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Terms</p>
                <p className="text-2xl font-bold text-gray-900">{terms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Generated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {terms.filter(t => t.ai_generated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Quality</p>
                <p className="text-2xl font-bold text-gray-900">
                  {terms.filter(t => t.quality_score && t.quality_score >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Gamepad2 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Game Ready</p>
                <p className="text-2xl font-bold text-gray-900">
                  {terms.filter(t => t.examples && t.examples.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="terms">Terms ({filteredTerms.length})</TabsTrigger>
          <TabsTrigger value="ai-generation">AI Generation</TabsTrigger>
          <TabsTrigger value="ai-jobs">AI Jobs ({aiJobs.length})</TabsTrigger>
          <TabsTrigger value="games">Game Integration</TabsTrigger>
        </TabsList>

        {/* Terms Tab */}
        <TabsContent value="terms" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search terms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Terms List */}
          <div className="space-y-4">
            {filteredTerms.map(term => (
              <Card key={term.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{term.term}</h3>
                        {term.category && (
                          <Badge variant="outline">{term.category}</Badge>
                        )}
                        {term.ai_generated && (
                          <Badge className="bg-purple-100 text-purple-700">AI Generated</Badge>
                        )}
                        {term.quality_score && (
                          <Badge className={getQualityColor(term.quality_score)}>
                            Quality: {term.quality_score}%
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{term.definition}</p>
                      
                      {term.uncomfortable_truth && (
                        <div className="bg-red-50 p-3 rounded-md mb-3">
                          <p className="text-sm font-medium text-red-800 mb-1">Uncomfortable Truth:</p>
                          <p className="text-sm text-red-700">{term.uncomfortable_truth}</p>
                        </div>
                      )}
                      
                      {term.examples && term.examples.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-800 mb-1">Examples:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                                                      {term.examples.slice(0, 2).map((example: string, idx: number) => (
                            <li key={idx}>{example}</li>
                          ))}
                          </ul>
                        </div>
                      )}
                      
                      {term.action_steps && term.action_steps.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-800 mb-1">Action Steps:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                                                      {term.action_steps.slice(0, 2).map((step: string, idx: number) => (
                            <li key={idx}>{step}</li>
                          ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditingTerm(term)
                        setShowEditDialog(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteTerm(term.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Generation Tab */}
        <TabsContent value="ai-generation" className="space-y-6">
          <EnhancedGlossaryGenerator />
        </TabsContent>

        {/* AI Jobs Tab */}
        <TabsContent value="ai-jobs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI Processing Jobs</h3>
            <Button variant="outline" onClick={loadAIJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {aiJobs.map(job => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium">{job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                        <p className="text-sm text-gray-600">{job.provider} • {new Date(job.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  {job.status === 'running' && (
                    <Progress value={job.progress} className="mb-4" />
                  )}
                  
                  {job.error && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{job.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {job.results && job.results.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Generated {job.results.length} terms</p>
                      <div className="space-y-2">
                        {job.results.slice(0, 3).map((term, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded">
                            <p className="font-medium">{term.term}</p>
                            <p className="text-sm text-gray-600">{term.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.cost && (
                    <p className="text-sm text-gray-500 mt-2">Cost: ${job.cost.toFixed(4)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Integration</CardTitle>
              <CardDescription>
                Prepare glossary terms for educational games like matching, lightning practice, and crosswords
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Game Readiness Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Terms with Examples</span>
                      <span>{terms.filter(t => t.examples && t.examples.length > 0).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Terms with Synonyms</span>
                      <span>{terms.filter(t => t.synonyms && t.synonyms.length > 0).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Quality Terms</span>
                      <span>{terms.filter(t => t.quality_score && t.quality_score >= 80).length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Export for Games</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Play className="h-4 w-4 mr-2" />
                      Export Matching Game Set
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Zap className="h-4 w-4 mr-2" />
                      Export Lightning Practice Set
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Export Crossword Set
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generation Dialog */}
      <Dialog open={showGenerationDialog} onOpenChange={setShowGenerationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Glossary Generation</DialogTitle>
          </DialogHeader>
          <GenerationDialogContent 
            type={generationType}
            provider={selectedProvider}
            contentSources={contentSources}
            setContentSources={setContentSources}
            customContent={customContent}
            setCustomContent={setCustomContent}
            onGenerate={startAIGeneration}
            onCancel={() => setShowGenerationDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Term Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTerm ? 'Edit Term' : 'Add New Term'}</DialogTitle>
          </DialogHeader>
          <EditTermDialog 
            term={editingTerm}
            onSave={saveTerm}
            onCancel={() => {
              setShowEditDialog(false)
              setEditingTerm(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Sub-components for dialogs
function GenerationDialogContent({ type, provider, contentSources, setContentSources, customContent, setCustomContent, onGenerate, onCancel }: any) {
  return (
    <div className="space-y-6">
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          AI generation follows CivicSense content standards: reveals uncomfortable truths about power, 
          uses active voice, names specific actors, and provides actionable civic engagement steps.
        </AlertDescription>
      </Alert>

      {type === 'extract' && (
        <div>
          <h4 className="font-medium mb-4">Select Content Sources</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {contentSources.map((source: ContentSource) => (
              <div key={source.id} className="flex items-start space-x-3 p-3 border rounded">
                <input
                  type="checkbox"
                  checked={source.selected}
                  onChange={(e) => {
                    setContentSources(contentSources.map((s: ContentSource) => 
                      s.id === source.id ? { ...s, selected: e.target.checked } : s
                    ))
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">{source.title}</p>
                  <p className="text-sm text-gray-600">{source.content_preview}</p>
                  <Badge variant="outline" className="mt-1">{source.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'generate' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Topic or Theme for Term Generation
          </label>
          <Textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder="Enter a civic topic, concept, or area where you want to generate terms (e.g., 'voting rights', 'gerrymandering', 'lobbying influence')"
            rows={4}
          />
        </div>
      )}

      {type === 'optimize' && (
        <div>
          <Alert>
            <Wand2 className="h-4 w-4" />
            <AlertDescription>
              This will optimize existing terms with quality scores below 80% using CivicSense content standards.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with {provider}
        </Button>
      </div>
    </div>
  )
}

function EditTermDialog({ term, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    term: term?.term || '',
    definition: term?.definition || '',
    part_of_speech: term?.part_of_speech || '',
    category: term?.category || '',
    examples: term?.examples || [],
    synonyms: term?.synonyms || [],
    uncomfortable_truth: term?.uncomfortable_truth || '',
    power_dynamics: term?.power_dynamics || [],
    action_steps: term?.action_steps || []
  })

  const [newExample, setNewExample] = useState('')
  const [newSynonym, setNewSynonym] = useState('')
  const [newActionStep, setNewActionStep] = useState('')

  const addExample = () => {
    if (newExample.trim()) {
      setFormData(prev => ({ ...prev, examples: [...prev.examples, newExample.trim()] }))
      setNewExample('')
    }
  }

  const addSynonym = () => {
    if (newSynonym.trim()) {
      setFormData(prev => ({ ...prev, synonyms: [...prev.synonyms, newSynonym.trim()] }))
      setNewSynonym('')
    }
  }

  const addActionStep = () => {
    if (newActionStep.trim()) {
      setFormData(prev => ({ ...prev, action_steps: [...prev.action_steps, newActionStep.trim()] }))
      setNewActionStep('')
    }
  }

  const removeItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter((_: any, i: number) => i !== index)
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Term</label>
          <Input
            value={formData.term}
            onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
            placeholder="Enter the term"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Part of Speech</label>
          <Select value={formData.part_of_speech} onValueChange={(value) => setFormData(prev => ({ ...prev, part_of_speech: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select part of speech" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="noun">Noun</SelectItem>
              <SelectItem value="verb">Verb</SelectItem>
              <SelectItem value="adjective">Adjective</SelectItem>
              <SelectItem value="adverb">Adverb</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Definition</label>
        <Textarea
          value={formData.definition}
          onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
          placeholder="Enter the definition"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <Input
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="e.g., 'constitutional law', 'voting', 'federal government'"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Uncomfortable Truth (CivicSense Brand)</label>
        <Textarea
          value={formData.uncomfortable_truth}
          onChange={(e) => setFormData(prev => ({ ...prev, uncomfortable_truth: e.target.value }))}
          placeholder="What uncomfortable truth about power does this term reveal?"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Examples</label>
        <div className="space-y-2">
          {formData.examples.map((example: string, idx: number) => (
            <div key={idx} className="flex items-center space-x-2">
              <Input value={example} readOnly />
              <Button size="sm" variant="ghost" onClick={() => removeItem('examples', idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex space-x-2">
            <Input
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              placeholder="Add example"
              onKeyPress={(e) => e.key === 'Enter' && addExample()}
            />
            <Button onClick={addExample}>Add</Button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Action Steps</label>
        <div className="space-y-2">
          {formData.action_steps.map((step: string, idx: number) => (
            <div key={idx} className="flex items-center space-x-2">
              <Input value={step} readOnly />
              <Button size="sm" variant="ghost" onClick={() => removeItem('action_steps', idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex space-x-2">
            <Input
              value={newActionStep}
              onChange={(e) => setNewActionStep(e.target.value)}
              placeholder="Add civic action step"
              onKeyPress={(e) => e.key === 'Enter' && addActionStep()}
            />
            <Button onClick={addActionStep}>Add</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...term, ...formData })}>
          Save Term
        </Button>
      </div>
    </div>
  )
} 