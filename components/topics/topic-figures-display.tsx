'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, ExternalLink, Plus, X } from 'lucide-react'

interface PublicFigure {
  id: string
  full_name: string
  display_name: string | null
  image_url: string | null
  party_affiliation: string | null
  office: string | null
  current_state: string | null
  bio: string | null
  is_politician: boolean | null
}

interface TopicFiguresResponse {
  topic: {
    topic_id: string
    topic_title: string
  }
  figures: PublicFigure[]
  count: number
}

interface TopicFiguresDisplayProps {
  topicId: string
  topicTitle?: string
  editable?: boolean
  className?: string
}

export function TopicFiguresDisplay({ 
  topicId, 
  topicTitle, 
  editable = false,
  className = '' 
}: TopicFiguresDisplayProps) {
  const [data, setData] = useState<TopicFiguresResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load topic figures
  useEffect(() => {
    loadTopicFigures()
  }, [topicId])

  const loadTopicFigures = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/topics/${topicId}/figures`)
      if (!response.ok) {
        throw new Error('Failed to load topic figures')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load figures')
    } finally {
      setLoading(false)
    }
  }

  const removeFigure = async (figureId: string) => {
    try {
      const response = await fetch(
        `/api/topics/${topicId}/figures?figureId=${figureId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        throw new Error('Failed to remove figure')
      }
      
      // Reload data
      await loadTopicFigures()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove figure')
    }
  }

  const getPartyColor = (party: string | null) => {
    if (!party) return 'bg-gray-100 text-gray-800'
    
    const partyLower = party.toLowerCase()
    if (partyLower.includes('republican')) return 'bg-red-100 text-red-800'
    if (partyLower.includes('democrat')) return 'bg-blue-100 text-blue-800'
    if (partyLower.includes('independent')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Key Figures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Users className="h-5 w-5" />
            Key Figures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <Button 
            onClick={loadTopicFigures} 
            variant="outline" 
            size="sm"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.figures.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Key Figures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-sm text-center py-8">
            No related figures found for this topic.
            {editable && (
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Figure
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Key Figures ({data.count})
          </div>
          {editable && (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Figure
            </Button>
          )}
        </CardTitle>
        {topicTitle && (
          <p className="text-sm text-gray-600">
            For: {topicTitle}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.figures.map(figure => (
            <div 
              key={figure.id} 
              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={figure.image_url || undefined} />
                <AvatarFallback>
                  {(figure.display_name || figure.full_name)
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm">
                      {figure.display_name || figure.full_name}
                    </h4>
                    
                    {figure.office && (
                      <p className="text-xs text-gray-600 mb-1">
                        {figure.office}
                        {figure.current_state && ` (${figure.current_state})`}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {figure.party_affiliation && (
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${getPartyColor(figure.party_affiliation)}`}
                        >
                          {figure.party_affiliation}
                        </Badge>
                      )}
                      
                      {figure.is_politician && (
                        <Badge variant="outline" className="text-xs">
                          Politician
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {editable && (
                    <Button
                      onClick={() => removeFigure(figure.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {figure.bio && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {figure.bio}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => window.open(`/public-figures/${figure.id}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {data.count > 4 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {data.count} Figures
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for managing topic figures
export function useTopicFigures(topicId: string) {
  const [figures, setFigures] = useState<PublicFigure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFigures = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/topics/${topicId}/figures`)
      if (!response.ok) throw new Error('Failed to load figures')
      
      const data = await response.json()
      setFigures(data.figures || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load figures')
    } finally {
      setLoading(false)
    }
  }

  const addFigure = async (figureId: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}/figures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figureId })
      })
      
      if (!response.ok) throw new Error('Failed to add figure')
      
      await loadFigures() // Reload
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add figure')
      return false
    }
  }

  const removeFigure = async (figureId: string) => {
    try {
      const response = await fetch(
        `/api/topics/${topicId}/figures?figureId=${figureId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to remove figure')
      
      await loadFigures() // Reload
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove figure')
      return false
    }
  }

  return {
    figures,
    loading,
    error,
    loadFigures,
    addFigure,
    removeFigure
  }
} 