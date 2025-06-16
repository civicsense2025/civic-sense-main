"use client"

import type { TopicMetadata } from "@/lib/quiz-data"
import { useMemo, useEffect } from "react"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { StartQuizButton } from "@/components/start-quiz-button"
import { HelpCircle, Info } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useGuestAccess } from "@/hooks/useGuestAccess"

interface TopicInfoProps {
  topicData: TopicMetadata
  onStartQuiz: () => void
  requireAuth?: boolean
  onAuthRequired?: () => void
  remainingQuizzes?: number
}

interface ParsedBlurb {
  title: string
  content: string
  emoji: string
}

export function TopicInfo({ 
  topicData, 
  onStartQuiz, 
  requireAuth = false, 
  onAuthRequired,
  remainingQuizzes 
}: TopicInfoProps) {
  // Global audio integration
  const { autoPlayEnabled, playText } = useGlobalAudio()
  
  // Parse the HTML content into structured blurbs
  const blurbs = useMemo(() => {
    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
    const parsed: ParsedBlurb[] = []
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = topicData.why_this_matters
    
    // Look for bullet points or structured content
    const listItems = tempDiv.querySelectorAll('li')
    
    if (listItems.length > 0) {
      // Parse list items
      listItems.forEach((item, index) => {
        if (index < numberEmojis.length) {
          const text = item.textContent || ''
          const colonIndex = text.indexOf(':')
          
          if (colonIndex > 0) {
            // Split on first colon to get title and content
            const title = text.substring(0, colonIndex).trim()
            const content = text.substring(colonIndex + 1).trim()
            
            parsed.push({
              title: title.replace(/^(Your|The)\s+/i, ''), // Clean up common prefixes
              content,
              emoji: numberEmojis[index]
            })
          } else {
            // No colon, treat first few words as title
            const words = text.split(' ')
            const title = words.slice(0, 2).join(' ')
            const content = words.slice(2).join(' ')
            
            parsed.push({
              title,
              content,
              emoji: numberEmojis[index]
            })
          }
        }
      })
    } else {
      // Parse paragraphs if no list items
      const paragraphs = tempDiv.querySelectorAll('p')
      paragraphs.forEach((p, index) => {
        if (index < numberEmojis.length) {
          const text = p.textContent || ''
          if (text.trim()) {
            const sentences = text.split('.')
            const title = sentences[0].trim()
            const content = sentences.slice(1).join('.').trim()
            
            parsed.push({
              title: title.length > 50 ? title.substring(0, 47) + '...' : title,
              content: content || title,
              emoji: numberEmojis[index]
            })
          }
        }
      })
    
      // Fallback: split by common patterns
      if (parsed.length === 0) {
        const text = tempDiv.textContent || ''
        const sections = text.split(/[•·▪▫]/).filter(s => s.trim())
        
        sections.forEach((section, index) => {
          if (index < numberEmojis.length && section.trim()) {
            const colonIndex = section.indexOf(':')
            
            if (colonIndex > 0) {
              const title = section.substring(0, colonIndex).trim()
              const content = section.substring(colonIndex + 1).trim()
              
              parsed.push({
                title: title.replace(/^(Your|The)\s+/i, ''),
                content,
                emoji: numberEmojis[index]
              })
            } else {
              const words = section.trim().split(' ')
              const title = words.slice(0, 3).join(' ')
              const content = words.slice(3).join(' ') || title
              
              parsed.push({
                title,
                content,
                emoji: numberEmojis[index]
              })
            }
          }
        })
      }
    }
    
    return parsed
  }, [topicData.why_this_matters])

  // Auto-play the topic title and all blurbs when autoplay is enabled
  useEffect(() => {
    if (autoPlayEnabled && topicData.topic_title) {
      // Build text to read: title + all blurbs
      let textToRead = `${topicData.topic_title}. Why this matters: `
      
      if (blurbs.length > 0) {
        // Add all blurbs
        textToRead += blurbs.map(blurb => `${blurb.title}. ${blurb.content}`).join('. ')
      } else if (topicData.why_this_matters) {
        // Fallback to raw content if no blurbs parsed
        const plainText = topicData.why_this_matters.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        textToRead += plainText.slice(0, 600) // Limit length
      }
      
      // Small delay to ensure UI is ready
      setTimeout(() => {
        playText(textToRead, { autoPlay: true })
      }, 1000)
    }
  }, [autoPlayEnabled, topicData.topic_title, topicData.why_this_matters, blurbs, playText])

  // FAQ data with structured schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I earn points in quizzes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You earn points by answering questions correctly. Faster responses earn bonus points, and consecutive correct answers build combo multipliers."
        }
      },
      {
        "@type": "Question",
        "name": "What are boosts and how do they work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Boosts are special power-ups that can help you during quizzes. They include Time Extensions, Answer Hints, and Score Multipliers. Premium users get additional boost usage each day."
        }
      },
      {
        "@type": "Question",
        "name": "How can I improve my civic knowledge skill rating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Taking daily quizzes consistently, reviewing explanations for questions you miss, and focusing on specific skill areas will help improve your civic knowledge ratings over time."
        }
      },
      {
        "@type": "Question",
        "name": "Can I retake quizzes I've already completed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can retake quizzes, but your daily quiz limit applies to both new and repeated quizzes. Premium users have unlimited quiz attempts."
        }
      }
    ]
  };

  const { hasCompletedTopic } = useGuestAccess()
  const topicCompleted = hasCompletedTopic(topicData.id)

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 py-8">
      <div className="mb-8">
        {/* Header section with title, emoji, and description */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="text-5xl sm:text-6xl mb-4">
                {topicData.emoji}
              </div>
              <h1 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-4">
                {topicData.topic_title}
              </h1>
              {topicData.description && (
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {topicData.description}
                </p>
              )}
            </div>
            
            {/* StartQuizButton moved to the right side */}
            <div className="flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {requireAuth ? (
                      <div>
                        <StartQuizButton 
                          label="Sign Up to Begin" 
                          onClick={onAuthRequired}
                          showPulse={true}
                          completed={topicCompleted}
                        />
                      </div>
                    ) : (
                      <div>
                        <StartQuizButton 
                          label="Begin Quiz" 
                          onClick={onStartQuiz} 
                          remainingQuizzes={remainingQuizzes}
                          showPulse={true}
                          completed={topicCompleted}
                        />
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete today's civic quizzes and stay informed!</p>
                    {remainingQuizzes !== undefined && (
                      <p className="text-xs mt-1">You have {remainingQuizzes} quizzes remaining today</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Why This Matters section - left aligned */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-6 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Why This Matters
          </h2>

          {/* Blurbs as cards */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {blurbs.map((blurb, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
              >
                <div className="text-xl flex-shrink-0 mt-1">
                  {blurb.emoji}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-base sm:text-lg">
                    {blurb.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs sm:text-sm">
                    {blurb.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Fallback if parsing fails */}
          {blurbs.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 rounded-2xl">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: topicData.why_this_matters }}
              />
            </div>
          )}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                How do I earn points in quizzes?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                You earn points by answering questions correctly. Faster responses earn bonus points, and consecutive correct answers build combo multipliers.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                What are boosts and how do they work?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Boosts are special power-ups that can help you during quizzes. They include Time Extensions, Answer Hints, and Score Multipliers. Premium users get additional boost usage each day.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                How can I improve my civic knowledge skill rating?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Taking daily quizzes consistently, reviewing explanations for questions you miss, and focusing on specific skill areas will help improve your civic knowledge ratings over time.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                Can I retake quizzes I've already completed?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Yes, you can retake quizzes, but your daily quiz limit applies to both new and repeated quizzes. Premium users have unlimited quiz attempts.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </div>
    </div>
  )
}
