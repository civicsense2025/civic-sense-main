"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@civicsense/ui-web'
import { Card } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { Crown, Users, Trophy, Zap, Play, Clock, Target, GamepadIcon } from "lucide-react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from 'react'
import { useAuth } from '@civicsense/ui-web'

const AnimatedSection = ({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
}) => {
  const ref = useRef<Element>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  badge 
}: { 
  icon: any
  title: string
  description: string
  badge?: string
}) => (
  <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 group hover:-translate-y-2 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
    <div className="flex justify-center mb-4">
      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
    </div>
    <div className="flex items-center justify-center gap-2 mb-3">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
  </Card>
)

const GameModeCard = ({ 
  icon: Icon, 
  title, 
  description, 
  players,
  duration,
  comingSoon = false,
  onClick 
}: { 
  icon: any
  title: string
  description: string
  players: string
  duration: string
  comingSoon?: boolean
  onClick?: () => void
}) => (
  <Card className={`p-6 group transition-all duration-300 ${comingSoon ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'} bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700`}>
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <Icon size={24} />
      </div>
      {comingSoon && <Badge variant="outline">Coming Soon</Badge>}
    </div>
    
    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{description}</p>
    
    <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
      <div className="flex items-center gap-1">
        <Users size={16} />
        <span>{players}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock size={16} />
        <span>{duration}</span>
      </div>
    </div>
    
    {!comingSoon && (
      <Button onClick={onClick} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium">
        <Play size={16} className="mr-2" />
        Play Now
      </Button>
    )}
  </Card>
)

const StatsCard = ({ value, label, icon: Icon }: { value: string, label: string, icon: any }) => (
  <div className="text-center p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
    <div className="flex justify-center mb-3">
      <Icon size={24} className="text-blue-600 dark:text-blue-400" />
    </div>
    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{value}</div>
    <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
  </div>
)

export default function MultiplayerMarketing() {
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-400/10 dark:to-purple-400/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                🎮 Multiplayer Mode
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-6">
              Challenge Friends in
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Civic Knowledge
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-3xl mx-auto">
              Test your understanding of government, politics, and civic processes in real-time battles. 
              Learn together, compete together, grow together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-4 text-lg">
                <Link href="/multiplayer/quick-match">
                  <GamepadIcon className="mr-2" size={20} />
                  Quick Match
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-slate-300 dark:border-slate-600 px-8 py-4 text-lg">
                <Link href="/multiplayer/rooms">
                  <Users className="mr-2" size={20} />
                  Create Room
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.2} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Game Modes
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Choose your challenge level and compete in different formats designed to test various aspects of civic knowledge.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <GameModeCard
                icon={Zap}
                title="Quick Match"
                description="Fast-paced 5-minute rounds testing constitutional knowledge and current events."
                players="2-8 players"
                duration="5-10 min"
                onClick={() => window.location.href = '/multiplayer/quick-match'}
              />
              
              <GameModeCard
                icon={Trophy}
                title="Tournament Mode"
                description="Bracket-style competition with multiple rounds and increasing difficulty."
                players="8-32 players"
                duration="30-60 min"
                comingSoon
              />
              
              <GameModeCard
                icon={Target}
                title="Civic Challenge"
                description="Deep dives into specific topics like voting rights, constitutional amendments, or local government."
                players="2-6 players"
                duration="15-25 min"
                comingSoon
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.2} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Why Multiplayer Learning Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Research shows that competitive learning environments increase retention and engagement. 
              Our multiplayer mode combines the best of gaming with serious civic education.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={Users}
                title="Social Learning"
                description="Learn from and with others. Discuss answers, share insights, and build understanding together."
              />
              
              <FeatureCard
                icon={Trophy}
                title="Competitive Edge"
                description="Healthy competition motivates deeper learning and better retention of civic concepts."
                badge="Proven"
              />
              
              <FeatureCard
                icon={Zap}
                title="Real-time Feedback"
                description="Get immediate explanations for correct and incorrect answers during the game."
              />
              
              <FeatureCard
                icon={Target}
                title="Skill-based Matching"
                description="Play with others at your level or challenge yourself against more experienced players."
                badge="Coming Soon"
              />
              
              <FeatureCard
                icon={Crown}
                title="Achievement System"
                description="Earn badges, climb leaderboards, and track your civic knowledge growth over time."
              />
              
              <FeatureCard
                icon={GamepadIcon}
                title="Cross-platform"
                description="Play on any device - desktop, tablet, or mobile. Your progress syncs everywhere."
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.2} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Join the Community
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Be part of a growing community of civic-minded learners
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatsCard value="1,200+" label="Active Players" icon={Users} />
              <StatsCard value="15,000+" label="Games Played" icon={GamepadIcon} />
              <StatsCard value="89%" label="Knowledge Retention" icon={Target} />
              <StatsCard value="4.8★" label="Player Rating" icon={Trophy} />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection delay={0.2}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Test Your Civic Knowledge?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of players who are making civic learning fun, engaging, and competitive.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="bg-white text-blue-600 hover:bg-slate-100 font-semibold px-8 py-4 text-lg">
                <Link href="/multiplayer/quick-match">
                  <Play className="mr-2" size={20} />
                  Start Playing Now
                </Link>
              </Button>
              {!user && (
                <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                  <Link href="/auth/sign-up">
                    Create Free Account
                  </Link>
                </Button>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
} 