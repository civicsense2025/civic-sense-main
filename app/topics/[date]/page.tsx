import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from "@/components/header"
import { Container, Stack, Text } from "@/components/ui"
import { Badge } from "@/components/ui/badge"
import { TopicSubmissionForm } from '@/components/topic-submission-form'
import Link from 'next/link'

interface PageProps {
  params: {
    date: string // Format: YYYY-MM-DD
  }
}

interface HistoricalEvent {
  id: string
  title: string
  description: string | null
  date: string
  type: 'civic_event' | 'figure_event'
  significance: number | null
  why_this_matters?: string
  policy_areas?: string[]
}

type CategoryType = 'breaking' | 'featured' | 'historical' | 'policy' | 'default';

// Helper function to format date for meta title
function formatDateForTitle(dateStr: string): string {
  // Parse the date in UTC to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Ensure consistent date display regardless of user's timezone
  })
}

// Helper function to validate date format
function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false
  }
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return !isNaN(date.getTime())
}

// Helper function to generate meta description from topics and events
function generateMetaDescription(topics: any[], events: HistoricalEvent[]): string {
  const allItems = [...topics, ...events]
  if (allItems.length === 0) {
    return 'Explore historical events and current topics for this day in American politics and government.'
  }

  const categories = [...new Set(topics.flatMap(t => 
    Array.isArray(t.categories) ? t.categories : []
  ))]

  const breakingCount = topics.filter(t => t.is_breaking).length
  const featuredCount = topics.filter(t => t.is_featured).length
  const historicalCount = events.length

  return `Explore ${allItems.length} items including ${historicalCount} historical events${
    breakingCount ? `, ${breakingCount} breaking news` : ''
  }${
    featuredCount ? `, ${featuredCount} featured topics` : ''
  } about ${categories.slice(0, 3).join(', ')}${
    categories.length > 3 ? ' and more' : ''
  }.`
}

