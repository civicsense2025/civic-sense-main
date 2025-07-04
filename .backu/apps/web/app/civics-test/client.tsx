"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "../../components/ui"
import { Badge } from "../../components/ui"
import { Card, CardContent } from "../../components/ui"
import { 
  ChevronDown,
  Play,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from "../../components/ui"
import { AuthDialog } from "../../components/ui"
import { CivicsTestAssessment } from "../../components/ui"
import { Header } from "../../components/ui"

// Temporary stubs for monorepo migration
const useGuestAccess = () => ({
  guestToken: 'guest-' + Date.now(),
  recordQuizAttempt: async (type: string) => console.log('Recording guest attempt:', type)
})

// Temporary supabase stub
const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null } })
  }
}
import { cn } from "../../components/ui"

// Custom hook for intersection observer
const useScrollAnimation = () => {
  const [visibleElements, setVisibleElements] = useState<Set<number>>(new Set())

  const observeRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observeRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0')
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, index]))
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    return () => {
      if (observeRef.current) {
        observeRef.current.disconnect()
      }
    }
  }, [])

  const observeElement = (element: HTMLElement | null, index: number) => {
    if (element && observeRef.current) {
      element.setAttribute('data-index', index.toString())
      observeRef.current.observe(element)
    }
  }

  return { visibleElements, observeElement }
}

// Benefits for different use cases - updated with more authoritative messaging
const benefits = [
  {
    emoji: "🗳️",
    title: "New voters",
    description: "Find out if you're actually prepared to participate in democracy—or just going through the motions."
  },
  {
    emoji: "🌍",
    title: "Immigrants and new citizens",
    description: "See if you understand American politics better than people born here. (Spoiler: you probably do.)"
  },
  {
    emoji: "🎓",
    title: "Educators and students",
    description: "Discover the gaps between what we teach about civics and how government actually functions."
  },
  {
    emoji: "👨‍👩‍👧‍👦",
    title: "Parents",
    description: "Know enough to explain why politics affects your family's daily life—from school funding to healthcare costs."
  },
  {
    emoji: "💼",
    title: "Professionals",
    description: "Understand the political forces shaping your industry before your competitors do."
  },
  {
    emoji: "🏛️",
    title: "Political junkies",
    description: "Think you know politics? Prove it. Our advanced questions separate the informed from the opinionated."
  }
]

// Test info to replace dynamic stats
const testInfo = [
  {
    emoji: "📚",
    title: "Comprehensive Coverage",
    description: "From local government mechanics to federal policy processes"
  },
  {
    emoji: "🎯",
    title: "Real-World Focus",
    description: "Questions about how power actually works, not textbook theory"
  },
  {
    emoji: "⏱️",
    title: "10-12 Minutes",
    description: "Just long enough to reveal what you actually know"
  },
  {
    emoji: "🔍",
    title: "Instant Analysis",
    description: "Get detailed feedback on your civic knowledge gaps"
  }
]

// FAQ data - updated to be more authoritative
const faqs = [
  {
    question: "How is this different from other civics tests?",
    answer: "We don't ask if you can recite the preamble. We ask if you understand why your vote for state legislature might matter more than your presidential vote. We test whether you know how lobbying actually works, not just that it exists."
  },
  {
    question: "How long does this actually take?",
    answer: "10-12 minutes for the full assessment. We're not trying to waste your time—just long enough to reveal what you actually know versus what you think you know."
  },
  {
    question: "Do I need to create an account?",
    answer: "No. You can take the test right now. But if you create an account afterward, we'll save your results and show you exactly which areas of civic knowledge you're missing—and why they matter."
  },
  {
    question: "Is this politically biased?",
    answer: "We test your understanding of how power actually works, not your political opinions. Whether you're left, right, or somewhere else entirely, we just want to see if you understand the system you're participating in."
  },
  {
    question: "What makes this the most comprehensive test?",
    answer: "We cover everything from local government mechanics to federal policy processes to media literacy. Most tests focus on memorizing facts. We test whether you can navigate the actual political landscape."
  },
  {
    question: "Why should I care about my score?",
    answer: "Because in an age of misinformation and polarization, understanding how democracy actually works isn't optional anymore. Your civic knowledge directly affects your ability to make informed decisions and hold power accountable."
  }
]

