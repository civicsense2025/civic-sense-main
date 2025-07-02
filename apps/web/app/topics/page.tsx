'use client'

import { Suspense, useState, useEffect } from 'react'
import { Header } from '@civicsense/ui-web'
import { Container } from "@civicsense/ui-web/components/ui"
import { Calendar } from "@civicsense/ui-web/components/calendar"
import { Button } from "@civicsense/ui-web"
import { Badge } from "@civicsense/ui-web"
import { Card, CardContent } from "@civicsense/ui-web"
import { CalendarDays, List, Clock, ArrowRight } from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"
import Link from "next/link"
import type { TopicMetadata } from '@civicsense/shared/lib/quiz-data'

interface TopicStats {
  totalTopics: number
  totalDays: number
  breakingNews: number
  featuredTopics: number
}

interface GroupedTopics {
  [date: string]: TopicMetadata[]
}

type ViewMode = 'list' | 'calendar'

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicMetadata[]>([])
  const [stats, setStats] = useState<TopicStats>({
    totalTopics: 0,
    totalDays: 0,
    breakingNews: 0,
    featuredTopics: 0
  })
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load topics and stats
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Fetch topics
        const topicsRes = await fetch('/api/topics?limit=all')
        if (!topicsRes.ok) throw new Error('Failed to fetch topics')
        const topicsData = await topicsRes.json()
        
        const formattedTopics: TopicMetadata[] = (topicsData.topics || []).map((topic: any) => ({
          topic_id: topic.topic_id,
          topic_title: topic.topic_title,
          description: topic.description || '',
          why_this_matters: topic.why_this_matters || '',
          emoji: topic.emoji || '📚',
          date: topic.date || '',
          dayOfWeek: topic.day_of_week || '',
          categories: Array.isArray(topic.categories) ? topic.categories : [],
          is_breaking: topic.is_breaking || false,
          is_featured: topic.is_featured || false
        }))
        
        setTopics(formattedTopics)
        
        // Calculate stats
        const uniqueDays = new Set(formattedTopics.map(t => t.date)).size
        const breakingNews = formattedTopics.filter(t => t.is_breaking).length
        const featuredTopics = formattedTopics.filter(t => t.is_featured).length
        
        setStats({
          totalTopics: formattedTopics.length,
          totalDays: uniqueDays,
          breakingNews,
          featuredTopics
        })
        
      } catch (err) {
        console.error('Error loading topics:', err)
        setError('Failed to load topics')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Group topics by date for list view
  const groupTopicsByDate = (topics: TopicMetadata[]): GroupedTopics => {
    const grouped: GroupedTopics = {}
    
    topics
      .filter(topic => topic.date) // Only include topics with dates
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
      .forEach(topic => {
        if (!grouped[topic.date]) {
          grouped[topic.date] = []
        }
        grouped[topic.date].push(topic)
      })
    
    return grouped
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    } catch {
      return dateString
    }
  }

  const groupedTopics = groupTopicsByDate(topics)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="w-full">
          <Container className="max-w-7xl py-12">
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          </Container>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="w-full">
          <Container className="max-w-7xl py-12">
            <div className="text-center py-24">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </Container>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full">
        <Container className="max-w-7xl py-12 sm:py-16 lg:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20">
            <h1 className="text-4xl font-light text-foreground tracking-tight mb-6">
              Daily Topics
            </h1>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              Explore our curated collection of daily topics about American politics, news, and government.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Topics', value: stats.totalTopics },
              { label: 'Days Covered', value: stats.totalDays },
              { label: 'Breaking News', value: stats.breakingNews },
              { label: 'Featured Topics', value: stats.featuredTopics }
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-muted/20 rounded-lg p-6 text-center"
              >
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted/20 rounded-lg p-1 flex">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="flex items-center gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                Calendar View
              </Button>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'calendar' ? (
            <div className="bg-card rounded-xl border shadow-sm">
              <Suspense fallback={
                <div className="flex items-center justify-center h-[800px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              }>
                <Calendar
                  topics={topics}
                  className="p-8"
                />
              </Suspense>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTopics).length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-muted-foreground mb-4">No topics available yet.</p>
                  <Button asChild>
                    <Link href="/">Explore CivicSense</Link>
                  </Button>
                </div>
              ) : (
                Object.entries(groupedTopics).map(([date, dateTopics]) => (
                  <div key={date} className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-light text-foreground">
                        {formatDate(date)}
                      </h2>
                      <div className="flex-1 h-px bg-border"></div>
                      <Badge variant="outline" className="text-xs">
                        {dateTopics.length} topic{dateTopics.length === 1 ? '' : 's'}
                      </Badge>
                    </div>

                    {/* Topics for this date */}
                    <div className="grid gap-4">
                      {dateTopics.map(topic => (
                        <Card key={topic.topic_id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Emoji */}
                              <div className="text-3xl flex-shrink-0">
                                {topic.emoji}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="flex-1">
                                    <h3 className="text-xl font-medium text-foreground mb-2">
                                      {topic.topic_title}
                                    </h3>
                                    
                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {topic.is_breaking && (
                                        <Badge className="bg-red-500 text-white text-xs">
                                          Breaking
                                        </Badge>
                                      )}
                                      {topic.is_featured && (
                                        <Badge className="bg-blue-500 text-white text-xs">
                                          Featured
                                        </Badge>
                                      )}
                                      {topic.categories.slice(0, 3).map(category => (
                                        <Badge key={category} variant="outline" className="text-xs">
                                          {category}
                                        </Badge>
                                      ))}
                                      {topic.categories.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{topic.categories.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Action Button */}
                                  <Button asChild size="sm" className="flex-shrink-0">
                                    <Link href={`/quiz/${topic.topic_id}`}>
                                      Take Quiz
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                                
                                {/* Description */}
                                <p className="text-muted-foreground mb-4 leading-relaxed">
                                  {topic.description}
                                </p>
                                
                                {/* Why This Matters */}
                                {topic.why_this_matters && (
                                  <div className="bg-muted/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-foreground">
                                        Why This Matters
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {topic.why_this_matters}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Container>
      </main>
    </div>
  )
} 