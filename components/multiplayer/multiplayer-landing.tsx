"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Users, Zap, Trophy, Brain, Gamepad2, ArrowRight } from 'lucide-react'
import { GameModeCard, type GameMode } from './game-mode-card'
import { cn } from '@/lib/utils'

// All game modes for interactive gallery
const ALL_GAME_MODES: GameMode[] = [
  {
    id: 'classic',
    name: 'Classic Quiz',
    description: 'Traditional quiz format with detailed explanations after each question',
    emoji: '📚',
    features: ['Detailed explanations', 'Balanced pacing', 'Educational focus'],
    difficulty: 'mixed',
    playerRange: [2, 6],
    estimatedTime: '10-15 min',
    guestAccess: true
  },
  {
    id: 'speed_round',
    name: 'Speed Round',
    description: 'Fast-paced questions for quick thinking and competitive play',
    emoji: '⚡',
    features: ['Quick answers', 'Real-time leaderboard', 'Adrenaline rush'],
    difficulty: 'intermediate',
    playerRange: [2, 8],
    estimatedTime: '5-8 min',
    guestAccess: true
  },
  {
    id: 'matching',
    name: 'Matching Challenge',
    description: 'Collaborative puzzle-solving with team hints and matching gameplay',
    emoji: '🧩',
    features: ['Puzzle solving', 'Team collaboration', 'Strategy bonuses'],
    difficulty: 'mixed',
    playerRange: [2, 6],
    estimatedTime: '12-18 min',
    requiresSignup: true
  },
  {
    id: 'learning_lab',
    name: 'Learning Lab',
    description: 'Collaborative exploration with AI teachers and discussion',
    emoji: '🧪',
    features: ['AI teachers', 'Group discussion', 'Deep learning'],
    difficulty: 'mixed',
    playerRange: [2, 4],
    estimatedTime: '15-20 min',
    isPremium: true
  },
  {
    id: 'elimination',
    name: 'Elimination',
    description: 'Last player standing wins in this high-stakes format',
    emoji: '🏆',
    features: ['High stakes', 'Progressive difficulty', 'Winner takes all'],
    difficulty: 'advanced',
    playerRange: [3, 10],
    estimatedTime: '8-12 min',
    requiresSignup: true
  }
]

interface MultiplayerLandingProps {
  onSignIn: () => void
  onTryMode?: (modeId: string) => void
  joinRoomCode?: string | null
  className?: string
}

