"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Clock,
  MessageSquare,
  Users,
  Brain,
  Target,
  TrendingUp,
  Play,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Self-contained Real-time News Demo
function RealTimeNewsDemo() {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4)
      setProgress((prev) => (prev + 25) % 100)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const steps = [
    { title: "Breaking News Detected", icon: <AlertCircle className="h-4 w-4" />, color: "text-red-500" },
    { title: "AI Analysis in Progress", icon: <Brain className="h-4 w-4" />, color: "text-blue-500" },
    { title: "Questions Generated", icon: <MessageSquare className="h-4 w-4" />, color: "text-green-500" },
    { title: "Ready for Learning", icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-500" }
  ]

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            Supreme Court Rules on Voting Rights
          </div>
          <Progress value={progress} className="h-2" />
          <div className="space-y-2">
            {steps.map((stepItem, index) => (
              <motion.div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-all",
                  step >= index ? "bg-slate-50 dark:bg-slate-800" : "opacity-50"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: step >= index ? 1 : 0.5, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <div className={cn("flex-shrink-0", stepItem.color)}>
                  {stepItem.icon}
                </div>
                <span className="text-sm">{stepItem.title}</span>
                {step === index && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Self-contained Multiplayer Demo
function MultiplayerDemo() {
  const [players, setPlayers] = useState([
    { name: "Alex", score: 450, isAnswering: false },
    { name: "Sarah", score: 380, isAnswering: false },
    { name: "You", score: 520, isAnswering: false }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prev => prev.map(player => ({
        ...player,
        isAnswering: Math.random() > 0.7,
        score: player.score + (Math.random() > 0.8 ? Math.floor(Math.random() * 50) : 0)
      })))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Constitutional Rights Battle</div>
            <Badge variant="secondary">Live</Badge>
          </div>
          <div className="space-y-3">
            {players.map((player, index) => (
              <motion.div
                key={player.name}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                animate={{ 
                  scale: player.isAnswering ? 1.02 : 1,
                  borderColor: player.isAnswering ? "#3b82f6" : "transparent"
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {player.name[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{player.score}</span>
                  {player.isAnswering && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Self-contained Quiz Demo
function QuizDemo() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const questions = [
    {
      question: "The filibuster allows senators to block legislation. Who benefits most from this?",
      options: ["The majority party", "The minority party", "Individual senators", "The American people"],
      correct: 1,
      insight: "The filibuster is a tool that typically benefits whoever wants to prevent change."
    },
    {
      question: "Gerrymandering primarily affects which democratic process?",
      options: ["Presidential elections", "Senate elections", "House elections", "Local elections"],
      correct: 2,
      insight: "Districts are redrawn to create 'safe' seats for the party in power."
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showAnswer) {
        setShowAnswer(true)
      } else {
        setShowAnswer(false)
        setCurrentQuestion((prev) => (prev + 1) % questions.length)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [currentQuestion, showAnswer])

  const question = questions[currentQuestion]

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">Power Dynamics</Badge>
            <span className="text-xs text-slate-500">Question {currentQuestion + 1} of {questions.length}</span>
          </div>
          
          <h3 className="text-sm font-medium leading-relaxed">
            {question.question}
          </h3>
          
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <motion.div
                key={index}
                className={cn(
                  "p-3 rounded-lg border text-sm transition-all",
                  showAnswer && index === question.correct
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100"
                    : "border-slate-200 dark:border-slate-700"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center text-xs",
                    showAnswer && index === question.correct
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-slate-300 dark:border-slate-600"
                  )}>
                    {showAnswer && index === question.correct && <CheckCircle className="h-3 w-3" />}
                  </div>
                  {option}
                </div>
              </motion.div>
            ))}
          </div>

          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Uncomfortable Truth:</strong> {question.insight}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function FeaturesShowcase() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 dark:text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            We decode the news in{" "}
            <span className="text-blue-600 dark:text-blue-400">real-time</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            No one has time for traditional civics education when democracy changes rapidly every day. 
            We turn breaking news into learning moments within hours.
          </motion.p>
        </div>

        {/* Features */}
        <div className="space-y-16">
          
          {/* Real-time News */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary">Lightning Fast</Badge>
                </div>
                <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                  Breaking News → Learning Content
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Our AI monitors breaking political news and generates educational content within hours. 
                When the Supreme Court makes a ruling or Congress passes legislation, you'll understand 
                the power dynamics at play before anyone else.
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>2-4 hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  <span>AI-powered analysis</span>
                </div>
              </div>
            </div>
            <div>
              <RealTimeNewsDemo />
            </div>
          </motion.div>

          {/* Multiplayer Learning */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="lg:order-2 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary">Social Learning</Badge>
                </div>
                <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                  Learn Together, Not Alone
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Democracy is social, so is learning about it. Battle friends in real-time civic knowledge 
                duels. See who really understands how power works in American democracy.
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Up to 8 players</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Live leaderboards</span>
                </div>
              </div>
            </div>
            <div className="lg:order-1">
              <MultiplayerDemo />
            </div>
          </motion.div>

          {/* Uncomfortable Truths */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-600" />
                  <Badge variant="secondary">Uncomfortable Truths</Badge>
                </div>
                <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                  How Power Actually Works
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                We don't teach sanitized civics. Every question reveals the uncomfortable truths about 
                how power really operates in American democracy. Learn what politicians don't want you to know.
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>2,500+ questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>Zero sugarcoating</span>
                </div>
              </div>
            </div>
            <div>
              <QuizDemo />
            </div>
          </motion.div>

        </div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-4">
            Ready to learn civics that politicians don't want you to have?
          </h3>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            <Play className="h-4 w-4 mr-2" />
            Start Learning
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

      </div>
    </section>
  )
} 