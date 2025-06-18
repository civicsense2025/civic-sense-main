"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { WaitingRoom } from "@/components/multiplayer/waiting-room"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { useMultiplayerRoom } from "@/lib/multiplayer"
import { dataService } from "@/lib/data-service"
import type { QuizQuestion, TopicMetadata } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

interface MultiplayerQuizClientProps {
  params: {
    topicId: string
  }
  searchParams: {
    room?: string
    player?: string
  }
}

export default function MultiplayerQuizClient({ params, searchParams }: MultiplayerQuizClientProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  const roomId = searchParams.room
  const playerId = searchParams.player

  const { room, isLoading: roomLoading, error: roomError } = useMultiplayerRoom(roomId)

  // Load quiz data
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [topicData, questionsData] = await Promise.all([
          dataService.getTopicById(params.topicId),
          dataService.getQuestionsByTopic(params.topicId)
        ])
        
        if (!topicData) {
          setError("Quiz topic not found")
          return
        }
        setTopic(topicData)
        
        if (questionsData && questionsData.length > 0) {
          setQuestions(questionsData)
        } else {
          setError("No questions available for this topic")
        }
      } catch (err) {
        console.error("Error loading quiz data:", err)
        setError("Failed to load quiz data")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.topicId) {
      loadQuizData()
    }
  }, [params.topicId])

  // Check if game has started
  useEffect(() => {
    if (room?.room_status === 'in_progress') {
      setGameStarted(true)
    }
  }, [room?.room_status])

  const handleGameStart = () => {
    setGameStarted(true)
  }

  const handleQuizComplete = () => {
    // Handle quiz completion - could navigate to results or back to home
    router.push("/")
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  // Validate required params
  if (!roomId || !playerId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Invalid Room Link</h1>
          <p className="text-muted-foreground mb-6">
            This multiplayer quiz link is missing required information.
          </p>
          <Button onClick={handleBackToHome} className="rounded-xl">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || roomLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading multiplayer quiz...</p>
        </div>
      </div>
    )
  }

  if (error || roomError || !topic) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {error || roomError || "The requested quiz could not be loaded."}
          </p>
          <Button onClick={handleBackToHome} className="rounded-xl">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Show waiting room if game hasn't started
  if (!gameStarted || room?.room_status === 'waiting') {
    return (
      <WaitingRoom
        roomId={roomId}
        playerId={playerId}
        onGameStart={handleGameStart}
      />
    )
  }

  // Show quiz engine when game is in progress
  if (questions.length > 0 && topic) {
    return (
      <div className="bg-white dark:bg-slate-950">
        <QuizEngine
          questions={questions}
          topicId={params.topicId}
          currentTopic={{
            id: topic.topic_id || "",
            title: topic.topic_title || "",
            emoji: topic.emoji || "",
            date: topic.date || "",
            dayOfWeek: topic.date ? new Date(topic.date).toLocaleDateString('en-US', { weekday: 'long' }) : ""
          }}
          onComplete={handleQuizComplete}
        />
      </div>
    )
  }

  // Fallback error state
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Quiz Unavailable</h1>
        <p className="text-muted-foreground mb-6">
          This quiz is not ready for multiplayer yet.
        </p>
        <Button onClick={handleBackToHome} className="rounded-xl">
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </div>
  )
} 