export function MultiplayerLanding({ onSignIn, onTryMode, joinRoomCode, className }: MultiplayerLandingProps) {
  const [selectedMode, setSelectedMode] = useState('classic')
  const [demoStep, setDemoStep] = useState(0)
  const [galleryMode, setGalleryMode] = useState('classic')

  // Auto-cycle through demo steps
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep(prev => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const demoSteps = [
    { title: "Choose your game mode", description: "Pick from 5 different ways to learn civics together" },
    { title: "Invite friends or join strangers", description: "Share a room code or join an existing game" },
    { title: "Learn with AI companions", description: "Smart AI players with unique personalities join the fun" },
    { title: "Compete and collaborate", description: "Build civic knowledge through friendly competition" }
  ]

  return (
    <div className={cn("min-h-screen bg-white dark:bg-slate-950", className)}>
      {/* Join Room Banner - Show when someone is trying to join a specific room */}
      {joinRoomCode && (
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium">
              <Users className="h-4 w-4" />
              Room Invitation
            </div>
            <h2 className="text-2xl md:text-3xl font-medium text-blue-900 dark:text-blue-100">
              You've been invited to join room <span className="font-mono bg-white dark:bg-slate-800 px-3 py-1 rounded border">{joinRoomCode}</span>
            </h2>
            <p className="text-blue-700 dark:text-blue-300 max-w-2xl mx-auto">
              Sign in to join your friends in this multiplayer civic learning game.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={onSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium"
              >
                Sign In to Join Room
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  // Allow guests to try creating their own room instead
                  if (onTryMode) {
                    onTryMode('classic')
                  } else {
                    onSignIn()
                  }
                }}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-full font-medium"
              >
                Create Your Own Room
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-6">
            <div className="flex justify-center mb-6">
              <Gamepad2 className="h-12 w-12 md:h-16 md:w-16 text-blue-600" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-light text-slate-900 dark:text-white tracking-tight">
              Learn Democracy
              <span className="block text-slate-600 dark:text-slate-400">Together</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
              Join friends or meet new people in interactive civic knowledge games. 
              Build understanding through competition and collaboration with AI-powered learning companions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => {
                // Default to classic mode for main CTA, since it's guest-friendly
                if (onTryMode) {
                  onTryMode('classic')
                } else {
                  onSignIn()
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium group"
            >
              <Play className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              Start Playing Now
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-0 px-4 py-2 font-mono font-light">
                Free • No signup required
              </Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0 px-4 py-2 font-mono font-light">
                3 games/day as guest
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Access Explanation */}
      <section className="py-12 px-4 bg-blue-50 dark:bg-blue-950/30 border-y border-blue-200 dark:border-blue-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-light text-blue-900 dark:text-blue-100">
            Start Playing Immediately
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl">🎮</span>
              </div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">As a Guest</h3>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 3 games per day</li>
                <li>• Classic & Speed modes</li>
                <li>• Join any room instantly</li>
                <li>• AI opponents included</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl">📝</span>
              </div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">With Sign Up</h3>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Unlimited games</li>
                <li>• All 5 game modes</li>
                <li>• Room history</li>
                <li>• Progress tracking</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl">👑</span>
              </div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Premium</h3>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• AI teacher mode</li>
                <li>• Advanced analytics</li>
                <li>• Custom AI personalities</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
          <p className="text-blue-600 dark:text-blue-400 text-sm max-w-2xl mx-auto">
            No credit card required. Jump into a game in seconds, then decide if you want to unlock more features.
          </p>
        </div>
      </section>

      {/* Demo Flow Section */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white mb-4">
              How it works
            </h2>
            <div className="flex justify-center gap-2 mb-8">
              {demoSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === demoStep ? "bg-blue-600 w-8" : "bg-slate-300 dark:bg-slate-700"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Demo Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-medium text-slate-900 dark:text-white">
                  {demoSteps[demoStep].title}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  {demoSteps[demoStep].description}
                </p>
              </div>

              {demoStep === 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {ALL_GAME_MODES.slice(0, 2).map((mode) => (
                    <GameModeCard
                      key={mode.id}
                      mode={mode}
                      isSelected={selectedMode === mode.id}
                      onSelect={setSelectedMode}
                      isPremium={false}
                      isPro={false}
                      className="opacity-75 pointer-events-none"
                    />
                  ))}
                </div>
              )}

              {demoStep === 1 && (
                <div className="space-y-4">
                  <Card className="opacity-75">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <h4 className="text-lg font-medium">Room Code: DEMO123</h4>
                        <div className="flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            3/6 players
                          </span>
                          <span>Constitutional Rights</span>
                        </div>
                        <Button disabled className="w-full">
                          Join Room
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {demoStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['🤖 The Professor', '🗞️ News Junkie', '👩‍🏫 Retired Teacher', '🎓 College Student'].map((ai, index) => (
                      <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                          <div className="text-2xl mb-2">{ai.split(' ')[0]}</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{ai.split(' ').slice(1).join(' ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {demoStep === 3 && (
                <div className="space-y-4">
                  <Card className="opacity-75">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Live Leaderboard</h4>
                        <div className="space-y-2">
                          {[
                            { name: 'You', score: 850, position: 1 },
                            { name: 'The Professor', score: 820, position: 2 },
                            { name: 'Sarah M.', score: 780, position: 3 },
                            { name: 'News Junkie', score: 760, position: 4 }
                          ].map((player, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700 rounded">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-mono">#{player.position}</span>
                                <span className="text-sm font-medium">{player.name}</span>
                              </div>
                              <span className="text-sm font-mono">{player.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Visual Demo */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                  <div className="text-center space-y-6">
                    <div className="text-4xl">{demoStep === 0 ? '📚' : demoStep === 1 ? '🔗' : demoStep === 2 ? '🤖' : '🏆'}</div>
                    <h4 className="text-xl font-medium text-slate-900 dark:text-white">
                      {demoStep === 0 ? 'Choose Mode' : demoStep === 1 ? 'Share Code' : demoStep === 2 ? 'AI Joins' : 'Compete!'}
                    </h4>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                          style={{ width: `${((demoStep + 1) / 4) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Step {demoStep + 1} of 4
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Game Mode Gallery */}
      <section className="py-16 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white mb-4">
              Choose Your Style
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Five different ways to learn civics together, from quick competitive rounds to deep collaborative exploration.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Mode Selector */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-6">Game Modes</h3>
              {ALL_GAME_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setGalleryMode(mode.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all duration-200 group",
                    galleryMode === mode.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mode.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {mode.name}
                        </h4>
                                                 {mode.isPremium && (
                           <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                             Premium
                           </Badge>
                         )}
                         {mode.requiresSignup && (
                           <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                             Sign Up
                           </Badge>
                         )}
                         {mode.guestAccess && (
                           <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                             Guest OK
                           </Badge>
                         )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 overflow-hidden">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Mode Details */}
            <div className="lg:col-span-2">
              {(() => {
                const currentMode = ALL_GAME_MODES.find(m => m.id === galleryMode) || ALL_GAME_MODES[0]
                return (
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-6">
                      {/* Mode Header */}
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{currentMode.emoji}</div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-medium text-slate-900 dark:text-white">
                              {currentMode.name}
                            </h3>
                                                         {currentMode.isPremium && (
                               <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                 Premium
                               </Badge>
                             )}
                             {currentMode.requiresSignup && (
                               <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                 Sign Up Required
                               </Badge>
                             )}
                             {currentMode.guestAccess && (
                               <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                 Guest Friendly
                               </Badge>
                             )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {currentMode.description}
                          </p>
                        </div>
                      </div>

                      {/* Mode Stats */}
                      <div className="grid grid-cols-3 gap-6 py-4 border-y border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {currentMode.playerRange[0]}-{currentMode.playerRange[1]}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Players</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {currentMode.estimatedTime}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                            {currentMode.difficulty}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Difficulty</div>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Key Features</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {currentMode.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Demo Preview */}
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                        <div className="text-center space-y-4">
                          <div className="text-3xl">{currentMode.emoji}</div>
                          <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                            {currentMode.name} Preview
                          </h4>
                          
                          {/* Mode-specific preview content */}
                          {currentMode.id === 'classic' && (
                            <div className="space-y-3">
                              <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 text-left">
                                <div className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                                  What is the purpose of the Electoral College?
                                </div>
                                <div className="space-y-2">
                                  {['To ensure fair representation', 'To speed up elections', 'To prevent foreign interference', 'To limit voter turnout'].map((option, i) => (
                                    <div key={i} className="text-xs text-slate-600 dark:text-slate-400 py-1 px-2 bg-white dark:bg-slate-700 rounded border">
                                      {String.fromCharCode(65 + i)}. {option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-500">
                                Detailed explanations follow each question
                              </div>
                            </div>
                          )}

                          {currentMode.id === 'speed_round' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-center gap-2 text-2xl font-mono">
                                <span className="text-red-500">00:15</span>
                                <span className="text-slate-400">⏱️</span>
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Quick-fire questions with live leaderboard
                              </div>
                            </div>
                          )}

                          {currentMode.id === 'matching' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                                  Supreme Court
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-200 dark:border-green-800">
                                  Judicial Branch
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                                  Congress
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                                  Legislative Branch
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-500">
                                Match concepts collaboratively
                              </div>
                            </div>
                          )}

                          {currentMode.id === 'learning_lab' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                  <span className="text-sm">🤖</span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  AI Teacher joins discussion
                                </div>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 text-xs text-left">
                                "Let's explore how this amendment has been interpreted differently over time..."
                              </div>
                            </div>
                          )}

                          {currentMode.id === 'elimination' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <Trophy className="h-6 w-6 text-yellow-500" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  Last Player Standing
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-500">
                                Progressive difficulty • High stakes
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="text-center pt-4">
                                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                if (currentMode.guestAccess && onTryMode) {
                  onTryMode(currentMode.id)
                } else {
                  onSignIn()
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
            >
              {currentMode.guestAccess ? 'Play Now' : 'Try'} {currentMode.name}
            </Button>
            {(currentMode.requiresSignup || currentMode.isPremium) && (
              <p className="text-xs text-slate-500 dark:text-slate-500 self-center">
                {currentMode.isPremium ? 'Premium required' : 'Sign up required'}
              </p>
            )}
            {currentMode.guestAccess && (
              <p className="text-xs text-green-600 dark:text-green-400 self-center">
                ✓ No signup required
              </p>
            )}
          </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white mb-4">
              Why multiplayer civics works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Learning democracy shouldn't be a solo activity. Real civic engagement happens in groups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: "Social Learning",
                description: "Discuss, debate, and learn from different perspectives in real-time"
              },
              {
                icon: <Brain className="h-8 w-8" />,
                title: "AI Companions",
                description: "Smart AI players with unique civic personalities and knowledge levels"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Multiple Formats",
                description: "From quick speed rounds to deep collaborative exploration"
              },
              {
                icon: <Trophy className="h-8 w-8" />,
                title: "Friendly Competition",
                description: "Gamified learning that makes civic education engaging and memorable"
              },
              {
                icon: <Play className="h-8 w-8" />,
                title: "Instant Play",
                description: "No downloads, no setup. Share a code and start learning together"
              },
              {
                icon: <ArrowRight className="h-8 w-8" />,
                title: "Real Impact",
                description: "Build the civic knowledge needed for effective democratic participation"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <CardHeader>
                  <div className="text-blue-600 mb-2">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white">
            Ready to learn democracy together?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Join thousands of Americans building civic knowledge through collaborative gameplay.
          </p>
          <Button
            size="lg"
            onClick={() => {
              // Default to classic mode for final CTA
              if (onTryMode) {
                onTryMode('classic')
              } else {
                onSignIn()
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium group"
          >
            <Play className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
            Start Your First Game
          </Button>
        </div>
      </section>
    </div>
  )
} 