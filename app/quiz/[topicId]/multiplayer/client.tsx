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
import { ErrorBoundary } from "react-error-boundary"

// Global styles for fullscreen multiplayer experience
if (typeof window !== 'undefined') {
  // Add global styles on mount
  const style = document.createElement('style')
  style.id = 'multiplayer-fullscreen-styles'
  style.innerHTML = `
    .fullscreen-multiplayer {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 999 !important;
      background: white !important;
      overflow: auto !important;
    }
    
    /* Hide header and footer when in fullscreen multiplayer */
    body:has(.fullscreen-multiplayer) > header,
    body:has(.fullscreen-multiplayer) > footer,
    body:has(.fullscreen-multiplayer) nav[aria-label="main"] {
      display: none !important;
    }
    
    /* Ensure dark mode works */
    .dark .fullscreen-multiplayer {
      background: rgb(15 23 42) !important;
    }
    
    /* Prevent body scroll when multiplayer is active */
    body:has(.fullscreen-multiplayer) {
      overflow: hidden !important;
    }
  `
  if (!document.getElementById('multiplayer-fullscreen-styles')) {
    document.head.appendChild(style)
  }
}

interface MultiplayerQuizClientProps {
  params: {
    topicId: string
  }
  searchParams: {
    room?: string
    player?: string
    mode?: string
  }
}

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const router = useRouter()
  
  // Log error in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('🎮 [ErrorFallback] Quiz error:', error)
    }
  }, [error])
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-light text-slate-900 dark:text-white">Quiz Error</h1>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => {
                resetErrorBoundary()
                window.location.reload()
              }}
              className="w-full"
            >
              Reload Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MultiplayerQuizClient({ params, searchParams }: MultiplayerQuizClientProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  
  // Join form state - must be declared at top level to avoid conditional hook calls
  const [joinName, setJoinName] = useState<string>('')
  const [isJoining, setIsJoining] = useState(false)

  // Memoize the room and player IDs to prevent unnecessary re-renders
  const roomId = useMemo(() => {
    // Handle different possible formats of searchParams
    if (typeof searchParams.room === 'string') {
      return searchParams.room
    }
    
    // If searchParams is a complex object, try to extract from it
    if (searchParams && typeof searchParams === 'object') {
      const serialized = JSON.stringify(searchParams)
      try {
        // Look for room value in serialized data
        const roomMatch = serialized.match(/\"room\":\"([^\"]+)\"/)
        if (roomMatch) {
          return roomMatch[1]
        }
      } catch (e) {
        console.warn('Failed to extract room from searchParams:', e)
      }
    }
    
    return null
  }, [searchParams])
  
  // Store playerId in state so we can update it after localStorage lookup or a fresh join
  const [playerId, setPlayerId] = useState<string | null>(() => {
    // First, try to read from the URL / searchParams (legacy links)
    if (typeof searchParams.player === 'string') {
      return searchParams.player
    }

    // Attempt to parse from serialized searchParams (edge-case when props are dehydrated as an object)
    if (searchParams && typeof searchParams === 'object') {
      const serialized = JSON.stringify(searchParams)
      const match = serialized.match(/\"player\":\"([^\"]+)\"/)
      if (match) {
        return match[1]
      }
    }

    // Nothing found yet – return null for now; we will try localStorage on mount
    return null
  })

  const topicId = useMemo(() => params.topicId, [params.topicId])

  // Only log in development
  const devLog = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎮 [MultiplayerQuizClient] ${message}`, data || '')
    }
  }, [])

  devLog('Component mounted', {
    topicId,
    extractedRoomId: roomId,
    extractedPlayerId: playerId,
    searchParams,
    rawRoom: searchParams.room,
    rawPlayer: searchParams.player,
    searchParamsType: typeof searchParams,
    searchParamsKeys: searchParams ? Object.keys(searchParams) : 'null'
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
  } = useMultiplayerRoom(roomId || undefined)

  // Load quiz data - memoize the effect to prevent infinite loops
  const loadQuizData = useCallback(async () => {
    if (!topicId) {
      devLog('No topicId provided, skipping quiz data load')
      setIsLoading(false)
      setError('Invalid quiz topic')
      return
    }

    devLog('Loading quiz data', { topicId })
    
    try {
      setIsLoading(true)
      setError(null)

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        setError("Loading quiz data is taking too long. Please try again.")
        setIsLoading(false)
      }, 30000) // 30 second timeout

      const [topicData, questionsData] = await Promise.all([
        dataService.getTopicById(topicId),
        dataService.getQuestionsByTopic(topicId)
      ])
      
      clearTimeout(timeout)
      
      devLog('Quiz data loaded', {
        topic: topicData ? { id: topicData.topic_id, title: topicData.topic_title } : null,
        questionsCount: questionsData?.length || 0
      })
      
      if (!topicData) {
        setError("Quiz topic not found")
        return
      }
      
      setTopic(topicData)
      
      if (!questionsData || questionsData.length === 0) {
        setError("No questions available for this topic")
        return
      }
      
      // Validate questions have required fields
      const validQuestions = questionsData.filter(q => 
        q.question && 
        q.correct_answer && 
        (q.question_type === 'true_false' || (q.option_a && q.option_b))
      )
      
      if (validQuestions.length === 0) {
        setError("No valid questions found for this topic")
        return
      }
      
      setQuestions(validQuestions)
    } catch (err) {
      devLog('Error loading quiz data', err)
      setError(err instanceof Error ? err.message : "Failed to load quiz data")
    } finally {
      setIsLoading(false)
    }
  }, [topicId, devLog])

  // Load quiz data on mount
  useEffect(() => {
    loadQuizData()
  }, [loadQuizData])

  // Check if game has started - memoize to prevent unnecessary updates
  const shouldStartGame = useMemo(() => {
    return room?.room_status === 'in_progress' || room?.room_status === 'starting'
  }, [room?.room_status])

  useEffect(() => {
    if (shouldStartGame && !gameStarted) {
      devLog('Game started', { roomStatus: room?.room_status })
      setGameStarted(true)
    }
  }, [shouldStartGame, gameStarted, room?.room_status, devLog])

  // Handle room errors
  useEffect(() => {
    if (roomError) {
      devLog('Room error detected', { roomError })
      setError(`Room error: ${roomError}`)
    }
  }, [roomError, devLog])

  const handleGameStart = useCallback(() => {
    devLog('Game start triggered')
    setGameStarted(true)
  }, [devLog])

  const handleQuizComplete = useCallback(() => {
    devLog('Quiz completed')
    // Clean up and navigate
    if (roomId && playerId && leaveRoom) {
      leaveRoom(playerId).catch(err => {
        devLog('Error leaving room', err)
      })
    }
    router.push("/")
  }, [router, roomId, playerId, leaveRoom, devLog])

  const handleBackToHome = useCallback(() => {
    devLog('Navigating back to home')
    // Clean up before leaving
    if (roomId && playerId && leaveRoom) {
      leaveRoom(playerId).catch(err => {
        devLog('Error leaving room', err)
      })
    }
    router.push("/")
  }, [router, roomId, playerId, leaveRoom, devLog])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomId && playerId && leaveRoom) {
        devLog('Component unmounting, leaving room')
        leaveRoom(playerId).catch(err => {
          devLog('Error leaving room on unmount', err)
        })
      }
    }
  }, [roomId, playerId, leaveRoom, devLog])

  // On mount, if no playerId yet, try to recover it from localStorage
  useEffect(() => {
    if (!playerId && roomId) {
      try {
        const cached = localStorage.getItem(`multiplayerPlayer_${roomId}`)
        if (cached) {
          setPlayerId(cached)
        }
      } catch {
        /* ignore SSR / quota errors */
      }
    }
  }, [playerId, roomId])

  // Loading state
  if (isLoading || roomLoading) {
    return (
      <div className="fullscreen-multiplayer">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading multiplayer quiz...</p>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading questions...' : 'Connecting to room...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If no roomId at all we cannot proceed
  if (!roomId) {
    return (
      <div className="fullscreen-multiplayer">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-slate-900 dark:text-white">Invalid Room Link</h1>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                This multiplayer quiz link is missing the room code.
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 text-xs text-left bg-gray-100 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto">{JSON.stringify(searchParams, null, 2)}</pre>
            )}
            <Button onClick={handleBackToHome}>
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If we have the roomId but not playerId yet, show a simple join form

  const handleSelfJoin = async () => {
    if (!joinName.trim()) return
    setIsJoining(true)
    try {
      const result = await (await import('@/lib/multiplayer')).multiplayerOperations.joinRoom({
        roomCode: roomId,
        playerName: joinName.trim(),
        playerEmoji: '😊'
      })

      // joinRoom already caches the playerId in localStorage – update state too
      setPlayerId(result.player.id)
      devLog('Joined room successfully', { playerId: result.player.id })
    } catch (err) {
      console.error('Failed to join room:', err)
      alert('Failed to join room. Please check the code or try again.')
    } finally {
      setIsJoining(false)
    }
  }

  if (!playerId) {
    return (
      <div className="fullscreen-multiplayer">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-slate-900 dark:text-white">Join Room</h1>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                Enter a display name to join room <span className="font-medium">{roomId}</span>.
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
              />
              <Button
                disabled={isJoining || !joinName.trim()}
                onClick={handleSelfJoin}
                className="w-full"
              >
                {isJoining ? 'Joining…' : 'Join Game'}
              </Button>
              <Button variant="outline" onClick={handleBackToHome} className="w-full">
                <Home className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !topic) {
    return (
      <div className="fullscreen-multiplayer">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-light text-slate-900 dark:text-white">Quiz Not Available</h1>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                {error || "The requested quiz could not be loaded. This might be a temporary issue."}
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleBackToHome} 
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white px-8 py-3 rounded-full font-light w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              
              <button 
                onClick={() => window.location.reload()} 
                className="w-full text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm font-light"
              >
                Try reloading the page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show waiting room if game hasn't started
  if (!gameStarted || room?.room_status === 'waiting') {
    return (
      <div className="fullscreen-multiplayer">
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
      </div>
    )
  }

  // Show quiz engine when game is in progress
  if (questions.length > 0 && topic) {
    // Import the multiplayer router dynamically to avoid SSR issues
    const MultiplayerQuizRouter = React.lazy(() => 
      import('@/components/multiplayer/multiplayer-quiz-router').then(module => ({
        default: module.MultiplayerQuizRouter
      }))
    )
    
    const currentTopic = {
      id: topic.topic_id || "",
      title: topic.topic_title || "",
      emoji: topic.emoji || "🎯",
      date: topic.date || new Date().toISOString().split('T')[0],
      dayOfWeek: topic.date ? new Date(topic.date).toLocaleDateString('en-US', { weekday: 'long' }) : "Today"
    }
    
    return (
      <div className="fullscreen-multiplayer">
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          onReset={() => window.location.reload()}
        >
          <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg font-medium">Starting multiplayer quiz...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Room Status: {room?.room_status || 'loading'}
                </p>
              </div>
            </div>
          }>
            <MultiplayerQuizRouter
              questions={questions}
              topicId={topicId}
              roomId={roomId}
              playerId={playerId}
              onComplete={handleQuizComplete}
              currentTopic={currentTopic}
            />
          </React.Suspense>
        </ErrorBoundary>
      </div>
    )
  }

  // Fallback error state
  return (
    <div className="fullscreen-multiplayer">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-light text-slate-900 dark:text-white">Quiz Unavailable</h1>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              This quiz is not ready for multiplayer yet. Please try again later or choose a different quiz.
            </p>
          </div>
          
          <Button 
            onClick={handleBackToHome} 
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white px-8 py-3 rounded-full font-light w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(MultiplayerQuizClient) 