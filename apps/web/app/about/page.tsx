"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@civicsense/ui-web'
import { AutoReadPage } from '@/components/auto-read/auto-read-page'
import { FeedbackButton } from '@civicsense/ui-web'
import { ServerHeader } from '@civicsense/ui-web'
import { useEffect, useRef } from 'react'

export default function AboutPage() {
  const shatterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!shatterRef.current) return
      
      const scrolled = window.scrollY
      const rate = scrolled * 0.01
      
      // Get all letters
      const letters = shatterRef.current.querySelectorAll('.shatter-letter')
      
      letters.forEach((letter, index) => {
        const element = letter as HTMLElement
        
        // Create different scatter patterns for each letter
        const xOffset = Math.sin(index * 0.5) * rate * (index + 1)
        const yOffset = Math.cos(index * 0.3) * rate * (index + 1) * 0.5
        const rotation = (index % 2 === 0 ? 1 : -1) * rate * (index + 1) * 0.3
        const scale = Math.max(0.5, 1 - rate * 0.002)
        
        element.style.transform = `
          translate(${xOffset}px, ${yOffset}px) 
          rotate(${rotation}deg) 
          scale(${scale})
        `
        element.style.opacity = `${Math.max(0.3, 1 - rate * 0.003)}`
      })
    }

    // Split text into individual letters
    if (shatterRef.current) {
      const text = 'breaking down'
      const letters = text.split('').map((char, index) => {
        if (char === ' ') {
          return `<span class="shatter-letter inline-block" style="width: 0.5em;">&nbsp;</span>`
        }
        return `<span class="shatter-letter inline-block transition-all duration-100 ease-out">${char}</span>`
      }).join('')
      
      shatterRef.current.innerHTML = letters
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AutoReadPage />
      <ServerHeader />
      
      <style jsx global>{`
        .shatter-letter {
          display: inline-block;
          transition: all 0.1s ease-out;
        }
        
        @media (max-width: 640px) {
          .hero-text {
            font-size: 8rem;
            line-height: 0.8;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .hero-text {
            font-size: 12rem;
            line-height: 0.8;
          }
        }
        
        @media (min-width: 1025px) {
          .hero-text {
            font-size: 16rem;
            line-height: 0.8;
          }
        }
      `}</style>
      
      <div className="space-y-0">
        {/* Hero section - Full Screen */}
        <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
          <div className="text-center space-y-12 max-w-7xl mx-auto">
            <h1 className="hero-text font-light text-slate-900 dark:text-white leading-tight tracking-tight">
              Democracy is
              <br />
              <span ref={shatterRef} className="font-black text-red-600">
                breaking down
              </span>
            </h1>
            <p className="text-xl sm:text-2xl font-light text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
              While you're trying to figure out what's happening, the people in power are counting on your confusion.
            </p>
            <p className="text-lg text-slate-800 dark:text-slate-300 font-medium">
              It's time to decode democracy.
            </p>
          </div>
        </section>
        
        {/* Crisis Statistics */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white mb-4">
                Here's how bad it's gotten
              </h2>
            </div>
            
            <div className="space-y-24">
              {/* Civic Knowledge Crisis */}
              <div className="text-center space-y-8">
                <div className="text-7xl sm:text-8xl font-black text-red-600 leading-none">
                  1/4
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white">
                  That's how many Americans can name all three branches of government
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Think about that. Most people can't even name the basics of how their own government works.
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Source: <a href="https://www.annenbergpublicpolicycenter.org/americans-knowledge-of-the-branches-of-government-is-declining/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">2023 Annenberg Constitution Day Civics Survey</a>, University of Pennsylvania
                </div>
              </div>
              
              {/* Trust Crisis */}
              <div className="text-center space-y-8">
                <div className="text-7xl sm:text-8xl font-black text-orange-500 leading-none">
                  22%
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white">
                  Trust the federal government to do the right thing
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  In 1958, that number was 75%. We've lost faith in the system—and for good reason.
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Source: <a href="https://www.pewresearch.org/politics/2024/06/24/public-trust-in-government-1958-2024/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Public Trust in Government: 1958-2024</a>, Pew Research Center
                </div>
              </div>
              
              {/* Civic Literacy Crisis */}
              <div className="text-center space-y-8">
                <div className="text-7xl sm:text-8xl font-black text-purple-600 leading-none">
                  70%
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white">
                  Can't pass a basic civics test
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  They can't name Supreme Court justices or explain how laws get made. Democracy requires informed citizens.
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Source: <a href="https://www.uschamberfoundation.org/civics/new-study-finds-alarming-lack-of-civic-literacy-among-americans" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Civic Literacy Study 2024</a>, U.S. Chamber of Commerce Foundation
                </div>
              </div>
              
              {/* Engagement Gap */}
              <div className="text-center space-y-8">
                <div className="text-6xl sm:text-7xl font-black text-blue-600 leading-none">
                  58% vs 25%
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white">
                  Young white women vs Black men who voted in 2024
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  When some voices are twice as loud as others, democracy doesn't work for everyone.
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Source: <a href="https://circle.tufts.edu/latest-research/new-data-nearly-half-youth-voted-2024" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Youth Voter Turnout 2024</a>, CIRCLE at Tufts University
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* The Problem */}
        <section className="py-32 px-6 bg-slate-900 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-light text-white">
                Most civic education is
                <br />
                <span className="font-black text-red-400">
                  teaching you to be powerless
                </span>
              </h2>
              <p className="text-xl font-light text-slate-300 leading-relaxed max-w-3xl mx-auto">
                They teach you how democracy is <em>supposed</em> to work.<br />
                <strong className="text-white text-2xl">We teach you how it actually works.</strong>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-16 max-w-4xl mx-auto text-left">
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-red-300">Traditional Civic Education Says:</h3>
                <div className="space-y-4 text-slate-300 font-light">
                  <p>"Write your congressman and trust the process"</p>
                  <p>"Voting is your most important duty"</p>
                  <p>"The system works if you just participate"</p>
                  <p>"Both sides have valid points"</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-green-300">CivicSense Shows You:</h3>
                <div className="space-y-4 text-white font-light">
                  <p>"Here's how lobbyists actually influence policy"</p>
                  <p>"Your local elections matter more than federal"</p>
                  <p>"Here's what's broken and how to fix it"</p>
                  <p>"Here's how to spot manipulation and build real power"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-8 mb-20">
              <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white">
                The civic education politicians
                <br />
                <span className="font-black text-red-600">
                  don't want you to have
                </span>
              </h2>
            </div>
            
            <div className="space-y-20">
              {/* Unfiltered Reality */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <div className="text-5xl">🔥</div>
                  <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                    Unfiltered reality
                  </h3>
                  <p className="text-lg font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                    We explain how power actually flows in America. Follow the money. Understand who really makes decisions. Learn why your vote for state legislature might matter more than your presidential vote.
                  </p>
                  <blockquote className="text-slate-600 dark:text-slate-400 italic border-l-2 border-red-600 pl-6">
                    "Most people think the president runs the country. The president wishes that were true."
                  </blockquote>
                </div>
                <div className="text-center">
                  <div className="text-8xl font-black text-red-600/10">01</div>
                </div>
              </div>

              {/* Information Warfare Defense */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="text-center md:order-2">
                  <div className="text-8xl font-black text-blue-600/10">02</div>
                </div>
                <div className="space-y-6 md:order-1">
                  <div className="text-5xl">🛡️</div>
                  <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                    Information warfare defense
                  </h3>
                  <p className="text-lg font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                    Identify manipulation techniques in real time. Distinguish between facts and spin. Understand how disinformation campaigns actually work—and build immunity to them.
                  </p>
                  <blockquote className="text-slate-600 dark:text-slate-400 italic border-l-2 border-blue-600 pl-6">
                    "When you can spot the manipulation, you can't be manipulated."
                  </blockquote>
                </div>
              </div>

              {/* Tactical Action */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <div className="text-5xl">⚡</div>
                  <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                    Tactical civic action
                  </h3>
                  <p className="text-lg font-light text-slate-600 dark:text-slate-400 leading-relaxed">
                    Learn how to research your representatives' actual voting records and funding. Understand ballot measures that affect your daily life. Build effective advocacy skills that work.
                  </p>
                  <blockquote className="text-slate-600 dark:text-slate-400 italic border-l-2 border-green-600 pl-6">
                    "Knowledge without action doesn't strengthen democracy."
                  </blockquote>
                </div>
                <div className="text-center">
                  <div className="text-8xl font-black text-green-600/10">03</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Stakes */}
        <section className="py-32 px-6 bg-slate-900 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            <h2 className="text-3xl sm:text-4xl font-light text-white">
              Here's what's at stake
            </h2>
            
            <div className="text-xl font-light text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Democracy survives when citizens are impossible to fool.<br />
              <span className="text-white font-medium">It dies when they're easy to manipulate.</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-6 text-center">
                <div className="text-4xl">📊</div>
                <h3 className="text-lg font-medium text-white">Misinformation spreads faster</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  False stories spread 6x faster than true stories on social media. Critical thinking is your defense.
                </p>
              </div>
              <div className="space-y-6 text-center">
                <div className="text-4xl">💰</div>
                <h3 className="text-lg font-medium text-white">Dark money influences policy</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  Billions in untraceable political spending shape laws. You need to know how to follow the money.
                </p>
              </div>
              <div className="space-y-6 text-center">
                <div className="text-4xl">⚖️</div>
                <h3 className="text-lg font-medium text-white">Local decisions affect daily life</h3>
                <p className="text-slate-400 font-light leading-relaxed">
                  School funding, housing costs, policing—decided locally while everyone watches federal politics.
                </p>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <p className="text-xl font-medium text-white">
                Every day you stay confused is another day the system works exactly as intended.
              </p>
            </div>
          </div>
        </section>

        {/* How We Do It */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-8 mb-20">
              <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white">
                How we build civic warriors
              </h2>
              <p className="text-xl font-light text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                We don't just inform—we transform. Every interaction is designed to make you harder to manipulate and impossible to ignore.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center space-y-6">
                <div className="text-5xl">🧭</div>
                <h3 className="text-xl font-medium text-slate-900 dark:text-white">
                  Daily reality checks
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                  Every day, we break down the most important political developments. Not the theater—the real decisions that affect your life.
                </p>
              </div>

              <div className="text-center space-y-6">
                <div className="text-5xl">🎯</div>
                <h3 className="text-xl font-medium text-slate-900 dark:text-white">
                  Skills-based learning
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                  Through quizzes and interactive content, you develop the skills to analyze policy, spot bias, and think strategically about civic engagement.
                </p>
              </div>

              <div className="text-center space-y-6">
                <div className="text-5xl">⚡</div>
                <h3 className="text-xl font-medium text-slate-900 dark:text-white">
                  Action-oriented outcomes
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                  Every lesson connects to actionable steps. We measure success by behavioral change, not engagement metrics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white">
              Ready to become
              <br />
              <span className="font-black text-red-600">ungovernable by misinformation?</span>
            </h2>
            
            <div className="space-y-8">
              <p className="text-xl font-light text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Join thousands of Americans who refuse to be confused, overwhelmed, or manipulated by political theater.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button 
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-full px-8 py-3 text-lg font-medium"
                >
                  <Link href="/">Start Today's Quiz</Link>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="rounded-full px-8 py-3 text-lg font-medium border-2"
                >
                  <Link href="/civics-test">Take the Assessment</Link>
                </Button>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
                Free. No signup required. Just civic education that actually works.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}