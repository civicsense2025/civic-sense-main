import { useEffect, useState } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { TopicCard } from "@/components/daily-card/topic-card"
import { useTopicAccess } from "@/hooks/use-topic-access"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import type { TopicMetadata } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { parseTopicDate } from "@/lib/utils"





export default function HomeTopicCarousel() {
  const [topics, setTopics] = useState<TopicMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const { getTopicAccessStatus, isTopicCompleted } = useTopicAccess()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    async function loadTopics() {
      setIsLoading(true)
      setError(null)
      try {

        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const todayStr = `${yyyy}-${mm}-${dd}`


        let { data, error } = await supabase
          .from('question_topics')
          .select('*')
          .eq('is_active', true)
          .eq('date', todayStr)
          .order('date', { ascending: false })

        if (error) throw error


        if (!data || data.length === 0) {
          const recent = await supabase
            .from('question_topics')
            .select('*')
            .eq('is_active', true)
            .not('date', 'is', null)
            .order('date', { ascending: false })
            .limit(12)
          if (recent.error) throw recent.error
          data = recent.data
        }

        if (!cancelled) {
          setTopics((data || []).map(t => ({
            ...t,
            categories: Array.isArray(t.categories) ? t.categories.filter((c): c is string => typeof c === 'string') : [],
            date: typeof t.date === 'string' ? t.date : '',
            dayOfWeek: parseTopicDate(t.date)?.toLocaleDateString('en-US', { weekday: 'short' }) || '',
            is_breaking: !!t.is_breaking,
            is_featured: !!t.is_featured,
          })))
        }
      } catch (err) {
        setError('Failed to load topics. Please try again.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadTopics()
    return () => { cancelled = true }
  }, [])


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (topics.length === 0) return
      if (e.key === 'ArrowLeft') {
        setCurrent(c => Math.max(0, c - 1))
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        setCurrent(c => Math.min(topics.length - 1, c + 1))
        e.preventDefault()
      } else if (e.key === 'Enter' || e.key === ' ') {
        const topic = topics[current]
        if (topic) {
          const access = getTopicAccessStatus(topic)
          if (access.accessible) {
            router.push(`/quiz/${topic.topic_id}`)
          }
        }
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [topics, current, getTopicAccessStatus, router])

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </section>
    )
  }
  if (error) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="text-red-600">{error}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </section>
    )
  }
  if (topics.length === 0) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="text-2xl">No topics found</div>
          <Button asChild>
            <a href="/topics">Browse All Topics</a>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-2">
      <div className="w-full max-w-6xl relative">
        <Carousel opts={{ align: 'start', loop: false }}>
          <CarouselContent className="gap-x-4 md:gap-x-8">
            {topics.map((topic) => (
              <CarouselItem
                key={topic.topic_id}
                className="flex justify-center px-1 md:px-2 basis-full sm:basis-1/2 lg:basis-1/3 max-w-xs"
              >
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 p-3 sm:p-4 flex flex-col items-center w-full">
                  <TopicCard
                    topic={{ ...topic, description: '' }}
                    accessStatus={getTopicAccessStatus(topic)}
                    isCompleted={isTopicCompleted(topic.topic_id)}
                    onStartQuiz={() => router.push(`/quiz/${topic.topic_id}`)}
                    className="w-full text-base md:text-lg [&_h2]:text-lg [&_h2]:md:text-xl [&_h2]:font-normal [&_h2]:mb-1 [&_div.flex-wrap]:gap-0.5 [&_div.flex-wrap]:mb-1 [&_div.flex-wrap]:text-xs [&_button]:text-sm [&_button]:px-4 [&_button]:py-2"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious onClick={() => setCurrent(c => Math.max(0, c - 1))} />
          <CarouselNext onClick={() => setCurrent(c => Math.min(topics.length - 1, c + 1))} />
        </Carousel>
      </div>
      <div className="mt-8">
        <Button asChild size="lg" className="px-8 py-4 text-lg rounded-full shadow-md">
          <a href="/topics">Browse All Topics</a>
        </Button>
      </div>
    </section>
  )
} 