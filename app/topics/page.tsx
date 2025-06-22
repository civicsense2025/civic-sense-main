import { Suspense } from 'react'
import { Header } from "@/components/header"
import { Container } from "@/components/ui"
import { Calendar } from "@/components/calendar"
import { supabase } from '@/lib/supabase'
import { Metadata } from 'next'
import type { TopicMetadata } from '@/lib/quiz-data'

export const metadata: Metadata = {
  title: 'Daily Topics Calendar • CivicSense',
  description: 'Explore our daily topics about American politics, news, and government. Find topics by date and learn about current events.',
}

// This ensures the page is server-side rendered
export const dynamic = 'force-dynamic'

async function getTopics(): Promise<TopicMetadata[]> {
  const { data: topics, error } = await supabase
    .from('question_topics')
    .select('topic_id, topic_title, description, why_this_matters, emoji, date, day_of_week, categories, is_breaking, is_featured')
    .eq('is_active', true)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching topics:', error)
    return []
  }

  return topics.map(topic => ({
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
}

async function getTopicStats() {
  const { data: stats, error } = await supabase
    .from('question_topics')
    .select('date, is_breaking, is_featured', { count: 'exact' })
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching topic stats:', error)
    return {
      totalTopics: 0,
      totalDays: 0,
      breakingNews: 0,
      featuredTopics: 0
    }
  }

  const uniqueDays = new Set(stats.map(t => t.date)).size
  const breakingNews = stats.filter(t => t.is_breaking).length
  const featuredTopics = stats.filter(t => t.is_featured).length

  return {
    totalTopics: stats.length,
    totalDays: uniqueDays,
    breakingNews,
    featuredTopics
  }
}

export default async function TopicsPage() {
  const [topics, stats] = await Promise.all([getTopics(), getTopicStats()])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full">
        <Container className="max-w-7xl py-12 sm:py-16 lg:py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20">
            <h1 className="text-4xl font-light text-foreground tracking-tight mb-6">
              Daily Topics Calendar
            </h1>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              Explore our curated collection of daily topics about American politics, news, and government.
              Click on any date with topics to learn more.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
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

          {/* Calendar */}
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
        </Container>
      </main>
    </div>
  )
} 