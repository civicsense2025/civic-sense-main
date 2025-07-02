"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@civicsense/shared/lib/supabase"
import { Badge } from "@civicsense/ui-web/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@civicsense/ui-web/components/ui/tabs"
import { Separator } from "@civicsense/ui-web/components/ui/separator"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { Loader2, ArrowLeft, Calendar, Info, Link as LinkIcon, ExternalLink, Briefcase, Award, MessageSquare, AlertTriangle, FileText, Users } from "lucide-react"
import { UserMenu } from "@civicsense/ui-web/components/auth/user-menu"
import { Skeleton } from "@civicsense/ui-web/components/ui/skeleton"

// Define types for public figures data
interface PublicFigure {
  id: string
  slug: string
  full_name: string
  display_name: string | null
  primary_role_category: string
  region: string
  party_affiliation: string | null
  trump_relationship_type: string | null
  influence_level: number | null
  current_positions: string[] | null
  key_positions: string[] | null
  notable_controversies: string[] | null
  key_policies_supported: string[] | null
  quotable_statements: string[] | null
  policy_flip_flops: any
  scandals_timeline: any
  financial_interests: string[] | null
  birth_year: number | null
  birth_state: string | null
  current_residence_state: string | null
  education_background: string | null
  career_highlights: string[] | null
  net_worth_estimate: number | null
  voting_record_url: string | null
  key_votes: any
  committee_memberships: string[] | null
  bills_sponsored: number | null
  social_media_handles: any
  media_appearances_count: number | null
  book_publications: string[] | null
  major_speeches: any
  civicsense_priority: number | null
  content_difficulty_level: number | null
  sources: any
}

interface FigureEvent {
  id: string
  figure_id: string
  event_date: string
  event_type: string
  event_title: string
  event_description: string | null
  significance_level: number | null
  related_figures: string[] | null
  policy_areas: string[] | null
  sources: any
}

interface FigureRelationship {
  id: string
  figure_a_id: string
  figure_b_id: string
  relationship_type: string
  relationship_strength: number | null
  relationship_direction: string | null
  description: string | null
  relationship_start_date: string | null
  relationship_end_date: string | null
  evidence_sources: any
  key_interactions: any
  policy_alignments: string[] | null
  related_figure_name?: string
  related_figure_slug?: string
}

interface PolicyPosition {
  id: string
  figure_id: string
  policy_area: string
  specific_policy: string | null
  position_description: string
  position_date: string | null
  certainty_level: string | null
  consistency_score: number | null
  sources: any
}

