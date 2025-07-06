"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from "@/components/header"
import { Container } from "@/components/ui"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  BookOpen, 
  Users, 
  MessageSquare, 
  TrendingUp,
  ExternalLink,
  Play,
  PenTool,
  Gavel,
  Vote,
  DollarSign,
  Zap,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  Sparkles,
  Target,
  Globe,
  Calendar,
  ChevronRight,
  ChevronDown,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collection } from '@/types/collections'

interface LinkItem {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  isExternal?: boolean
  isPrimary?: boolean
  isNew?: boolean
  category: 'content' | 'resource' | 'action'
}

interface QuestionTopic {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: string[]
}

interface GroupedTopics {
  date: string
  displayDate: string
  topics: QuestionTopic[]
  isToday?: boolean
}

interface Stats {
  totalTopics: number
  totalCollections: number
  breakingNews: number
  learningPaths: number
}

export function LinksPageClient() {
  const [mounted, setMounted] = useState(false)
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([])
  const [allTopics, setAllTopics] = useState<QuestionTopic[]>([])
  const [groupedTopics, setGroupedTopics] = useState<GroupedTopics[]>([])
  const [breakingTopics, setBreakingTopics] = useState<QuestionTopic[]>([])
  const [stats, setStats] = useState<Stats>({
    totalTopics: 0,
    totalCollections: 0,
    breakingNews: 0,
    learningPaths: 0
  })
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    fetchFeaturedCollections()
    fetchFeaturedTopics()
  }, [])

  const fetchFeaturedCollections = async () => {
    try {
      const response = await fetch('/api/collections?featured=true&limit=5')
      if (response.ok) {
        const data = await response.json()
        setFeaturedCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Error fetching featured collections:', error)
    } finally {
      setCollectionsLoading(false)
    }
  }

  const fetchFeaturedTopics = async () => {
    try {
      const response = await fetch('/api/topics?limit=all')
      if (response.ok) {
        const data = await response.json()
        const topics = data.topics || []
        setAllTopics(topics)
        
        // Identify breaking topics
        const breaking = topics.filter((topic: QuestionTopic) => 
          topic.categories?.some(cat => 
            cat.toLowerCase().includes('breaking') || 
            cat.toLowerCase().includes('urgent') ||
            cat.toLowerCase().includes('developing')
          ) || 
          (topic.date === new Date().toISOString().split('T')[0] && 
           topic.categories?.some(cat => 
             cat.toLowerCase().includes('current') || 
             cat.toLowerCase().includes('news')
           ))
        )
        setBreakingTopics(breaking.slice(0, 3))
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalTopics: topics.length,
          breakingNews: breaking.length
        }))
        
        groupTopicsByDateRange(topics)
      }
    } catch (error) {
      console.error('Error fetching featured topics:', error)
    } finally {
      setTopicsLoading(false)
    }
  }

  const groupTopicsByDateRange = (topics: QuestionTopic[]) => {
    const today = new Date()
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0')
    
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)
    
    const oneWeekAhead = new Date(today)
    oneWeekAhead.setDate(today.getDate() + 7)
    
    const grouped = topics.reduce((acc, topic) => {
      const date = topic.date || 'no-date'
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(topic)
      return acc
    }, {} as Record<string, QuestionTopic[]>)

    const validDates = Object.keys(grouped)
      .filter(date => {
        if (date === 'no-date') return true
        const topicDate = new Date(date + 'T12:00:00')
        return topicDate >= oneWeekAgo && topicDate <= oneWeekAhead
      })
      .sort((a, b) => {
        if (a === 'no-date') return 1
        if (b === 'no-date') return -1
        return new Date(b).getTime() - new Date(a).getTime()
      })

    const result: GroupedTopics[] = []
    const todayIndex = validDates.indexOf(todayString)
    let datesToShow: string[] = []
    
    if (todayIndex !== -1) {
      datesToShow = validDates.slice(todayIndex, todayIndex + 3)
    } else {
      datesToShow = validDates.slice(0, 3)
    }
    
    for (const date of datesToShow) {
      const topics = grouped[date]
      const isToday = date === todayString
      
      let displayDate: string
      if (date === 'no-date') {
        displayDate = 'Recent Topics'
      } else {
        const topicDate = new Date(date + 'T12:00:00')
        if (isToday) {
          displayDate = 'Today'
        } else {
          const dayDiff = Math.round((topicDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          if (dayDiff === -1) {
            displayDate = 'Yesterday'
          } else if (dayDiff === 1) {
            displayDate = 'Tomorrow'
          } else if (dayDiff === -2) {
            displayDate = '2 days ago'
          } else if (dayDiff === 2) {
            displayDate = 'In 2 days'
          } else {
            displayDate = topicDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric' 
            })
          }
        }
      }
      
      result.push({
        date,
        displayDate,
        topics: topics.slice(0, 6),
        isToday
      })
    }

    setGroupedTopics(result)
  }

  const isBreakingTopic = (topic: QuestionTopic) => {
    return topic.categories?.some(cat => 
      cat.toLowerCase().includes('breaking') || 
      cat.toLowerCase().includes('urgent') ||
      cat.toLowerCase().includes('developing')
    ) || 
    (topic.date === new Date().toISOString().split('T')[0] && 
     topic.categories?.some(cat => 
       cat.toLowerCase().includes('current') || 
       cat.toLowerCase().includes('news')
     ))
  }

  // Resource links
  const resourceLinks: LinkItem[] = [
    {
      id: 'categories',
      title: 'Browse Topics',
      description: 'Explore civic education by category',
      href: '/categories',
      icon: <BookOpen className="h-5 w-5" />,
      category: 'resource'
    },
    {
      id: 'glossary',
      title: 'Civic Glossary',
      description: 'Essential terms and definitions',
      href: '/glossary',
      icon: <Gavel className="h-5 w-5" />,
      category: 'resource'
    },
    {
      id: 'public-figures',
      title: 'Your Representatives',
      description: 'Learn about current political figures',
      href: '/public-figures',
      icon: <Vote className="h-5 w-5" />,
      category: 'resource'
    }
  ]

  // Action links
  const actionLinks: LinkItem[] = [
    {
      id: 'civics-test',
      title: 'Civics Assessment',
      description: 'Comprehensive test of your civic knowledge',
      href: '/civics-test',
      icon: <PenTool className="h-5 w-5" />,
      isPrimary: true,
      category: 'action'
    },
    {
      id: 'donate',
      title: 'Support Our Mission',
      description: 'Help expand civic education access',
      href: '/donate',
      icon: <Heart className="h-5 w-5" />,
      isPrimary: true,
      category: 'action'
    },
    {
      id: 'schools',
      title: 'Educational Partnerships',
      description: 'Bring CivicSense to your institution',
      href: '/schools',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'action'
    }
  ]

  if (!mounted) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full">
        <Container className="max-w-7xl py-12 sm:py-16 lg:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20">
            <h1 className="text-4xl font-light text-foreground tracking-tight mb-6">
              CivicSense Links
            </h1>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              Your hub for civic education resources, tools, and direct action opportunities. Democracy, decoded daily.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total Topics', value: stats.totalTopics },
              { label: 'Collections', value: featuredCollections.length },
              { label: 'Breaking News', value: stats.breakingNews },
              { label: 'Learning Paths', value: resourceLinks.length + actionLinks.length }
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

          {/* Breaking Topics Section */}
          {!topicsLoading && breakingTopics.length > 0 && (
            <div className="space-y-6 mb-16">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-light text-foreground flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Breaking News
                </h2>
                <div className="flex-1 h-px bg-border"></div>
                <Badge variant="outline" className="text-xs">
                  {breakingTopics.length} urgent
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {breakingTopics.map((topic) => (
                  <BreakingTopicCard key={topic.topic_id} topic={topic} />
                ))}
              </div>
            </div>
          )}

          {/* Featured Topics Section */}
          {!topicsLoading && groupedTopics.length > 0 && (
            <div className="space-y-8 mb-16">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-light text-foreground flex items-center gap-3">
                  <Target className="h-6 w-6 text-purple-600" />
                  Featured Topics
                </h2>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              {groupedTopics.map((group) => (
                <div key={group.date} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className={cn(
                      "text-xl font-light",
                      group.isToday ? "text-purple-700 dark:text-purple-300" : "text-muted-foreground"
                    )}>
                      {group.date !== 'no-date' ? (
                        <>
                          {new Date(group.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          {group.isToday && " ✨"}
                        </>
                      ) : (
                        'Recent Topics'
                      )}
                    </h3>
                    <div className="flex-1 h-px bg-border"></div>
                    <Badge variant="outline" className="text-xs">
                      {group.topics.filter(topic => !isBreakingTopic(topic)).length} topics
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    {group.topics.filter(topic => !isBreakingTopic(topic)).map((topic) => (
                      <TopicCard key={topic.topic_id} topic={topic} />
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-6">
                <Button asChild size="lg">
                  <Link href="/topics">
                    <BookOpen className="h-5 w-5 mr-2" />
                    View All {allTopics.length} Topics
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Featured Collections Section */}
          {!collectionsLoading && featuredCollections.length > 0 && (
            <div className="space-y-6 mb-16">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-light text-foreground flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  Featured Learning
                </h2>
                <div className="flex-1 h-px bg-border"></div>
                <Badge variant="outline" className="text-xs">
                  {featuredCollections.length} collections
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {featuredCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
              
              <div className="text-center pt-6">
                <Button asChild variant="outline" size="lg">
                  <Link href="/collections">
                    <BookOpen className="h-5 w-5 mr-2" />
                    View All Collections
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Resources Section */}
          <div className="space-y-6 mb-16">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-light text-foreground flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Learning Resources
              </h2>
              <div className="flex-1 h-px bg-border"></div>
              <Badge variant="outline" className="text-xs">
                {resourceLinks.length} resources
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {resourceLinks.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>

          {/* Action Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-light text-foreground flex items-center gap-3">
                <Heart className="h-6 w-6 text-red-500" />
                Take Action
              </h2>
              <div className="flex-1 h-px bg-border"></div>
              <Badge variant="outline" className="text-xs">
                {actionLinks.length} actions
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {actionLinks.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        </Container>
      </main>
    </div>
  )
}

function BreakingTopicCard({ topic }: { topic: QuestionTopic }) {
  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{topic.emoji}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Breaking
                  </Badge>
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  {topic.topic_title}
                </h3>
              </div>
              
              <Button asChild size="sm" className="flex-shrink-0 bg-red-600 hover:bg-red-700">
                <Link href={`/quiz/${topic.topic_id}`}>
                  Take Quiz
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {topic.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TopicCard({ topic }: { topic: QuestionTopic }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{topic.emoji}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-foreground mb-2">
                  {topic.topic_title}
                </h3>
                
                {topic.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
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
                )}
              </div>
              
              <Button asChild size="sm" className="flex-shrink-0">
                <Link href={`/quiz/${topic.topic_id}`}>
                  Take Quiz
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {topic.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CollectionCard({ collection }: { collection: Collection }) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
      case 2: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
      case 3: return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800'
      case 4: return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800'
      case 5: return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
    }
  }

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner'
      case 2: return 'Easy'
      case 3: return 'Intermediate'
      case 4: return 'Advanced'
      case 5: return 'Expert'
      default: return 'Unknown'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{collection.emoji}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-foreground mb-2">
                  {collection.title}
                </h3>
                
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={cn("text-xs border", getDifficultyColor(collection.difficulty_level))}>
                    {getDifficultyLabel(collection.difficulty_level)}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(collection.estimated_minutes)}
                  </div>
                  
                  {collection.current_events_relevance >= 4 && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <TrendingUp className="h-3 w-3" />
                      Hot
                    </div>
                  )}
                </div>
              </div>
              
              <Button asChild size="sm" className="flex-shrink-0">
                <Link href={`/collections/${collection.slug}`}>
                  Start Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {collection.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LinkCard({ link }: { link: LinkItem }) {
  const CardComponent = link.isExternal ? 'a' : Link
  const cardProps = link.isExternal 
    ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
    : { href: link.href }

  return (
    <CardComponent {...cardProps} className="block">
      <Card className={cn(
        "hover:shadow-md transition-shadow cursor-pointer group",
        link.isPrimary && "ring-1 ring-blue-200 bg-blue-50/50 dark:ring-blue-800 dark:bg-blue-950/50"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
              link.isPrimary 
                ? "bg-blue-600 text-white" 
                : "bg-muted text-muted-foreground"
            )}>
              {link.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-medium text-foreground group-hover:text-blue-600 transition-colors">
                  {link.title}
                </h3>
                {link.isNew && (
                  <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {link.description}
              </p>
            </div>
            
            <div className="shrink-0">
              {link.isExternal ? (
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              ) : (
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  )
} 