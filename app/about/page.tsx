"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AutoReadPage } from '@/components/auto-read-page'
import { FeedbackButton } from '@/components/feedback'
import { useEffect, useState, useRef } from 'react'

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState(0)
  const crisisRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleScroll = () => {
      if (!crisisRef.current) return
      
      const rect = crisisRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const elementTop = rect.top
      const elementHeight = rect.height
      
      // Calculate progress through the crisis section (0 to 1)
      const scrollProgress = Math.max(0, Math.min(1, (windowHeight - elementTop) / (windowHeight + elementHeight * 0.5)))
      
      // Determine which section should be active (0-3)
      const section = Math.floor(scrollProgress * 4)
      setActiveSection(Math.min(section, 3))
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AutoReadPage />
      
      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        
        @keyframes pulse-intense {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        @keyframes slide-up-stagger {
          0% { transform: translateY(60px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fade-in-scale {
          0% { 
            transform: translateY(40px) scale(0.95); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        
        @keyframes number-pulse {
          0%, 100% { 
            color: rgb(15 23 42);
            text-shadow: none;
            transform: scale(1);
          }
          50% { 
            color: rgb(239 68 68);
            text-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
            transform: scale(1.03);
          }
        }
        
        .crisis-number {
          animation: number-pulse 4s infinite;
          font-variant-numeric: tabular-nums;
          font-weight: 900;
        }
        
        .floating-element {
          animation: float 6s ease-in-out infinite;
        }
        
        .pulse-element {
          animation: pulse-intense 3s ease-in-out infinite;
        }
        
        .slide-up-1 {
          animation: slide-up-stagger 1s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .slide-up-2 {
          animation: slide-up-stagger 1s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .slide-up-3 {
          animation: slide-up-stagger 1s ease-out forwards;
          animation-delay: 0.6s;
          opacity: 0;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .source-citation {
          font-size: 0.75rem;
          color: rgb(100 116 139);
          margin-top: 0.75rem;
          opacity: 0.8;
        }
        
        .source-citation a {
          color: rgb(59 130 246);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .source-citation a:hover {
          color: rgb(37 99 235);
          text-decoration: underline;
          opacity: 1;
        }
        
        .crisis-section {
          position: relative;
          overflow: visible;
        }
        
        .crisis-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, transparent 70%);
          animation: pulse-intense 6s ease-in-out infinite;
          pointer-events: none;
        }
        
        .crisis-stat {
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(60px) scale(0.9);
          opacity: 0;
          pointer-events: none;
        }
        
        .crisis-stat.active {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
          animation: fade-in-scale 0.8s ease-out;
        }
        
        .crisis-stat.past {
          transform: translateY(-60px) scale(0.9);
          opacity: 0.3;
        }
        
        .scrolljack-container {
          height: 500vh;
          position: relative;
        }
        
        .crisis-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .mobile-crisis-stack {
          display: none;
        }
        
        @media (max-width: 768px) {
          .scrolljack-container {
            height: auto;
            display: none;
          }
          
          .mobile-crisis-stack {
            display: block;
            padding: 4rem 1rem;
            space-y: 8rem;
          }
          
          .crisis-number {
            font-size: 5rem !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <Link 
            href="/" 
            className="group hover:opacity-70 transition-opacity"
          >
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
              CivicSense
            </h1>
          </Link>
        </div>
      </div>
      
      <div className="space-y-0">
        {/* Hero section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6">
          <div className="text-center space-y-8 slide-up-1 max-w-7xl">
            <h1 className="text-6xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-light text-slate-900 dark:text-white tracking-tight leading-none">
              Democracy is
              <br />
              <span className="gradient-text font-black">breaking down</span>
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-5xl mx-auto">
              While you're trying to figure out what's happening,<br />
              the people in power are counting on your confusion.
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-700 dark:text-slate-300 font-medium">
              It's time to decode democracy.
            </p>
          </div>
        </section>
        
        {/* Crisis Statistics - Desktop Scrolljacking */}
        <div className="scrolljack-container" ref={crisisRef}>
          <div className="crisis-sticky">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light text-slate-900 dark:text-white mb-16 sm:mb-20">
                  Here's how bad it's gotten
                </h2>
                
                {/* Crisis Stats Container */}
                <div className="relative min-h-[60vh] flex items-center justify-center">
                  
                  {/* Knowledge Crisis */}
                  <div className={`crisis-stat absolute inset-0 flex items-center justify-center ${activeSection === 0 ? 'active' : activeSection > 0 ? 'past' : ''}`}>
                    <div className="relative w-full max-w-4xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
                      <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-white/20">
                        <div className="crisis-number text-7xl sm:text-8xl lg:text-9xl xl:text-[12rem] font-black tracking-tighter mb-4 sm:mb-6">
                          1<span className="text-5xl sm:text-6xl lg:text-7xl">/</span>4
                        </div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
                          That's how many Americans can name all three branches of government
                        </h3>
                        <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                          Think about that. Most people can't even name the basics of how their own government works.
                        </p>
                        <div className="source-citation">
                          Source: <a href="https://www.annenbergpublicpolicycenter.org/americans-knowledge-of-the-branches-of-government-is-declining/" target="_blank" rel="noopener noreferrer">2023 Annenberg Constitution Day Civics Survey</a>, University of Pennsylvania
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trust Crisis */}
                  <div className={`crisis-stat absolute inset-0 flex items-center justify-center ${activeSection === 1 ? 'active' : activeSection > 1 ? 'past' : ''}`}>
                    <div className="relative w-full max-w-4xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
                      <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-white/20">
                        <div className="crisis-number text-7xl sm:text-8xl lg:text-9xl xl:text-[12rem] font-black tracking-tighter mb-4 sm:mb-6">
                          22<span className="text-4xl sm:text-5xl lg:text-6xl">%</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
                          Trust the federal government to do the right thing
                        </h3>
                        <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                          In 1958, that number was 75%. We've lost faith in the system—and for good reason.
                        </p>
                        <div className="source-citation">
                          Source: <a href="https://www.pewresearch.org/politics/2024/06/24/public-trust-in-government-1958-2024/" target="_blank" rel="noopener noreferrer">Public Trust in Government: 1958-2024</a>, Pew Research Center
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Civic Literacy Crisis */}
                  <div className={`crisis-stat absolute inset-0 flex items-center justify-center ${activeSection === 2 ? 'active' : activeSection > 2 ? 'past' : ''}`}>
                    <div className="relative w-full max-w-4xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                      <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-white/20">
                        <div className="crisis-number text-7xl sm:text-8xl lg:text-9xl xl:text-[12rem] font-black tracking-tighter mb-4 sm:mb-6">
                          70<span className="text-4xl sm:text-5xl lg:text-6xl">%</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
                          Can't pass a basic civics test
                        </h3>
                        <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                          They can't name Supreme Court justices or explain how laws get made. Democracy requires informed citizens.
                        </p>
                        <div className="source-citation">
                          Source: <a href="https://www.uschamberfoundation.org/civics/new-study-finds-alarming-lack-of-civic-literacy-among-americans" target="_blank" rel="noopener noreferrer">Civic Literacy Study 2024</a>, U.S. Chamber of Commerce Foundation
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Engagement Gap */}
                  <div className={`crisis-stat absolute inset-0 flex items-center justify-center ${activeSection === 3 ? 'active' : ''}`}>
                    <div className="relative w-full max-w-4xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                      <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-white/20">
                        <div className="crisis-number text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter mb-4 sm:mb-6">
                          58% vs 25%
                        </div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
                          Young white women vs Black men who voted in 2024
                        </h3>
                        <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                          When some voices are twice as loud as others, democracy doesn't work for everyone.
                        </p>
                        <div className="source-citation">
                          Source: <a href="https://circle.tufts.edu/latest-research/new-data-nearly-half-youth-voted-2024" target="_blank" rel="noopener noreferrer">Youth Voter Turnout 2024</a>, CIRCLE at Tufts University
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Crisis Stack */}
        <div className="mobile-crisis-stack space-y-32 md:hidden">
          <div className="text-center px-4">
            <h2 className="text-4xl font-light text-slate-900 dark:text-white mb-16">
              Here's how bad it's gotten
            </h2>
          </div>
          
          {/* Knowledge Crisis - Mobile */}
          <div className="px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-3xl text-center">
                <div className="text-7xl font-black tracking-tighter mb-6 crisis-number">
                  1<span className="text-5xl">/</span>4
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Americans can name all three branches of government
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  Most people can't even name the basics of how their own government works.
                </p>
                <div className="source-citation">
                  Source: <a href="https://www.annenbergpublicpolicycenter.org/americans-knowledge-of-the-branches-of-government-is-declining/" target="_blank" rel="noopener noreferrer">2023 Annenberg Survey</a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust Crisis - Mobile */}
          <div className="px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-3xl text-center">
                <div className="text-7xl font-black tracking-tighter mb-6 crisis-number">
                  22<span className="text-4xl">%</span>
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Trust the federal government
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  In 1958, that number was 75%. We've lost faith in the system.
                </p>
                <div className="source-citation">
                  Source: <a href="https://www.pewresearch.org/politics/2024/06/24/public-trust-in-government-1958-2024/" target="_blank" rel="noopener noreferrer">2024 Pew Research</a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Civic Literacy - Mobile */}
          <div className="px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-3xl text-center">
                <div className="text-7xl font-black tracking-tighter mb-6 crisis-number">
                  70<span className="text-4xl">%</span>
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Can't pass a basic civics test
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  Can't name Supreme Court justices or explain how laws get made.
                </p>
                <div className="source-citation">
                  Source: <a href="https://www.uschamberfoundation.org/civics/new-study-finds-alarming-lack-of-civic-literacy-among-americans" target="_blank" rel="noopener noreferrer">2024 Chamber Foundation</a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Engagement Gap - Mobile */}
          <div className="px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-3xl text-center">
                <div className="text-6xl font-black tracking-tighter mb-6 crisis-number">
                  58% vs 25%
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                  Voting gap by race and gender
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  When some voices are twice as loud, democracy doesn't work for everyone.
                </p>
                <div className="source-citation">
                  Source: <a href="https://circle.tufts.edu/latest-research/new-data-nearly-half-youth-voted-2024" target="_blank" rel="noopener noreferrer">2024 CIRCLE Study</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* The Stark Reality */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 crisis-section">
          <div className="text-center space-y-12 max-w-6xl">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-slate-900 dark:text-white tracking-tight slide-up-1">
              This isn't happening
              <br />
              <span className="gradient-text font-black">by accident</span>
            </h2>
            <div className="space-y-8 slide-up-2">
              <p className="text-2xl sm:text-3xl lg:text-4xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Confused citizens don't ask hard questions.
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Overwhelmed people don't vote.
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                Disengaged populations don't hold power accountable.
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white font-black leading-relaxed slide-up-3">
                That's the point.
              </p>
            </div>
          </div>
        </section>
        
        {/* Solution section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light text-slate-900 dark:text-white tracking-tight mb-8">
                We're changing the game
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <div className="text-6xl mb-6 floating-element">🧠</div>
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                      We cut through the noise
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                      Every day, we take the most important political developments and break them down into clear, digestible facts. No jargon. No spin. Just what you need to know.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <div className="text-6xl mb-6 floating-element" style={{animationDelay: '1s'}}>⚡</div>
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                      We build your civic muscles
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                      Through daily quizzes and explanations, you'll develop the skills to spot misinformation, understand policy impacts, and think critically about what you hear.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                    <div className="text-6xl mb-6 floating-element" style={{animationDelay: '2s'}}>🎯</div>
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                      We give you real power
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                      Knowledge is power. When you understand how the system really works, you can work within it—or fight to change it. Either way, you're not on the sidelines anymore.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="lg:pl-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-12 rounded-3xl text-center">
                    <h3 className="text-3xl font-light text-slate-900 dark:text-white mb-8">
                      Democracy, <span className="gradient-text font-medium">decoded daily</span>
                    </h3>
                    <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-8">
                      Join thousands of Americans who are taking back their civic power, one quiz at a time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        asChild
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 rounded-full px-8 py-3 text-lg font-semibold pulse-element"
                      >
                        <Link href="/">Try Daily Quiz</Link>
                      </Button>
                      <Button 
                        asChild
                        variant="outline"
                        className="rounded-full px-8 py-3 text-lg font-semibold border-2"
                      >
                        <Link href="/donate">Support Our Mission</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Source Transparency */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-slate-500/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 rounded-3xl">
                <h3 className="text-2xl font-light text-slate-900 dark:text-white mb-6">
                  We show our work
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Every statistic on this page comes from verified, nonpartisan research organizations. 
                  Click any source link to see the full study. We believe transparency builds trust—and trust builds democracy.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Sources include university research centers, nonpartisan polling organizations, and government agencies.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white tracking-tight">
              Ready to decode democracy?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
              Your feedback helps us build something better for everyone.
            </p>
            <div className="flex justify-center">
              <FeedbackButton 
                label="Share Your Thoughts" 
                contextType="general" 
                contextId="about_page" 
                variant="default"
                className="px-8 py-3 text-lg rounded-full"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}