"use client"

import { useState, useEffect } from "react"
import { topicsData, type CategoryType } from "@/lib/quiz-data"
import { CivicCard } from "./civic-card"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { GameModal } from "./game-modal"
import { Button } from "@/components/ui/button"

// Helper to get today's date at midnight for consistent comparison
const getTodayAtMidnight = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

interface DailyCardStackProps {
  selectedCategory: CategoryType | null
  searchQuery: string
  requireAuth?: boolean
  onAuthRequired?: () => void
}

const FREE_QUIZ_LIMIT = 2 // Number of quizzes allowed without authentication

export function DailyCardStack({
  selectedCategory,
  searchQuery,
  requireAuth = false,
  onAuthRequired,
}: DailyCardStackProps) {
  const cardBaseHeight = "h-[400px]"
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())
  const [currentDate, setCurrentDate] = useState(getTodayAtMidnight()) // Store current date for rendering logic
  const [quizAttempts, setQuizAttempts] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)

  // Convert topics object to array for easier mapping
  const topicsList = Object.values(topicsData)

  // Filter topics based on category and search query
  const filteredTopics = topicsList.filter((topic) => {
    const matchesCategory = selectedCategory === null || topic.categories.includes(selectedCategory)
    const matchesSearch =
      searchQuery === "" ||
      topic.topic_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Effect to update current date if the component stays mounted across midnight (optional, good practice)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(getTodayAtMidnight())
    }, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  // Load completed topics, quiz attempts, streak, and last activity from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    if (savedCompleted) {
      setCompletedTopics(new Set(JSON.parse(savedCompleted)))
    }

    const savedAttempts = localStorage.getItem("civicAppQuizAttempts")
    if (savedAttempts) {
      setQuizAttempts(Number.parseInt(savedAttempts, 10))
    }

    const savedStreak = localStorage.getItem("civicAppStreak")
    if (savedStreak) {
      setStreak(Number.parseInt(savedStreak, 10))
    }

    const savedLastActivity = localStorage.getItem("civicAppLastActivity")
    if (savedLastActivity) {
      setLastActivity(new Date(savedLastActivity))
    }
  }, [])

  // Save completed topics and quiz attempts to localStorage
  useEffect(() => {
    localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(Array.from(completedTopics)))
  }, [completedTopics])

  useEffect(() => {
    localStorage.setItem("civicAppQuizAttempts", quizAttempts.toString())
  }, [quizAttempts])

  const handleExploreGame = (topicId: string) => {
    const topic = topicsData[topicId]
    if (!topic) return

    const topicDate = new Date(topic.date)
    topicDate.setHours(0, 0, 0, 0) // Normalize topic date to midnight for comparison

    if (topicDate > currentDate && !completedTopics.has(topicId)) {
      // Topic is locked because its date hasn't arrived
      console.log(`Topic "${topic.topic_title}" is locked. Available on: ${topic.date}`)
      return
    }

    // Check if user needs to authenticate
    if (requireAuth && quizAttempts >= FREE_QUIZ_LIMIT) {
      onAuthRequired?.()
      return
    }

    setSelectedTopicId(topicId)
    setIsModalOpen(true)

    // Increment quiz attempts if not completed already
    if (!completedTopics.has(topicId)) {
      setQuizAttempts((prev) => prev + 1)
    }
  }

  const handleGameComplete = (topicId: string) => {
    const now = new Date()
    setLastActivity(now)
    localStorage.setItem("civicAppLastActivity", now.toString())

    // Update streak
    const lastActivityDate = lastActivity ? new Date(lastActivity) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate)
      lastDate.setHours(0, 0, 0, 0)

      if (lastDate.getTime() === yesterday.getTime()) {
        // Last activity was yesterday, increment streak
        const newStreak = streak + 1
        setStreak(newStreak)
        localStorage.setItem("civicAppStreak", newStreak.toString())
      } else if (lastDate.getTime() < yesterday.getTime()) {
        // Last activity was before yesterday, reset streak
        setStreak(1)
        localStorage.setItem("civicAppStreak", "1")
      }
      // If last activity was today, don't change streak
    } else {
      // First activity ever
      setStreak(1)
      localStorage.setItem("civicAppStreak", "1")
    }

    setCompletedTopics((prev) => {
      const newCompleted = new Set(prev)
      newCompleted.add(topicId)
      return newCompleted
    })
  }

  if (filteredTopics.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto text-center p-8 bg-card rounded-2xl shadow-lg">
        <p className="text-lg font-medium">No topics match your search criteria.</p>
        <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
      </div>
    )
  }

  // Show auth prompt if user has reached the free quiz limit
  if (requireAuth && quizAttempts >= FREE_QUIZ_LIMIT) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-8 bg-card rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Ready for more learning?</h2>
        <p className="mb-6">
          You've completed {quizAttempts} quizzes. Sign up to continue learning and support our mission with a small
          donation.
        </p>
        <Button onClick={onAuthRequired} className="rounded-xl">
          Sign Up to Continue
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="relative w-full max-w-sm mx-auto pt-8">
        {/* Decorative background stacked cards */}
        <div
          className={`absolute inset-x-0 mx-auto ${cardBaseHeight} bg-slate-200/70 dark:bg-slate-700/70 rounded-2xl shadow-lg transform -rotate-6 translate-y-3 opacity-75`}
          style={{ width: "calc(100% - 40px)" }}
        />
        <div
          className={`absolute inset-x-0 mx-auto ${cardBaseHeight} bg-slate-300/70 dark:bg-slate-600/70 rounded-2xl shadow-lg transform rotate-3 translate-y-1.5 opacity-90`}
          style={{ width: "calc(100% - 20px)" }}
        />

        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full relative z-10"
        >
          <CarouselContent className="-ml-4">
            {filteredTopics.map((topic) => {
              const topicDate = new Date(topic.date)
              topicDate.setHours(0, 0, 0, 0) // Normalize for comparison
              const isLocked = topicDate > currentDate
              const isCompleted = completedTopics.has(topic.topic_id)

              return (
                <CarouselItem key={topic.topic_id} className="pl-4 basis-full">
                  <CivicCard
                    topic={topic}
                    baseHeight={cardBaseHeight}
                    onExploreGame={handleExploreGame}
                    isCompleted={isCompleted}
                    isLocked={isLocked && !isCompleted} // A completed card is never "locked" for re-exploration
                  />
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <div className="flex justify-center items-center space-x-4 mt-8">
            <CarouselPrevious className="bg-card hover:bg-muted border-border shadow-md disabled:opacity-50 rounded-xl" />
            <CarouselNext className="bg-card hover:bg-muted border-border shadow-md disabled:opacity-50 rounded-xl" />
          </div>
        </Carousel>
      </div>

      <GameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topicId={selectedTopicId}
        onGameComplete={handleGameComplete}
      />
    </>
  )
}
