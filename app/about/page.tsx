"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AutoReadPage } from '@/components/auto-read-page'
import { FeedbackButton } from '@/components/feedback'
import { useEffect, useState, useRef } from 'react'
import { ServerHeader } from '@/components/server-header'

export default function AboutPage() {
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
        rootMargin: '0px 0px -100px 0px'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AutoReadPage />
      
      {/* Header */}
      <ServerHeader />
      
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
        
        .organic-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(40px);
          opacity: 0;
        }
        
        .organic-card.visible {
          transform: translateY(0);
          opacity: 1;
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
        
        .crisis-timeline-item {
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(80px);
          opacity: 0;
        }
        
        .crisis-timeline-item.visible {
          transform: translateY(0);
          opacity: 1;
        }
        
        .crisis-timeline-item:nth-child(even) {
          transform: translateY(80px) translateX(-40px);
        }
        
        .crisis-timeline-item:nth-child(even).visible {
          transform: translateY(0) translateX(0);
        }
        
        .crisis-timeline-item:nth-child(odd) {
          transform: translateY(80px) translateX(40px);
        }
        
        .crisis-timeline-item:nth-child(odd).visible {
          transform: translateY(0) translateX(0);
        }
      `}</style>
      
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
        
        {/* Crisis Timeline */}
        <section className="py-20 sm:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light text-slate-900 dark:text-white mb-8">
                Here's how bad it's gotten
              </h2>
            </div>
            
            <div className="space-y-32">
              {/* Knowledge Crisis */}
              <div 
                ref={(el) => observeElement(el, 10)}
                className={`crisis-timeline-item ${visibleElements.has(10) ? 'visible' : ''}`}
              >
                <div className="relative max-w-5xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 lg:p-16 rounded-3xl border border-white/20 text-center">
                    <div className="crisis-number text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter mb-6 sm:mb-8">
                      1<span className="text-4xl sm:text-5xl lg:text-6xl">/</span>4
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">
                      That's how many Americans can name all three branches of government
                    </h3>
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-6">
                      Think about that. Most people can't even name the basics of how their own government works.
                    </p>
                    <div className="source-citation">
                      Source: <a href="https://www.annenbergpublicpolicycenter.org/americans-knowledge-of-the-branches-of-government-is-declining/" target="_blank" rel="noopener noreferrer">2023 Annenberg Constitution Day Civics Survey</a>, University of Pennsylvania
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trust Crisis */}
              <div 
                ref={(el) => observeElement(el, 11)}
                className={`crisis-timeline-item ${visibleElements.has(11) ? 'visible' : ''}`}
              >
                <div className="relative max-w-5xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 lg:p-16 rounded-3xl border border-white/20 text-center">
                    <div className="crisis-number text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter mb-6 sm:mb-8">
                      22<span className="text-4xl sm:text-5xl lg:text-6xl">%</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">
                      Trust the federal government to do the right thing
                    </h3>
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-6">
                      In 1958, that number was 75%. We've lost faith in the system—and for good reason.
                    </p>
                    <div className="source-citation">
                      Source: <a href="https://www.pewresearch.org/politics/2024/06/24/public-trust-in-government-1958-2024/" target="_blank" rel="noopener noreferrer">Public Trust in Government: 1958-2024</a>, Pew Research Center
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Civic Literacy Crisis */}
              <div 
                ref={(el) => observeElement(el, 12)}
                className={`crisis-timeline-item ${visibleElements.has(12) ? 'visible' : ''}`}
              >
                <div className="relative max-w-5xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 lg:p-16 rounded-3xl border border-white/20 text-center">
                    <div className="crisis-number text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter mb-6 sm:mb-8">
                      70<span className="text-4xl sm:text-5xl lg:text-6xl">%</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">
                      Can't pass a basic civics test
                    </h3>
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-6">
                      They can't name Supreme Court justices or explain how laws get made. Democracy requires informed citizens.
                    </p>
                    <div className="source-citation">
                      Source: <a href="https://www.uschamberfoundation.org/civics/new-study-finds-alarming-lack-of-civic-literacy-among-americans" target="_blank" rel="noopener noreferrer">Civic Literacy Study 2024</a>, U.S. Chamber of Commerce Foundation
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Engagement Gap */}
              <div 
                ref={(el) => observeElement(el, 13)}
                className={`crisis-timeline-item ${visibleElements.has(13) ? 'visible' : ''}`}
              >
                <div className="relative max-w-5xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-8 sm:p-12 lg:p-16 rounded-3xl border border-white/20 text-center">
                    <div className="crisis-number text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter mb-6 sm:mb-8">
                      58% vs 25%
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">
                      Young white women vs Black men who voted in 2024
                    </h3>
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-6">
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
        </section>
        
        {/* The Uncomfortable Truth */}
        <section className="relative py-32 sm:py-40 px-4 sm:px-6 overflow-hidden">
          {/* Dynamic flowing background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto text-center space-y-20 text-white">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight">
                Most civic education is
                <br />
                <span className="bg-gradient-to-r from-red-400 via-pink-400 to-red-400 bg-clip-text text-transparent font-black">
                  teaching you to be powerless
                </span>
              </h2>
              <p className="text-xl sm:text-2xl lg:text-3xl text-slate-300 font-light leading-relaxed max-w-4xl mx-auto">
                They teach you how democracy is <em className="text-slate-400">supposed</em> to work.<br />
                <strong className="text-white text-2xl sm:text-3xl lg:text-4xl">We teach you how it actually works.</strong>
              </p>
            </div>
            
            {/* Flowing comparison - not boxy lists */}
            <div className="space-y-16 max-w-5xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-3xl blur-xl"></div>
                <div className="relative bg-white/5 backdrop-blur-sm p-8 sm:p-12 rounded-3xl border border-white/10">
                  <div className="text-center space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-red-300 mb-8">Traditional Civic Education Says:</h3>
                    <div className="text-lg sm:text-xl text-slate-300 space-y-4 font-light leading-relaxed">
                      <p>"Write your congressman and trust the process"</p>
                      <p>"Voting is your most important duty"</p>
                      <p>"The system works if you just participate"</p>
                      <p>"Both sides have valid points"</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="text-4xl sm:text-5xl text-white/30 font-light">⬇</div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-8 sm:p-12 rounded-3xl border border-white/20">
                  <div className="text-center space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-green-300 mb-8">CivicSense Shows You:</h3>
                    <div className="text-lg sm:text-xl text-white space-y-4 font-medium leading-relaxed">
                      <p>"Here's how lobbyists actually influence policy"</p>
                      <p>"Your local elections matter more than federal"</p>
                      <p>"Here's what's broken and how to fix it"</p>
                      <p>"Here's how to spot manipulation and build real power"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Smooth transition to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-slate-50 dark:to-transparent"></div>
        </section>

        {/* What Makes Us Different - More organic flow */}
        <section className="relative py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-50 dark:via-slate-100 dark:to-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-8">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-slate-900 tracking-tight">
                The civic education politicians
                <br />
                <span className="bg-gradient-to-r from-red-600 via-pink-600 to-red-600 bg-clip-text text-transparent font-black">
                  don't want you to have
                </span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            
            {/* Flowing cards - no rigid grid */}
            <div className="space-y-24 max-w-6xl mx-auto">
              {/* Unfiltered Reality */}
              <div 
                ref={(el) => observeElement(el, 20)}
                className={`organic-card ${visibleElements.has(20) ? 'visible' : ''} relative`}
              >
                <div className="absolute -inset-8 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-orange-500/5 rounded-[3rem] blur-2xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm p-8 sm:p-12 lg:p-16 rounded-[2.5rem] border border-slate-200/50 shadow-xl">
                  <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-1/3 text-center">
                      <div className="text-8xl mb-6 transform rotate-3">🔥</div>
                      <div className="text-6xl font-black text-red-500/20 tracking-tighter">01</div>
                    </div>
                    <div className="lg:w-2/3 space-y-6">
                      <h3 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
                        Unfiltered reality
                      </h3>
                      <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
                        We explain how power actually flows in America. Follow the money. Understand who really makes decisions. Learn why your vote for state legislature might matter more than your presidential vote.
                      </p>
                      <blockquote className="text-slate-600 italic text-lg border-l-4 border-red-500 pl-6">
                        "Most people think the president runs the country. The president wishes that were true."
                      </blockquote>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Warfare Defense */}
              <div 
                ref={(el) => observeElement(el, 21)}
                className={`organic-card ${visibleElements.has(21) ? 'visible' : ''} relative lg:ml-12`}
              >
                <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-[3rem] blur-2xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm p-8 sm:p-12 lg:p-16 rounded-[2.5rem] border border-slate-200/50 shadow-xl">
                  <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                    <div className="lg:w-1/3 text-center">
                      <div className="text-8xl mb-6 transform -rotate-3">🛡️</div>
                      <div className="text-6xl font-black text-blue-500/20 tracking-tighter">02</div>
                    </div>
                    <div className="lg:w-2/3 space-y-6">
                      <h3 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
                        Information warfare defense
                      </h3>
                      <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
                        Identify manipulation techniques in real time. Distinguish between facts and spin. Understand how disinformation campaigns actually work—and build immunity to them.
                      </p>
                      <blockquote className="text-slate-600 italic text-lg border-l-4 border-blue-500 pl-6">
                        "When you can spot the manipulation, you can't be manipulated."
                      </blockquote>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tactical Action */}
              <div 
                ref={(el) => observeElement(el, 22)}
                className={`organic-card ${visibleElements.has(22) ? 'visible' : ''} relative lg:mr-12`}
              >
                <div className="absolute -inset-8 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 rounded-[3rem] blur-2xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm p-8 sm:p-12 lg:p-16 rounded-[2.5rem] border border-slate-200/50 shadow-xl">
                  <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-1/3 text-center">
                      <div className="text-8xl mb-6 transform rotate-2">⚡</div>
                      <div className="text-6xl font-black text-green-500/20 tracking-tighter">03</div>
                    </div>
                    <div className="lg:w-2/3 space-y-6">
                      <h3 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
                        Tactical civic action
                      </h3>
                      <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
                        Learn how to research your representatives' actual voting records and funding. Understand ballot measures that affect your daily life. Build effective advocacy skills that work.
                      </p>
                      <blockquote className="text-slate-600 italic text-lg border-l-4 border-green-500 pl-6">
                        "Knowledge without action doesn't strengthen democracy."
                      </blockquote>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Stakes */}
        <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative max-w-5xl mx-auto text-center space-y-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight">
              Here's what's at stake
            </h2>
            <div className="space-y-12 max-w-4xl mx-auto">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-light leading-relaxed text-slate-300">
                Democracy survives when citizens are impossible to fool.<br />
                <span className="text-white font-semibold">It dies when they're easy to manipulate.</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="space-y-4 p-6 bg-white/5 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl">📊</div>
                  <h3 className="text-lg font-semibold">Misinformation spreads faster</h3>
                  <p className="text-slate-400 text-sm">
                    False stories spread 6x faster than true stories on social media. Critical thinking is your defense.
                  </p>
                </div>
                <div className="space-y-4 p-6 bg-white/5 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl">💰</div>
                  <h3 className="text-lg font-semibold">Dark money influences policy</h3>
                  <p className="text-slate-400 text-sm">
                    Billions in untraceable political spending shape laws. You need to know how to follow the money.
                  </p>
                </div>
                <div className="space-y-4 p-6 bg-white/5 rounded-2xl backdrop-blur-sm">
                  <div className="text-3xl">⚖️</div>
                  <h3 className="text-lg font-semibold">Local decisions affect daily life</h3>
                  <p className="text-slate-400 text-sm">
                    School funding, housing costs, policing—decided locally while everyone watches federal politics.
                  </p>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-medium text-white">
                Every day you stay confused is another day the system works exactly as intended.
              </div>
            </div>
          </div>
        </section>

        {/* How We Do It */}
        <section className="py-20 sm:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight mb-8">
                How we build civic warriors
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-light">
                We don't just inform—we transform. Every interaction is designed to make you harder to manipulate and impossible to ignore.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 h-full">
                  <div className="text-5xl mb-6">🧭</div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    Daily reality checks
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Every day, we break down the most important political developments. Not the theater—the real decisions that affect your life.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 h-full">
                  <div className="text-5xl mb-6">🎯</div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    Skills-based learning
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Through quizzes and interactive content, you develop the skills to analyze policy, spot bias, and think strategically about civic engagement.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 h-full">
                  <div className="text-5xl mb-6">⚡</div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    Action-oriented outcomes
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Every lesson connects to actionable steps. We measure success by behavioral change, not engagement metrics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join the Movement */}
        <section className="py-20 sm:py-32 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-5xl mx-auto text-center space-y-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight">
              Ready to become
              <br />
              <span className="gradient-text font-black">ungovernable by misinformation?</span>
            </h2>
            <div className="space-y-8">
              <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
                Join thousands of Americans who refuse to be confused, overwhelmed, or manipulated by political theater.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button 
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 rounded-full px-12 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                >
                  <Link href="/">Start Today's Quiz</Link>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="rounded-full px-12 py-4 text-lg font-semibold border-2 border-slate-300 dark:border-slate-600 hover:border-slate-900 dark:hover:border-slate-300 transform hover:scale-105 transition-all duration-300"
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