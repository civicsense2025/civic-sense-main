"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@civicsense/shared/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@civicsense/ui-web"
import { Badge } from "@civicsense/ui-web"
import { Input } from "@civicsense/ui-web"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@civicsense/ui-web"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@civicsense/ui-web"
import { Loader2, ArrowLeft } from "lucide-react"
import { UserMenu } from "@civicsense/ui-web/components/auth/user-menu"
import { Skeleton } from "@civicsense/ui-web"
import { SimpleBookmarkButton } from '@civicsense/ui-web/components/bookmarks/simple-bookmark-button'

// Define types for public figures data
interface PublicFigure {
  id: string
  slug: string
  full_name: string
  display_name: string | null
  primary_role_category: string
  influence_level: number | null
  current_positions: string[] | null
  party_affiliation: string | null
  civicsense_priority: number | null
}

// Public Figure Card Skeleton Component
function PublicFigureCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with name and badges */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Positions */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Public Figure List Item Skeleton Component
function PublicFigureListSkeleton() {
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 py-4 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  )
}

// Loading state for grid view
function GridLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 9 }).map((_, i) => (
        <PublicFigureCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Loading state for list view
function ListLoadingSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 12 }).map((_, i) => (
        <PublicFigureListSkeleton key={i} />
      ))}
    </div>
  )
}

export default function PublicFiguresPage() {
  const [figures, setFigures] = useState<PublicFigure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [partyFilter, setPartyFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  // Role categories for filtering
  const roleCategories = [
    "President",
    "Cabinet Official",
    "Congress (MAGA)",
    "Congress (Traditional Republican)",
    "Governor / State Official",
    "Judiciary / Legal Influence",
    "White House / Senior Advisor",
    "Media Personality / Influencer",
    "Think Tank / Policy Author",
    "Megadonor / Financier",
    "Legal Team",
    "Religious Leader",
    "Far-right Activist",
    "Trump Orbit"
  ]

  // Party affiliations for filtering
  const partyAffiliations = [
    "Republican",
    "Democrat",
    "Independent",
    "Independent/Republican-leaning",
    "Republican/Former Democrat"
  ]

  useEffect(() => {
    const fetchPublicFigures = async () => {
      try {
        setLoading(true)
        // Using any type to bypass the database type checking since public_figures is a new table
        const { data, error } = await (supabase as any)
          .from('public_figures')
          .select('id, slug, full_name, display_name, primary_role_category, influence_level, current_positions, party_affiliation, civicsense_priority')
          .order('civicsense_priority', { ascending: false })
          .order('influence_level', { ascending: false })
          .order('full_name')
        
        if (error) {
          throw error
        }
        
        setFigures(data as PublicFigure[] || [])
      } catch (err) {
        console.error('Error fetching public figures:', err)
        setError('Failed to load public figures. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPublicFigures()
  }, [])

  // Filter figures based on search query and filters
  const filteredFigures = figures.filter(figure => {
    const matchesSearch = 
      figure.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (figure.display_name && figure.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (figure.current_positions && figure.current_positions.some(pos => 
        pos.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    
    const matchesRole = roleFilter === "all" || figure.primary_role_category === roleFilter
    const matchesParty = partyFilter === "all" || figure.party_affiliation === partyFilter

    return matchesSearch && matchesRole && matchesParty
  })

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
        {/* Clean header with lots of whitespace */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
            Public Figures
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Explore key political figures and their connections in American politics
          </p>
        </div>

        {/* Filters and search - cleaner layout */}
        <div className="space-y-6 mb-12">
          <Input 
            placeholder="Search by name or position..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md mx-auto"
          />
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roleCategories.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={partyFilter} onValueChange={setPartyFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {partyAffiliations.map(party => (
                  <SelectItem key={party} value={party}>{party}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View tabs - cleaner style */}
        <Tabs defaultValue="grid" className="space-y-8">
          <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 bg-slate-50 dark:bg-slate-900 border-0 rounded-full p-1">
            <TabsTrigger 
              value="grid" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-light"
            >
              Grid View
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-light"
            >
              List View
            </TabsTrigger>
          </TabsList>
          
          {/* Grid View - cleaner cards */}
          <TabsContent value="grid">
            {loading ? (
              <GridLoadingSkeleton />
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredFigures.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-light">
                No public figures match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFigures.map(figure => (
                  <Link href={`/public-figures/${figure.slug}`} key={figure.id} className="group">
                    <div className="h-full p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all hover:shadow-sm">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {figure.display_name || figure.full_name}
                          </h2>
                          <div className="flex items-center gap-2">
                            <SimpleBookmarkButton
                              contentType="figure"
                              contentId={figure.id}
                              title={figure.display_name || figure.full_name}
                              description={`${figure.primary_role_category} - ${figure.party_affiliation || 'Unknown party'}`}
                              tags={[figure.primary_role_category, figure.party_affiliation || 'Unknown'].filter(Boolean)}
                              variant="icon"
                            />
                            {figure.influence_level && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Level {figure.influence_level}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 font-light">
                          {figure.primary_role_category}
                        </p>
                        
                        {figure.current_positions && figure.current_positions.length > 0 && (
                          <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
                            {figure.current_positions[0]}
                          </p>
                        )}
                        
                        <div className="pt-4 flex justify-between items-center">
                          <Badge variant="secondary" className="font-light">
                            {figure.party_affiliation || "Unknown"}
                          </Badge>
                          <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            View profile →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* List View - cleaner list */}
          <TabsContent value="list">
            {loading ? (
              <ListLoadingSkeleton />
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredFigures.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-light">
                No public figures match your filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFigures.map(figure => (
                  <Link href={`/public-figures/${figure.slug}`} key={figure.id}>
                    <div className="flex justify-between items-center p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">{figure.display_name || figure.full_name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                          {figure.primary_role_category}
                          {figure.current_positions && figure.current_positions.length > 0 && (
                            <> • {figure.current_positions[0]}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-light">{figure.party_affiliation || "Unknown"}</Badge>
                        {figure.influence_level && (
                          <Badge variant={figure.influence_level >= 4 ? "destructive" : "outline"} className="font-light">
                            Level {figure.influence_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 