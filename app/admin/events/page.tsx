'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { toast } from '@/components/ui/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
)
import { 
  Calendar, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  Search,
  Plus,
  Edit,
  ExternalLink,
  BarChart3,
  BookOpen,
  Zap,
  Filter,
  History,
  RefreshCw,
  Brain,
  Target,
  LinkIcon,
  ChevronDown,
  Check,
  X,
  Lightbulb,
  Sparkles,
  Database,
  TrendingDown,
  AlertTriangle
} from 'lucide-react'

// Types based on our actual schema
interface Event {
  topic_id: string
  topic_title: string
  description: string
  date: string
  why_this_matters?: string
  civic_relevance_score?: number
  event_type?: 'political' | 'sociopolitical' | 'cultural' | 'economic' | 'military' | 'legislative' | 'judicial' | 'constitutional' | 'news' | 'current'
  significance_level?: number
  key_figures?: string[]
  related_organizations?: string[]
  geographic_scope?: string
  impact_summary?: string
  long_term_consequences?: string
  tags?: string[]
  categories?: string[]
  quiz_potential?: any
  fact_check_status?: string
  reliability_score?: number
  is_featured?: boolean
  content_warnings?: string[]
  ai_generated?: boolean
  research_quality_score?: number
  last_fact_checked?: string
  source_type?: string
  sources?: any
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

interface UserEvent {
  id: string
  event_title: string
  event_description: string
  event_date: string
  url: string
  status: string
  admin_notes?: string
  created_at: string
  user_id: string
}

interface NewsEvent {
  id: string
  headline: string
  content: string
  civic_relevance_score: number
  discovered_at: string
  published_at: string
  source: string
  source_url: string
  government_actors_involved?: string[]
  policy_areas_affected?: string[]
  potential_civic_actions?: string[]
  power_dynamics_revealed?: string[]
}

interface EventsData {
  events: Event[]
  user_events: UserEvent[]
  news_events: NewsEvent[]
  stats: {
    total_events: number
    historical_events: number
    current_events: number
    featured_events: number
    high_significance_events: number
    total_user_events: number
    pending_user_events: number
    total_news_events: number
    ai_research_results: number
  }
}

interface GapAnalysis {
  id: string
  type: 'time_period' | 'topic_theme' | 'category' | 'connection_opportunity'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  confidence: number
  evidence: {
    current_content_count: number
    related_content_found: number
    gap_size_estimate: string
    civic_importance: string
  } | string[] // Support both new object format and legacy array format
  suggested_research: {
    mode: string
    themes: string[]
    start_year?: number
    end_year?: number
  }
  impact_potential: number
}
  
// Component for Gap Analysis tab
function GapAnalysisTab({ 
  eventsData, 
  gapAnalysis, 
  isRunningGapAnalysis, 
  diagnostic, 
  isRunningDiagnostic, 
  availableCategories,
  onRunGapAnalysis,
  onRunDiagnostic,
  onApplySuggestion,
  onClearCache
}: {
  eventsData: EventsData | null
  gapAnalysis: any
  isRunningGapAnalysis: boolean
  diagnostic: any
  isRunningDiagnostic: boolean
  availableCategories: string[]
  onRunGapAnalysis: () => void
  onRunDiagnostic: () => void
  onApplySuggestion: (suggestion: any) => void
  onClearCache?: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            AI-Powered Content Gap Analysis
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze your civic education database to identify content gaps and research opportunities
          </p>
        </div>
        {(gapAnalysis || diagnostic) && (
          <Button
            onClick={() => {
              if (typeof window !== 'undefined' && window.localStorage) {
                const cached = localStorage.getItem('civic-sense-gap-analysis')
                if (cached) {
                  const gapAnalysisCache = JSON.parse(cached)
                  const age = Math.round((Date.now() - gapAnalysisCache.timestamp) / (60 * 60 * 1000))
                  const confirmed = confirm(`Clear cached gap analysis data?\n\nThis will remove:\n• ${gapAnalysis?.length || 0} research opportunities\n• Database diagnostic results\n• Cache age: ${age} hours\n\nYou can run a fresh analysis anytime.`)
                  if (confirmed) {
                    onClearCache?.()
                  }
                } else {
                  onClearCache?.()
                }
              }
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        )}
      </div>

      {/* Agent Learning Context Display */}
      {eventsData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Database Analysis Context
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Events</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{eventsData.stats.total_events}</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Historical Events</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{eventsData.stats.historical_events}</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Content Patterns</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {Math.floor(eventsData.stats.total_events / 10)}+
              </p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Categories</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {availableCategories.length}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">AI Analysis Features:</p>
            <p>• Analyzes existing content patterns and themes • Identifies content gaps systematically • Builds knowledge relationships • Generates contextually relevant content</p>
          </div>
        </div>
      )}

      {/* Database Reality Check */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Reality Check
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Verify what's actually in your database vs hardcoded fallback data
            </p>
          </div>
          <Button
            onClick={onRunDiagnostic}
            disabled={isRunningDiagnostic}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isRunningDiagnostic ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Analyzing...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Check Database
              </>
            )}
          </Button>
        </div>
        
        {diagnostic && (
          <div className="space-y-4">
            {/* Reality Check Summary */}
            <div className="bg-white dark:bg-orange-900/30 p-4 rounded border border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-orange-800 dark:text-orange-200">
                  Database Analysis Results
                </h4>
                <Badge 
                  variant={diagnostic.reality_check.has_real_content ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {diagnostic.reality_check.has_real_content ? 'Has Real Content' : 'Mostly Fake Data'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-800/20 rounded">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Topics</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {diagnostic.reality_check.content_sources.question_topics.count}
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-800/20 rounded">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Events</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {diagnostic.reality_check.content_sources.events.count}
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-800/20 rounded">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Questions</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {diagnostic.reality_check.content_sources.questions.count}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-orange-100 dark:bg-orange-800/30 rounded">
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    Real vs Hardcoded Categories:
                  </span>
                  <span className="font-bold text-orange-900 dark:text-orange-100">
                    {diagnostic.reality_check.hardcoded_vs_real.percentage_real}% real
                  </span>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded">
                  <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">Recommendation:</p>
                  <p className="text-orange-700 dark:text-orange-300">
                    {diagnostic.gap_analysis_validity.recommended_action}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Gap Analysis Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI-Powered Content Gap Analysis
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Using OpenAI to analyze {diagnostic ? diagnostic.summary.total_content_items : 'your'} database items and {diagnostic ? diagnostic.reality_check.hardcoded_vs_real.real_from_database : availableCategories.length} real categories
            </p>
            {diagnostic && (
              <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                Database Quality: {diagnostic.summary.verdict} • {diagnostic.summary.percentage_real_data}% real data
              </div>
            )}
          </div>
          <Button
            onClick={onRunGapAnalysis}
            disabled={isRunningGapAnalysis}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            {isRunningGapAnalysis ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">AI Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
        
        {gapAnalysis && Array.isArray(gapAnalysis) && gapAnalysis.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-medium text-purple-800 dark:text-purple-200">
                Found {gapAnalysis.length} Research Opportunities:
              </h4>
              <Badge className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                🤖 AI-Powered
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {gapAnalysis.map((gap: any, index: number) => (
                <div key={gap.id || index} className="bg-white dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-purple-900 dark:text-purple-100">{gap.title}</h5>
                        <Badge variant={gap.priority === 'high' ? 'destructive' : gap.priority === 'medium' ? 'default' : 'secondary'}>
                          {gap.priority} priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {gap.confidence}% confidence
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {gap.impact_potential}/10 impact
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">{gap.description}</p>
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        <strong>Evidence:</strong>{' '}
                        {gap.evidence && typeof gap.evidence === 'object' ? (
                          <>
                            {gap.evidence.current_content_count || 0} current items, 
                            {gap.evidence.related_content_found || 0} related found, 
                            gap size: {gap.evidence.gap_size_estimate || 'unknown'}
                          </>
                        ) : (
                          Array.isArray(gap.evidence) ? (
                            <>
                              {gap.evidence.slice(0, 2).join('; ')}
                              {gap.evidence.length > 2 && ` +${gap.evidence.length - 2} more`}
                            </>
                          ) : (
                            'No evidence data available'
                          )
                        )}
                      </div>
                      {gap.ai_reasoning && (
                        <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                          <strong>AI Analysis:</strong> {gap.ai_reasoning}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => onApplySuggestion(gap)}
                      size="sm"
                      className="ml-4"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Research This
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gapAnalysis && Array.isArray(gapAnalysis) && gapAnalysis.length === 0 && !isRunningGapAnalysis && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">No Analysis Yet</h4>
            <p className="text-purple-700 dark:text-purple-300">Click "Run AI Analysis" to identify content gaps and research opportunities.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Component for creating historical events
function CreateHistoricalEventForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'political',
    significance_level: 5,
    key_figures: '',
    impact_summary: '',
    why_this_matters: '',
    tags: '',
    is_featured: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const eventData = {
      ...formData,
      key_figures: formData.key_figures.split(',').map(s => s.trim()).filter(Boolean),
      tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean)
    }
    
    onSubmit(eventData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Historical Event</DialogTitle>
        <DialogDescription>
          Add a new historical event to the CivicSense database for civic education content.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium">Event Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Brown v. Board of Education Decision"
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Event Type</label>
          <Select 
            value={formData.event_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="political">Political</SelectItem>
              <SelectItem value="legislative">Legislative</SelectItem>
              <SelectItem value="judicial">Judicial</SelectItem>
              <SelectItem value="constitutional">Constitutional</SelectItem>
              <SelectItem value="sociopolitical">Sociopolitical</SelectItem>
              <SelectItem value="cultural">Cultural</SelectItem>
              <SelectItem value="economic">Economic</SelectItem>
              <SelectItem value="military">Military</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description of the event..."
            rows={3}
            required
          />
        </div>
        
        <div className="col-span-2">
          <label className="text-sm font-medium">Why This Matters (Civic Education Context)</label>
          <Textarea
            value={formData.why_this_matters}
            onChange={(e) => setFormData(prev => ({ ...prev, why_this_matters: e.target.value }))}
            placeholder="Explain the civic education significance and what citizens should understand..."
            rows={2}
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Significance Level (1-10)</label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.significance_level}
            onChange={(e) => setFormData(prev => ({ ...prev, significance_level: parseInt(e.target.value) }))}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Key Figures (comma-separated)</label>
          <Input
            value={formData.key_figures}
            onChange={(e) => setFormData(prev => ({ ...prev, key_figures: e.target.value }))}
            placeholder="Earl Warren, Thurgood Marshall, ..."
          />
        </div>
        
        <div className="col-span-2">
          <label className="text-sm font-medium">Impact Summary</label>
          <Textarea
            value={formData.impact_summary}
            onChange={(e) => setFormData(prev => ({ ...prev, impact_summary: e.target.value }))}
            placeholder="Summary of the long-term impact and consequences..."
            rows={2}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Tags (comma-separated)</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="civil rights, supreme court, ..."
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="featured"
            checked={formData.is_featured}
            onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
          />
          <label htmlFor="featured" className="text-sm font-medium">Featured Event</label>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit">Create Historical Event</Button>
      </DialogFooter>
    </form>
  )
}

// Overview component
function EventsOverview({ eventsData }: { eventsData: EventsData | null }) {
  if (!eventsData) return <LoadingSpinner />

  const recentEvents = eventsData.events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const highSignificanceEvents = eventsData.events
    .filter(e => (e.significance_level || 0) >= 8)
    .sort((a, b) => (b.significance_level || 0) - (a.significance_level || 0))
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentEvents.map((event) => (
            <div key={event.topic_id} className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-sm">{event.topic_title}</h4>
              <p className="text-xs text-slate-500">{event.date}</p>
              <div className="flex gap-2 mt-1">
                {event.event_type && (
                  <Badge variant="outline" className="text-xs">
                    {event.event_type}
                  </Badge>
                )}
                {event.significance_level && (
                  <Badge variant="secondary" className="text-xs">
                    Significance: {event.significance_level}/10
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            High Significance Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {highSignificanceEvents.map((event) => (
            <div key={event.topic_id} className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-sm">{event.topic_title}</h4>
              <p className="text-xs text-slate-500">{event.date}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="destructive" className="text-xs">
                  {event.significance_level}/10
                </Badge>
                {event.is_featured && (
                  <Badge className="text-xs">Featured</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Events list component
function EventsList({ events, onRefresh }: { events: Event[], onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Events Found</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your filters or search terms.
            </p>
          </CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.topic_id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{event.topic_title}</h3>
                    {event.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">
                    {event.description}
                  </p>
                  
                  {event.why_this_matters && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium">Why This Matters:</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {event.why_this_matters}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.event_type && (
                      <Badge variant="outline">
                        {event.event_type}
                      </Badge>
                    )}
                    {event.significance_level && (
                      <Badge variant="secondary">
                        Significance: {event.significance_level}/10
                      </Badge>
                    )}
                    {event.civic_relevance_score && (
                      <Badge variant="default">
                        Civic Relevance: {event.civic_relevance_score}%
                      </Badge>
                    )}
                  </div>
                  
                  {event.key_figures && event.key_figures.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Key Figures: </span>
                      <span className="text-sm text-slate-600">
                        {event.key_figures.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag: string, tagIndex: number) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <p className="text-sm font-medium">{event.date}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// User events list component  
function UserEventsList({ events, onRefresh }: { events: UserEvent[], onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No User Events Found</h3>
            <p className="text-slate-600 dark:text-slate-400">
              No user-submitted events match your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{event.event_title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">
                    {event.event_description}
                  </p>
                  
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>Date: {event.event_date}</span>
                    <span>Submitted: {new Date(event.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {event.admin_notes && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <p className="text-sm font-medium">Admin Notes:</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{event.admin_notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <Badge 
                    variant={event.status === 'approved' ? 'default' : 
                           event.status === 'pending' ? 'secondary' : 'destructive'}
                  >
                    {event.status}
                  </Badge>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={event.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// News events list component
function NewsEventsList({ events, onRefresh }: { events: NewsEvent[], onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No News Events Found</h3>
            <p className="text-slate-600 dark:text-slate-400">
              No AI-discovered news events match your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{event.headline}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">
                    {event.content.substring(0, 200)}...
                  </p>
                  
                  <div className="flex gap-4 text-sm text-slate-500 mb-3">
                    <span>Published: {new Date(event.published_at).toLocaleDateString()}</span>
                    <span>Source: {event.source}</span>
                    <span>Relevance: {event.civic_relevance_score}%</span>
                  </div>
                  
                  {event.government_actors_involved && event.government_actors_involved.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Government Actors: </span>
                      <span className="text-sm text-slate-600">
                        {event.government_actors_involved.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {event.policy_areas_affected && event.policy_areas_affected.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.policy_areas_affected.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <Badge variant="secondary">
                    AI Discovered
                  </Badge>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={event.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

interface DatabaseAnalysis {
  total_topics: number
  total_events: number
  category_distribution: Record<string, number>
  time_period_gaps: Array<{
    start_year: number
    end_year: number
    event_count: number
    significance: 'major_gap' | 'minor_gap' | 'well_covered'
  }>
  theme_analysis: Array<{
    theme: string
    coverage: number
    quality_score: number
    gap_type: 'missing' | 'shallow' | 'outdated'
  }>
  connection_opportunities: Array<{
    topic_a: string
    topic_b: string
    connection_strength: number
    connection_type: string
  }>
}

export default function EventsAdminPage() {
  const [eventsData, setEventsData] = useState<EventsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistoricalResearchDialog, setShowHistoricalResearchDialog] = useState(false)
  
  // Enhanced state for better UX
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [gapAnalysis, setGapAnalysis] = useState<any>(null)
  const [isRunningGapAnalysis, setIsRunningGapAnalysis] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  
  // Database diagnostic state
  const [diagnostic, setDiagnostic] = useState<any>(null)
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false)
  
  const [historicalResearchState, setHistoricalResearchState] = useState({
    query: '',
    timeframe: { start: '', end: '' },
    focusAreas: [] as string[],
    isResearching: false,
    results: [] as any[],
    selectedResults: [] as string[],
    contentConnections: [] as any[],
    newsConnections: [] as any[],
    contentPackages: [] as any[],
    researchSummary: null as any
  })

  // Save gap analysis to localStorage
  const saveGapAnalysis = (gapData: any, diagnosticData: any) => {
    try {
      const gapAnalysisCache = {
        data: gapData,
        diagnostic: diagnosticData,
        timestamp: Date.now(),
        version: '1.0'
      }
      localStorage.setItem('civic-sense-gap-analysis', JSON.stringify(gapAnalysisCache))
      console.log('✅ Gap analysis saved to cache')
    } catch (error) {
      console.warn('⚠️ Failed to save gap analysis to cache:', error)
    }
  }

  // Load gap analysis from localStorage
  const loadGapAnalysis = () => {
    try {
      const cached = localStorage.getItem('civic-sense-gap-analysis')
      if (cached) {
        const gapAnalysisCache = JSON.parse(cached)
        
        // Check if cache is less than 24 hours old
        const isRecent = (Date.now() - gapAnalysisCache.timestamp) < 24 * 60 * 60 * 1000
        
        if (isRecent && gapAnalysisCache.data) {
          setGapAnalysis(gapAnalysisCache.data)
          setDiagnostic(gapAnalysisCache.diagnostic)
          console.log('✅ Loaded cached gap analysis:', {
            gaps: gapAnalysisCache.data?.length || 0,
            age: Math.round((Date.now() - gapAnalysisCache.timestamp) / (60 * 60 * 1000)) + ' hours'
          })
          
          toast({
            title: "Gap Analysis Restored",
            description: `Loaded ${gapAnalysisCache.data?.length || 0} research opportunities from cache.`,
            duration: 3000
          })
        } else {
          // Clear old cache
          localStorage.removeItem('civic-sense-gap-analysis')
          console.log('🧹 Cleared old gap analysis cache')
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load gap analysis from cache:', error)
      localStorage.removeItem('civic-sense-gap-analysis')
    }
  }

  // Clear gap analysis cache
  const clearGapAnalysisCache = () => {
    localStorage.removeItem('civic-sense-gap-analysis')
    setGapAnalysis(null)
    setDiagnostic(null)
    toast({
      title: "Gap Analysis Cleared",
      description: "Cleared cached gap analysis data. Run a new analysis to get fresh results.",
      duration: 3000
    })
  }

  // Load events data
  const loadEventsData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        type: selectedEventType,
        limit: '50',
        min_significance: '1'
      })
      
      const response = await fetch(`/api/admin/events?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load events')
      }
      
      const data: EventsData = await response.json()
      setEventsData(data)
      
    } catch (err) {
      console.error('Error loading events:', err)
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }

  // Load available categories when dialog opens
  useEffect(() => {
    if (showHistoricalResearchDialog && availableCategories.length === 0) {
      loadCategories()
    }
  }, [showHistoricalResearchDialog])

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      if (data.success) {
        setAvailableCategories(data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const runGapAnalysis = async () => {
    try {
      setIsRunningGapAnalysis(true)
      setGapAnalysis(null)
      
      console.log('🔍 Starting gap analysis...')
      
      const response = await fetch('/api/admin/historical-research-agent/analyze-gaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('📊 Gap analysis response:', data)
      
      if (data.success) {
        // Extract the content_gaps array from the response
        const gaps = data.data?.content_gaps || []
        console.log('✅ AI Gap analysis complete:', {
          gaps_found: gaps.length,
          ai_powered: data.summary?.ai_powered,
          database_categories: data.summary?.database_categories,
          content_quality: data.summary?.content_quality
        })
        
        setGapAnalysis(Array.isArray(gaps) ? gaps : [])
        
        // Save results to cache for persistence
        saveGapAnalysis(gaps, diagnostic)
        
        // Show success feedback
        toast({
          title: "Gap Analysis Complete!",
          description: `🤖 Found ${gaps.length} research opportunities using ${data.summary?.ai_powered ? 'AI-powered' : 'systematic'} analysis of ${data.summary?.database_categories || 0} real categories. Results saved for 24 hours.`,
          duration: 5000
        })
        
      } else {
        console.error('❌ Gap analysis failed:', data.error, data.details)
        throw new Error(data.details || data.error || 'Unknown error')
      }
      
    } catch (error) {
      console.error('❌ Error in gap analysis:', error)
      
      let errorMessage = 'Failed to run gap analysis'
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Authentication required - please refresh the page and try again'
        } else if (error.message.includes('fetch failed')) {
          errorMessage = 'Network connection failed - check your internet connection'
        } else {
          errorMessage = `Gap analysis error: ${error.message}`
        }
      }
      
      toast({
        title: "Gap Analysis Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 6000
      })
      setGapAnalysis([]) // Set empty array so UI knows it failed
      
    } finally {
      setIsRunningGapAnalysis(false)
    }
  }

  const runDatabaseDiagnostic = async () => {
    try {
      setIsRunningDiagnostic(true)
      setDiagnostic(null)
      
      const response = await fetch('/api/admin/historical-research-agent/database-diagnostic')
      
      const data = await response.json()
      
      if (data.success) {
        setDiagnostic(data.diagnostic)
        
        // Save diagnostic to cache (update existing gap analysis cache)
        saveGapAnalysis(gapAnalysis, data.diagnostic)
        
        // Show diagnostic summary
        const summary = data.summary
        toast({
          title: "Database Diagnostic Complete!",
          description: `${summary.verdict} - ${summary.percentage_real_data}% real data. ${summary.total_content_items} items analyzed.`,
          duration: 5000
        })
      } else {
        console.error('Database diagnostic API error:', data)
        alert('Failed to run database diagnostic: ' + data.error)
      }
    } catch (error) {
      console.error('Error running database diagnostic:', error)
      alert('Error running database diagnostic. Please try again.')
    } finally {
      setIsRunningDiagnostic(false)
    }
  }

  const applySuggestion = (suggestion: any) => {
    setSelectedSuggestion(suggestion)
    
    // Auto-fill the form with suggestion data (with proper null checking)
    if (suggestion?.suggested_research) {
      setHistoricalResearchState(prev => ({
        ...prev,
        query: suggestion.suggested_research.mode || 'thematic_research',
        focusAreas: suggestion.suggested_research.themes || [suggestion.title],
        timeframe: {
          start: suggestion.suggested_research.start_year?.toString() || '',
          end: suggestion.suggested_research.end_year?.toString() || ''
        }
      }))
    } else {
      // Fallback: use the gap analysis data to set research parameters
      setHistoricalResearchState(prev => ({
        ...prev,
        query: 'thematic_research',
        focusAreas: [suggestion.title || 'Historical Research'],
        timeframe: { start: '', end: '' }
      }))
    }
    
    // Scroll to research configuration
    document.getElementById('research-config')?.scrollIntoView({ behavior: 'smooth' })
    
    // Show a helpful message
    toast({
      title: "Research Suggestion Applied",
      description: `Set up research for: ${suggestion.title}. You can modify the parameters below.`,
      duration: 3000
    })
  }

  useEffect(() => {
    loadEventsData()
  }, [selectedEventType])

  // Load cached gap analysis on component mount
  useEffect(() => {
    loadGapAnalysis()
  }, [])

  // Filter events based on search
  const filteredEvents = eventsData?.events.filter(event =>
    event.topic_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.key_figures?.some(figure => figure.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const filteredUserEvents = eventsData?.user_events.filter(event =>
    event.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.event_description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const filteredNewsEvents = eventsData?.news_events.filter(event =>
    event.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleCreateHistoricalEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_historical_event',
          ...eventData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create event')
      }

      const result = await response.json()
      console.log('Event created successfully:', result)
      
      // Reload data
      await loadEventsData()
      setIsCreateDialogOpen(false)
      
    } catch (err) {
      console.error('Error creating event:', err)
      setError(err instanceof Error ? err.message : 'Failed to create event')
    }
  }

  const handleHistoricalResearch = async () => {
    try {
      setHistoricalResearchState(prev => ({ ...prev, isResearching: true, results: [] }))
      
      // Determine research mode based on user input
      let researchMode = 'systematic_survey'
      if (historicalResearchState.timeframe.start || historicalResearchState.timeframe.end) {
        researchMode = 'period_focus'
      }
      if (historicalResearchState.focusAreas.length > 0) {
        researchMode = 'thematic_research'
      }
      
      const response = await fetch('/api/admin/historical-research-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: researchMode,
          themes: historicalResearchState.focusAreas,
          start_year: historicalResearchState.timeframe.start ? parseInt(historicalResearchState.timeframe.start) : undefined,
          end_year: historicalResearchState.timeframe.end ? parseInt(historicalResearchState.timeframe.end) : undefined,
          max_events: 50,
          include_content_relationships: true,
          include_news_connections: true,
          generate_content_packages: true,
          learning_context: {
            use_existing_content: true,
            analyze_patterns: true,
            build_knowledge_graph: true
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI Agent research failed')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setHistoricalResearchState(prev => ({
          ...prev,
          results: result.data?.events || [],
          contentConnections: result.data?.content_connections || [],
          newsConnections: result.data?.news_connections || [],
          contentPackages: result.data?.content_packages || [],
          researchSummary: result.summary,
          isResearching: false
        }))
      } else {
        throw new Error(result.error || 'AI Agent research failed')
      }
      
    } catch (error) {
      console.error('AI Agent research error:', error)
      setHistoricalResearchState(prev => ({ ...prev, isResearching: false }))
      setError(error instanceof Error ? error.message : 'AI Agent research failed')
    }
  }

  const handleSaveHistoricalEvents = async () => {
    try {
      const selectedEvents = historicalResearchState.results.filter(
        event => historicalResearchState.selectedResults.includes(event.title)
      )
      
      if (selectedEvents.length === 0) {
        setError('Please select at least one event to save')
        return
      }
      
      // Save each selected event
      for (const event of selectedEvents) {
        await handleCreateHistoricalEvent({
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          event_type: event.event_type,
          significance_level: event.significance_level,
          key_figures: event.key_figures,
          impact_summary: event.impact_summary,
          why_this_matters: `This ${event.event_type} event demonstrates ${event.civic_education_relevance.government_structure ? 'government structure, ' : ''}${event.civic_education_relevance.checks_and_balances ? 'checks and balances, ' : ''}${event.civic_education_relevance.democratic_processes ? 'democratic processes, ' : ''}and other key civic concepts that help citizens understand how power actually works in American democracy.`,
          tags: event.tags,
          is_featured: event.significance_level >= 9
        })
      }
      
      // Close dialog and refresh
      setShowHistoricalResearchDialog(false)
      setHistoricalResearchState({
        query: '',
        timeframe: { start: '', end: '' },
        focusAreas: [],
        isResearching: false,
        results: [],
        selectedResults: [],
        contentConnections: [],
        newsConnections: [],
        contentPackages: [],
        researchSummary: null
      })
      
      await loadEventsData()
      
    } catch (error) {
      console.error('Error saving historical events:', error)
      setError(error instanceof Error ? error.message : 'Failed to save events')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-2">Loading events system...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              onClick={loadEventsData} 
              className="ml-4" 
              size="sm"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Events Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage historical events, user submissions, and AI-discovered news for civic education content
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={loadEventsData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowHistoricalResearchDialog(true)}>
            <Brain className="h-4 w-4 mr-2" />
            AI Research Agent
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Historical Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CreateHistoricalEventForm onSubmit={handleCreateHistoricalEvent} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      {eventsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold">{eventsData.stats.total_events}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Historical</p>
                  <p className="text-2xl font-bold">{eventsData.stats.historical_events}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Current Events</p>
                  <p className="text-2xl font-bold">{eventsData.stats.current_events}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">User Submitted</p>
                  <p className="text-2xl font-bold">{eventsData.stats.total_user_events}</p>
                  <p className="text-xs text-slate-500">({eventsData.stats.pending_user_events} pending)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">AI Research</p>
                  <p className="text-2xl font-bold">{eventsData.stats.ai_research_results}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search events, people, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedEventType} onValueChange={setSelectedEventType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="historical">Historical Events</SelectItem>
            <SelectItem value="events">Current Events</SelectItem>
            <SelectItem value="user_events">User Submissions</SelectItem>
            <SelectItem value="news_events">AI News Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gap-analysis">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Gap Analysis
            </div>
          </TabsTrigger>
          <TabsTrigger value="events">Events ({filteredEvents.length})</TabsTrigger>
          <TabsTrigger value="user-events">User Events ({filteredUserEvents.length})</TabsTrigger>
          <TabsTrigger value="news-events">News Events ({filteredNewsEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EventsOverview eventsData={eventsData} />
        </TabsContent>

        <TabsContent value="gap-analysis" className="space-y-6">
          <GapAnalysisTab 
            eventsData={eventsData}
            gapAnalysis={gapAnalysis}
            isRunningGapAnalysis={isRunningGapAnalysis}
            diagnostic={diagnostic}
            isRunningDiagnostic={isRunningDiagnostic}
            availableCategories={availableCategories}
            onRunGapAnalysis={runGapAnalysis}
            onRunDiagnostic={runDatabaseDiagnostic}
            onApplySuggestion={applySuggestion}
            onClearCache={clearGapAnalysisCache}
          />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <EventsList events={filteredEvents} onRefresh={loadEventsData} />
        </TabsContent>

        <TabsContent value="user-events" className="space-y-4">
          <UserEventsList events={filteredUserEvents} onRefresh={loadEventsData} />
        </TabsContent>

        <TabsContent value="news-events" className="space-y-4">
          <NewsEventsList events={filteredNewsEvents} onRefresh={loadEventsData} />
        </TabsContent>
      </Tabs>

      {/* Historical Research Dialog */}
      <Dialog open={showHistoricalResearchDialog} onOpenChange={setShowHistoricalResearchDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Historical Research AI Agent
            </DialogTitle>
            <DialogDescription>
              Advanced AI agent that learns from existing database content to generate new historical events and build knowledge connections
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Agent Learning Context Display */}
            {eventsData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  AI Agent Learning Context
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Database Topics</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{eventsData.stats.total_events}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Historical Events</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{eventsData.stats.historical_events}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Content Patterns</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {Math.floor(eventsData.stats.total_events / 10)}+
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Available Categories</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {availableCategories.length}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800/30 rounded text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Agent Learning Features:</p>
                  <p>• Analyzes existing content patterns and themes • Identifies content gaps systematically • Builds knowledge relationships • Generates contextually relevant content</p>
                </div>
              </div>
            )}

            {/* Database Reality Check */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Reality Check
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Verify what's actually in your database vs hardcoded fallback data
                  </p>
                </div>
                <Button
                  onClick={runDatabaseDiagnostic}
                  disabled={isRunningDiagnostic}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  {isRunningDiagnostic ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Check Database
                    </>
                  )}
                </Button>
              </div>
              
              {diagnostic && (
                <div className="mt-4 space-y-3">
                  {/* Reality Check Summary */}
                  <div className="bg-white dark:bg-orange-900/30 p-3 rounded border border-orange-200 dark:border-orange-700">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-orange-800 dark:text-orange-200">
                        Database Analysis Results
                      </h5>
                      <Badge 
                        variant={diagnostic.reality_check.has_real_content ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {diagnostic.reality_check.has_real_content ? 'Has Real Content' : 'Mostly Fake Data'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-orange-700 dark:text-orange-300">Question Topics</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          {diagnostic.reality_check.content_sources.question_topics.count}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-orange-700 dark:text-orange-300">Events</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          {diagnostic.reality_check.content_sources.events.count}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-orange-700 dark:text-orange-300">Questions</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          {diagnostic.reality_check.content_sources.questions.count}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-800/30 rounded text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-orange-800 dark:text-orange-200">
                          Real vs Hardcoded Categories:
                        </span>
                        <span className="font-bold text-orange-900 dark:text-orange-100">
                          {diagnostic.reality_check.hardcoded_vs_real.percentage_real}% real
                        </span>
                      </div>
                      <div className="text-orange-700 dark:text-orange-300">
                        {diagnostic.reality_check.hardcoded_vs_real.real_from_database} real categories + {diagnostic.reality_check.hardcoded_vs_real.hardcoded_fallbacks} hardcoded fallbacks
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-800/30 rounded text-xs">
                      <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">Recommendation:</p>
                      <p className="text-orange-700 dark:text-orange-300">
                        {diagnostic.gap_analysis_validity.recommended_action}
                      </p>
                    </div>
                    
                    {diagnostic.content_analysis.time_coverage.earliest_event && (
                      <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-800/30 rounded text-xs">
                        <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">Time Coverage:</p>
                        <p className="text-orange-700 dark:text-orange-300">
                          {diagnostic.content_analysis.time_coverage.earliest_event} to {diagnostic.content_analysis.time_coverage.latest_event} 
                          ({diagnostic.content_analysis.time_coverage.time_span_years} years)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Gap Analysis Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    AI-Powered Content Gap Analysis
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Using OpenAI to analyze {diagnostic ? diagnostic.summary.total_content_items : 'your'} database items and {diagnostic ? diagnostic.reality_check.hardcoded_vs_real.real_from_database : availableCategories.length} real categories
                  </p>
                  {diagnostic && (
                    <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                      Database Quality: {diagnostic.summary.verdict} • {diagnostic.summary.percentage_real_data}% real data
                    </div>
                  )}
                </div>
                <Button
                  onClick={runGapAnalysis}
                  disabled={isRunningGapAnalysis}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  {isRunningGapAnalysis ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">AI Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              </div>
              
              {gapAnalysis && Array.isArray(gapAnalysis) && gapAnalysis.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h5 className="font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                      🤖 AI-Powered
                    </span>
                    Found {gapAnalysis.length} Intelligent Research Opportunities:
                  </h5>
                  {gapAnalysis.slice(0, 3).map((gap: any) => (
                    <div key={gap.id} className="bg-white dark:bg-purple-900/30 p-3 rounded border border-purple-200 dark:border-purple-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h6 className="font-medium text-purple-900 dark:text-purple-100">{gap.title}</h6>
                            <Badge variant={gap.priority === 'high' ? 'destructive' : gap.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                              {gap.priority} priority
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {gap.confidence}% confidence
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {gap.impact_potential}/10 impact
                            </Badge>
                          </div>
                          <p className="text-sm text-purple-700 dark:text-purple-300">{gap.description}</p>
                          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                            <strong>Evidence:</strong>{' '}
                            {gap.evidence && typeof gap.evidence === 'object' ? (
                              <>
                                {gap.evidence.current_content_count || 0} current items, 
                                {gap.evidence.related_content_found || 0} related found, 
                                gap size: {gap.evidence.gap_size_estimate || 'unknown'}
                              </>
                            ) : (
                              Array.isArray(gap.evidence) ? (
                                <>
                                  {gap.evidence.slice(0, 2).join('; ')}
                                  {gap.evidence.length > 2 && ` +${gap.evidence.length - 2} more`}
                                </>
                              ) : (
                                'No evidence data available'
                              )
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => applySuggestion(gap as any)}
                          size="sm"
                          className="ml-4"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          Research This
                        </Button>
                      </div>
                    </div>
                  ))}
                  {Array.isArray(gapAnalysis) && gapAnalysis.length > 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowHistoricalResearchDialog(true)}
                      className="text-purple-700 hover:text-purple-900"
                    >
                      View All {gapAnalysis.length} Opportunities
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Research Configuration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Research Mode</label>
                  <Select 
                    value={historicalResearchState.query} 
                    onValueChange={(value) => setHistoricalResearchState(prev => ({ ...prev, query: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI research mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="systematic_survey">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Systematic Survey</span>
                          <span className="text-xs text-slate-500">Comprehensive analysis of historical gaps</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="period_focus">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Period Focus</span>
                          <span className="text-xs text-slate-500">Deep dive into specific time periods</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="thematic_research">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Thematic Research</span>
                          <span className="text-xs text-slate-500">Focus on specific civic themes</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gap_analysis">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Gap Analysis</span>
                          <span className="text-xs text-slate-500">Identify and fill content gaps</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="relationship_discovery">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Relationship Discovery</span>
                          <span className="text-xs text-slate-500">Build knowledge connections</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Year</label>
                    <Input
                      type="number"
                      placeholder="1789"
                      min="1600"
                      max="2024"
                      value={historicalResearchState.timeframe.start}
                      onChange={(e) => setHistoricalResearchState(prev => ({
                        ...prev,
                        timeframe: { ...prev.timeframe, start: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Year</label>
                    <Input
                      type="number"
                      placeholder="2024"
                      min="1600"
                      max="2024"
                      value={historicalResearchState.timeframe.end}
                      onChange={(e) => setHistoricalResearchState(prev => ({
                        ...prev,
                        timeframe: { ...prev.timeframe, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Focus Areas</label>
                  
                  {/* Enhanced Focus Areas Input */}
                  <div className="space-y-3" id="research-config">
                    <Textarea
                      placeholder="Type focus areas separated by commas (e.g., Civil Rights Movement, Presidential Powers, Supreme Court Decisions)"
                      value={historicalResearchState.focusAreas.join(', ')}
                      onChange={(e) => setHistoricalResearchState(prev => ({
                        ...prev,
                        focusAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      rows={2}
                      className="resize-none"
                    />
                    
                    {/* Quick Add Categories */}
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-between" disabled={isLoadingCategories}>
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              {isLoadingCategories ? 'Loading categories...' : `Add from ${availableCategories.length} existing categories`}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search categories..." />
                            <CommandList>
                              <CommandEmpty>No categories found.</CommandEmpty>
                              <CommandGroup>
                                {availableCategories.map((category) => (
                                  <CommandItem
                                    key={category}
                                    onSelect={() => {
                                      if (!historicalResearchState.focusAreas.includes(category)) {
                                        setHistoricalResearchState(prev => ({
                                          ...prev,
                                          focusAreas: [...prev.focusAreas, category]
                                        }))
                                      }
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <span>{category}</span>
                                    {historicalResearchState.focusAreas.includes(category) && (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Selected Focus Areas Tags */}
                    {historicalResearchState.focusAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {historicalResearchState.focusAreas.map((area) => (
                          <Badge key={area} variant="secondary" className="flex items-center gap-1">
                            {area}
                            <button
                              onClick={() => {
                                setHistoricalResearchState(prev => ({
                                  ...prev,
                                  focusAreas: prev.focusAreas.filter(f => f !== area)
                                }))
                              }}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Agent Capabilities
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Learns from {eventsData?.stats.total_events || 0} existing database topics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Identifies content gaps and patterns automatically</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Builds knowledge relationships and connections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Generates civic education focused content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Creates thematic content packages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Smart gap analysis with {diagnostic ? diagnostic.reality_check.hardcoded_vs_real.real_from_database : availableCategories.length} real categories</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleHistoricalResearch}
                  disabled={historicalResearchState.isResearching || !historicalResearchState.query}
                  className="w-full"
                  size="lg"
                >
                  {historicalResearchState.isResearching ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">AI Agent Learning & Researching...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Start AI Research Agent
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Research Progress & Results */}
            {historicalResearchState.isResearching && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <LoadingSpinner />
                  <span className="font-medium text-blue-900 dark:text-blue-100">AI Agent Working...</span>
                </div>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <p>• Loading database context and analyzing existing content patterns</p>
                  <p>• Identifying content gaps and relationship opportunities</p>
                  <p>• Generating contextually aware historical events</p>
                  <p>• Building knowledge connections and content packages</p>
                </div>
              </div>
            )}

            {/* Research Summary */}
            {historicalResearchState.researchSummary && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  AI Research Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Events Generated</p>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">
                      {historicalResearchState.researchSummary.total_events}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Content Connections</p>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">
                      {historicalResearchState.researchSummary.content_connections}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Content Packages</p>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">
                      {historicalResearchState.researchSummary.content_packages}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Confidence Score</p>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">
                      {historicalResearchState.researchSummary.confidence_score}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-green-700 dark:text-green-300">
                  <p><strong>Database Context:</strong> {historicalResearchState.researchSummary.database_context_utilized}</p>
                  <p><strong>Patterns Discovered:</strong> {historicalResearchState.researchSummary.patterns_discovered}</p>
                  <p><strong>Gaps Identified:</strong> {historicalResearchState.researchSummary.gaps_identified}</p>
                </div>
              </div>
            )}

            {/* Research Results */}
            {historicalResearchState.results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Generated Historical Events ({historicalResearchState.results.length})
                  </h4>
                  <div className="text-sm text-slate-600">
                    Select events to add to database
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4">
                  {historicalResearchState.results.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={historicalResearchState.selectedResults.includes(event.title)}
                          onChange={(e) => {
                            setHistoricalResearchState(prev => ({
                              ...prev,
                              selectedResults: e.target.checked
                                ? [...prev.selectedResults, event.title]
                                : prev.selectedResults.filter(title => title !== event.title)
                            }))
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium">{event.title}</h5>
                            <Badge variant="outline" className="text-xs">
                              {event.event_type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Significance: {event.significance_level}/10
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Confidence: {event.confidence_score}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {event.description}
                          </p>
                          <div className="text-xs text-slate-500 space-y-1">
                            <p><strong>Date:</strong> {event.event_date}</p>
                            {event.key_figures && event.key_figures.length > 0 && (
                              <p><strong>Key Figures:</strong> {event.key_figures.join(', ')}</p>
                            )}
                            <p><strong>Impact:</strong> {event.impact_summary}</p>
                            <p><strong>Civic Relevance:</strong> {event.why_this_matters}</p>
                            {event.related_existing_content && event.related_existing_content.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <LinkIcon className="h-3 w-3" />
                                <span className="text-xs">Connects to {event.related_existing_content.length} existing topics</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Packages */}
            {historicalResearchState.contentPackages.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Generated Content Packages ({historicalResearchState.contentPackages.length})
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {historicalResearchState.contentPackages.map((pkg, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2">{pkg.title}</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{pkg.description}</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>Theme:</span>
                            <Badge variant="outline">{pkg.theme}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Time Period:</span>
                            <span>{pkg.time_period}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Civic Relevance:</span>
                            <span>{pkg.civic_relevance_score}/10</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHistoricalResearchDialog(false)}
            >
              Cancel
            </Button>
            {historicalResearchState.results.length > 0 && (
              <Button
                onClick={handleSaveHistoricalEvents}
                disabled={historicalResearchState.selectedResults.length === 0}
              >
                Save Selected Events ({historicalResearchState.selectedResults.length})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gap Analysis Detail Dialog */}
      <Dialog open={selectedSuggestion !== null} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Research Suggestion
            </DialogTitle>
            <DialogDescription>
              AI-generated research suggestion based on content gap analysis
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Suggestion Details */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Research Suggestion</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong>
                  <p>{selectedSuggestion?.title}</p>
                </div>
                <div>
                  <strong>Description:</strong>
                  <p>{selectedSuggestion?.description}</p>
                </div>
                <div>
                  <strong>Research Mode:</strong>
                  <p>{selectedSuggestion?.suggested_approach.research_mode}</p>
                </div>
                <div>
                  <strong>Focus Areas:</strong>
                  <p>{selectedSuggestion?.suggested_approach.focus_areas.join(', ')}</p>
                </div>
                <div>
                  <strong>Expected Events:</strong>
                  <p>{selectedSuggestion?.suggested_approach.expected_events}</p>
                </div>
              </div>
            </div>

            {/* Research Summary */}
            {selectedSuggestion && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  AI Research Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Database Context:</strong>
                    <p>{selectedSuggestion.research_summary.database_context_utilized}</p>
                  </div>
                  <div>
                    <strong>Patterns Discovered:</strong>
                    <p>{selectedSuggestion.research_summary.patterns_discovered}</p>
                  </div>
                  <div>
                    <strong>Gaps Identified:</strong>
                    <p>{selectedSuggestion.research_summary.gaps_identified}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedSuggestion(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}