"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Calendar, Info, Link as LinkIcon, ExternalLink, Briefcase, Award, MessageSquare, AlertTriangle, FileText, Users } from "lucide-react"

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
    return (
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !figure) {
    return (
      <div className="container py-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p>{error || 'Figure not found'}</p>
          <Button asChild>
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
    <div className="container py-8 max-w-7xl">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/public-figures">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Public Figures
          </Link>
        </Button>
      </div>
      
      {/* Header section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{figure.display_name || figure.full_name}</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mt-1">{figure.primary_role_category}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {figure.party_affiliation && (
              <Badge variant="secondary" className="text-sm">
                {figure.party_affiliation}
              </Badge>
            )}
            {figure.influence_level && (
              <Badge variant={figure.influence_level >= 4 ? "destructive" : "outline"} className="text-sm">
                Influence Level {figure.influence_level}
              </Badge>
            )}
            {figure.trump_relationship_type && (
              <Badge variant="outline" className="text-sm">
                {figure.trump_relationship_type}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Current positions */}
        {figure.current_positions && figure.current_positions.length > 0 && (
          <div className="mt-4 space-y-1">
            {figure.current_positions.map((position, index) => (
              <p key={index} className="text-slate-800 dark:text-slate-200 font-medium">
                {position}
              </p>
            ))}
          </div>
        )}
      </div>
      
      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Timeline</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="policies">Policy Positions</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Biographical info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Biographical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {figure.birth_year && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Age</h3>
                    <p>{figure.birth_year} ({getAge(figure.birth_year)} years old)</p>
                  </div>
                )}
                
                {figure.birth_state && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Birth State</h3>
                    <p>{figure.birth_state}</p>
                  </div>
                )}
                
                {figure.current_residence_state && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Residence</h3>
                    <p>{figure.current_residence_state}</p>
                  </div>
                )}
                
                {figure.education_background && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Education</h3>
                    <p>{figure.education_background}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {figure.net_worth_estimate && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Net Worth</h3>
                    <p>{formatNetWorth(figure.net_worth_estimate)}</p>
                  </div>
                )}
                
                {figure.career_highlights && figure.career_highlights.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Career Highlights</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {figure.career_highlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Key positions */}
          {figure.key_positions && figure.key_positions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Key Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {figure.key_positions.map((position, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{position}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Controversies */}
          {figure.notable_controversies && figure.notable_controversies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Notable Controversies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {figure.notable_controversies.map((controversy, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{controversy}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Quotable statements */}
          {figure.quotable_statements && figure.quotable_statements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Quotable Statements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {figure.quotable_statements.map((quote, index) => (
                    <li key={index} className="pl-4 border-l-4 border-slate-200 dark:border-slate-700">
                      <blockquote className="italic text-slate-700 dark:text-slate-300">
                        "{quote}"
                      </blockquote>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {/* Policy flip-flops */}
          {figure.policy_flip_flops && Array.isArray(figure.policy_flip_flops) && figure.policy_flip_flops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Policy Position Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {figure.policy_flip_flops.map((flip: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <h3 className="font-medium">{flip.policy}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Before</h4>
                          <p>{flip.before}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">After</h4>
                          <p>{flip.after}</p>
                        </div>
                      </div>
                      {flip.context && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                          Context: {flip.context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Financial interests */}
          {figure.financial_interests && figure.financial_interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Financial Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {figure.financial_interests.map((interest, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{interest}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Events Timeline Tab */}
        <TabsContent value="events" className="space-y-6">
          {events.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No timeline events available for this figure.</p>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 pl-6 ml-6 space-y-10">
              {events.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Date marker */}
                  <div className="absolute -left-[30px] p-1 bg-white dark:bg-slate-950 rounded-full border-2 border-slate-200 dark:border-slate-700">
                    <Calendar className="h-4 w-4 text-slate-500" />
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{event.event_title}</CardTitle>
                        {event.significance_level && (
                          <Badge variant={event.significance_level >= 4 ? "destructive" : "outline"}>
                            Significance {event.significance_level}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {new Date(event.event_date).toLocaleDateString()} • {event.event_type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {event.event_description && <p>{event.event_description}</p>}
                      
                      {event.policy_areas && event.policy_areas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {event.policy_areas.map((area, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{area}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-6">
          {relationships.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No relationships available for this figure.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relationships.map((relationship) => (
                <Card key={relationship.id} className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {relationship.related_figure_name || 'Unknown Figure'}
                        </CardTitle>
                        <CardDescription>{relationship.relationship_type}</CardDescription>
                      </div>
                      {relationship.relationship_strength && (
                        <Badge variant={relationship.relationship_strength >= 4 ? "default" : "outline"}>
                          Strength {relationship.relationship_strength}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relationship.description && <p>{relationship.description}</p>}
                    
                    {relationship.relationship_start_date && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Since: </span>
                        {new Date(relationship.relationship_start_date).toLocaleDateString()}
                      </div>
                    )}
                    
                    {relationship.policy_alignments && relationship.policy_alignments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Policy Alignments</h4>
                        <div className="flex flex-wrap gap-2">
                          {relationship.policy_alignments.map((policy, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{policy}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {relationship.related_figure_slug && (
                      <div className="pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/public-figures/${relationship.related_figure_slug}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Policy Positions Tab */}
        <TabsContent value="policies" className="space-y-6">
          {policies.length === 0 && !figure.key_policies_supported ? (
            <p className="text-center py-8 text-slate-500">No policy positions available for this figure.</p>
          ) : (
            <>
              {/* Key policies supported from main figure data */}
              {figure.key_policies_supported && figure.key_policies_supported.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Policies Supported</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {figure.key_policies_supported.map((policy, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{policy}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              {/* Detailed policy positions */}
              {policies.length > 0 && (
                <div className="space-y-6">
                  {policies.map((policy) => (
                    <Card key={policy.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{policy.policy_area}</CardTitle>
                            {policy.specific_policy && (
                              <CardDescription>{policy.specific_policy}</CardDescription>
                            )}
                          </div>
                          {policy.consistency_score && (
                            <Badge variant={policy.consistency_score >= 4 ? "default" : "secondary"}>
                              Consistency {policy.consistency_score}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p>{policy.position_description}</p>
                        
                        {policy.position_date && (
                          <div className="text-sm">
                            <span className="font-medium text-slate-500 dark:text-slate-400">Date: </span>
                            {new Date(policy.position_date).toLocaleDateString()}
                          </div>
                        )}
                        
                        {policy.certainty_level && (
                          <div className="text-sm">
                            <span className="font-medium text-slate-500 dark:text-slate-400">Certainty: </span>
                            {policy.certainty_level}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          {!figure.sources ? (
            <p className="text-center py-8 text-slate-500">No sources available for this figure.</p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(figure.sources) && figure.sources.map((source: any, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-1 mr-3">
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
                        <div className="text-sm text-slate-500">
                          {source.organization}
                          {source.type && <> • {source.type}</>}
                          {source.date && <> • {source.date}</>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 