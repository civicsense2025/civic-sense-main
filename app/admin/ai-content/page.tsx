"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Brain, Users, Calendar, Search, Filter, 
  CheckCircle, XCircle, Clock, AlertCircle,
  Eye, Edit, Trash2, ExternalLink, Star,
  TrendingUp, BarChart3, Sparkles, Shield,
  ArrowRight, Plus, Download, Upload,
  Globe, User, BookOpen, Gavel, Vote
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabase'
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Use actual database types with optional tracking fields (since migration hasn't run yet)
interface AIExtractedTopic {
  id: string
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string
  emoji: string
  categories: any // Json type
  source_analysis_id?: string | null
  ai_extraction_metadata?: any
  created_at: string | null
  is_active: boolean | null
  date?: string | null
  day_of_week?: string | null
  is_breaking?: boolean | null
  translations?: any
  updated_at?: string | null
}

interface AIExtractedFigure {
  id: string
  full_name: string
  display_name?: string | null
  slug: string
  primary_role_category?: string | null
  party_affiliation?: string | null
  current_positions?: string[] | null
  source_analysis_id?: string | null
  ai_extraction_metadata?: any
  created_at?: string | null
  content_review_status?: string | null
  // Include other database fields
  bills_sponsored?: number | null
  birth_state?: string | null
  birth_year?: number | null
  civicsense_priority?: number | null
  influence_level?: number | null
  updated_at?: string | null
}

interface AIExtractedEvent {
  topic_id: string
  topic_title: string
  date: string
  description: string
  why_this_matters: string
  source_analysis_id?: string | null
  ai_extraction_metadata?: any
  sources?: any
}

interface AdminStats {
  totalTopics: number
  totalFigures: number
  totalEvents: number
  pendingReview: number
  approvedContent: number
  rejectedContent: number
  extractionSources: number
}

export default function AIContentAdminPage() {
  const { user } = useAuth()
  const { hasFeatureAccess } = usePremium()
  const { toast } = useToast()
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminAccess()
  
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [topics, setTopics] = useState<AIExtractedTopic[]>([])
  const [figures, setFigures] = useState<AIExtractedFigure[]>([])
  const [events, setEvents] = useState<AIExtractedEvent[]>([])
  
  // Check admin access and redirect if unauthorized
  useEffect(() => {
    if (!user) return
    
    if (adminError) {
      toast({
        title: "Access Error",
        description: "Could not verify admin permissions",
        variant: "destructive"
      })
      window.location.href = '/dashboard'
      return
    }
    
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions to access this panel",
        variant: "destructive"
      })
      window.location.href = '/dashboard'
      return
    }
    
    if (!adminLoading && isAdmin) {
      console.log('✅ Admin access verified for user:', user.email)
    }
  }, [user, isAdmin, adminLoading, adminError, toast])

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Load AI-extracted topics (fallback to all topics if no ai_extracted exist yet)
        let { data: topicsData, error: topicsError } = await supabase
          .from('question_topics')
          .select('*')
          .eq('source_type', 'ai_extracted')
          .order('created_at', { ascending: false })
        
        // If no AI-extracted topics exist yet, show empty array
        if (topicsError || !topicsData || topicsData.length === 0) {
          topicsData = []
        }
        setTopics(topicsData as AIExtractedTopic[])
        
        // Load AI-extracted figures (fallback to empty if none exist)
        let { data: figuresData, error: figuresError } = await supabase
          .from('public_figures')
          .select('*')
          .eq('source_type', 'ai_extracted')
          .order('created_at', { ascending: false })
        
        if (figuresError || !figuresData || figuresData.length === 0) {
          figuresData = []
        }
        setFigures(figuresData as AIExtractedFigure[])
        
        // Load AI-extracted events (fallback to empty if none exist)
        let { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('source_type', 'ai_extracted')
          .order('date', { ascending: false })
        
        if (eventsError || !eventsData || eventsData.length === 0) {
          eventsData = []
        }
        setEvents(eventsData as AIExtractedEvent[])
        
        // Calculate stats
        const pendingFigures = figuresData?.filter(f => f.content_review_status === 'ai_generated').length || 0
        const approvedFigures = figuresData?.filter(f => f.content_review_status === 'approved').length || 0
        const rejectedFigures = figuresData?.filter(f => f.content_review_status === 'rejected').length || 0
        
        // Get unique source analysis IDs (with null checks)
        const sourceIds = new Set([
          ...(topicsData?.map(t => (t as any).source_analysis_id).filter(Boolean) || []),
          ...(figuresData?.map(f => (f as any).source_analysis_id).filter(Boolean) || []),
          ...(eventsData?.map(e => (e as any).source_analysis_id).filter(Boolean) || [])
        ])
        
        const adminStats: AdminStats = {
          totalTopics: topicsData?.length || 0,
          totalFigures: figuresData?.length || 0,
          totalEvents: eventsData?.length || 0,
          pendingReview: pendingFigures,
          approvedContent: approvedFigures,
          rejectedContent: rejectedFigures,
          extractionSources: sourceIds.size
        }
        
        setStats(adminStats)
        
      } catch (error) {
        console.error('Error loading admin data:', error)
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadAdminData()
  }, [user, toast])

  const handleApproveContent = async (type: 'topic' | 'figure' | 'event', id: string) => {
    try {
      if (type === 'figure') {
        const { error } = await supabase
          .from('public_figures')
          .update({ content_review_status: 'approved' })
          .eq('id', id)
        
        if (error) throw error
        
        // Update local state
        setFigures(prev => prev.map(f => 
          f.id === id ? { ...f, content_review_status: 'approved' } : f
        ))
      }
      // Add similar logic for topics and events as needed
      
      toast({
        title: "Content Approved",
        description: `${type} has been approved and is now live`,
      })
    } catch (error) {
      console.error('Error approving content:', error)
      toast({
        title: "Error",
        description: "Failed to approve content",
        variant: "destructive"
      })
    }
  }

  const handleRejectContent = async (type: 'topic' | 'figure' | 'event', id: string) => {
    try {
      if (type === 'figure') {
        const { error } = await supabase
          .from('public_figures')
          .update({ content_review_status: 'rejected' })
          .eq('id', id)
        
        if (error) throw error
        
        // Update local state
        setFigures(prev => prev.map(f => 
          f.id === id ? { ...f, content_review_status: 'rejected' } : f
        ))
      }
      
      toast({
        title: "Content Rejected",
        description: `${type} has been rejected and hidden from users`,
      })
    } catch (error) {
      console.error('Error rejecting content:', error)
      toast({
        title: "Error",
        description: "Failed to reject content",
        variant: "destructive"
      })
    }
  }

  if (isLoading || adminLoading || !stats || (!isAdmin && !adminError)) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'ai_generated': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      'approved': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    }
    
    const variant = variants[status as keyof typeof variants] || variants['ai_generated']
    const Icon = variant.icon
    
    return (
      <Badge className={`${variant.color} border-0 font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'ai_generated' ? 'Pending' : status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      <main className="w-full py-8">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                <Brain className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                AI Content Review
              </h1>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Review and manage civic education content extracted from news articles
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-light text-slate-900 dark:text-white">
                {stats.totalTopics + stats.totalFigures + stats.totalEvents}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Total Items</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Extracted from {stats.extractionSources} articles
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-yellow-600 dark:text-yellow-400">
                {stats.pendingReview}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Pending Review</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Awaiting approval
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-green-600 dark:text-green-400">
                {stats.approvedContent}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Approved</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Live content
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-red-600 dark:text-red-400">
                {stats.rejectedContent}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Rejected</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Hidden content
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 dark:border-slate-700 rounded-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 rounded-full border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ai_generated">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40 rounded-full border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 rounded-full bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
              <TabsTrigger value="topics" className="rounded-full">
                Topics ({stats.totalTopics})
              </TabsTrigger>
              <TabsTrigger value="figures" className="rounded-full">
                Figures ({stats.totalFigures})
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-full">
                Events ({stats.totalEvents})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      Question Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                      {stats.totalTopics}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Civic education topics extracted from articles
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <User className="h-5 w-5 text-purple-500" />
                      Public Figures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                      {stats.totalFigures}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Politicians and civic leaders identified
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Calendar className="h-5 w-5 text-green-500" />
                      Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                      {stats.totalEvents}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Important civic events and milestones
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <div className="space-y-4">
                {topics.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No AI-extracted topics found
                  </div>
                ) : (
                  topics.map((topic) => (
                    <Card key={topic.id} className="border-slate-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{topic.emoji}</span>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {topic.topic_title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {topic.topic_id}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                              {topic.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(topic.categories) ? topic.categories.map((category: any) => (
                                <Badge key={category} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              )) : null}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span>Created: {topic.created_at ? new Date(topic.created_at).toLocaleDateString() : 'Unknown'}</span>
                              {topic.source_analysis_id && (
                                <span>Analysis ID: {topic.source_analysis_id.slice(0, 8)}...</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge(topic.is_active ? 'approved' : 'ai_generated')}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="figures" className="space-y-6">
              <div className="space-y-4">
                {figures.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No AI-extracted figures found
                  </div>
                ) : (
                  figures.map((figure) => (
                    <Card key={figure.id} className="border-slate-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {figure.full_name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {figure.primary_role_category || 'Unknown role'}
                                  {figure.party_affiliation && ` • ${figure.party_affiliation}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {figure.current_positions?.map((position, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {position}
                                </Badge>
                              )) || null}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span>Added: {figure.created_at ? new Date(figure.created_at).toLocaleDateString() : 'Unknown'}</span>
                              {figure.source_analysis_id && (
                                <span>Analysis ID: {figure.source_analysis_id.slice(0, 8)}...</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge(figure.content_review_status || 'ai_generated')}
                            <div className="flex gap-1">
                              {figure.content_review_status === 'ai_generated' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleApproveContent('figure', figure.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRejectContent('figure', figure.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No AI-extracted events found
                  </div>
                ) : (
                  events.map((event) => (
                    <Card key={event.topic_id} className="border-slate-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {event.topic_title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {new Date(event.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                              {event.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              {event.source_analysis_id && (
                                <span>Analysis ID: {event.source_analysis_id.slice(0, 8)}...</span>
                              )}
                              {event.ai_extraction_metadata?.significance && (
                                <Badge variant="outline" className="text-xs">
                                  {event.ai_extraction_metadata.significance} significance
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge('approved')}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="text-center py-12 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-4">
              <h3 className="text-xl font-light text-slate-900 dark:text-white">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="outline" className="rounded-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="rounded-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Link href="/test-media-bias-analysis">
                  <Button variant="outline" className="rounded-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Extraction
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
} 