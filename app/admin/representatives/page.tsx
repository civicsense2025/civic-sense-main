'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  MapPin, 
  AlertTriangle, 
  RefreshCw, 
  Plus,
  Search,
  Filter,
  Database,
  Globe,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

interface Representative {
  id: string
  name: string
  office: string
  level: 'federal' | 'state' | 'local'
  party?: string
  data_source: string
  last_verified: string
  needs_manual_verification: boolean
  user_count?: number
}

interface LocationCoverage {
  id: string
  location_hash: string
  coverage_level: {
    federal: string
    state: string
    local: string
  }
  last_updated: string
  needs_attention: boolean
  user_count?: number
}

interface Stats {
  totalRepresentatives: number
  federalCount: number
  stateCount: number
  localCount: number
  needsVerification: number
  locationsNeedingAttention: number
  dataSourceBreakdown: Record<string, number>
}

export default function AdminRepresentativesPage() {
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [locationCoverage, setLocationCoverage] = useState<LocationCoverage[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [dataSourceFilter, setDataSourceFilter] = useState<string>('all')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load representatives data
      const repsResponse = await fetch('/api/admin/representatives')
      const repsData = await repsResponse.json()

      if (!repsData.success) {
        throw new Error(repsData.error || 'Failed to load representatives')
      }

      setRepresentatives(repsData.data.representatives || [])
      setLocationCoverage(repsData.data.locationCoverage || [])
      setStats(repsData.data.stats || null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const refreshDataSources = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/representatives/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshAll: true })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Sync failed')
      }

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    }
  }

  // Filter representatives
  const filteredRepresentatives = representatives.filter(rep => {
    const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.office.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === 'all' || rep.level === levelFilter
    const matchesDataSource = dataSourceFilter === 'all' || rep.data_source === dataSourceFilter
    
    return matchesSearch && matchesLevel && matchesDataSource
  })

  const getDataSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'congress_gov': return 'bg-blue-100 text-blue-800'
      case 'openstates': return 'bg-green-100 text-green-800'
      case 'google_civic': return 'bg-purple-100 text-purple-800'
      case 'manual': return 'bg-yellow-100 text-yellow-800'
      case 'scraped': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCoverageBadgeColor = (level: string) => {
    switch (level) {
      case 'complete': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'missing': return 'bg-red-100 text-red-800'
      case 'manual': return 'bg-orange-100 text-orange-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !representatives.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading representative data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Representative Management</h1>
          <p className="text-gray-600 mt-1">
            Manage location-aware representative data and coverage tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshDataSources} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Data Sources
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Representative
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Representatives</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRepresentatives}</div>
              <div className="text-xs text-muted-foreground">
                Federal: {stats.federalCount} | State: {stats.stateCount} | Local: {stats.localCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Verification</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.needsVerification}</div>
              <div className="text-xs text-muted-foreground">
                Require manual verification
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location Coverage Issues</CardTitle>
              <MapPin className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.locationsNeedingAttention}</div>
              <div className="text-xs text-muted-foreground">
                Locations need attention
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.dataSourceBreakdown).map(([source, count]) => (
                  <div key={source} className="flex justify-between text-xs">
                    <span className="capitalize">{source}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="representatives" className="space-y-6">
        <TabsList>
          <TabsTrigger value="representatives">Representatives</TabsTrigger>
          <TabsTrigger value="coverage">Location Coverage</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
        </TabsList>

        {/* Representatives Tab */}
        <TabsContent value="representatives" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search representatives..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="all">All Levels</option>
                    <option value="federal">Federal</option>
                    <option value="state">State</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dataSource">Data Source</Label>
                  <select
                    id="dataSource"
                    value={dataSourceFilter}
                    onChange={(e) => setDataSourceFilter(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="all">All Sources</option>
                    <option value="congress_gov">Congress.gov</option>
                    <option value="openstates">OpenStates</option>
                    <option value="google_civic">Google Civic</option>
                    <option value="manual">Manual</option>
                    <option value="scraped">Scraped</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Representatives Table */}
          <Card>
            <CardHeader>
              <CardTitle>Representatives ({filteredRepresentatives.length})</CardTitle>
              <CardDescription>
                Manage representative data from various sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Data Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Verified</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepresentatives.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="font-medium">{rep.name}</TableCell>
                        <TableCell>{rep.office}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {rep.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{rep.party || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getDataSourceBadgeColor(rep.data_source)}>
                            {rep.data_source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rep.needs_manual_verification ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Needs Verification
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(rep.last_verified).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{rep.user_count || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Coverage Tab */}
        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Coverage Analysis</CardTitle>
              <CardDescription>
                Monitor data coverage across different locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location Hash</TableHead>
                      <TableHead>Federal Coverage</TableHead>
                      <TableHead>State Coverage</TableHead>
                      <TableHead>Local Coverage</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationCoverage.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-mono text-sm">
                          {location.location_hash}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCoverageBadgeColor(location.coverage_level.federal)}>
                            {location.coverage_level.federal}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCoverageBadgeColor(location.coverage_level.state)}>
                            {location.coverage_level.state}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCoverageBadgeColor(location.coverage_level.local)}>
                            {location.coverage_level.local}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(location.last_updated).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {location.needs_attention ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Needs Attention
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Good
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{location.user_count || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Source Management</CardTitle>
              <CardDescription>
                Manage API integrations and data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Congress.gov API</CardTitle>
                    <CardDescription>Federal representatives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <Button size="sm" variant="outline">
                        Sync Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">OpenStates API</CardTitle>
                    <CardDescription>State legislators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <Button size="sm" variant="outline">
                        Sync Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Google Civic API</CardTitle>
                    <CardDescription>Elections & voting info</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Limited
                      </Badge>
                      <Button size="sm" variant="outline">
                        Test API
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Sync Options</h3>
                <div className="space-y-2">
                  <Button onClick={refreshDataSources} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Full Data Refresh
                  </Button>
                  <p className="text-sm text-gray-600">
                    This will update all representative data from external APIs.
                    This process may take several minutes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 