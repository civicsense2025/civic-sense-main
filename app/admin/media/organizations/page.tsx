"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Globe,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  Target,
  Award,
  Clock,
  Link as LinkIcon,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface MediaOrganization {
  id: string
  name: string
  domain: string
  type: 'newspaper' | 'magazine' | 'tv' | 'radio' | 'digital' | 'wire_service'
  country: string
  founded_year?: number
  political_bias_score: number // -100 (far left) to +100 (far right)
  factual_accuracy_score: number // 0-100
  transparency_score: number // 0-100
  credibility_rating: 'very_high' | 'high' | 'mixed' | 'low' | 'very_low'
  editorial_stance: 'left' | 'lean_left' | 'center' | 'lean_right' | 'right' | 'mixed'
  ownership_type: 'public' | 'private' | 'government' | 'nonprofit'
  circulation?: number
  website_url?: string
  logo_url?: string
  description?: string
  created_at: string
  updated_at: string
  stats: {
    articles_analyzed: number
    avg_bias_score: number
    fact_checks_passed: number
    fact_checks_failed: number
    last_analysis: string | null
  }
}

interface MediaStats {
  total_organizations: number
  by_type: Record<string, number>
  by_credibility: Record<string, number>
  by_bias: {
    far_left: number
    left: number
    center: number
    right: number
    far_right: number
  }
  avg_factual_accuracy: number
  avg_transparency: number
  articles_analyzed_total: number
}

interface MediaFilters {
  search: string
  type: 'all' | 'newspaper' | 'magazine' | 'tv' | 'radio' | 'digital' | 'wire_service'
  credibility: 'all' | 'very_high' | 'high' | 'mixed' | 'low' | 'very_low'
  bias: 'all' | 'left' | 'center' | 'right'
  country: string
}

