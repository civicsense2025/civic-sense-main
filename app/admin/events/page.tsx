'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  LinkIcon
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

export default function EventsAdminPage() {
  const [eventsData, setEventsData] = useState<EventsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    loadEventsData()
  }, [selectedEventType])

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events ({filteredEvents.length})</TabsTrigger>
          <TabsTrigger value="user-events">User Events ({filteredUserEvents.length})</TabsTrigger>
          <TabsTrigger value="news-events">News Events ({filteredNewsEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EventsOverview eventsData={eventsData} />
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
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Why This Matters:
                      </p>
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
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
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