export default function CivicsTestLanding() {
  const { user } = useAuth()
  const { guestToken, recordQuizAttempt } = useGuestAccess()
  const { visibleElements, observeElement } = useScrollAnimation()
  const [showTest, setShowTest] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [selectedTestType, setSelectedTestType] = useState<'quick' | 'full'>('full')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch analytics data on component mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/civics-test/analytics?days=30')
        if (response.ok) {
          const text = await response.text()
          if (text.trim()) {
            try {
              const data = JSON.parse(text)
              setAnalyticsData(data)
            } catch (parseError) {
              console.warn('Failed to parse analytics response:', parseError)
              // Set empty analytics data as fallback
              setAnalyticsData(null)
            }
          } else {
            console.warn('Empty analytics response')
            setAnalyticsData(null)
          }
        } else {
          console.warn('Analytics request failed:', response.status)
          setAnalyticsData(null)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
        setAnalyticsData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleStartTest = async (testType: 'quick' | 'full') => {
    setSelectedTestType(testType)
    setShowTest(true)
    
    // Record guest attempt if not logged in
    if (!user) {
      await recordQuizAttempt('civics-test')
    }
    
    // Track test start
    const sessionId = `civics-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    fetch('/api/civics-test/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'started',
        session_id: sessionId,
        user_id: user?.id || null,
        guest_token: !user ? guestToken : null,
        metadata: { test_type: testType }
      })
    }).catch(console.error)
  }

  const handleTestComplete = (data: any) => {
    setTestResults(data)
    setShowResults(true)
    
    // Track test completion with full data
    const sessionId = `civics-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    fetch('/api/civics-test/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'completed',
        session_id: sessionId,
        user_id: user?.id || null,
        guest_token: !user ? guestToken : null,
        score: data.assessmentResults?.score || 0,
        level: data.assessmentResults?.level || 'beginner',
        test_type: selectedTestType,
        answers: data.answers || {},
        category_breakdown: data.assessmentResults?.perCategory || {},
        metadata: { 
          test_type: selectedTestType,
          level: data.assessmentResults?.level,
          total_questions: data.assessmentResults?.total
        }
      })
    }).catch(console.error)
  }

  const handleCreateAccount = () => {
    // Track signup after test
    fetch('/api/civics-test/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'signup_after_test',
        session_id: `civics-test-${Date.now()}`,
        user_id: null,
        guest_token: guestToken,
        metadata: { 
          score: testResults?.assessmentResults?.score || 0,
          level: testResults?.assessmentResults?.level
        }
      })
    }).catch(console.error)
    
    setShowAuthDialog(true)
  }

  // Show test interface
  if (showTest && !showResults) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header onSignInClick={() => setShowAuthDialog(true)} />
        <main className="w-full py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowTest(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ← Back to Overview
              </Button>
            </div>
            
            <CivicsTestAssessment
              onComplete={handleTestComplete}
              onBack={() => setShowTest(false)}
              testType={selectedTestType}
              userId={user?.id}
              guestToken={guestToken || undefined}
            />
          </div>
        </main>
        
        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={() => {
            setShowAuthDialog(false)
            
            // Small delay to ensure auth context is updated, then convert guest results
            setTimeout(async () => {
              if (guestToken) {
                try {
                  // Get the current user from Supabase auth
                  const { data: { user: currentUser } } = await supabase.auth.getUser()
                  if (currentUser?.id) {
                    await fetch('/api/civics-test/analytics', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        guest_token: guestToken,
                        user_id: currentUser.id
                      })
                    })
                  }
                } catch (error) {
                  console.error('Error converting guest results:', error)
                }
              }
            }, 100)
          }}
          initialMode="sign-in"
        />
      </div>
    )
  }

  // Show results with guest conversion prompt
  if (showResults && testResults && !user) {
    const { assessmentResults } = testResults
    const score = assessmentResults?.score || 0
    const level = assessmentResults?.level || 'beginner'
    
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header onSignInClick={() => setShowAuthDialog(true)} />
        <main className="w-full py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Results */}
            <div className="text-center space-y-4 sm:space-y-6 px-2">
              <div className="text-4xl sm:text-5xl lg:text-6xl">
                {score >= 80 ? '🎯' : score >= 60 ? '👍' : '🌱'}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-white">
                You scored {score}%
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
                {level === 'advanced' 
                  ? "You understand how power actually works. Ready for the advanced challenges." 
                  : level === 'intermediate' 
                  ? "You have a solid foundation, but there's more to discover about how democracy functions." 
                  : "You're starting your civic knowledge journey. Everyone begins somewhere."}
              </p>
            </div>

            {/* Guest conversion prompt */}
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-blue-100 dark:border-blue-900 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-6 lg:p-8 text-center space-y-4 sm:space-y-6">
                  <div className="text-3xl sm:text-4xl">🎁</div>
                  <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white px-2">
                    Ready to see what you're missing?
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-light leading-relaxed px-2">
                    Create a free account to save your results, track your progress over time, 
                    and discover exactly which areas of civic knowledge you need to strengthen—and why they matter for your life.
                  </p>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="space-y-1 sm:space-y-2">
                        <div className="text-xl sm:text-2xl">📊</div>
                        <div className="font-medium text-slate-900 dark:text-white">Track Progress</div>
                        <div className="text-slate-600 dark:text-slate-400">See your knowledge grow</div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="text-xl sm:text-2xl">🎯</div>
                        <div className="font-medium text-slate-900 dark:text-white">Get Targeted Learning</div>
                        <div className="text-slate-600 dark:text-slate-400">Focus on what matters</div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="text-xl sm:text-2xl">🏆</div>
                        <div className="font-medium text-slate-900 dark:text-white">Prove Your Knowledge</div>
                        <div className="text-slate-600 dark:text-slate-400">Join the informed minority</div>
                      </div>
                    </div>
                    
                    <Button
                      size="lg"
                      onClick={handleCreateAccount}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 sm:px-8 py-3 rounded-full w-full sm:w-auto"
                    >
                      Create Free Account
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowResults(false)
                        setShowTest(false)
                      }}
                      className="text-slate-600 dark:text-slate-400 text-sm sm:text-base"
                    >
                      Maybe later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={async () => {
            setShowAuthDialog(false)
            
            // Small delay to ensure auth context is updated
            setTimeout(async () => {
              // Refresh user from auth context
              const { data: { user: currentUser } } = await supabase.auth.getUser()
              
              // Convert guest results to user account
              if (guestToken && currentUser?.id) {
                try {
                  await fetch('/api/civics-test/analytics', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      guest_token: guestToken,
                      user_id: currentUser.id
                    })
                  })
                } catch (error) {
                  console.error('Error converting guest results:', error)
                }
              }
              
              // Redirect to dashboard with success message
              window.location.href = '/dashboard?converted=true'
            }, 100)
          }}
          initialMode="sign-in"
        />
      </div>
    )
  }

  // Main landing page
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => setShowAuthDialog(true)} />
      
      <main className="w-full">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-0 px-3 sm:px-4 py-1 font-mono font-light text-xs sm:text-sm">
                Free • No signup required • 10 minutes
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight leading-tight px-2">
                The civic knowledge test <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">that actually matters</span>
              </h1>
              
              <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto px-2">
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                  67% of Americans can't pass basic civics tests—<strong>and don't realize what they're missing.</strong>
                </p>
                
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium">
                  We test how power actually works, not textbook theory.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                onClick={() => handleStartTest('full')}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium group w-full sm:w-auto max-w-sm"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Take the Assessment
              </Button>
            </div>
          </div>
        </section>

        {/* Test Info Section */}
        <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {testInfo.map((info, index) => (
                <div key={index} className="text-center space-y-2 sm:space-y-4">
                  <div className="text-2xl sm:text-3xl lg:text-4xl">{info.emoji}</div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-slate-900 dark:text-white">{info.title}</div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-1">{info.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why This Test Is Different Section */}
        <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-3xl mx-2 sm:mx-4 my-6 sm:my-8">
          <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-white px-2">
              Why this test is different
            </h2>
            <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto px-2">
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                We don't ask if you can recite the preamble. We ask if you understand why your vote for state legislature might matter more than your presidential vote. We test whether you know how lobbying actually works, not just that it exists.
              </p>
              <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200">
                Real questions. Real stakes. Real knowledge.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section with Scroll Animations */}
        <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8 sm:space-y-12">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  ref={(el) => observeElement(el, index)}
                  className={cn(
                    "border-b border-slate-100 dark:border-slate-800 last:border-0 pb-8 sm:pb-12 last:pb-0 transition-all duration-700 ease-out",
                    visibleElements.has(index) 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-8"
                  )}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="text-3xl sm:text-4xl flex-shrink-0 transform transition-transform duration-500 ease-out"
                         style={{
                           transform: visibleElements.has(index) ? 'scale(1)' : 'scale(0.8)'
                         }}>
                      {benefit.emoji}
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white">{benefit.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed text-base sm:text-lg">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Truth Section */}
        <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-3xl mx-2 sm:mx-4 my-6 sm:my-8">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-white px-2">
              The uncomfortable truth about civic knowledge
            </h2>
            <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto px-2">
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                67% of Americans can't pass a basic citizenship test. But knowing facts isn't enough anymore. In an age of misinformation and polarization, you need to understand how democracy actually works—not how we wish it worked.
              </p>
              <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200">
                This assessment will show you exactly where you stand.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => handleStartTest('full')}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium w-full sm:w-auto max-w-sm"
            >
              Take the Full Assessment
            </Button>
          </div>
        </section>

        {/* What You'll Discover Section */}
        <section className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Animated sparkles background */}
          <div className="absolute inset-0 pointer-events-none hidden sm:block">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${10 + (i * 12)}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + (i % 3)}s`
                }}
              >
                <span className="text-yellow-400 opacity-30 text-xl">✨</span>
              </div>
            ))}
          </div>
          
          <div className="max-w-5xl mx-auto text-center space-y-12 sm:space-y-16 relative">
            <div className="space-y-6 sm:space-y-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-slate-900 dark:text-white leading-tight px-2">
                What you'll discover
              </h2>
              <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 text-left max-w-4xl mx-auto">
              <div 
                className="space-y-4 sm:space-y-6 group hover:scale-105 transition-transform duration-300 ease-out"
                ref={(el) => observeElement(el, 20)}
              >
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <span className="text-2xl sm:text-3xl lg:text-4xl">🔍</span>
                  </div>
                  <div className="absolute -top-1 -right-1 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                    <span className="text-lg animate-spin">✨</span>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white">Information literacy</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed text-sm sm:text-base lg:text-lg">
                    Whether you can distinguish between reliable and unreliable political information in today's media landscape
                  </p>
                </div>
              </div>
              
              <div 
                className="space-y-4 sm:space-y-6 group hover:scale-105 transition-transform duration-300 ease-out"
                ref={(el) => observeElement(el, 21)}
              >
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <span className="text-2xl sm:text-3xl lg:text-4xl">🏛️</span>
                  </div>
                  <div className="absolute -top-1 -right-1 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                    <span className="text-lg animate-spin">✨</span>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white">Local vs. federal impact</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed text-sm sm:text-base lg:text-lg">
                    If you understand how your local government affects your daily life more than federal politics
                  </p>
                </div>
              </div>
              
              <div 
                className="space-y-4 sm:space-y-6 group hover:scale-105 transition-transform duration-300 ease-out"
                ref={(el) => observeElement(el, 22)}
              >
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <span className="text-2xl sm:text-3xl lg:text-4xl">⚡</span>
                  </div>
                  <div className="absolute -top-1 -right-1 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                    <span className="text-lg animate-spin">✨</span>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white">Power structures</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed text-sm sm:text-base lg:text-lg">
                    How well you grasp the actual power structures that shape American policy behind the scenes
                  </p>
                </div>
              </div>
              
              <div 
                className="space-y-4 sm:space-y-6 group hover:scale-105 transition-transform duration-300 ease-out"
                ref={(el) => observeElement(el, 23)}
              >
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <span className="text-2xl sm:text-3xl lg:text-4xl">📈</span>
                  </div>
                  <div className="absolute -top-1 -right-1 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                    <span className="text-lg animate-spin">✨</span>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white">Knowledge gaps</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed text-sm sm:text-base lg:text-lg">
                    Which specific areas of civic knowledge you're missing—and why they matter for your life
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-6 sm:pt-8">
              <p className="text-base sm:text-lg lg:text-xl font-medium text-slate-800 dark:text-slate-200 max-w-3xl mx-auto leading-relaxed px-2">
                No tricks. No gotcha questions. Just an honest assessment of what every American should know.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-white px-2">
                Questions You Might Have
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <h3 className="font-medium text-slate-900 dark:text-white pr-3 sm:pr-4 text-sm sm:text-base">
                        {faq.question}
                      </h3>
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 sm:h-5 sm:w-5 text-slate-500 transition-transform flex-shrink-0",
                          expandedFaq === index && "rotate-180"
                        )} 
                      />
                    </button>
                    {expandedFaq === index && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-4">
                        <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed text-sm sm:text-base">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      
              <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={() => setShowAuthDialog(false)}
          initialMode="sign-in"
        />
    </div>
  )
} 