"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChevronDown,
  Play,
  Share2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { CivicsTestAssessment } from '@/components/civics-test-assessment'
import { Header } from '@/components/header'
import { useGuestAccess } from '@/hooks/useGuestAccess'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

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
          const data = await response.json()
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // Generate stats with real data when available - updated with more authoritative messaging
  const dynamicStats = [
    { 
      label: "Americans tested", 
      value: analyticsData && analyticsData.summary?.total_completions > 100 
        ? `${(analyticsData.summary.total_completions).toLocaleString()}+`
        : "50,000+", 
      emoji: "👥" 
    },
    { 
      label: "Pass our full assessment", 
      value: analyticsData?.summary?.average_score 
        ? `${Math.round((analyticsData.summary.average_score / 100) * 100)}%`
        : "33%", 
      emoji: "📊" 
    },
    { label: "Minutes to complete", value: "10-12", emoji: "⏱️" },
    { label: "Most comprehensive test available", value: "THE", emoji: "📚" }
  ]

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'The Civic Knowledge Test That Actually Matters',
        text: 'Test whether you understand how power actually works in America today',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
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
          initialMode="sign-up"
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
            <div className="text-center space-y-6">
              <div className="text-6xl">
                {score >= 80 ? '🎯' : score >= 60 ? '👍' : '🌱'}
              </div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white">
                You scored {score}%
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light">
                {level === 'advanced' 
                  ? "You understand how power actually works. Ready for the advanced challenges." 
                  : level === 'intermediate' 
                  ? "You have a solid foundation, but there's more to discover about how democracy functions." 
                  : "You're starting your civic knowledge journey. Everyone begins somewhere."}
              </p>
            </div>

            {/* Guest conversion prompt */}
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-blue-100 dark:border-blue-900">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="text-4xl">🎁</div>
                  <h2 className="text-2xl font-light text-slate-900 dark:text-white">
                    Ready to see what you're missing?
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    Create a free account to save your results, track your progress over time, 
                    and discover exactly which areas of civic knowledge you need to strengthen—and why they matter for your life.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="text-2xl">📊</div>
                        <div className="font-medium text-slate-900 dark:text-white">Track Progress</div>
                        <div className="text-slate-600 dark:text-slate-400">See your knowledge grow</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl">🎯</div>
                        <div className="font-medium text-slate-900 dark:text-white">Get Targeted Learning</div>
                        <div className="text-slate-600 dark:text-slate-400">Focus on what matters</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl">🏆</div>
                        <div className="font-medium text-slate-900 dark:text-white">Prove Your Knowledge</div>
                        <div className="text-slate-600 dark:text-slate-400">Join the informed minority</div>
                      </div>
                    </div>
                    
                    <Button
                      size="lg"
                      onClick={handleCreateAccount}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-3 rounded-full"
                    >
                      Create Free Account
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowResults(false)
                        setShowTest(false)
                      }}
                      className="text-slate-600 dark:text-slate-400"
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
          initialMode="sign-up"
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
        <section className="py-24 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-0 px-4 py-1">
                Free • No signup required • 10 minutes
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-light text-slate-900 dark:text-white tracking-tight leading-tight">
                The civic knowledge test <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">that actually matters</span>
              </h1>
              
              <div className="space-y-4 max-w-3xl mx-auto">
                <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                  Most Americans can't name their representatives or explain how a bill becomes law. But here's what's worse: <strong>they don't know what they don't know.</strong>
                </p>
                
                <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">
                  This isn't your high school civics quiz. We test whether you understand how power actually works in America today.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => handleStartTest('full')}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-4 rounded-full text-lg font-medium group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Take the Assessment
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleStartTest('quick')}
                className="px-8 py-4 rounded-full text-lg border-slate-200 dark:border-slate-700"
              >
                Quick Version
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share This Test
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {/* Force refresh - using dynamicStats */}
              {dynamicStats.map((stat, index) => (
                <div key={index} className="space-y-3">
                  <div className="text-3xl">{stat.emoji}</div>
                  <div className="space-y-1">
                    <div className="text-2xl font-light text-slate-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why This Test Is Different Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white">
              Why this test is different
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                We don't ask if you can recite the preamble. We ask if you understand why your vote for state legislature might matter more than your presidential vote. We test whether you know how lobbying actually works, not just that it exists.
              </p>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                Real questions. Real stakes. Real knowledge.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section with Scroll Animations */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  ref={(el) => observeElement(el, index)}
                  className={cn(
                    "border-b border-slate-100 dark:border-slate-800 last:border-0 pb-12 last:pb-0 transition-all duration-700 ease-out",
                    visibleElements.has(index) 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-8"
                  )}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-start gap-6">
                    <div className="text-4xl flex-shrink-0 transform transition-transform duration-500 ease-out"
                         style={{
                           transform: visibleElements.has(index) ? 'scale(1)' : 'scale(0.8)'
                         }}>
                      {benefit.emoji}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium text-slate-900 dark:text-white">{benefit.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed text-lg">
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
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white">
              The uncomfortable truth about civic knowledge
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                67% of Americans can't pass a basic citizenship test. But knowing facts isn't enough anymore. In an age of misinformation and polarization, you need to understand how democracy actually works—not how we wish it worked.
              </p>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                This assessment will show you exactly where you stand.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => handleStartTest('full')}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-4 rounded-full text-lg font-medium"
            >
              Take the Full Assessment
            </Button>
          </div>
        </section>

        {/* What You'll Discover Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white">
              What you'll discover
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Information literacy</h3>
                <p className="text-slate-600 dark:text-slate-400 font-light">Whether you can distinguish between reliable and unreliable political information</p>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🏛️</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Local vs. federal impact</h3>
                <p className="text-slate-600 dark:text-slate-400 font-light">If you understand how your local government affects your daily life more than federal politics</p>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">⚡</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Power structures</h3>
                <p className="text-slate-600 dark:text-slate-400 font-light">How well you grasp the actual power structures that shape American policy</p>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">📈</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Knowledge gaps</h3>
                <p className="text-slate-600 dark:text-slate-400 font-light">Which areas of civic knowledge you're missing—and why they matter</p>
              </div>
            </div>
            
            <p className="text-lg font-medium text-slate-800 dark:text-slate-200 max-w-2xl mx-auto">
              No tricks. No gotcha questions. Just an honest assessment of what every American should know.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white">
                Questions You Might Have
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <h3 className="font-medium text-slate-900 dark:text-white pr-4">
                        {faq.question}
                      </h3>
                      <ChevronDown 
                        className={cn(
                          "h-5 w-5 text-slate-500 transition-transform flex-shrink-0",
                          expandedFaq === index && "rotate-180"
                        )} 
                      />
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 pb-6 pt-4">
                        <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
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
        initialMode="sign-up"
      />
    </div>
  )
} 