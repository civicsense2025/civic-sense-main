"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  CheckCircle,
  ArrowRight,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Self-contained Real-time News Demo
// Move constants outside component to prevent re-creation on every render
const REAL_TIME_PHASES = [
  {
    title: "Breaking News Detected",
    icon: "📡",
    color: "text-blue-600",
    bgColor: "bg-blue-50/80 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-700",
    messages: [
      "🚨 Supreme Court drops voting rights bombshell...",
      "📰 Scanning 847 news sources for hot takes...",
      "🔍 Separating actual news from Twitter drama..."
    ]
  },
  {
    title: "AI Processing Reality",
    icon: "🧠",
    color: "text-purple-600",
    bgColor: "bg-purple-50/80 dark:bg-purple-900/30",
    borderColor: "border-purple-200 dark:border-purple-700",
    messages: [
      "🤖 Teaching AI the difference between 'should' and 'actually happens'...",
      "⚡ Converting politician-speak into human language...",
      "🎯 Finding the uncomfortable truths they don't want you to know..."
    ]
  },
  {
    title: "Content Generation",
    icon: "⚗️",
    color: "text-green-600", 
    bgColor: "bg-green-50/80 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-700",
    messages: [
      "📝 Writing quiz questions that actually matter...",
      "💡 Creating discussion points that spark action...",
      "🎲 Building glossary terms politicians hate..."
    ]
  },
  {
    title: "Ready to Deploy",
    icon: "🚀",
    color: "text-orange-600",
    bgColor: "bg-orange-50/80 dark:bg-orange-900/30", 
    borderColor: "border-orange-200 dark:border-orange-700",
    messages: [
      "✨ Content weaponized for democracy!",
      "🎯 Ready to educate some citizens...",
      "💪 Democracy just got stronger!"
    ]
  }
] as const

const CONTENT_TYPES = [
  { type: "Quiz Questions", count: 6, icon: "❓", status: "generated" },
  { type: "Key Insights", count: 4, icon: "💡", status: "generated" },
  { type: "Action Steps", count: 3, icon: "🎯", status: "generated" },
  { type: "Glossary Terms", count: 8, icon: "📚", status: "generated" }
] as const

