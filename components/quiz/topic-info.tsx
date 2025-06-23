"use client"

import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import { useMemo, useEffect, useState, useCallback } from "react"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { StartQuizButton } from "@/components/start-quiz-button"
import { CreateRoomDialog } from "@/components/multiplayer/create-room-dialog"
import { JoinRoomDialog } from "@/components/multiplayer/join-room-dialog"
import { HelpCircle, Info, BookOpen, Users, UserPlus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourceMetadataCard } from "@/components/source-metadata-card"
import { EnhancedSocialShare } from "@/components/enhanced-social-share"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { dataService } from "@/lib/data-service"
import { questionOperations } from "@/lib/database"
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { QuizGameMode, QuizModeConfig, FULL_MODE_CONFIGS } from '@/lib/types/quiz'
import { PremiumFeature } from '@/lib/premium'
import { QuizModeSelector } from "@/components/quiz/quiz-mode-selector"

interface TopicInfoProps {
  topicData: TopicMetadata
  onStartQuiz: () => void
  requireAuth?: boolean
  onAuthRequired?: () => void
  remainingQuizzes?: number
  isPartiallyCompleted?: boolean
  hasCompletedTopic?: boolean
  questions?: QuizQuestion[] // Optional pre-loaded questions
  className?: string
  selectedMode?: QuizGameMode
  onModeChange?: (mode: QuizGameMode) => void
  modeConfig?: QuizModeConfig
  onModeConfigChange?: (config: QuizModeConfig) => void
  isPremium?: boolean
  hasFeatureAccess?: (feature: PremiumFeature) => boolean
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
  hasCompletedTopic = false,
  questions: preloadedQuestions = [],
  className,
  selectedMode = 'standard',
  onModeChange,
  modeConfig = FULL_MODE_CONFIGS.standard,
  onModeConfigChange,
  isPremium = false,
  hasFeatureAccess
}: TopicInfoProps) {

  const { autoPlayEnabled, playText } = useGlobalAudio()
  const [activeTab, setActiveTab] = useState("why-this-matters")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoadingSources, setIsLoadingSources] = useState(true)
  const [hasQuestions, setHasQuestions] = useState(false)
  const [isCheckingQuestions, setIsCheckingQuestions] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize state based on pre-loaded questions
  useEffect(() => {
    if (preloadedQuestions.length > 0) {
      console.log(`🚀 TopicInfo: Using ${preloadedQuestions.length} preloaded questions for ${topicData.topic_id}`)
      setQuestions(preloadedQuestions)
      setHasQuestions(true)
      setIsCheckingQuestions(false)
      setIsLoadingSources(false)
    } else {
      // Only check if topic has questions when no preloaded questions are provided
      setIsCheckingQuestions(true)
      checkQuestionsAndLoad()
    }
  }, [preloadedQuestions, topicData.topic_id])

  // Check if the topic has questions and load them (only when no preloaded questions)
  async function checkQuestionsAndLoad() {
    try {
      if (topicData.topic_id) {
        console.log(`📥 TopicInfo: Checking and loading questions for ${topicData.topic_id}`)
        
        // Check if questions exist first with proper database join
        const hasQuestionsResult = await dataService.checkTopicHasQuestions(topicData.topic_id)
        setHasQuestions(hasQuestionsResult)
        
        if (hasQuestionsResult) {
          // Load the questions for source extraction using database queries with joins
          setIsLoadingSources(true)
          try {
            const questionsData = await dataService.getQuestionsByTopic(topicData.topic_id)
            const validQuestions = Array.isArray(questionsData) ? questionsData : []
            setQuestions(validQuestions)
            console.log(`✅ TopicInfo: Loaded ${validQuestions.length} questions from database for ${topicData.topic_id}`)
            
            // If database returned 0 questions but check said there were some, log as warning
            if (validQuestions.length === 0 && hasQuestionsResult) {
              console.warn(`⚠️ TopicInfo: Database query returned 0 questions despite hasQuestions check being true for ${topicData.topic_id}`)
              setHasQuestions(false)
            }
          } catch (error) {
            console.error("Error loading questions from database:", error)
            setQuestions([])
            setHasQuestions(false)
          } finally {
            setIsLoadingSources(false)
          }
        } else {
          console.log(`📊 TopicInfo: No questions found in database for ${topicData.topic_id}`)
          setQuestions([])
          setIsLoadingSources(false)
        }
      } else {
        console.warn('TopicInfo: No topic_id provided')
        setHasQuestions(false)
        setQuestions([])
        setIsLoadingSources(false)
      }
    } catch (error) {
      console.error("Error checking if topic has questions:", error)
      setHasQuestions(false)
      setQuestions([])
      setIsLoadingSources(false)
    } finally {
      setIsCheckingQuestions(false)
    }
  }

  // Parse the HTML content into structured blurbs
  const blurbs = useMemo(() => {
    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
    const parsed: ParsedBlurb[] = []
    
    // Helper function to capitalize first actual word
    const capitalizeFirstWord = (text: string): string => {
      return text.replace(/^([^a-zA-Z]*)(.)/, (match, punctuation, firstLetter) => {
        return punctuation + firstLetter.toUpperCase()
      })
    }
    
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
              title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')), // Clean up common prefixes and capitalize
              content: capitalizeFirstWord(content),
              emoji: numberEmojis[index]
            })
          } else {
            // No colon, treat first few words as title
            const words = text.split(' ')
            const title = words.slice(0, 2).join(' ')
            const content = words.slice(2).join(' ')
            
            parsed.push({
              title: capitalizeFirstWord(title),
              content: capitalizeFirstWord(content),
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
              title: capitalizeFirstWord(title.length > 50 ? title.substring(0, 47) + '...' : title),
              content: capitalizeFirstWord(content || title),
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
                title: capitalizeFirstWord(title.replace(/^(Your|The)\s+/i, '')),
                content: capitalizeFirstWord(content),
                emoji: numberEmojis[index]
              })
            } else {
              const words = section.trim().split(' ')
              const title = words.slice(0, 3).join(' ')
              const content = words.slice(3).join(' ') || title
              
              parsed.push({
                title: capitalizeFirstWord(title),
                content: capitalizeFirstWord(content),
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

  // Extract and process sources from questions
  const allSources = useMemo(() => {
    if (questions.length === 0) {
      return []
    }

    const sourceMap = new Map()
    
    console.log('🔍 TopicInfo: Processing questions for sources:', {
      questionsCount: questions.length,
      topicId: topicData.topic_id,
      questionsPreview: questions.slice(0, 2).map(q => ({
        question_number: q.question_number,
        has_sources: !!(q.sources && q.sources.length > 0),
        sources_count: q.sources?.length || 0
      }))
    })
    
    questions.forEach((question, index) => {
      // Debug logging for individual questions
      console.log(`📋 Processing question ${index + 1}:`, {
        question_number: question.question_number,
        has_sources: !!(question.sources && Array.isArray(question.sources)),
        sources_count: question.sources?.length || 0,
        topic_id: question.topic_id
      })
      
      if (question.sources && Array.isArray(question.sources) && question.sources.length > 0) {
        question.sources.forEach((source: any, sourceIndex) => {
          console.log(`📎 Processing source ${sourceIndex + 1} for question ${question.question_number}:`, source)
          
          // Handle different source formats
          let name = ''
          let url = ''
          
          if (source && typeof source === 'object') {
            name = source.name || source.title || source.source_name || ''
            url = source.url || source.link || source.href || ''
          } else if (typeof source === 'string' && source.startsWith('http')) {
            url = source
            name = source
          }
          
          if (url && url.trim() !== '') {
            const displayName = name && name.trim() !== '' ? name.trim() : url
            
            // Use question_number as the identifier, with fallback
            const questionId = question.question_number || (index + 1)
            
            // Simple deduplication by URL
            if (!sourceMap.has(url)) {
              sourceMap.set(url, { 
                name: displayName,
                url: url,
                questions: [questionId],
                // Include any additional metadata
                ...(source.title && { title: source.title }),
                ...(source.description && { description: source.description }),
                ...(source.domain && { domain: source.domain })
              })
              console.log(`✅ Added new source: ${displayName} for question ${questionId}`)
            } else {
              // Add question number if not already present
              const existing = sourceMap.get(url)
              if (!existing.questions.includes(questionId)) {
                existing.questions.push(questionId)
                console.log(`🔗 Linked existing source to question ${questionId}`)
              }
            }
          } else {
            console.warn(`⚠️ Invalid source URL for question ${question.question_number}:`, source)
          }
        })
      } else {
        console.log(`ℹ️ Question ${question.question_number} has no sources`)
      }
    })
    
    // Convert to array and sort
    const sources = Array.from(sourceMap.values()).sort((a, b) => {
      // Sort by number of questions (descending), then alphabetically
      if (b.questions.length !== a.questions.length) {
        return b.questions.length - a.questions.length
      }
      return a.name.localeCompare(b.name)
    })
    
    console.log('🎯 Processed sources:', sources.length, sources)
    return sources
  }, [questions, topicData.topic_id])

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
    <div className={cn('flex flex-col h-full px-4 sm:px-8 py-8', className)}>
      {/* Header section with title, emoji, description, and quiz selector in a flex row */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Title and description section - 2/3 width */}
        <div className="flex-grow lg:w-2/3">
          <div className="text-5xl sm:text-6xl mb-4">
            {topicData.emoji}
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-4">
            {topicData.topic_title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
            <span className="font-mono">{new Date(topicData.date).toLocaleDateString('en-US', { 
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
          {topicData.description && (
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {topicData.description}
            </p>
          )}
        </div>

        {/* Quiz selector section - 1/3 width */}
        <div className="lg:w-1/3">
          <div className="sticky top-4">
            <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-4 backdrop-blur-sm">
              {hasQuestions && !isCheckingQuestions ? (
                <>
                  {/* Premium features gate */}
                  {isPremium ? (
                    <QuizModeSelector
                      selectedMode={selectedMode}
                      onModeSelect={onStartQuiz}
                      isPremium={isPremium}
                      hasFeatureAccess={hasFeatureAccess || (() => false)}
                    />
                  ) : (
                    <QuizModeSelector
                      selectedMode={selectedMode}
                      onModeSelect={onStartQuiz}
                      isPremium={false}
                      hasFeatureAccess={(feature) => {
                        // Individual feature flags for free tier
                        switch (feature) {
                          case 'custom_decks':
                          case 'historical_progress':
                          case 'advanced_analytics':
                          case 'spaced_repetition':
                          case 'learning_insights':
                          case 'priority_support':
                          case 'offline_mode':
                          case 'export_data':
                            return false;
                          default:
                            return true; // Allow basic features by default
                        }
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    {!hasQuestions ? "Quiz coming soon!" : "Loading quiz options..."}
                  </p>
                </div>
              )}
              
              {/* Quiz count display - only show for non-premium users */}
              {remainingQuizzes !== undefined && hasQuestions && !isPremium && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {remainingQuizzes} quizzes remaining today
                    <span className="block mt-1 text-xs">
                      Upgrade to premium for unlimited quizzes
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Sharing Section */}
      <div className="mb-10">
        <EnhancedSocialShare
          title={topicData.topic_title}
          description={topicData.description || "Test your civic knowledge with this important topic"}
          emoji={topicData.emoji || "🏛️"}
          type="topic"
        />
      </div>

      {/* Rest of the content */}
      <div className="mb-8">
        {/* Tabbed interface for "Why This Matters" and "Sources & Citations" */}
        <div className="mb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger 
                value="why-this-matters"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Info className="h-4 w-4" />
                <span className="hidden xs:inline">Why This Matters</span>
                <span className="xs:hidden">Why This Matters</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sources-citations"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden xs:inline">Sources & Citations</span>
                <span className="xs:hidden">Sources</span>
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
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
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
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
                    <div key={index} className="space-y-2">
                      <SourceMetadataCard
                        source={source}
                        showThumbnail={true}
                        className="mb-1"
                      />
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pl-4">
                        <span>
                          Used in question{source.questions.length > 1 ? 's' : ''}: {source.questions
                            .slice()
                            .sort((a: number, b: number) => a - b)
                            .join(', ')}
                        </span>
                        {source.questions.length > 1 && (
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            {source.questions.length} questions
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : questions.length > 0 ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-amber-600 dark:text-amber-400 mt-1">⚠️</div>
                    <div>
                      <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                        Sources temporarily unavailable
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        This quiz has {questions.length} question{questions.length !== 1 ? 's' : ''}, but source information is currently being processed. Sources & citations will appear here once available.
                      </p>
                    </div>
                  </div>
                </div>
              ) : hasQuestions ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 dark:text-blue-400 mt-1">ℹ️</div>
                    <div>
                      <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                        Questions loading...
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        This topic has questions available. Sources & citations will appear once the questions finish loading.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-orange-600 dark:text-orange-400 mt-1">🚧</div>
                    <div className="text-center w-full">
                      <p className="text-orange-800 dark:text-orange-200 font-medium mb-2">
                        Quiz content coming soon
                      </p>
                      <p className="text-orange-700 dark:text-orange-300 text-sm mb-3">
                        This topic is being prepared with curated questions and verified sources. We're working to add comprehensive quiz content for this important civic topic.
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Check back soon or explore other available topics while we prepare this one!
                      </p>
                    </div>
                  </div>
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
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-left justify-start">
                How do I earn points in quizzes?
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4 text-slate-600 dark:text-slate-400">
                You earn points by answering questions correctly. Faster responses earn bonus points, and consecutive correct answers build combo multipliers.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-slate-200 dark:border-slate-700">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-left justify-start">
                What are boosts and how do they work?
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4 text-slate-600 dark:text-slate-400">
                Boosts are special power-ups that can help you during quizzes. They include Time Extensions, Answer Hints, and Score Multipliers. Premium users get additional boost usage each day.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-slate-200 dark:border-slate-700">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-left justify-start">
                How can I improve my civic knowledge skill rating?
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4 text-slate-600 dark:text-slate-400">
                Taking daily quizzes consistently, reviewing explanations for questions you miss, and focusing on specific skill areas will help improve your civic knowledge ratings over time.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-slate-200 dark:border-slate-700">
              <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-left justify-start">
                Can I retake quizzes I've already completed?
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4 text-slate-600 dark:text-slate-400">
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
