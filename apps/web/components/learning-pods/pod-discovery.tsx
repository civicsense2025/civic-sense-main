"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  Calendar,
  MapPin,
  BookOpen,
  TrendingUp,
  ExternalLink,
  Heart,
  Clock
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import { useToast } from '@civicsense/ui-web'

interface DiscoverablePod {
  id: string
  pod_id: string
  display_name: string
  short_description: string
  banner_image_url?: string
  target_age_range: string
  difficulty_level: number
  topics_covered: string[]
  search_tags: string[]
  member_count: number
  activity_score: number
  average_rating: number
  total_ratings: number
  learning_pods: {
    pod_type: string
    created_at: string
  }
}

interface PodDiscoveryProps {
  onJoinPod?: (podId: string) => void
}

export function PodDiscovery({ onJoinPod }: PodDiscoveryProps) {
  const { toast } = useToast()
  
  const [pods, setPods] = useState<DiscoverablePod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)

  const podTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Family' },
    { value: 'friends', label: '👥 Friends' },
    { value: 'classroom', label: '🏫 Classroom' },
    { value: 'study_group', label: '📚 Study Group' },
    { value: 'campaign', label: '🗳️ Political Campaign' },
    { value: 'organization', label: '🏢 Organization' },
    { value: 'book_club', label: '📖 Book Club' },
    { value: 'debate_team', label: '⚖️ Debate Team' }
  ]

  const ageRangeOptions = [
    { value: 'all', label: 'All Ages' },
    { value: 'elementary', label: 'Elementary (5-11)' },
    { value: 'middle_school', label: 'Middle School (12-14)' },
    { value: 'high_school', label: 'High School (15-18)' },
    { value: 'adult', label: 'Adult (18+)' },
    { value: 'all_ages', label: 'All Ages Welcome' }
  ]

  const difficultyOptions = [
    { value: 'all', label: 'Any Difficulty' },
    { value: '1', label: '⭐ Beginner' },
    { value: '2', label: '⭐⭐ Easy' },
    { value: '3', label: '⭐⭐⭐ Moderate' },
    { value: '4', label: '⭐⭐⭐⭐ Advanced' },
    { value: '5', label: '⭐⭐⭐⭐⭐ Expert' }
  ]

  const loadPods = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (selectedType && selectedType !== 'all') params.set('type', selectedType)
      if (selectedAgeRange && selectedAgeRange !== 'all') params.set('ageRange', selectedAgeRange)
      if (selectedDifficulty && selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty)
      if (showFeaturedOnly) params.set('featured', 'true')
      
      const response = await fetch(`/api/learning-pods/discover?${params}`)
      
      if (!response.ok) {
        // Show mock data if API fails (for demo purposes)
        setPods(getMockPods())
        setIsLoading(false)
        toast({
          title: "Using demo data",
          description: "Showing sample discoverable pods for demonstration.",
        })
        return
      }
      
      const data = await response.json()
      setPods(data.pods || [])
    } catch (error) {
      console.error('Error loading pods:', error)
      // Show mock data on error
      setPods(getMockPods())
      toast({
        title: "Using demo data",
        description: "Showing sample discoverable pods for demonstration.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data for demo purposes
  const getMockPods = (): DiscoverablePod[] => [
    {
      id: 'demo-1',
      pod_id: 'demo-pod-1',
      display_name: 'Smith Family Learning Pod',
      short_description: 'A family-friendly environment for learning about civics and government together.',
      target_age_range: 'all_ages',
      difficulty_level: 2,
      topics_covered: ['Government', 'Elections', 'Local Issues'],
      search_tags: ['family', 'beginner', 'government'],
      member_count: 4,
      activity_score: 85,
      average_rating: 4.5,
      total_ratings: 12,
      learning_pods: {
        pod_type: 'family',
        created_at: '2024-01-15T00:00:00Z'
      }
    },
    {
      id: 'demo-2',
      pod_id: 'demo-pod-2',
      display_name: 'Civic Engagement Study Group',
      short_description: 'College students learning about political participation and civic responsibility.',
      target_age_range: 'adult',
      difficulty_level: 4,
      topics_covered: ['Constitutional Law', 'Public Policy', 'Civil Rights'],
      search_tags: ['study', 'advanced', 'college'],
      member_count: 12,
      activity_score: 92,
      average_rating: 4.8,
      total_ratings: 25,
      learning_pods: {
        pod_type: 'study_group',
        created_at: '2024-02-01T00:00:00Z'
      }
    },
    {
      id: 'demo-3',
      pod_id: 'demo-pod-3',
      display_name: 'High School Government Class',
      short_description: 'Interactive civics learning for high school students preparing for citizenship.',
      target_age_range: 'high_school',
      difficulty_level: 3,
      topics_covered: ['Elections', 'Economy', 'Justice'],
      search_tags: ['classroom', 'high-school', 'interactive'],
      member_count: 28,
      activity_score: 78,
      average_rating: 4.2,
      total_ratings: 18,
      learning_pods: {
        pod_type: 'classroom',
        created_at: '2024-01-20T00:00:00Z'
      }
    }
  ]

  useEffect(() => {
    loadPods()
  }, [searchTerm, selectedType, selectedAgeRange, selectedDifficulty, showFeaturedOnly])

  const getPodTypeIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'family': '👨‍👩‍👧‍👦',
      'friends': '👥',
      'classroom': '🏫',
      'study_group': '📚',
      'campaign': '🗳️',
      'organization': '🏢',
      'book_club': '📖',
      'debate_team': '⚖️'
    }
    return typeMap[type] || '👥'
  }

  const getAgeRangeColor = (ageRange: string) => {
    const colorMap: Record<string, string> = {
      'elementary': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'middle_school': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'high_school': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'adult': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'all_ages': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    return colorMap[ageRange] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const formatAgeRange = (ageRange: string) => {
    const formatMap: Record<string, string> = {
      'elementary': 'Elementary',
      'middle_school': 'Middle School',
      'high_school': 'High School',
      'adult': 'Adult',
      'all_ages': 'All Ages'
    }
    return formatMap[ageRange] || ageRange
  }

  const handleJoinPod = async (podId: string) => {
    if (onJoinPod) {
      onJoinPod(podId)
    } else {
      toast({
        title: "Sign in required",
        description: "Please sign in to join learning pods.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Discovering learning pods...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Discover Learning Pods</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find and join public learning pods that match your interests, age group, and learning goals.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pods by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pod Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {podTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Age Range</label>
              <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  {ageRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="rounded"
              />
              Featured pods only
            </label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSelectedType('all')
                setSelectedAgeRange('all')
                setSelectedDifficulty('all')
                setShowFeaturedOnly(false)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {pods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pods found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all available pods.
            </p>
            <Button onClick={() => {
              setSearchTerm('')
              setSelectedType('all')
              setSelectedAgeRange('all')
              setSelectedDifficulty('all')
              setShowFeaturedOnly(false)
            }}>
              Show All Pods
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pods.map((pod) => (
            <Card key={pod.id} className="flex flex-col hover:shadow-lg transition-shadow">
              {pod.banner_image_url && (
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <img 
                    src={pod.banner_image_url} 
                    alt={pod.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getPodTypeIcon(pod.learning_pods.pod_type)}</span>
                    <Badge className={getAgeRangeColor(pod.target_age_range)} variant="secondary">
                      {formatAgeRange(pod.target_age_range)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {pod.average_rating.toFixed(1)}
                  </div>
                </div>
                
                <CardTitle className="text-lg line-clamp-2">{pod.display_name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {pod.short_description}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{pod.member_count} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>Activity: {Math.round(pod.activity_score)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>Level {pod.difficulty_level}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(pod.learning_pods.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {pod.topics_covered.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pod.topics_covered.slice(0, 3).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {pod.topics_covered.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{pod.topics_covered.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => handleJoinPod(pod.pod_id)}
                    className="w-full gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Join Pod
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 