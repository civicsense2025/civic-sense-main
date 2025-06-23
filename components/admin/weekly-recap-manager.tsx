'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, TrendingUp, Users, Eye, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WeeklyRecap {
  id: string
  collection_id: string
  week_start_date: string
  week_end_date: string
  generation_timestamp: string
  total_content_analyzed: number
  content_selected: number
  avg_engagement_score: number
  top_themes: string[]
  views_count: number
  completions_count: number
  collection?: {
    title: string
    slug: string
    emoji: string
    description: string
    status: string
    is_featured: boolean
  }
}

interface GenerationResponse {
  success: boolean
  collection_id?: string
  collection_slug?: string
  week_start: string
  week_end: string
  items_count?: number
  top_themes?: string[]
  avg_engagement_score?: number
  message?: string
  error?: string
}

export function WeeklyRecapManager() {
  const [recaps, setRecaps] = useState<WeeklyRecap[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState('')

  // Load existing weekly recaps
  useEffect(() => {
    loadWeeklyRecaps()
  }, [])

  const loadWeeklyRecaps = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/collections?categories=weekly-recap&include_meta=true&limit=20')
      const data = await response.json()
      
      if (data.success) {
        // Transform the collections data to match our interface
        const transformedRecaps = data.collections.map((collection: any) => ({
          id: collection.id,
          collection_id: collection.id,
          week_start_date: collection.slug.replace('weekly-recap-', ''),
          week_end_date: '', // Calculate from start date
          generation_timestamp: collection.created_at,
          total_content_analyzed: 0, // Would come from weekly_recap_collections table
          content_selected: collection.total_items || 0,
          avg_engagement_score: 0,
          top_themes: collection.tags?.filter((tag: string) => 
            !['auto-generated', 'weekly'].includes(tag)
          ) || [],
          views_count: 0,
          completions_count: collection.completion_count || 0,
          collection: {
            title: collection.title,
            slug: collection.slug,
            emoji: collection.emoji,
            description: collection.description,
            status: collection.status,
            is_featured: collection.is_featured
          }
        }))
        
        setRecaps(transformedRecaps)
      }
    } catch (error) {
      console.error('Error loading weekly recaps:', error)
      toast.error('Failed to load weekly recaps')
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyRecap = async (weekStart?: string) => {
    try {
      setGenerating(true)
      
      const response = await fetch('/api/admin/generate-weekly-recap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weekStart ? { week_start: weekStart } : {})
      })
      
      const result: GenerationResponse = await response.json()
      
      if (result.success) {
        toast.success(result.message || 'Weekly recap generated successfully!')
        loadWeeklyRecaps() // Reload the list
        setSelectedWeek('') // Clear selection
      } else {
        toast.error(result.error || 'Failed to generate weekly recap')
      }
    } catch (error) {
      console.error('Error generating weekly recap:', error)
      toast.error('Failed to generate weekly recap')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getWeekOptions = () => {
    const options = []
    const now = new Date()
    
    // Generate last 8 weeks
    for (let i = 1; i <= 8; i++) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - (7 * i))
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      
      options.push({
        value: weekStartStr,
        label: `Week of ${formatDate(weekStartStr)} - ${formatDate(weekEnd.toISOString().split('T')[0])}`
      })
    }
    
    return options
  }

  return (
    <div className="space-y-6">
      {/* Header and Generation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Recap Collections</h2>
          <p className="text-muted-foreground">
            Automatically generated collections featuring the week's most engaging civic content
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Current/Previous Week</option>
            {getWeekOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <Button
            onClick={() => generateWeeklyRecap(selectedWeek || undefined)}
            disabled={generating}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate Weekly Recap
          </Button>
        </div>
      </div>

      {/* Weekly Recaps List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading weekly recaps...</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {recaps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Weekly Recaps Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate your first weekly recap collection to get started
                </p>
                <Button onClick={() => generateWeeklyRecap()}>
                  Generate First Recap
                </Button>
              </CardContent>
            </Card>
          ) : (
            recaps.map((recap) => (
              <Card key={recap.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{recap.collection?.emoji}</span>
                      <div>
                        <CardTitle className="text-lg">
                          {recap.collection?.title}
                        </CardTitle>
                        <CardDescription>
                          Week of {formatDate(recap.week_start_date)}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {recap.collection?.is_featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                      <Badge 
                        variant={recap.collection?.status === 'published' ? 'default' : 'outline'}
                      >
                        {recap.collection?.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {recap.collection?.description}
                  </p>
                  
                  {/* Themes */}
                  {recap.top_themes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Themes:</span>
                      <div className="flex flex-wrap gap-1">
                        {recap.top_themes.map((theme, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{recap.content_selected}</div>
                        <div className="text-xs text-muted-foreground">Items</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{recap.views_count}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{recap.completions_count}</div>
                        <div className="text-xs text-muted-foreground">Completions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {formatDate(recap.generation_timestamp)}
                        </div>
                        <div className="text-xs text-muted-foreground">Generated</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/collections/${recap.collection?.slug}`, '_blank')}
                    >
                      View Collection
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/app/admin/collections`, '_blank')}
                    >
                      Edit in Admin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
} 