// Comprehensive skeleton for the detail page
function PublicFigureDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-4 w-1 bg-slate-300" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          <div className="space-y-6">
            {/* Name and basic info */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-80" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs skeleton */}
        <div className="space-y-8">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-md" />
            ))}
          </div>

          {/* Content area */}
          <div className="space-y-8">
            {/* Basic info section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Lists section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicFigureDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [figure, setFigure] = useState<PublicFigure | null>(null)
  const [events, setEvents] = useState<FigureEvent[]>([])
  const [relationships, setRelationships] = useState<FigureRelationship[]>([])
  const [policies, setPolicies] = useState<PolicyPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFigureData = async () => {
      if (!params.slug) return
      
      try {
        setLoading(true)
        
        // Fetch the public figure details
        const { data: figureData, error: figureError } = await (supabase as any)
          .from('public_figures')
          .select('*')
          .eq('slug', params.slug)
          .single()
        
        if (figureError) throw figureError
        if (!figureData) throw new Error('Figure not found')
        
        setFigure(figureData as PublicFigure)
        
        // Fetch related data in parallel
        const [eventsResponse, relationshipsResponse, policiesResponse] = await Promise.all([
          // Events
          (supabase as any)
            .from('figure_events')
            .select('*')
            .eq('figure_id', figureData.id)
            .order('event_date', { ascending: false }),
          
          // Relationships (both directions)
          Promise.all([
            (supabase as any)
              .from('figure_relationships')
              .select('*, figure_b:figure_b_id(full_name, slug)')
              .eq('figure_a_id', figureData.id),
            
            (supabase as any)
              .from('figure_relationships')
              .select('*, figure_a:figure_a_id(full_name, slug)')
              .eq('figure_b_id', figureData.id)
          ]),
          
          // Policy positions
          (supabase as any)
            .from('figure_policy_positions')
            .select('*')
            .eq('figure_id', figureData.id)
        ])
        
        // Process events
        if (eventsResponse.error) throw eventsResponse.error
        setEvents(eventsResponse.data || [])
        
        // Process relationships
        const [relationsAsA, relationsAsB] = relationshipsResponse
        
        if (relationsAsA.error) throw relationsAsA.error
        if (relationsAsB.error) throw relationsAsB.error
        
        // Transform relationships for consistent display
        const transformedRelationships = [
          ...(relationsAsA.data || []).map((rel: any) => ({
            ...rel,
            related_figure_name: rel.figure_b?.full_name,
            related_figure_slug: rel.figure_b?.slug
          })),
          ...(relationsAsB.data || []).map((rel: any) => ({
            ...rel,
            // Swap relationship direction for consistent UI
            figure_a_id: rel.figure_b_id,
            figure_b_id: rel.figure_a_id,
            related_figure_name: rel.figure_a?.full_name,
            related_figure_slug: rel.figure_a?.slug
          }))
        ]
        
        setRelationships(transformedRelationships)
        
        // Process policy positions
        if (policiesResponse.error) throw policiesResponse.error
        setPolicies(policiesResponse.data || [])
        
      } catch (err) {
        console.error('Error fetching figure data:', err)
        setError('Failed to load figure data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchFigureData()
  }, [params.slug])

  // Format dollar amount for net worth
  const formatNetWorth = (amount: number | null) => {
    if (!amount) return 'Unknown'
    
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)} billion`
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)} million`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)} thousand`
    } else {
      return `$${amount}`
    }
  }

  // Get age from birth year
  const getAge = (birthYear: number | null) => {
    if (!birthYear) return null
    const currentYear = new Date().getFullYear()
    return currentYear - birthYear
  }

  if (loading) {
    return <PublicFigureDetailSkeleton />
  }

  if (error || !figure) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex justify-center items-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <h1 className="text-2xl font-light text-red-500">Error</h1>
          <p className="text-slate-600 dark:text-slate-400">{error || 'Figure not found'}</p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/public-figures">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Public Figures
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Minimal header - matching homepage */}
      <div className="border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Clean branding */}
            <Link 
              href="/" 
              className="group hover:opacity-70 transition-opacity"
            >
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                CivicSense
              </h1>
            </Link>
            
            {/* Minimal user menu */}
            <UserMenu 
              onSignInClick={() => {}}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        {/* Back button */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="pl-0 hover:pl-0 hover:bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
            <Link href="/public-figures">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Public Figures
            </Link>
          </Button>
        </div>
        
        {/* Header section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                {figure.display_name || figure.full_name}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mt-2 font-light">
                {figure.primary_role_category}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {figure.party_affiliation && (
                <Badge variant="secondary" className="text-sm font-light">
                  {figure.party_affiliation}
                </Badge>
              )}
              {figure.influence_level && (
                <Badge variant={figure.influence_level >= 4 ? "destructive" : "outline"} className="text-sm font-light">
                  Influence Level {figure.influence_level}
                </Badge>
              )}
              {figure.trump_relationship_type && (
                <Badge variant="outline" className="text-sm font-light">
                  {figure.trump_relationship_type}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Current positions */}
          {figure.current_positions && figure.current_positions.length > 0 && (
            <div className="mt-4 space-y-1">
              {figure.current_positions.map((position, index) => (
                <p key={index} className="text-slate-800 dark:text-slate-200 font-light">
                  {position}
                </p>
              ))}
            </div>
          )}
        </div>
        
        {/* Main content tabs */}
        <Tabs defaultValue="overview" className="space-y-10">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-slate-50 dark:bg-slate-900 border-0 rounded-full p-1">
            <TabsTrigger 
              value="overview" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-light"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-light"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger 
              value="relationships" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-light"
            >
              Relationships
            </TabsTrigger>
            <TabsTrigger 
              value="policies" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-light"
            >
              Policies
            </TabsTrigger>
            <TabsTrigger 
              value="sources" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-light"
            >
              Sources
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-12">
            {/* Biographical info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center">
                <Info className="h-5 w-5 mr-2 text-slate-500" />
                Biographical Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {figure.birth_year && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Age</h3>
                      <p className="font-light">{figure.birth_year} ({getAge(figure.birth_year)} years old)</p>
                    </div>
                  )}
                  
                  {figure.birth_state && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Birth State</h3>
                      <p className="font-light">{figure.birth_state}</p>
                    </div>
                  )}
                  
                  {figure.current_residence_state && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Residence</h3>
                      <p className="font-light">{figure.current_residence_state}</p>
                    </div>
                  )}
                  
                  {figure.education_background && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Education</h3>
                      <p className="font-light">{figure.education_background}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  {figure.net_worth_estimate && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Net Worth</h3>
                      <p className="font-light">{formatNetWorth(figure.net_worth_estimate)}</p>
                    </div>
                  )}
                  
                  {figure.career_highlights && figure.career_highlights.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Career Highlights</h3>
                      <ul className="list-disc pl-5 space-y-1 font-light">
                        {figure.career_highlights.map((highlight, index) => (
                          <li key={index}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Key positions */}
            {figure.key_positions && figure.key_positions.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-slate-500" />
                  Key Positions
                </h2>
                <ul className="space-y-3 font-light">
                  {figure.key_positions.map((position, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-slate-400">•</span>
                      <span>{position}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Controversies */}
            {figure.notable_controversies && figure.notable_controversies.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-slate-500" />
                  Notable Controversies
                </h2>
                <ul className="space-y-3 font-light">
                  {figure.notable_controversies.map((controversy, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-slate-400">•</span>
                      <span>{controversy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Quotable statements */}
            {figure.quotable_statements && figure.quotable_statements.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-slate-500" />
                  Quotable Statements
                </h2>
                <ul className="space-y-6">
                  {figure.quotable_statements.map((quote, index) => (
                    <li key={index} className="pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                      <blockquote className="italic text-slate-700 dark:text-slate-300 font-light">
                        "{quote}"
                      </blockquote>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Policy flip-flops */}
            {figure.policy_flip_flops && Array.isArray(figure.policy_flip_flops) && figure.policy_flip_flops.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2 text-slate-500" />
                  Policy Position Changes
                </h2>
                <div className="space-y-8">
                  {figure.policy_flip_flops.map((flip: any, index: number) => (
                    <div key={index} className="space-y-4">
                      <h3 className="font-medium">{flip.policy}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Before</h4>
                          <p className="font-light">{flip.before}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">After</h4>
                          <p className="font-light">{flip.after}</p>
                        </div>
                      </div>
                      {flip.context && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic font-light">
                          Context: {flip.context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Financial interests */}
            {figure.financial_interests && figure.financial_interests.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center">
                  <Award className="h-5 w-5 mr-2 text-slate-500" />
                  Financial Interests
                </h2>
                <ul className="space-y-3 font-light">
                  {figure.financial_interests.map((interest, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-slate-400">•</span>
                      <span>{interest}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          
          {/* Events Timeline Tab */}
          <TabsContent value="events" className="space-y-6">
            {events.length === 0 ? (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400 font-light">No timeline events available for this figure.</p>
            ) : (
              <div className="relative border-l border-slate-200 dark:border-slate-800 pl-6 ml-6 space-y-12">
                {events.map((event, index) => (
                  <div key={event.id} className="relative">
                    {/* Date marker */}
                    <div className="absolute -left-[28px] p-1 bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800">
                      <Calendar className="h-4 w-4 text-slate-500" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white">{event.event_title}</h3>
                        {event.significance_level && (
                          <Badge variant={event.significance_level >= 4 ? "destructive" : "outline"} className="font-light">
                            Significance {event.significance_level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                        {new Date(event.event_date).toLocaleDateString()} • {event.event_type}
                      </p>
                      
                      {event.event_description && (
                        <p className="font-light text-slate-700 dark:text-slate-300">{event.event_description}</p>
                      )}
                      
                      {event.policy_areas && event.policy_areas.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {event.policy_areas.map((area, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-light">{area}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Relationships Tab */}
          <TabsContent value="relationships" className="space-y-6">
            {relationships.length === 0 ? (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400 font-light">No relationships available for this figure.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {relationships.map((relationship) => (
                  <div key={relationship.id} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all hover:shadow-sm">
                    <div className="space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium text-slate-900 dark:text-white flex items-center">
                            <Users className="h-4 w-4 mr-2 text-slate-500" />
                            {relationship.related_figure_name || 'Unknown Figure'}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 font-light">
                            {relationship.relationship_type}
                          </p>
                        </div>
                        {relationship.relationship_strength && (
                          <Badge variant={relationship.relationship_strength >= 4 ? "default" : "outline"} className="font-light">
                            Strength {relationship.relationship_strength}
                          </Badge>
                        )}
                      </div>
                      
                      {relationship.description && (
                        <p className="font-light text-slate-700 dark:text-slate-300">{relationship.description}</p>
                      )}
                      
                      {relationship.relationship_start_date && (
                        <div className="text-sm">
                          <span className="font-medium text-slate-500 dark:text-slate-400">Since: </span>
                          <span className="font-light">{new Date(relationship.relationship_start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {relationship.policy_alignments && relationship.policy_alignments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Policy Alignments</h4>
                          <div className="flex flex-wrap gap-2">
                            {relationship.policy_alignments.map((policy, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-light">{policy}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {relationship.related_figure_slug && (
                        <div className="pt-2">
                          <Button variant="outline" size="sm" asChild className="rounded-full font-light">
                            <Link href={`/public-figures/${relationship.related_figure_slug}`}>
                              View Profile
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Policy Positions Tab */}
          <TabsContent value="policies" className="space-y-10">
            {policies.length === 0 && !figure.key_policies_supported ? (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400 font-light">No policy positions available for this figure.</p>
            ) : (
              <>
                {/* Key policies supported from main figure data */}
                {figure.key_policies_supported && figure.key_policies_supported.length > 0 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                      Key Policies Supported
                    </h2>
                    <ul className="space-y-3 font-light">
                      {figure.key_policies_supported.map((policy, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 text-slate-400">•</span>
                          <span>{policy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Detailed policy positions */}
                {policies.length > 0 && (
                  <div className="space-y-10">
                    <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                      Detailed Policy Positions
                    </h2>
                    
                    <div className="space-y-8">
                      {policies.map((policy) => (
                        <div key={policy.id} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-medium text-slate-900 dark:text-white">{policy.policy_area}</h3>
                                {policy.specific_policy && (
                                  <p className="text-slate-600 dark:text-slate-400 font-light">{policy.specific_policy}</p>
                                )}
                              </div>
                              {policy.consistency_score && (
                                <Badge variant={policy.consistency_score >= 4 ? "default" : "secondary"} className="font-light">
                                  Consistency {policy.consistency_score}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="font-light text-slate-700 dark:text-slate-300">{policy.position_description}</p>
                            
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                              {policy.position_date && (
                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400">Date: </span>
                                  <span className="font-light">{new Date(policy.position_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              
                              {policy.certainty_level && (
                                <div>
                                  <span className="font-medium text-slate-500 dark:text-slate-400">Certainty: </span>
                                  <span className="font-light">{policy.certainty_level}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            {!figure.sources ? (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400 font-light">No sources available for this figure.</p>
            ) : (
              <div className="space-y-8">
                <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-slate-500" />
                  Sources
                </h2>
                
                <div className="space-y-6">
                  {Array.isArray(figure.sources) && figure.sources.map((source: any, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-1.5 mr-4">
                        <ExternalLink className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:underline text-blue-600 dark:text-blue-400"
                        >
                          {source.title}
                        </a>
                        <div className="text-sm text-slate-500 font-light">
                          {source.organization}
                          {source.type && <> • {source.type}</>}
                          {source.date && <> • {source.date}</>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 