function RealTimeNewsDemo() {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<string[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setPhase(p => {
            const nextPhase = (p + 1) % REAL_TIME_PHASES.length
            if (nextPhase === 0) {
              setGeneratedContent([])
            }
            return nextPhase
          })
          setCurrentMessage(0)
          return 0
        }
                return prev + 2
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress > 0 && progress % 33 === 0) {
      setCurrentMessage(prev => (prev + 1) % REAL_TIME_PHASES[phase].messages.length)
    }
  }, [progress, phase])

  useEffect(() => {
    if (phase === 3 && progress > 50) {
      // Simulate content being generated in final phase
      const timer = setTimeout(() => {
        setGeneratedContent(prev => {
          if (prev.length < CONTENT_TYPES.length) {
            return [...prev, CONTENT_TYPES[prev.length].type]
          }
          return prev
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [phase, progress, generatedContent])

  const currentPhase = REAL_TIME_PHASES[phase]

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-800/30 rounded-3xl blur-xl"></div>
      <Card className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-0 shadow-2xl shadow-slate-500/10 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="text-lg font-light text-slate-900 dark:text-white mb-2">
                Supreme Court Rules on Voting Rights
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Breaking news → Actionable civic education in real-time
              </div>
            </div>

            {/* Current Phase Display */}
            <div className={cn(
              "p-6 rounded-2xl transition-all duration-500 border-2",
              currentPhase.bgColor,
              currentPhase.borderColor
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl animate-pulse">
                  {currentPhase.icon}
                </div>
                <div>
                  <h3 className={cn("font-semibold text-lg", currentPhase.color)}>
                    {currentPhase.title}
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {currentPhase.messages[currentMessage]}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 rounded-full" />
              </div>
            </div>

            {/* Generated Content Preview (only in final phase) */}
            {phase === 3 && generatedContent.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h4 className="font-medium text-slate-900 dark:text-white text-center">
                  📦 Content Generated
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {CONTENT_TYPES.map((item, index) => (
                    <motion.div
                      key={item.type}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: generatedContent.includes(item.type) ? 1 : 0.3,
                        scale: generatedContent.includes(item.type) ? 1 : 0.9
                      }}
                      transition={{ delay: index * 0.2 }}
                      className={cn(
                        "p-3 rounded-xl border transition-all duration-300",
                        generatedContent.includes(item.type)
                          ? "bg-green-50/80 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                          : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.type}
                          </div>
                          <div className="text-xs text-slate-500">
                            {generatedContent.includes(item.type) ? `${item.count} created` : 'Pending...'}
                          </div>
                        </div>
                        {generatedContent.includes(item.type) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phase Indicators */}
            <div className="flex justify-center gap-2">
              {REAL_TIME_PHASES.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === phase 
                      ? "bg-blue-500 scale-125" 
                      : index < phase 
                        ? "bg-green-500" 
                        : "bg-slate-300 dark:bg-slate-600"
                  )}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Self-contained Multiplayer Demo
function MultiplayerDemo() {
  interface Player {
    name: string
    score: number
    isAnswering: boolean
    emoji: string
    xpGain: number | null
  }

  const [players, setPlayers] = useState<Player[]>([
    { name: "Alex", score: 450, isAnswering: false, emoji: "👨‍💼", xpGain: null },
    { name: "Sarah", score: 380, isAnswering: false, emoji: "👩‍🎓", xpGain: null },
    { name: "You", score: 520, isAnswering: false, emoji: "🧑‍💻", xpGain: null }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prev => prev.map(player => {
        const shouldAnswer = Math.random() > 0.7
        const xpGain = shouldAnswer ? Math.floor(Math.random() * 100) + 10 : null
        return {
          ...player,
          isAnswering: shouldAnswer,
          score: player.score + (xpGain || 0),
          xpGain: xpGain
        }
      }))
      
      // Clear XP gains after showing them
      setTimeout(() => {
        setPlayers(prev => prev.map(player => ({ ...player, xpGain: null })))
      }, 2500)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-800/30 rounded-3xl blur-xl"></div>
      <Card className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-0 shadow-2xl shadow-slate-500/10 rounded-3xl overflow-hidden">
        <CardContent className="p-10">
          <div className="space-y-8">
            <div className="font-light text-lg text-slate-900 dark:text-white">Constitutional Rights Battle</div>
            <div className="space-y-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.name}
                  className={cn(
                    "flex items-center justify-between p-5 rounded-2xl transition-all duration-300",
                    player.isAnswering 
                      ? "bg-blue-50/80 dark:bg-blue-900/30 shadow-xl shadow-blue-500/20" 
                      : "bg-slate-50/80 dark:bg-slate-800/80 shadow-lg"
                  )}
                  animate={{ 
                    scale: player.isAnswering ? 1.02 : 1,
                    y: player.isAnswering ? -2 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-2xl bg-white dark:bg-slate-800">
                      {player.emoji}
                    </div>
                    <span className="font-light text-lg text-slate-800 dark:text-slate-200">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-light text-xl text-slate-700 dark:text-slate-300">{player.score} XP</span>
                      {player.xpGain && (
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.8 }}
                          transition={{ duration: 2.0 }}
                          className="text-green-400 font-bold text-lg bg-green-900/20 px-2 py-1 rounded-md border border-green-400/30"
                        >
                          +{player.xpGain}
                        </motion.div>
                      )}
                    </div>
                    {player.isAnswering && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Self-contained Before/After Civics Comparison with Drag Slider
function CivicsBeforeAfterSlider() {
  const [dragPosition, setDragPosition] = useState(50) // Percentage from left
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setDragPosition(percentage)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const [currentExample, setCurrentExample] = useState(0)

  const examples = [
    {
      before: {
        title: "Traditional Civics",
        subtitle: "What textbooks say",
        question: "How does government surveillance work in America?",
        answer: "The government can only monitor citizens with proper warrants from judges, and the Fourth Amendment protects against unreasonable searches",
        bgColor: "bg-slate-50",
        textColor: "text-slate-600",
        icon: "🏫"
      },
      after: {
        title: "The Actual Reality", 
        subtitle: "What's happening right now",
        question: "How does government surveillance actually work in America?",
        answer: "Over 2,200 law enforcement agencies use Clearview AI to scan 50+ billion photos without warrants. Palantir has $1.2B in contracts making NSA surveillance 'user-friendly' while VP Vance's backer Peter Thiel runs the company",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        icon: "🚨",
        actionStep: "Senator Ron Wyden calls this 'using credit cards to end-run the Fourth Amendment'—contact his office to demand surveillance reform"
      }
    },
    {
      before: {
        title: "Traditional Civics",
        subtitle: "What textbooks say",
        question: "How do prescription drug prices get set?",
        answer: "The free market determines drug prices based on supply and demand, with some government programs helping people afford medications",
        bgColor: "bg-slate-50",
        textColor: "text-slate-600",
        icon: "🏫"
      },
      after: {
        title: "The Actual Reality",
        subtitle: "What's happening right now", 
        question: "How do prescription drug prices actually get set?",
        answer: "Pharmaceutical companies get 20-year monopolies through patents, then charge whatever they want. Insulin costs $3 to make but sells for $300. Meanwhile, pharma spends $374M annually lobbying Congress—more than oil and gas combined",
        bgColor: "bg-red-50",
        textColor: "text-red-700", 
        icon: "🚨",
        actionStep: "Senator Bernie Sanders chairs the Health Committee and is pushing Medicare price negotiation—call your senators to support expanding it beyond 10 drugs"
      }
    },
    {
      before: {
        title: "Traditional Civics", 
        subtitle: "What textbooks say",
        question: "How does housing policy work in America?",
        answer: "Local communities make zoning decisions to ensure orderly development and protect property values for homeowners",
        bgColor: "bg-slate-50",
        textColor: "text-slate-600",
        icon: "🏫"
      },
      after: {
        title: "The Actual Reality",
        subtitle: "What's happening right now",
        question: "How does housing policy actually work in America?", 
        answer: "Wealthy homeowners use zoning laws to block apartment construction, driving up their property values while making housing unaffordable for everyone else. In San Francisco, zoning bans apartments on 80% of residential land despite a housing crisis",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        icon: "🚨", 
        actionStep: "Attend your next city council meeting—zoning decisions are made locally, and developers often show up while renters don't. Your voice can override NIMBY opposition"
      }
    }
  ]

  const beforeContent = examples[currentExample].before
  const afterContent = examples[currentExample].after

  // Auto-cycle through examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length)
    }, 8000) // Change example every 8 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-800/30 rounded-3xl blur-xl"></div>
      <Card className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-0 shadow-2xl shadow-slate-500/10 rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {/* Fixed Height Container to Prevent Layout Shift */}
          <div 
            ref={containerRef}
            className="relative h-96 cursor-col-resize select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Before Side (Left) */}
            <div 
              className={cn(
                "absolute inset-0 p-8 transition-all duration-200",
                beforeContent.bgColor,
                "dark:bg-slate-800/50"
              )}
              style={{
                clipPath: `polygon(0 0, ${dragPosition}% 0, ${dragPosition}% 100%, 0 100%)`
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span className="text-lg">{beforeContent.icon}</span>
                  {beforeContent.title}
                </div>
                <div className="text-xs text-slate-400 mb-4">
                  {beforeContent.subtitle}
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                  {beforeContent.question}
                </h3>
                <div className="p-4 bg-white/80 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className={cn("text-sm", beforeContent.textColor, "dark:text-slate-300")}>
                    {beforeContent.answer}
                  </p>
                </div>
              </div>
            </div>

            {/* After Side (Right) */}
            <div 
              className={cn(
                "absolute inset-0 p-8 transition-all duration-200",
                afterContent.bgColor,
                "dark:bg-red-950/30"
              )}
              style={{
                clipPath: `polygon(${dragPosition}% 0, 100% 0, 100% 100%, ${dragPosition}% 100%)`
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <span className="text-lg">{afterContent.icon}</span>
                  {afterContent.title}
                </div>
                <div className="text-xs text-red-500 mb-4">
                  {afterContent.subtitle}
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                  {afterContent.question}
                </h3>
                <div className="p-4 bg-red-100/80 dark:bg-red-900/50 rounded-xl border border-red-200 dark:border-red-600">
                  <p className={cn("text-sm", afterContent.textColor, "dark:text-red-300 font-medium")}>
                    {afterContent.answer}
                  </p>
                </div>
                {afterContent.actionStep && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 text-sm">💡</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>What you can do:</strong> {afterContent.actionStep}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drag Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10 flex items-center justify-center"
              style={{ left: `${dragPosition}%`, transform: 'translateX(-50%)' }}
              onMouseDown={handleMouseDown}
            >
              <div className="w-8 h-8 bg-white rounded-full shadow-xl border-2 border-slate-200 flex items-center justify-center hover:scale-110 transition-transform">
                <div className="w-1 h-4 bg-slate-400 rounded-full mx-0.5"></div>
                <div className="w-1 h-4 bg-slate-400 rounded-full mx-0.5"></div>
              </div>
            </div>

            {/* Example Indicators */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {examples.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentExample(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentExample 
                      ? "bg-blue-500 scale-125" 
                      : "bg-white/50 hover:bg-white/75"
                  )}
                />
              ))}
            </div>

            {/* Instruction Text */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/75 text-white text-xs px-3 py-1 rounded-full">
                Drag to compare • {currentExample + 1} of {examples.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function FeaturesShowcase() {
  return (
    <section className="py-32 sm:py-40 lg:py-48 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-slate-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        
        {/* Header */}
        <div className="text-center mb-32 lg:mb-40">
          <motion.h2 
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extralight text-slate-900 dark:text-white mb-10 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            We decode the news
            <br />
            <span className="text-blue-600 font-light">
              in real-time
            </span>
          </motion.h2>
          <motion.p 
            className="text-2xl lg:text-3xl text-slate-500 dark:text-slate-400 font-extralight leading-relaxed max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            No one has time for traditional civics education when democracy changes rapidly every day. We turn breaking news into learning moments within minutes.
          </motion.p>
        </div>

        {/* Features */}
        <div className="space-y-40 lg:space-y-56">
          
          {/* Real-time News */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚡️</span>
                </div>
                <h3 className="text-4xl lg:text-5xl font-extralight text-slate-900 dark:text-white leading-tight">
                  News → Knowledge
                </h3>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Build civic knowledge doing what you already do—reading the news. Just 10-15 minutes per day turns your daily news habit into deep understanding of how power actually works. <a href="/topics" className="text-blue-600 hover:text-blue-700 underline">See our daily topics</a>.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">⚡</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">2-4 minutes</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">per topic</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🧠</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">AI-powered</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">analysis</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <RealTimeNewsDemo />
            </div>
          </motion.div>

          {/* Multiplayer Learning */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="lg:order-2 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-4xl lg:text-5xl font-extralight text-slate-900 dark:text-white leading-tight">
                  Multiplayer Learning
                </h3>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Democracy isn't a spectator sport, and neither is learning about it. Battle friends in real-time civic knowledge duels and see who really understands how power flows in American government.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">👥</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Up to 8 players</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">real-time battles</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Live leaderboards</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">instant rankings</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:order-1">
              <MultiplayerDemo />
            </div>
          </motion.div>

          {/* Uncomfortable Truths */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-4xl lg:text-5xl font-extralight text-slate-900 dark:text-white leading-tight">
                  How It Actually Works
                </h3>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Compare textbook civics with how power actually works. Drag to see the difference between what they teach and what really happens—then learn what you can do about it.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🚨</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Uncomfortable truths</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">not comfortable lies</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Actionable steps</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">to make real change</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <CivicsBeforeAfterSlider />
            </div>
          </motion.div>

        </div>

        {/* Theory of Change Section */}
        <motion.div 
          className="mt-32 lg:mt-40 pt-16 border-t border-slate-200/50 dark:border-slate-700/50"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-20">
            <h3 className="text-4xl lg:text-5xl font-extralight text-slate-900 dark:text-white mb-6 leading-tight">
              Our approach to
              <br />
              <span className="text-blue-600">civics</span>
            </h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-4xl mx-auto">
              Traditional civics fails because it separates learning from reality. We ground every concept in what's happening right now.
            </p>
          </div>

          {/* Theory Points - Left-Aligned with Staggered Animation */}
          <div className="space-y-16 lg:space-y-20 mb-20">
            
            {/* Point 1: Experiential Learning */}
            <motion.div 
              className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16"
              initial={{ opacity: 0, x: -60, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.1 
              }}
            >
              <motion.div 
                className="flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/10">
                  <span className="text-3xl lg:text-4xl">🧠</span>
                </div>
              </motion.div>
              <motion.div 
                className="flex-grow"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <h4 className="text-2xl lg:text-3xl font-medium text-slate-900 dark:text-white mb-4">
                  Experiential Learning Works
                </h4>
                <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  The Learning Pyramid shows <strong><a href="https://www.ferris.edu/university-college/firstgen/student-handbook/howtoretain90.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2">people retain 90% when they teach others or apply learning immediately</a></strong>, compared to just 5% from lectures. Abstract civics lessons fade—but understanding <em>why</em> Palantir got $1.2B while your school lacks funding? That sticks forever.
                </p>
              </motion.div>
            </motion.div>

            {/* Point 2: Critical Thinking */}
            <motion.div 
              className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16"
              initial={{ opacity: 0, x: -60, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 
              }}
            >
              <motion.div 
                className="flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center shadow-xl shadow-red-500/10">
                  <span className="text-3xl lg:text-4xl">🎯</span>
                </div>
              </motion.div>
              <motion.div 
                className="flex-grow"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <h4 className="text-2xl lg:text-3xl font-medium text-slate-900 dark:text-white mb-4">
                  Critical Thinking Through Contrast
                </h4>
                <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  Meta-analyses in STEM show <a href="https://www.pnas.org/doi/10.1073/pnas.1319030111" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2">active learning significantly boosts performance and critical thinking</a> compared to passive lectures. When students compare "how it's supposed to work" with "how it actually works," they develop sophisticated analytical skills. The gap between constitutional theory and surveillance reality? That's where critical thinking emerges.
                </p>
              </motion.div>
            </motion.div>

            {/* Point 3: Current Events */}
            <motion.div 
              className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16"
              initial={{ opacity: 0, x: -60, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.2 
              }}
            >
              <motion.div 
                className="flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/10">
                  <span className="text-3xl lg:text-4xl">⚡</span>
                </div>
              </motion.div>
              <motion.div 
                className="flex-grow"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <h4 className="text-2xl lg:text-3xl font-medium text-slate-900 dark:text-white mb-4">
                  Current Events = Immediate Relevance
                </h4>
                <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  Brookings research shows <a href="https://www.brookings.edu/articles/the-need-for-civic-education-in-21st-century-schools/" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2">engaging students in current events builds civic knowledge and media literacy</a>. Students care about today's Supreme Court decisions affecting their student loans—not 1803's Marbury v. Madison.
                </p>
              </motion.div>
            </motion.div>

            {/* Point 4: Democratic Participation */}
            <motion.div 
              className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16"
              initial={{ opacity: 0, x: -60, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.3 
              }}
            >
              <motion.div 
                className="flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/10">
                  <span className="text-3xl lg:text-4xl">🏛️</span>
                </div>
              </motion.div>
              <motion.div 
                className="flex-grow"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <h4 className="text-2xl lg:text-3xl font-medium text-slate-900 dark:text-white mb-4">
                  Democracy Needs Active Citizens
                </h4>
                <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  A CIRCLE/Carnegie report found <a href="https://circle.tufts.edu/sites/default/files/2020-01/all_together_now_commission_report_2013.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2">less than 10% of 18-24-year-olds met informed engagement standards</a>, with discussing controversial issues and community involvement strongly correlating with better civic outcomes. Meanwhile, <a href="https://www.uschamberfoundation.org/civics/new-study-finds-alarming-lack-of-civic-literacy-among-americans" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2">70% of Americans fail basic civic literacy tests</a> and many are <a href="https://www.pewresearch.org/politics/2024/01/09/tuning-out-americans-on-the-edge-of-politics/" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2">"tuning out" politics entirely</a> due to information overload. Passive civics creates passive citizens. We build confidence to engage power structures by showing exactly how influence flows and where pressure points exist.
                </p>
              </motion.div>
            </motion.div>

          </div>

          {/* Academic Citations */}
          <motion.div 
            className="mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="bg-slate-50/30 dark:bg-slate-800/30 rounded-2xl p-6 lg:p-8 border border-slate-200/50 dark:border-slate-700/50">
              <h5 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📚</span>
                Research Citations
              </h5>
              
              <div className="space-y-4">
                {/* Learning Pyramid Accordion */}
                <details className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group overflow-hidden">
                  <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 ease-out list-none">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📊</span>
                      <span>Learning Pyramid Research: 90% Retention Through Teaching Others</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 transition-transform duration-300 ease-out group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="accordion-content group-open:animate-accordion-down group-closed:animate-accordion-up px-4 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <strong>Source:</strong> National Training Laboratories. <em>Learning Pyramid: How to Retain 90% of Everything You Learn</em>. Ferris State University. 
                      <a href="https://www.ferris.edu/university-college/firstgen/student-handbook/howtoretain90.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2 ml-1">PDF</a>
                    </p>
                    
                    <div className="text-slate-700 dark:text-slate-300 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Scope</h4>
                        <p>National Training Laboratories tested whether people actually retain information from lectures, textbooks, videos, discussions, practice, and teaching others. Spoiler: lectures are nearly useless.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Findings</h4>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>Lectures: 5% retention</strong> (basically worthless)</li>
                          <li><strong>Reading: 10% retention</strong> (slightly better than worthless)</li>
                          <li><strong>Videos: 20% retention</strong> (YouTube isn't saving education)</li>
                          <li><strong>Demonstrations: 30% retention</strong> (show, don't just tell)</li>
                          <li><strong>Discussions: 50% retention</strong> (talking works)</li>
                          <li><strong>Practice: 75% retention</strong> (doing beats watching)</li>
                          <li><strong>Teaching others: 90% retention</strong> (the winner by a landslide)</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bottom Line</h4>
                        <p>Want proof? Ask someone to explain why Palantir gets $1.2 billion while schools lack textbooks. Or why insulin costs $3 to make but sells for $300. They'll remember those specific numbers and companies forever because the injustice burns into memory. Abstract constitutional principles? Gone by Thursday.</p>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Freeman PNAS Study Accordion */}
                <details className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group overflow-hidden">
                  <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 ease-out list-none">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🧪</span>
                      <span>PNAS Study: Active Learning Beats Lectures</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 transition-transform duration-300 ease-out group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="accordion-content group-open:animate-accordion-down group-closed:animate-accordion-up px-4 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <strong>Source:</strong> Freeman, S., et al. (2014). Active learning increases student performance in science, engineering, and mathematics. <em>PNAS</em>, 111(23), 8410-8415. 
                      <a href="https://www.pnas.org/doi/10.1073/pnas.1319030111" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2 ml-1">DOI</a>
                    </p>
                    
                    <div className="text-slate-700 dark:text-slate-300 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Scope</h4>
                        <p>Freeman and his team didn't just study a few classes—they analyzed 225 separate studies covering 158,000 students. They wanted to settle the debate: do lectures work, or is that just what professors tell themselves?</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Findings</h4>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Test scores improved by 6% with active learning</li>
                          <li>Students were <strong>1.5 times more likely to fail</strong> in lecture-only classes</li>
                          <li>Failure rates dropped from 34% to 22% with active learning</li>
                          <li>This worked across all science subjects and class sizes</li>
                          <li>Average students jumped from C grades to B grades</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bottom Line</h4>
                        <p>Students who see the gap between "checks and balances" theory and Clearview AI's warrant-free facial recognition don't just get smarter—they get angry. And angry citizens who understand exactly how power flows are the ones politicians actually fear.</p>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Brookings Current Events Study Accordion */}
                <details className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group overflow-hidden">
                  <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 ease-out list-none">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📰</span>
                      <span>Brookings Research: People Care About Today's News, Not Ancient History</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 transition-transform duration-300 ease-out group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="accordion-content group-open:animate-accordion-down group-closed:animate-accordion-up px-4 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <strong>Source:</strong> Brookings Institution. (2020). The need for civic education in 21st-century schools. 
                      <a href="https://www.brookings.edu/articles/the-need-for-civic-education-in-21st-century-schools/" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2 ml-1">Report</a>
                    </p>
                    
                    <div className="text-slate-700 dark:text-slate-300 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Scope</h4>
                        <p>Brookings researchers had a problem: civics classes were putting students to sleep while democracy crumbled around them. They investigated whether connecting classroom theory to breaking news could wake people up.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Findings</h4>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>People pay attention when they learn about today's Supreme Court cases that affect their student loans, medical bills, or housing costs</li>
                          <li>People get bored learning about Marbury v. Madison from 1803</li>
                          <li>When people discuss current events, they naturally develop media literacy skills</li>
                          <li>All 50 states now require current events discussions in civics classes</li>
                          <li>People learn better when civics connects to their daily lives—like understanding why gas prices rise when certain politicians make energy policy decisions</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bottom Line</h4>
                        <p>Try teaching Marbury v. Madison to someone getting evicted. Now explain how today's Supreme Court just ruled on student loan forgiveness that affects their $800 monthly payment. Which lesson sticks? Which one makes them vote?</p>
                      </div>
                    </div>
                  </div>
                </details>

                {/* CIRCLE Youth Engagement Accordion */}
                <details className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group overflow-hidden">
                  <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 ease-out list-none">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🗳️</span>
                      <span>CIRCLE Research: 90% of Young Adults Fail Basic Civic Standards</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 transition-transform duration-300 ease-out group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="accordion-content group-open:animate-accordion-down group-closed:animate-accordion-up px-4 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <strong>Source:</strong> CIRCLE & Carnegie Corporation. (2013). <em>All Together Now: Collaboration and Innovation for Youth Engagement</em>. Tufts University. 
                      <a href="https://circle.tufts.edu/sites/default/files/2020-01/all_together_now_commission_report_2013.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2 ml-1">PDF</a>
                    </p>
                    
                    <div className="text-slate-700 dark:text-slate-300 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Scope</h4>
                        <p>CIRCLE researchers faced a disturbing question: if democracy depends on informed citizens, what happens when citizens know nothing? They tested 18-24 year-olds on basic civic knowledge and participation. The results should terrify you.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Findings</h4>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Only 10% of young adults know enough about government to participate effectively</li>
                          <li>Students who discuss controversial topics get more involved in democracy</li>
                          <li>Young people who do community work are more likely to vote and stay engaged</li>
                          <li>Students from poor families, rural areas, and minority communities benefit most from good civics education</li>
                          <li>Most civics classes are failing to prepare students for real-world participation</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bottom Line</h4>
                        <p>90% of Americans can't identify which party controls their state legislature, but they know every Marvel character's backstory. They vote for candidates who promise healthcare reform while pharma companies spend $374 million annually to prevent it. Ignorance isn't bliss—it's expensive.</p>
                      </div>
                    </div>
                  </div>
                </details>

                {/* US Chamber Foundation Study Accordion */}
                <details className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group overflow-hidden">
                  <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 ease-out list-none">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🚨</span>
                      <span>US Chamber Foundation: 7 Out of 10 Americans Fail Basic Civics Test</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 transition-transform duration-300 ease-out group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="accordion-content group-open:animate-accordion-down group-closed:animate-accordion-up px-4 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <strong>Source:</strong> U.S. Chamber of Commerce Foundation. (2024). New study finds alarming lack of civic literacy among Americans. 
                      <a href="https://www.uschamberfoundation.org/civics/new-study-finds-alarming-lack-of-civic-literacy-among-americans" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2 ml-1">Report</a>
                    </p>
                    
                    <div className="text-slate-700 dark:text-slate-300 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Scope</h4>
                        <p>The Chamber wanted to know: how ignorant are American voters? They gave 2,000 registered voters a middle school civics test. These are people who actually show up to vote. The results explain a lot about American politics.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Findings</h4>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>70% failed the basic civics quiz</strong></li>
                          <li>Only half knew which branch of government makes laws (it's Congress)</li>
                          <li>One-third didn't know there are three branches of government</li>
                          <li>More than half couldn't say how many House Representatives there are (435)</li>
                          <li>Only 1 in 4 felt confident explaining how government actually works</li>
                          <li>Most parents think today's kids aren't prepared to be informed citizens</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bottom Line</h4>
                        <p>Registered voters who can't name their representatives are making decisions that affect nuclear weapons, climate policy, and your tax rate. Meanwhile, registered nurses must pass 200+ hours of continuing education to keep their licenses. We test people to drive cars but not to choose presidents.</p>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Pew Research Tuning Out Study Accordion */}
                <details className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group overflow-hidden">
                  <summary className="cursor-pointer p-4 flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 ease-out list-none">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📺</span>
                      <span>Pew Research: Americans Are Tuning Out Politics to Protect Their Mental Health</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 transition-transform duration-300 ease-out group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="accordion-content group-open:animate-accordion-down group-closed:animate-accordion-up px-4 pb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <strong>Source:</strong> Pew Research Center. (2024). Tuning out: Americans on the edge of politics. 
                      <a href="https://www.pewresearch.org/politics/2024/01/09/tuning-out-americans-on-the-edge-of-politics/" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 underline decoration-dotted decoration-slate-400 underline-offset-2 ml-1">Study</a>
                    </p>
                    
                    <div className="text-slate-700 dark:text-slate-300 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Scope</h4>
                        <p>Pew discovered something alarming: voters were actively avoiding political information to protect their mental health. These aren't apathetic people—they're overwhelmed people. What's driving citizens to tune out exactly when they need to tune in?</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Findings</h4>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>Information overload:</strong> "You can't escape it... politics is everywhere"</li>
                          <li><strong>Mental health protection:</strong> "It can really affect your mental health"</li>
                          <li><strong>Feeling powerless:</strong> "I'm not one of the important people"</li>
                          <li><strong>Too much negativity:</strong> "Too much fighting, not enough getting things done"</li>
                          <li><strong>Bad choices:</strong> "You're forced to pick between the lesser of two evils"</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Bottom Line</h4>
                        <p>Political exhaustion is a feature, not a bug. Overwhelmed citizens disengage, leaving decisions to those who profit from confusion. When people say "I can't keep up with politics," they're admitting defeat to a system designed to wear them down. Clarity is resistance.</p>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
              
              <p className="text-xs pt-4 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <em>Citations formatted according to <a href="https://guides.lib.umich.edu/c.php?g=282964&p=3285995" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline decoration-dotted decoration-slate-400 underline-offset-2">academic standards</a> for data and research sources.</em>
              </p>
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <div className="text-center">
            <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl p-8 lg:p-12 border border-slate-200/50 dark:border-slate-700/50">
              <h4 className="text-2xl lg:text-3xl font-extralight text-slate-900 dark:text-white mb-6 leading-relaxed">
                Ready to learn civics that politicians
                <br />
                don't want you to have?
              </h4>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                Join thousands building real civic knowledge through current events, uncomfortable truths, and actionable insights.
              </p>
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-2xl text-xl font-light shadow-2xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                <Play className="h-6 w-6 mr-3" />
                Start Learning
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
} 