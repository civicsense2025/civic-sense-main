"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { WaitingRoom } from "@/components/multiplayer/waiting-room"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { useMultiplayerRoom } from "@/lib/multiplayer"
import { dataService } from "@/lib/data-service"
import type { QuizQuestion, TopicMetadata } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import React from "react"

interface MultiplayerQuizClientProps {
  params: {
    topicId: string
  }
  searchParams: {
    room?: string
    player?: string
  }
}

function MultiplayerQuizClient({ params, searchParams }: MultiplayerQuizClientProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  // Memoize the room and player IDs to prevent unnecessary re-renders
  const roomId = useMemo(() => searchParams.room, [searchParams.room])
  const playerId = useMemo(() => searchParams.player, [searchParams.player])
  const topicId = useMemo(() => params.topicId, [params.topicId])

  console.log('🎮 MultiplayerQuizClient - Received props:', {
    params,
    searchParams,
    topicId,
    roomId,
    playerId
  })

  // Initialize the multiplayer room hook
  const { 
    room, 
    players,
    isLoading: roomLoading, 
    error: roomError,
    updatePlayerReady,
    startGame,
    leaveRoom
  } = useMultiplayerRoom(roomId)

  console.log('🎮 MultiplayerQuizClient - Room hook state:', {
    room: room ? { id: room.id, room_code: room.room_code, room_status: room.room_status } : null,
    roomLoading,
    roomError
  })

  // Load quiz data - memoize the effect to prevent infinite loops
  const loadQuizData = useCallback(async () => {
    if (!topicId) {
      console.log('🎮 No topicId provided, skipping quiz data load')
      setIsLoading(false)
      return
    }

    console.log('🎮 Loading quiz data for topic:', topicId)
    try {
      setIsLoading(true)
      setError(null)

      const [topicData, questionsData] = await Promise.all([
        dataService.getTopicById(topicId),
        dataService.getQuestionsByTopic(topicId)
      ])
      
      console.log('🎮 Quiz data loaded:', {
        topicData: topicData ? { id: topicData.topic_id, title: topicData.topic_title } : null,
        questionsCount: questionsData?.length || 0
      })
      
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
      console.error("🎮 Error loading quiz data:", err)
      setError("Failed to load quiz data")
    } finally {
      setIsLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    loadQuizData()
  }, [loadQuizData])

  // Check if game has started - memoize to prevent unnecessary updates
  const shouldStartGame = useMemo(() => {
    return room?.room_status === 'in_progress'
  }, [room?.room_status])

  useEffect(() => {
    if (shouldStartGame) {
      console.log('🎮 Game started! Status:', room?.room_status)
      setGameStarted(true)
    }
  }, [shouldStartGame, room?.room_status])

  const handleGameStart = useCallback(() => {
    console.log('🎮 Game start triggered')
    setGameStarted(true)
  }, [])

  const handleQuizComplete = useCallback(() => {
    console.log('🎮 Quiz completed')
    // Handle quiz completion - could navigate to results or back to home
    router.push("/")
  }, [router])

  const handleBackToHome = useCallback(() => {
    console.log('🎮 Navigating back to home')
    router.push("/")
  }, [router])

  console.log('🎮 Render state:', {
    roomId,
    playerId,
    isLoading,
    roomLoading,
    error,
    roomError,
    gameStarted,
    roomStatus: room?.room_status,
    hasQuestions: questions.length > 0,
    hasTopic: !!topic,
    room: room ? { 
      id: room.id, 
      room_code: room.room_code, 
      room_status: room.room_status,
      topic_id: room.topic_id 
    } : null,
    conditionalChecks: {
      hasRoomIdAndPlayerId: !!(roomId && playerId),
      isStillLoading: isLoading || roomLoading,
      hasError: !!(error || roomError || !topic),
      shouldShowWaitingRoom: (!gameStarted || room?.room_status === 'waiting') && !!(roomId && playerId) && !(isLoading || roomLoading) && !(error || roomError || !topic),
      shouldShowQuizEngine: !!(questions.length > 0 && topic) && gameStarted && room?.room_status !== 'waiting'
    }
  })

  // Validate required params
  if (!roomId || !playerId) {
    console.log('🎮 Missing required params - showing error')
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
    console.log('🎮 Showing loading state - isLoading:', isLoading, 'roomLoading:', roomLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading multiplayer quiz...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Quiz loading: {isLoading ? 'Yes' : 'No'} | Room loading: {roomLoading ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    )
  }

  if (error || roomError || !topic) {
    console.log('🎮 Showing error state - error:', error, 'roomError:', roomError, 'hasTopic:', !!topic)
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
    console.log('🎮 Showing waiting room - gameStarted:', gameStarted, 'roomStatus:', room?.room_status)
    return (
      <WaitingRoom
        roomId={roomId}
        playerId={playerId}
        room={room}
        players={players}
        isLoading={roomLoading}
        error={roomError}
        updatePlayerReady={updatePlayerReady}
        startGame={startGame}
        leaveRoom={leaveRoom}
        onGameStart={handleGameStart}
      />
    )
  }

  // Show quiz engine when game is in progress
  if (questions.length > 0 && topic) {
    console.log('🎮 Showing quiz engine - questionsLength:', questions.length, 'hasTopic:', !!topic)
    return (
      <div className="bg-white dark:bg-slate-950">
        <QuizEngine
          questions={questions}
          topicId={topicId}
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
  console.log('🎮 Showing fallback error state - this should not happen if everything is working')
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

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(MultiplayerQuizClient) 