// Helper function to get historical events for a month and day
async function getHistoricalEvents(monthAndDay: string): Promise<HistoricalEvent[]> {
  const [month, day] = monthAndDay.split('-')
  
  // Get all events from both tables that match the month and day
  const [eventsResponse, figureEventsResponse] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .like('date', `%-${month}-${day}`),
    supabase
      .from('figure_events')
      .select('*')
      .like('event_date', `%-${month}-${day}`)
  ])

  const events = eventsResponse.error ? [] : eventsResponse.data
  const figureEvents = figureEventsResponse.error ? [] : figureEventsResponse.data

  // Combine and format events
  return [
    ...events.map(event => ({
      id: event.id || event.topic_id,
      title: event.topic_title,
      description: event.description,
      date: event.date,
      type: 'civic_event' as const,
      significance: event.ai_extraction_metadata?.significance || null,
      why_this_matters: event.why_this_matters
    })),
    ...figureEvents.map(event => ({
      id: event.id,
      title: event.event_title,
      description: event.event_description,
      date: event.event_date,
      type: 'figure_event' as const,
      significance: event.significance_level,
      policy_areas: event.policy_areas
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = params
  const monthAndDay = date.split('-').slice(1).join('-') // Get MM-DD from YYYY-MM-DD
  
  const [topics, historicalEvents] = await Promise.all([
    supabase
      .from('question_topics')
      .select('*')
      .like('date', `%-${monthAndDay}`)
      .eq('is_active', true),
    getHistoricalEvents(monthAndDay)
  ])

  const formattedDate = formatDateForTitle(date)
  const description = generateMetaDescription(topics.data || [], historicalEvents)

  return {
    title: `${formattedDate} • Daily Topics • CivicSense`,
    description,
    openGraph: {
      title: `${formattedDate} • Daily Topics`,
      description,
    },
    robots: topics.data?.length ? 'index, follow' : 'noindex, follow'
  }
}

// Helper function to get category color
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'breaking': 'bg-red-500 text-white',
    'featured': 'bg-blue-500 text-white',
    'historical': 'bg-amber-500 text-white',
    'policy': 'bg-green-500 text-white',
    'default': 'bg-slate-500 text-white'
  }
  return colors[category.toLowerCase()] || colors.default
}

export default async function DailyTopicsPage({ params }: PageProps) {
  const { date } = params

  // Validate date format
  if (!isValidDate(date)) {
    return notFound()
  }

  const monthAndDay = date.split('-').slice(1).join('-') // Get MM-DD from YYYY-MM-DD
  
  // Get both current topics and historical events
  const [topics, historicalEvents] = await Promise.all([
    supabase
      .from('question_topics')
      .select('*')
      .like('date', `%-${monthAndDay}`)
      .eq('is_active', true),
    getHistoricalEvents(monthAndDay)
  ])

  const hasContent = (topics.data?.length || 0) + historicalEvents.length > 0
  const formattedDate = formatDateForTitle(date)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full">
        <Container className="max-w-4xl py-12">
          <Stack spacing="lg">
            {/* Page Header */}
            <div className="text-center">
              <h1 className="text-4xl font-light text-foreground mb-4">
                {formattedDate}
              </h1>
              <Text className="text-lg text-muted-foreground">
                Explore historical events and current topics in American politics and government.
              </Text>
            </div>

            {hasContent ? (
              <div className="space-y-12">
                {/* Current Topics Section */}
                {topics.data && topics.data.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-light mb-6">Today's Topics</h2>
                    <Stack spacing="lg">
                      {topics.data.map(topic => (
                        <div key={topic.topic_id} className="bg-card rounded-lg border p-6">
                          <Stack spacing="md">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{topic.emoji}</span>
                                <div>
                                  <Link 
                                    href={`/quiz/${topic.topic_id}`}
                                    className="text-xl font-medium hover:underline"
                                  >
                                    {topic.topic_title}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1">
                                    {topic.is_breaking && (
                                      <Badge className={getCategoryColor('breaking')}>Breaking</Badge>
                                    )}
                                    {topic.is_featured && (
                                      <Badge className={getCategoryColor('featured')}>Featured</Badge>
                                    )}
                                    {topic.categories?.map(category => (
                                      <Badge key={category} variant="outline">{category}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <Text className="text-muted-foreground">
                              {topic.description}
                            </Text>

                            <div className="bg-muted/50 rounded-md p-4">
                              <Text className="font-medium mb-2">Why This Matters</Text>
                              <Text className="text-muted-foreground">
                                {topic.why_this_matters}
                              </Text>
                            </div>

                            <div className="flex justify-end">
                              <Link
                                href={`/quiz/${topic.topic_id}`}
                                className="text-primary hover:underline text-sm font-medium"
                              >
                                Take the Quiz →
                              </Link>
                            </div>
                          </Stack>
                        </div>
                      ))}
                    </Stack>
                  </section>
                )}

                {/* Historical Events Section */}
                {historicalEvents.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-light mb-6">Historical Events</h2>
                    <Stack spacing="lg">
                      {historicalEvents.map(event => (
                        <div key={event.id} className="bg-card rounded-lg border p-6">
                          <Stack spacing="md">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-medium">{event.title}</h3>
                                  <Badge className={getCategoryColor('historical')}>
                                    {new Date(event.date).getFullYear()}
                                  </Badge>
                                  {event.type === 'figure_event' && event.policy_areas?.map(area => (
                                    <Badge key={area} className={getCategoryColor('policy')}>{area}</Badge>
                                  ))}
                                </div>
                                {event.significance && (
                                  <Badge variant="outline">
                                    Significance Level {event.significance}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <Text className="text-muted-foreground">
                              {event.description}
                            </Text>

                            {event.why_this_matters && (
                              <div className="bg-muted/50 rounded-md p-4">
                                <Text className="font-medium mb-2">Why This Matters</Text>
                                <Text className="text-muted-foreground">
                                  {event.why_this_matters}
                                </Text>
                              </div>
                            )}
                          </Stack>
                        </div>
                      ))}
                    </Stack>
                  </section>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Text className="text-muted-foreground mb-8">
                  No topics or events found for this date yet.
                </Text>
                <TopicSubmissionForm date={date} />
              </div>
            )}
          </Stack>
        </Container>
      </main>
    </div>
  )
} 