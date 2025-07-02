"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@civicsense/shared/lib/utils"
import { 
  CheckCircle,
  ArrowRight,
  Play
} from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Progress } from "../ui/progress"

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

  // Single effect with ref to prevent dependency issues
  const phaseRef = useRef(phase)
  const progressRef = useRef(progress)
  const generatedContentRef = useRef(generatedContent)
  
  useEffect(() => {
    phaseRef.current = phase
    progressRef.current = progress
    generatedContentRef.current = generatedContent
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev >= 100 ? 0 : prev + 2
        
        // Handle phase transitions
        if (prev >= 100) {
          setPhase(p => {
            const nextPhase = (p + 1) % REAL_TIME_PHASES.length
            if (nextPhase === 0) {
              setGeneratedContent([])
            }
            return nextPhase
          })
          setCurrentMessage(0)
        }
        
        // Handle message cycling (less frequently)
        else if (newProgress > 0 && newProgress % 33 === 0) {
          setCurrentMessage(prev => (prev + 1) % REAL_TIME_PHASES[phaseRef.current].messages.length)
        }
        
        return newProgress
      })
    }, 300) // Slower interval to reduce updates
    
    return () => clearInterval(interval)
  }, [])

  // Separate effect for content generation with better debouncing
  useEffect(() => {
    if (phase === 3 && progress > 50 && generatedContent.length < CONTENT_TYPES.length) {
      const timer = setTimeout(() => {
        setGeneratedContent(prev => {
          if (prev.length < CONTENT_TYPES.length) {
            return [...prev, CONTENT_TYPES[prev.length].type]
          }
          return prev
        })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [phase, progress]) // Removed generatedContent from dependencies to prevent loops

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
        // Reduce animation frequency to prevent excessive updates
        const shouldAnswer = Math.random() > 0.8 // Less frequent
        const xpGain = shouldAnswer ? Math.floor(Math.random() * 50) + 10 : null
        return {
          ...player,
          isAnswering: shouldAnswer,
          score: player.score + (xpGain || 0),
          xpGain: xpGain
        }
      }))
    }, 4000) // Slower interval
    
    // Use separate timeout for clearing XP gains
    const clearXpInterval = setInterval(() => {
      setPlayers(prev => prev.map(player => ({ ...player, xpGain: null })))
    }, 6000) // Clear XP gains every 6 seconds
    
    return () => {
      clearInterval(interval)
      clearInterval(clearXpInterval)
    }
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
                          className="text-yellow-900 dark:text-yellow-100 font-bold text-sm bg-yellow-400 px-2 py-0.5 rounded-lg border border-yellow-500/50 shadow-sm"
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

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  // Throttle drag updates to prevent excessive re-renders
  const lastDragUpdate = useRef(0)
  const DRAG_THROTTLE = 16 // ~60fps

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const now = Date.now()
    if (now - lastDragUpdate.current < DRAG_THROTTLE) return
    lastDragUpdate.current = now
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setDragPosition(percentage)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const now = Date.now()
    if (now - lastDragUpdate.current < DRAG_THROTTLE) return
    lastDragUpdate.current = now
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setDragPosition(percentage)
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      // Touch events for mobile
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

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

  // Auto-cycle through examples - only when not dragging
  useEffect(() => {
    if (isDragging) return // Don't auto-cycle while user is interacting
    
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length)
    }, 10000) // Slower cycling - every 10 seconds
    return () => clearInterval(interval)
  }, [isDragging])

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-800/30 rounded-3xl blur-xl"></div>
      
      {/* Example Indicators - Moved Above Card */}
      <div className="flex justify-center gap-2 mb-4">
        {examples.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentExample(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentExample 
                ? "bg-blue-500 scale-125" 
                : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
            )}
          />
        ))}
      </div>
      
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
              onTouchStart={handleTouchStart}
            >
              <div className="w-8 h-8 bg-white rounded-full shadow-xl border-2 border-slate-200 flex items-center justify-center hover:scale-110 transition-transform">
                <div className="w-1 h-4 bg-slate-400 rounded-full mx-0.5"></div>
                <div className="w-1 h-4 bg-slate-400 rounded-full mx-0.5"></div>
              </div>
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
    <section 
      id="democracy-decoded-section"
      className="py-24 sm:py-32 lg:py-40 bg-white dark:bg-slate-950 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        
        {/* Header */}
        <div className="text-center mb-24 lg:mb-32">
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-extralight text-slate-900 dark:text-white mb-8 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Democracy, decoded daily
          </motion.h2>
          <motion.p 
            className="text-xl lg:text-2xl text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Redefining civic education for a new era
          </motion.p>
        </div>

        {/* Features */}
        <div className="space-y-32 lg:space-y-40">
          
          {/* Textbook vs. Reality - First on mobile */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="lg:order-2 space-y-8">
              <h3 className="text-3xl lg:text-4xl font-light text-slate-900 dark:text-white leading-tight">
                Textbook vs. Reality
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                School civics classes teach you how government should work. Reality shows you how it actually works. Drag to see the difference.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-lg">🚨</span>
                  <span>Uncomfortable truths</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-lg">🎯</span>
                  <span>Actionable steps</span>
                </div>
              </div>
            </div>
            <div className="lg:order-1">
              <CivicsBeforeAfterSlider />
            </div>
          </motion.div>

          {/* Real-time News - Second on mobile */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-8">
              <h3 className="text-3xl lg:text-4xl font-light text-slate-900 dark:text-white leading-tight">
                News → Knowledge
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                AI transforms breaking news into quiz questions, insights, and action steps within minutes. Learn civics through current events.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-lg">⚡</span>
                  <span>2-4 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-lg">🧠</span>
                  <span>AI-powered</span>
                </div>
              </div>
            </div>
            <div>
              <RealTimeNewsDemo />
            </div>
          </motion.div>

          {/* Multiplayer Learning - Third on mobile */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="lg:order-2 space-y-8">
              <h3 className="text-3xl lg:text-4xl font-light text-slate-900 dark:text-white leading-tight">
                Multiplayer Learning
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Battle friends in real-time civic knowledge duels. See who really understands how power works.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-lg">👥</span>
                  <span>Up to 8 players</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-lg">🏆</span>
                  <span>Live rankings</span>
                </div>
              </div>
            </div>
            <div className="lg:order-1">
              <MultiplayerDemo />
            </div>
          </motion.div>

        </div>

        {/* Simple CTA */}
        <motion.div 
          className="mt-32 lg:mt-40 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl p-8 lg:p-12 border border-slate-200/50 dark:border-slate-700/50">
            <h4 className="text-2xl lg:text-3xl font-light text-slate-900 dark:text-white mb-6 leading-relaxed">
              Ready to learn civics that matter?
            </h4>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands building real civic knowledge through current events and uncomfortable truths.
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
        </motion.div>

      </div>
    </section>
  )
} 