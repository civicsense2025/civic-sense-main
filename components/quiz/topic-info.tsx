"use client"

import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import { useMemo, useEffect, useState } from "react"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { StartQuizButton } from "@/components/start-quiz-button"
import { HelpCircle, Info, BookOpen } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourceMetadataCard } from "@/components/source-metadata-card"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { dataService } from "@/lib/data-service"
import { questionOperations } from "@/lib/database"

interface TopicInfoProps {
  topicData: TopicMetadata
  onStartQuiz: () => void
  requireAuth?: boolean
  onAuthRequired?: () => void
  remainingQuizzes?: number
  isPartiallyCompleted?: boolean
  hasCompletedTopic?: boolean
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
  remainingQuizzes,
  isPartiallyCompleted = false,
  hasCompletedTopic = false
}: TopicInfoProps) {
  // Global audio integration
  const { autoPlayEnabled, playText } = useGlobalAudio()
  const [activeTab, setActiveTab] = useState("why-this-matters")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoadingSources, setIsLoadingSources] = useState(false)
  const [hasQuestions, setHasQuestions] = useState(false)
  const [isCheckingQuestions, setIsCheckingQuestions] = useState(true)
  
  // Check if the topic has questions
  useEffect(() => {
    async function checkQuestions() {
      setIsCheckingQuestions(true)
      try {
        if (topicData.topic_id) {
          const hasQuestionsResult = await dataService.checkTopicHasQuestions(topicData.topic_id)
          setHasQuestions(hasQuestionsResult)
        } else {
          setHasQuestions(false)
        }
      } catch (error) {
        console.error("Error checking if topic has questions:", error)
        setHasQuestions(false)
      } finally {
        setIsCheckingQuestions(false)
      }
    }
    
    checkQuestions()
  }, [topicData.topic_id])

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

  // Load questions when the sources tab is selected
  useEffect(() => {
    const loadQuestions = async () => {
      if (activeTab === "sources-citations" && questions.length === 0 && !isLoadingSources) {
        setIsLoadingSources(true)
        try {
          const questionsData = await dataService.getQuestionsByTopic(topicData.topic_id)
          setQuestions(questionsData)
        } catch (error) {
          console.error("Error loading questions for sources:", error)
        } finally {
          setIsLoadingSources(false)
        }
      }
    }
    
    loadQuestions()
  }, [activeTab, questions.length, topicData.topic_id, isLoadingSources])

  // Extract all unique sources from questions
  const allSources = useMemo(() => {
    const sourceMap = new Map()
    
    questions.forEach(question => {
      if (question.sources && question.sources.length > 0) {
        question.sources.forEach(source => {
          const key = `${source.name}-${source.url}`
          if (!sourceMap.has(key)) {
            sourceMap.set(key, { ...source, questions: [question.question_number] })
          } else {
            const existingSource = sourceMap.get(key)
            if (!existingSource.questions.includes(question.question_number)) {
              existingSource.questions.push(question.question_number)
            }
          }
        })
      }
    })
    
    return Array.from(sourceMap.values())
  }, [questions])

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

  const topicCompleted = hasCompletedTopic

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 py-8">
      {/* Quiz Button (positioned at the top right) */}
      <div className="flex justify-end mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StartQuizButton
                  label={!hasQuestions ? "Coming Soon" : topicCompleted ? "Retake Quiz" : "Begin Quiz"}
                  onClick={requireAuth ? onAuthRequired : onStartQuiz}
                  showPulse={!topicCompleted && hasQuestions}
                  remainingQuizzes={remainingQuizzes}
                  completed={topicCompleted}
                  isPartiallyCompleted={isPartiallyCompleted}
                  disabled={!hasQuestions || isCheckingQuestions}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!hasQuestions
                  ? "This quiz is coming soon! Check back later."
                  : "Complete today's civic quizzes and stay informed!"}
              </p>
              {remainingQuizzes !== undefined && hasQuestions && (
                <p className="text-xs mt-1">You have {remainingQuizzes} quizzes remaining today</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mb-8">
        {/* Header section with title, emoji, and description - full width */}
        <div className="mb-10">
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

        {/* Tabbed interface for "Why This Matters" and "Sources & Citations" */}
        <div className="mb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger 
                value="why-this-matters"
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Why This Matters
              </TabsTrigger>
              <TabsTrigger 
                value="sources-citations"
                className={"flex items-center gap-2 relative " + (allSources.length === 0 ? "opacity-50 cursor-not-allowed pointer-events-none bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600" : "")}
                disabled={allSources.length === 0}
              >
                <BookOpen className="h-4 w-4" />
                Sources & Citations
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-sm font-mono font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {allSources.length}
                </span>
              </TabsTrigger>
            </TabsList>
            
            {/* Why This Matters Tab Content */}
            <TabsContent value="why-this-matters" className="mt-0">
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
                      <h4 className="font-semibold font-mono text-slate-900 dark:text-slate-100 mb-2 text-base sm:text-lg">
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
            </TabsContent>
            
            {/* Sources & Citations Tab Content */}
            <TabsContent value="sources-citations" className="mt-0">
              {isLoadingSources ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-sm text-slate-600 dark:text-slate-300">Loading sources...</span>
                </div>
              ) : allSources.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    This quiz draws information from {allSources.length} credible source{allSources.length !== 1 ? 's' : ''}.
                  </p>
                  
                  {allSources.map((source, index) => (
                    <div key={index} className="space-y-1">
                      <SourceMetadataCard
                        source={source}
                        showThumbnail={true}
                        className="mb-2"
                      />
                      <div className="text-xs text-slate-500 dark:text-slate-400 pl-4">
                        Used in question{source.questions.length > 1 ? 's' : ''}: {source.questions.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg text-center">
                  <p className="text-slate-600 dark:text-slate-300">No sources available for this topic.</p>
                  <p className="text-xs text-slate-400 mt-2">Sources & Citations will appear here when available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="w-full rounded-xl border border-slate-200 dark:border-slate-700">
            <AccordionItem value="item-1" className="border-slate-200 dark:border-slate-700">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100">
                How do I earn points in quizzes?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                You earn points by answering questions correctly. Faster responses earn bonus points, and consecutive correct answers build combo multipliers.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-slate-200 dark:border-slate-700">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100">
                What are boosts and how do they work?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Boosts are special power-ups that can help you during quizzes. They include Time Extensions, Answer Hints, and Score Multipliers. Premium users get additional boost usage each day.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-slate-200 dark:border-slate-700">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100">
                How can I improve my civic knowledge skill rating?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                Taking daily quizzes consistently, reviewing explanations for questions you miss, and focusing on specific skill areas will help improve your civic knowledge ratings over time.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-slate-200 dark:border-slate-700">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100">
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
