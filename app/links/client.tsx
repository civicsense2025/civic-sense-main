"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  ChevronDown
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

export function LinksPageClient() {
  const [mounted, setMounted] = useState(false)
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([])
  const [allTopics, setAllTopics] = useState<QuestionTopic[]>([])
  const [groupedTopics, setGroupedTopics] = useState<GroupedTopics[]>([])
  const [selectedDateGroup, setSelectedDateGroup] = useState<GroupedTopics | null>(null)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    fetchFeaturedCollections()
    fetchFeaturedTopics()
  }, [])

  const fetchFeaturedCollections = async () => {
    try {
      const response = await fetch('/api/collections?featured=true&limit=3')
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
      const response = await fetch('/api/topics?limit=all') // Get all topics to filter properly
      if (response.ok) {
        const data = await response.json()
        const topics = data.topics || []
        setAllTopics(topics)
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
    // Use local date to avoid timezone issues
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0')
    
    // Calculate date range: start of 1 week ago to end of next week
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)
    oneWeekAgo.setHours(0, 0, 0, 0) // Start of day
    
    const oneWeekAhead = new Date(today)
    oneWeekAhead.setDate(today.getDate() + 7)
    oneWeekAhead.setHours(23, 59, 59, 999) // End of day
    
    console.log('Date range calculation:')
    console.log('Today:', todayString)
    console.log('Range start:', oneWeekAgo.toISOString().split('T')[0])
    console.log('Range end:', oneWeekAhead.toISOString().split('T')[0])
    
    // Group topics by date
    const grouped = topics.reduce((acc, topic) => {
      const date = topic.date || 'no-date'
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(topic)
      return acc
    }, {} as Record<string, QuestionTopic[]>)

    console.log('All topic dates:', Object.keys(grouped).filter(d => d !== 'no-date').sort())

    // Filter dates within our range and sort
    const validDates = Object.keys(grouped)
      .filter(date => {
        if (date === 'no-date') return true
        
        const topicDate = new Date(date + 'T12:00:00') // Use noon to avoid timezone issues
        const isInRange = topicDate >= oneWeekAgo && topicDate <= oneWeekAhead
        
        console.log(`Date ${date}: topicDate=${topicDate.toISOString().split('T')[0]}, inRange=${isInRange}`)
        
        return isInRange
      })
      .sort((a, b) => {
        if (a === 'no-date') return 1
        if (b === 'no-date') return -1
        return new Date(b).getTime() - new Date(a).getTime()
      })

    console.log('Valid dates after filtering:', validDates)

    const result: GroupedTopics[] = []
    
    // Find today's index and build result with today + last 2 days
    const todayIndex = validDates.indexOf(todayString)
    let datesToShow: string[] = []
    
    if (todayIndex !== -1) {
      // Today exists, show today + next 2 dates (which are actually previous days due to desc sort)
      datesToShow = validDates.slice(todayIndex, todayIndex + 3)
    } else {
      // Today doesn't exist, show first 3 available dates
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
          // Check if this is yesterday, tomorrow, etc.
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
        topics: topics.slice(0, 8), // Limit topics per date
        isToday
      })
    }

    console.log('Final result:', result.map(r => ({ date: r.date, displayDate: r.displayDate, isToday: r.isToday, topicCount: r.topics.length })))

    setGroupedTopics(result)
    
    // Set default selection: prioritize today, then most recent, then first available
    let defaultSelection = result.find(group => group.isToday) // Try today first
    
    if (!defaultSelection) {
      // If no topics for today, find the most recent date that has topics
      defaultSelection = result.find(group => group.date !== 'no-date')
    }
    if (!defaultSelection && result.length > 0) {
      defaultSelection = result[0] // Finally, just the first available
    }
    
    console.log('Default selection:', defaultSelection?.displayDate)
    
    if (defaultSelection) {
      setSelectedDateGroup(defaultSelection)
    }
  }

  // Core learning content
  const learningLinks: LinkItem[] = []

  // Resource links
  const resourceLinks: LinkItem[] = [
    {
      id: 'categories',
      title: 'Browse Topics',
      description: 'Explore civic education by category',
      href: '/categories',
      icon: <BookOpen className="h-4 w-4" />,
      category: 'resource'
    },
    {
      id: 'glossary',
      title: 'Civic Glossary',
      description: 'Essential terms and definitions',
      href: '/glossary',
      icon: <Gavel className="h-4 w-4" />,
      category: 'resource'
    },
    {
      id: 'public-figures',
      title: 'Your Representatives',
      description: 'Learn about current political figures',
      href: '/public-figures',
      icon: <Vote className="h-4 w-4" />,
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
      icon: <PenTool className="h-4 w-4" />,
      isPrimary: true,
      category: 'action'
    },
    {
      id: 'donate',
      title: 'Support Our Mission',
      description: 'Help expand civic education access',
      href: '/donate',
      icon: <Heart className="h-4 w-4" />,
      isPrimary: true,
      category: 'action'
    },
    {
      id: 'schools',
      title: 'Educational Partnerships',
      description: 'Bring CivicSense to your institution',
      href: '/schools',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'action'
    }
  ]

  const quickStats = [
    { label: 'Active Learners', value: '50K+', icon: <Users className="h-4 w-4" /> },
    { label: 'Quiz Questions', value: '2,500+', icon: <MessageSquare className="h-4 w-4" /> },
    { label: 'Learning Paths', value: '100+', icon: <Target className="h-4 w-4" /> }
  ]

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-sm mx-auto px-6 py-8 space-y-8">
        {/* Header - Clean and minimal */}
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-2xl">🤝</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100">
              CivicSense
            </h1>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              Democracy, decoded daily
            </p>
            <a 
              href="https://civicsense.one" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              🔗 civicsense.one
            </a>
          </div>
        </div>

        {/* Featured Collections */}
        {!collectionsLoading && featuredCollections.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Featured Learning</h2>
            </div>
            
            <div className="space-y-3">
              {featuredCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
            
            <Link href="/collections" className="block">
              <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <BookOpen className="h-4 w-4 mr-2" />
                View All Collections
              </Button>
            </Link>
          </div>
        )}

        {/* Featured Topics - Date List with Cards */}
        {!topicsLoading && groupedTopics.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Featured Topics</h2>
            </div>
            
            {/* Date and Topics with Cards */}
            <div className="space-y-6">
              {groupedTopics.map((group) => (
                <div key={group.date} className="space-y-3">
                  {/* Date Header */}
                  <h3 className={cn(
                    "text-sm font-medium",
                    group.isToday ? "text-purple-700 dark:text-purple-300" : "text-slate-700 dark:text-slate-300"
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
                  
                  {/* Topics as cards */}
                  <div className="space-y-2">
                    {group.topics.map((topic) => (
                      <TopicCard key={topic.topic_id} topic={topic} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/topics" className="block">
              <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <BookOpen className="h-4 w-4 mr-2" />
                View {allTopics.length} Topics
              </Button>
            </Link>
          </div>
        )}

        {/* Start Learning Section */}
        {learningLinks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Start Learning</h2>
            </div>
            
            <div className="space-y-3">
              {learningLinks.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        )}

        {/* Support Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Support Democracy</h2>
          </div>
          
          <div className="space-y-3">
            {actionLinks.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      </div>
    </div>
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
    <Link href={`/collections/${collection.slug}`} className="block">
      <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl shrink-0">{collection.emoji}</div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                  {collection.title}
                </h3>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {collection.description}
              </p>
              
              <div className="flex items-center gap-3 pt-1">
                <Badge className={cn("text-xs border", getDifficultyColor(collection.difficulty_level))}>
                  {getDifficultyLabel(collection.difficulty_level)}
                </Badge>
                
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
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
          </div>
        </CardContent>
      </Card>
    </Link>
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
        "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 cursor-pointer group",
        link.isPrimary && "ring-1 ring-blue-200 bg-blue-50 dark:ring-blue-800 dark:bg-blue-950"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-xl shrink-0",
              link.isPrimary 
                ? "bg-blue-600 text-white" 
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            )}>
              {link.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                  {link.title}
                </h3>
                {link.isNew && (
                  <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {link.description}
              </p>
            </div>
            
            <div className="shrink-0">
              {link.isExternal ? (
                <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 transition-colors" />
              ) : (
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  )
}

function TopicCard({ topic }: { topic: QuestionTopic }) {
  return (
    <Link href={`/quiz/${topic.topic_id}`} className="block">
      <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-xl shrink-0">{topic.emoji}</div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                  {topic.topic_title}
                </h3>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {topic.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 