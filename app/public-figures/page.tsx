"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

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
    <div className="container py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2">Public Figures</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Explore key political figures and their connections in American politics.
      </p>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input 
          placeholder="Search by name or position..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-1/3"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="md:w-1/3">
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
          <SelectTrigger className="md:w-1/3">
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

      {/* View tabs */}
      <Tabs defaultValue="grid" className="mb-6">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        {/* Grid View */}
        <TabsContent value="grid">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredFigures.length === 0 ? (
            <div className="text-center py-12">No public figures match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFigures.map(figure => (
                <Link href={`/public-figures/${figure.slug}`} key={figure.id}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{figure.display_name || figure.full_name}</CardTitle>
                        {figure.influence_level && (
                          <Badge variant={figure.influence_level >= 4 ? "destructive" : "outline"}>
                            Level {figure.influence_level}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{figure.primary_role_category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {figure.current_positions && figure.current_positions.length > 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {figure.current_positions[0]}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Badge variant="secondary">{figure.party_affiliation || "Unknown"}</Badge>
                      <span className="text-sm text-slate-500">View profile →</span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* List View */}
        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredFigures.length === 0 ? (
            <div className="text-center py-12">No public figures match your filters.</div>
          ) : (
            <div className="space-y-2">
              {filteredFigures.map(figure => (
                <Link href={`/public-figures/${figure.slug}`} key={figure.id}>
                  <div className="flex justify-between items-center p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div>
                      <h3 className="font-medium">{figure.display_name || figure.full_name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {figure.primary_role_category}
                        {figure.current_positions && figure.current_positions.length > 0 && (
                          <> • {figure.current_positions[0]}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{figure.party_affiliation || "Unknown"}</Badge>
                      {figure.influence_level && (
                        <Badge variant={figure.influence_level >= 4 ? "destructive" : "outline"}>
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
  )
} 