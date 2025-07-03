'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  MapPin, 
  Users, 
  Vote, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Search,
  RefreshCw,
  BookOpen,
  Building
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface Representative {
  id: string
  name: string
  office: string
  level: 'federal' | 'state' | 'local'
  party?: string
  phone?: string
  email?: string
  website_url?: string
  office_address?: string
  district_name?: string
  data_source: string
}

interface Election {
  id: string
  name: string
  electionDay: string
  isUpcoming: boolean
  voterInfo?: {
    pollingLocations?: any[]
    earlyVoteSites?: any[]
    contests?: any[]
  }
}

interface LocationData {
  address: string
  coordinates?: { lat: number; lng: number }
  representatives: {
    federal: Representative[]
    state: Representative[]
    local: Representative[]
  }
  coverage: {
    federal: string
    state: string
    local: string
  }
  helpfulLinks?: {
    suggestions: string[]
    helpText: string
  }
}

export default function LocationAwareDashboard() {
  const [address, setAddress] = useState('')
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Load saved representatives on mount
  useEffect(() => {
    loadSavedData()
  }, [])

  const loadSavedData = async () => {
    try {
      const response = await fetch('/api/location/representatives')
      const data = await response.json()

      if (data.success && data.data.representatives) {
        const reps = data.data.representatives
        if (reps.federal.length > 0 || reps.state.length > 0 || reps.local.length > 0) {
          setLocationData({
            address: data.data.location?.formatted_address || 'Your saved location',
            representatives: reps,
            coverage: {
              federal: reps.federal.length > 0 ? 'complete' : 'missing',
              state: reps.state.length > 0 ? 'complete' : 'missing',
              local: reps.local.length > 0 ? 'complete' : 'manual_lookup_required'
            }
          })
          setHasSearched(true)
        }
      }
    } catch (err) {
      console.warn('Failed to load saved data:', err)
    }
  }

  const handleAddressSearch = async () => {
    if (!address.trim()) return

    try {
      setLoading(true)
      setError(null)

      // Search for representatives
      const repsResponse = await fetch('/api/location/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: address.trim(),
          saveToProfile: true 
        })
      })

      const repsData = await repsResponse.json()

      if (!repsData.success) {
        throw new Error(repsData.error || 'Failed to find representatives')
      }

      setLocationData(repsData.data)

      // Search for elections
      const electionsResponse = await fetch('/api/location/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() })
      })

      const electionsData = await electionsResponse.json()
      if (electionsData.success) {
        setElections([
          ...(electionsData.data.elections || []),
          ...(electionsData.data.upcomingElection ? [electionsData.data.upcomingElection] : [])
        ])
      }

      setHasSearched(true)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const getPartyColor = (party?: string) => {
    if (!party) return 'bg-gray-100 text-gray-800'
    const lowerParty = party.toLowerCase()
    if (lowerParty.includes('democrat')) return 'bg-blue-100 text-blue-800'
    if (lowerParty.includes('republican')) return 'bg-red-100 text-red-800'
    if (lowerParty.includes('independent')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getCoverageColor = (coverage: string) => {
    switch (coverage) {
      case 'complete': return 'text-green-600'
      case 'partial': return 'text-yellow-600'
      case 'missing': return 'text-red-600'
      case 'manual_lookup_required': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getCoverageIcon = (coverage: string) => {
    switch (coverage) {
      case 'complete': return <CheckCircle className="h-4 w-4" />
      case 'partial': return <AlertTriangle className="h-4 w-4" />
      case 'missing': return <AlertTriangle className="h-4 w-4" />
      case 'manual_lookup_required': return <Search className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatCoverage = (coverage: string) => {
    switch (coverage) {
      case 'complete': return 'Complete'
      case 'partial': return 'Partial'
      case 'missing': return 'Missing'
      case 'manual_lookup_required': return 'Manual lookup needed'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Your Representatives & Elections</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find your federal, state, and local representatives. Learn about upcoming elections 
          and how to make your voice heard in democracy.
        </p>
      </div>

      {/* Address Search */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Find Your Representatives
          </CardTitle>
          <CardDescription>
            Enter your address to find your representatives and election information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="address" className="sr-only">Address</Label>
              <Input
                id="address"
                placeholder="Enter your address (e.g., 123 Main St, Austin, TX)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
              />
            </div>
            <Button 
              onClick={handleAddressSearch} 
              disabled={loading || !address.trim()}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && locationData && (
        <div className="space-y-6">
          {/* Location Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location: {locationData.address}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="text-sm">Federal:</span>
                  <div className={`flex items-center gap-1 ${getCoverageColor(locationData.coverage.federal)}`}>
                    {getCoverageIcon(locationData.coverage.federal)}
                    <span className="text-sm font-medium">
                      {formatCoverage(locationData.coverage.federal)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="text-sm">State:</span>
                  <div className={`flex items-center gap-1 ${getCoverageColor(locationData.coverage.state)}`}>
                    {getCoverageIcon(locationData.coverage.state)}
                    <span className="text-sm font-medium">
                      {formatCoverage(locationData.coverage.state)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="text-sm">Local:</span>
                  <div className={`flex items-center gap-1 ${getCoverageColor(locationData.coverage.local)}`}>
                    {getCoverageIcon(locationData.coverage.local)}
                    <span className="text-sm font-medium">
                      {formatCoverage(locationData.coverage.local)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="representatives" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="representatives">
                <Users className="h-4 w-4 mr-2" />
                Representatives
              </TabsTrigger>
              <TabsTrigger value="elections">
                <Vote className="h-4 w-4 mr-2" />
                Elections
              </TabsTrigger>
            </TabsList>

            {/* Representatives Tab */}
            <TabsContent value="representatives" className="space-y-4">
              {/* Federal Representatives */}
              {locationData.representatives.federal.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Federal Representatives</CardTitle>
                    <CardDescription>Your representatives in Congress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {locationData.representatives.federal.map((rep) => (
                        <RepresentativeCard key={rep.id} representative={rep} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* State Representatives */}
              {locationData.representatives.state.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>State Representatives</CardTitle>
                    <CardDescription>Your state legislators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {locationData.representatives.state.map((rep) => (
                        <RepresentativeCard key={rep.id} representative={rep} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Local Representatives */}
              {locationData.representatives.local.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Local Representatives</CardTitle>
                    <CardDescription>Your local government officials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {locationData.representatives.local.map((rep) => (
                        <RepresentativeCard key={rep.id} representative={rep} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : locationData.helpfulLinks && (
                <Card>
                  <CardHeader>
                    <CardTitle>Find Your Local Representatives</CardTitle>
                    <CardDescription>
                      We're working to improve local representative data coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {locationData.helpfulLinks.helpText}
                    </p>
                    <div className="space-y-2">
                      {locationData.helpfulLinks.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-blue-900">
                        Learn About Your Representatives
                      </h3>
                      <p className="text-sm text-blue-700">
                        Explore quizzes and content related to your representatives' actions, 
                        voting records, and the issues they work on.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Explore Related Content
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Elections Tab */}
            <TabsContent value="elections" className="space-y-4">
              {elections.length > 0 ? (
                elections.map((election) => (
                  <Card key={election.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {election.name}
                      </CardTitle>
                      <CardDescription>
                        Election Date: {new Date(election.electionDay).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {election.isUpcoming && (
                          <Badge className="bg-green-100 text-green-800">
                            Upcoming Election
                          </Badge>
                        )}
                        
                        {election.voterInfo && (
                          <div className="space-y-2">
                            {election.voterInfo.pollingLocations && election.voterInfo.pollingLocations.length > 0 && (
                              <div>
                                <h4 className="font-medium">Polling Locations</h4>
                                <p className="text-sm text-gray-600">
                                  {election.voterInfo.pollingLocations.length} location(s) found
                                </p>
                              </div>
                            )}
                            
                            {election.voterInfo.contests && election.voterInfo.contests.length > 0 && (
                              <div>
                                <h4 className="font-medium">Contests on Your Ballot</h4>
                                <p className="text-sm text-gray-600">
                                  {election.voterInfo.contests.length} race(s) on your ballot
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <Button variant="outline" size="sm">
                          <Vote className="h-4 w-4 mr-2" />
                          View Voting Guide
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">
                      No upcoming elections found
                    </h3>
                    <p className="text-sm text-gray-600">
                      Check back later for information about upcoming elections in your area.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* No Search Yet State */}
      {!hasSearched && !loading && (
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="pt-6">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Find Your Representatives
            </h3>
            <p className="text-sm text-gray-600">
              Enter your address above to discover who represents you in government 
              and learn about upcoming elections.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Representative Card Component
function RepresentativeCard({ representative }: { representative: Representative }) {
  const getPartyColor = (party?: string) => {
    if (!party) return 'bg-gray-100 text-gray-800'
    const lowerParty = party.toLowerCase()
    if (lowerParty.includes('democrat')) return 'bg-blue-100 text-blue-800'
    if (lowerParty.includes('republican')) return 'bg-red-100 text-red-800'
    if (lowerParty.includes('independent')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{representative.name}</h3>
          <p className="text-gray-600">{representative.office}</p>
          {representative.district_name && (
            <p className="text-sm text-gray-500">District: {representative.district_name}</p>
          )}
        </div>
        {representative.party && (
          <Badge className={getPartyColor(representative.party)}>
            {representative.party}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {representative.phone && (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${representative.phone}`}>
              <Phone className="h-3 w-3 mr-1" />
              Call
            </a>
          </Button>
        )}
        {representative.email && (
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${representative.email}`}>
              <Mail className="h-3 w-3 mr-1" />
              Email
            </a>
          </Button>
        )}
        {representative.website_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={representative.website_url} target="_blank" rel="noopener noreferrer">
              <Globe className="h-3 w-3 mr-1" />
              Website
            </a>
          </Button>
        )}
      </div>

      {representative.office_address && (
        <p className="text-xs text-gray-500">
          <MapPin className="h-3 w-3 inline mr-1" />
          {representative.office_address}
        </p>
      )}
    </div>
  )
} 