export default function MediaOrganizations() {
  const [organizations, setOrganizations] = useState<MediaOrganization[]>([])
  const [stats, setStats] = useState<MediaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MediaFilters>({
    search: '',
    type: 'all',
    credibility: 'all',
    bias: 'all',
    country: ''
  })
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    loadMediaOrganizations()
  }, [filters, currentPage])

  const loadMediaOrganizations = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration
      const mockStats: MediaStats = {
        total_organizations: 1247,
        by_type: {
          newspaper: 456,
          digital: 342,
          magazine: 178,
          tv: 156,
          radio: 89,
          wire_service: 26
        },
        by_credibility: {
          very_high: 234,
          high: 567,
          mixed: 289,
          low: 123,
          very_low: 34
        },
        by_bias: {
          far_left: 89,
          left: 267,
          center: 445,
          right: 312,
          far_right: 134
        },
        avg_factual_accuracy: 73.2,
        avg_transparency: 68.5,
        articles_analyzed_total: 45672
      }

      const mockOrganizations: MediaOrganization[] = [
        {
          id: '1',
          name: 'Associated Press',
          domain: 'apnews.com',
          type: 'wire_service',
          country: 'United States',
          founded_year: 1846,
          political_bias_score: 2, // Slightly center-right
          factual_accuracy_score: 94,
          transparency_score: 87,
          credibility_rating: 'very_high',
          editorial_stance: 'center',
          ownership_type: 'nonprofit',
          website_url: 'https://apnews.com',
          description: 'Independent news organization providing factual reporting worldwide',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T15:30:00Z',
          stats: {
            articles_analyzed: 2847,
            avg_bias_score: 2,
            fact_checks_passed: 2698,
            fact_checks_failed: 149,
            last_analysis: '2024-01-20T15:30:00Z'
          }
        },
        {
          id: '2',
          name: 'The New York Times',
          domain: 'nytimes.com',
          type: 'newspaper',
          country: 'United States',
          founded_year: 1851,
          political_bias_score: -15, // Lean left
          factual_accuracy_score: 86,
          transparency_score: 78,
          credibility_rating: 'high',
          editorial_stance: 'lean_left',
          ownership_type: 'public',
          circulation: 8500000,
          website_url: 'https://nytimes.com',
          description: 'American newspaper with international reach and Pulitzer Prize-winning journalism',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T14:15:00Z',
          stats: {
            articles_analyzed: 4523,
            avg_bias_score: -15,
            fact_checks_passed: 3890,
            fact_checks_failed: 633,
            last_analysis: '2024-01-20T14:15:00Z'
          }
        },
        {
          id: '3',
          name: 'Wall Street Journal',
          domain: 'wsj.com',
          type: 'newspaper',
          country: 'United States',
          founded_year: 1889,
          political_bias_score: 12, // Lean right
          factual_accuracy_score: 89,
          transparency_score: 82,
          credibility_rating: 'high',
          editorial_stance: 'lean_right',
          ownership_type: 'private',
          circulation: 2800000,
          website_url: 'https://wsj.com',
          description: 'Business-focused newspaper with conservative editorial stance',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T16:45:00Z',
          stats: {
            articles_analyzed: 3456,
            avg_bias_score: 12,
            fact_checks_passed: 3088,
            fact_checks_failed: 368,
            last_analysis: '2024-01-20T16:45:00Z'
          }
        },
        {
          id: '4',
          name: 'BBC News',
          domain: 'bbc.com',
          type: 'tv',
          country: 'United Kingdom',
          founded_year: 1922,
          political_bias_score: -3, // Slightly center-left
          factual_accuracy_score: 91,
          transparency_score: 85,
          credibility_rating: 'very_high',
          editorial_stance: 'center',
          ownership_type: 'public',
          website_url: 'https://bbc.com/news',
          description: 'British public service broadcaster with global reach',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T12:30:00Z',
          stats: {
            articles_analyzed: 5234,
            avg_bias_score: -3,
            fact_checks_passed: 4761,
            fact_checks_failed: 473,
            last_analysis: '2024-01-20T12:30:00Z'
          }
        },
        {
          id: '5',
          name: 'Breitbart News',
          domain: 'breitbart.com',
          type: 'digital',
          country: 'United States',
          founded_year: 2007,
          political_bias_score: 45, // Right-leaning
          factual_accuracy_score: 62,
          transparency_score: 45,
          credibility_rating: 'mixed',
          editorial_stance: 'right',
          ownership_type: 'private',
          website_url: 'https://breitbart.com',
          description: 'Conservative news and opinion website',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T11:20:00Z',
          stats: {
            articles_analyzed: 1876,
            avg_bias_score: 45,
            fact_checks_passed: 1163,
            fact_checks_failed: 713,
            last_analysis: '2024-01-20T11:20:00Z'
          }
        }
      ]

      setStats(mockStats)
      setOrganizations(mockOrganizations)
      
    } catch (error) {
      console.error('Error loading media organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        org.name.toLowerCase().includes(searchLower) ||
        org.domain.toLowerCase().includes(searchLower) ||
        org.description?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Type filter
    if (filters.type !== 'all' && org.type !== filters.type) return false

    // Credibility filter
    if (filters.credibility !== 'all' && org.credibility_rating !== filters.credibility) return false

    // Bias filter
    if (filters.bias !== 'all') {
      if (filters.bias === 'left' && org.political_bias_score >= -5) return false
      if (filters.bias === 'center' && (org.political_bias_score < -5 || org.political_bias_score > 5)) return false
      if (filters.bias === 'right' && org.political_bias_score <= 5) return false
    }

    // Country filter
    if (filters.country && !org.country.toLowerCase().includes(filters.country.toLowerCase())) return false

    return true
  })

  const paginatedOrganizations = filteredOrganizations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage)

  const getBiasColor = (score: number) => {
    if (score <= -25) return 'text-blue-700 bg-blue-100'
    if (score <= -5) return 'text-blue-600 bg-blue-50'
    if (score <= 5) return 'text-gray-600 bg-gray-100'
    if (score <= 25) return 'text-red-600 bg-red-50'
    return 'text-red-700 bg-red-100'
  }

  const getBiasLabel = (score: number) => {
    if (score <= -25) return 'Left'
    if (score <= -5) return 'Lean Left'
    if (score <= 5) return 'Center'
    if (score <= 25) return 'Lean Right'
    return 'Right'
  }

  const getCredibilityColor = (rating: string) => {
    switch (rating) {
      case 'very_high': return 'text-green-700 bg-green-100'
      case 'high': return 'text-green-600 bg-green-50'
      case 'mixed': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-orange-600 bg-orange-50'
      case 'very_low': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCredibilityLabel = (rating: string) => {
    return rating.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleOrganizationAction = async (orgId: string, action: string) => {
    console.log(`Performing action ${action} on organization ${orgId}`)
    await loadMediaOrganizations()
  }

  const handleBulkAction = async (action: string) => {
    console.log(`Performing bulk action ${action} on organizations:`, selectedOrgs)
    setSelectedOrgs([])
    await loadMediaOrganizations()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Media Organizations</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Media Data</h2>
          <p className="text-gray-600 mb-4">Unable to fetch media organizations data</p>
          <Button onClick={loadMediaOrganizations}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Organizations</h1>
          <p className="text-gray-600">Manage news sources and track bias analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
          <Button variant="outline" size="sm" onClick={loadMediaOrganizations}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_organizations.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Across {Object.keys(stats.by_type).length} media types
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Factual Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_factual_accuracy.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              Across all organizations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles Analyzed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.articles_analyzed_total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Total articles processed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Credibility</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.by_credibility.very_high + stats.by_credibility.high}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(((stats.by_credibility.very_high + stats.by_credibility.high) / stats.total_organizations) * 100)}% of total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bias Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Political Bias Distribution</CardTitle>
          <CardDescription>Distribution of organizations across the political spectrum</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(stats.by_bias).map(([bias, count]) => (
              <div key={bias} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-xs text-gray-500 capitalize">
                  {bias.replace('_', ' ')}
                </div>
                <Progress 
                  value={(count / stats.total_organizations) * 100} 
                  className="h-2 mt-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search organizations..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="newspaper">Newspaper</option>
              <option value="digital">Digital</option>
              <option value="tv">Television</option>
              <option value="radio">Radio</option>
              <option value="magazine">Magazine</option>
              <option value="wire_service">Wire Service</option>
            </select>

            <select
              value={filters.credibility}
              onChange={(e) => setFilters(prev => ({ ...prev, credibility: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Credibility</option>
              <option value="very_high">Very High</option>
              <option value="high">High</option>
              <option value="mixed">Mixed</option>
              <option value="low">Low</option>
              <option value="very_low">Very Low</option>
            </select>

            <select
              value={filters.bias}
              onChange={(e) => setFilters(prev => ({ ...prev, bias: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Bias</option>
              <option value="left">Left Leaning</option>
              <option value="center">Center</option>
              <option value="right">Right Leaning</option>
            </select>

            <Input
              placeholder="Country..."
              value={filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrgs.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedOrgs.length} organization(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('analyze')}>
                  Re-analyze
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                  Export Data
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedOrgs([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organizations ({filteredOrganizations.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allIds = paginatedOrganizations.map(o => o.id)
                  setSelectedOrgs(prev => 
                    prev.length === allIds.length ? [] : allIds
                  )
                }}
              >
                {selectedOrgs.length === paginatedOrganizations.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedOrganizations.map((org) => (
              <div key={org.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrgs(prev => [...prev, org.id])
                        } else {
                          setSelectedOrgs(prev => prev.filter(id => id !== org.id))
                        }
                      }}
                      className="rounded border-gray-300 mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{org.name}</h3>
                        <Badge className={cn("text-xs", getBiasColor(org.political_bias_score))}>
                          {getBiasLabel(org.political_bias_score)}
                        </Badge>
                        <Badge className={cn("text-xs", getCredibilityColor(org.credibility_rating))}>
                          {getCredibilityLabel(org.credibility_rating)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <LinkIcon className="h-4 w-4 mr-1" />
                          {org.domain}
                        </span>
                        <span className="capitalize">{org.type.replace('_', ' ')}</span>
                        <span>{org.country}</span>
                        {org.founded_year && <span>Founded {org.founded_year}</span>}
                      </div>
                      
                      {org.description && (
                        <p className="text-sm text-gray-700 mb-4">{org.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {org.factual_accuracy_score}%
                          </div>
                          <div className="text-xs text-gray-500">Factual Accuracy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {org.transparency_score}%
                          </div>
                          <div className="text-xs text-gray-500">Transparency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {org.stats.articles_analyzed.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Articles Analyzed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {Math.round((org.stats.fact_checks_passed / (org.stats.fact_checks_passed + org.stats.fact_checks_failed)) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">Fact Check Pass Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => handleOrganizationAction(org.id, 'view')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleOrganizationAction(org.id, 'edit')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleOrganizationAction(org.id, 'analyze')}>
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleOrganizationAction(org.id, 'delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {org.stats.last_analysis && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Last analyzed: {format(new Date(org.stats.last_analysis), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrganizations.length)} of {filteredOrganizations.length} organizations
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 