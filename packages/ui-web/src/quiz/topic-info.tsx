"use client"

import type { TopicMetadata, QuizQuestion } from '@civicsense/shared/quiz-data'
import { useMemo, useEffect, useState, useCallback } from "react"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { StartQuizButton } from "@/components/start-quiz-button"
import { CreateRoomDialog } from "@/components/multiplayer/create-room-dialog"
import { JoinRoomDialog } from "@/components/multiplayer/join-room-dialog"
import { HelpCircle, Info, BookOpen, Users, UserPlus, Settings } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { SourceMetadataCard } from "@/components/source-metadata-card"
import { EnhancedSocialShare } from "@/components/enhanced-social-share"
import { useGuestAccess } from '@civicsense/shared/useGuestAccess'
import { dataService } from '@civicsense/shared/data-service'
import { questionOperations } from '@civicsense/shared/database'
import { cn } from '../../utils'
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { QuizGameMode, QuizModeConfig, FULL_MODE_CONFIGS } from '@civicsense/shared/types/quiz'
import { PremiumFeature } from '@civicsense/shared/premium'
import { QuizModeSelector } from "@/components/quiz/quiz-mode-selector"
import { TopicLanguageSwitcher } from "../ui/language-switcher-topic"
import { useTranslatedContent } from '@civicsense/shared/use-translated-content'

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
  
  // Translation support
  const { 
    getTranslatedItem, 
    getAvailableLanguages, 
    currentLanguage,
    isTranslated 
  } = useTranslatedContent(topicData)
  
  // Get translated topic data
  const translatedTopic = getTranslatedItem() || topicData
  const availableLanguages = getAvailableLanguages()
  
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
    tempDiv.innerHTML = translatedTopic.why_this_matters
    
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
  }, [translatedTopic.why_this_matters])

  // Auto-play the topic title and all blurbs when autoplay is enabled
  useEffect(() => {
    if (autoPlayEnabled && translatedTopic.topic_title) {
      // Build text to read: title + all blurbs
      let textToRead = `${translatedTopic.topic_title}. Why this matters: `
      
      if (blurbs.length > 0) {
        // Add all blurbs
        textToRead += blurbs.map(blurb => `${blurb.title}. ${blurb.content}`).join('. ')
      } else if (translatedTopic.why_this_matters) {
        // Fallback to raw content if no blurbs parsed
        const plainText = translatedTopic.why_this_matters.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        textToRead += plainText.slice(0, 600) // Limit length
      }
      
      // Small delay to ensure UI is ready
      setTimeout(() => {
        playText(textToRead, { autoPlay: true })
      }, 1000)
    }
  }, [autoPlayEnabled, translatedTopic.topic_title, translatedTopic.why_this_matters, blurbs, playText])

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
    <div className={cn('flex flex-col h-full', className)}>
      {/* Hero Section - Enhanced hierarchy */}
      <div className="mb-8 lg:mb-12">
        <div className="text-center lg:text-left space-y-6">
          {/* Topic emoji - larger and more prominent */}
          <div className="text-6xl sm:text-7xl lg:text-8xl">
            {topicData.emoji}
          </div>
          
          {/* Topic title - much larger and more prominent */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
              {translatedTopic.topic_title}
            </h1>
            
            {/* Date and metadata with language switcher */}
            <div className="flex items-center justify-center lg:justify-start gap-3 text-sm text-slate-500 dark:text-slate-400">
              <time className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {new Date(topicData.date).toLocaleDateString('en-US', { 
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
              {hasQuestions && !isCheckingQuestions && (
                <Badge variant="secondary" className="text-xs">
                  Interactive Quiz Available
                </Badge>
              )}
              {isTranslated && (
                <Badge variant="outline" className="text-xs">
                  Translated
                </Badge>
              )}
            </div>
            
            {/* Language Switcher */}
            <div className="flex justify-center lg:justify-start">
              <TopicLanguageSwitcher 
                availableLanguages={availableLanguages}
                className="inline-flex"
                contentType="topic"
                contentId={topicData.topic_id}
                contentData={topicData}
              />
            </div>
            
            {/* Description with better typography */}
            {translatedTopic.description && (
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                {translatedTopic.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
        
        {/* Left Column: Content (2/3 width on desktop) */}
        <div className="flex-1 xl:w-2/3 space-y-8">
          
          {/* Quiz Action Section - Mobile First, more prominent */}
          <div className="xl:hidden">
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-lg">
              <CardContent className="p-6">
                {hasQuestions && !isCheckingQuestions ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Ready to Test Your Knowledge?
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Take this interactive quiz to see how much you know
                      </p>
                    </div>
                    
                    <QuizModeSelector
                      selectedMode={selectedMode}
                      onModeSelect={onModeChange || (() => {})}
                      isPremium={isPremium}
                      hasFeatureAccess={hasFeatureAccess || (() => false)}
                      onLoginClick={onAuthRequired || (() => {})}
                      className="mt-4"
                    />
                    
                    {/* Quiz count display for mobile */}
                    {remainingQuizzes !== undefined && hasQuestions && !isPremium && (
                      <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {remainingQuizzes} quiz{remainingQuizzes === 1 ? '' : 'es'} remaining today
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        Quiz Coming Soon
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        {isCheckingQuestions ? "Checking quiz availability..." : "Interactive quiz for this topic is being prepared"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Tabbed interface for "Why This Matters" and "Sources & Citations" */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 dark:bg-slate-800 p-1">
                <TabsTrigger 
                  value="why-this-matters"
                  className="flex items-center gap-2 text-sm font-medium h-10"
                >
                  <Info className="w-4 h-4" />
                  Why This Matters
                </TabsTrigger>
                <TabsTrigger 
                  value="sources"
                  className="flex items-center gap-2 text-sm font-medium h-10"
                >
                  <BookOpen className="w-4 h-4" />
                  Sources ({allSources.length})
                </TabsTrigger>
              </TabsList>

              {/* Why This Matters Tab */}
              <TabsContent value="why-this-matters" className="mt-6 space-y-6">
                {blurbs.length > 0 ? (
                  <div className="grid gap-4 sm:gap-6">
                    {blurbs.map((blurb, index) => (
                      <Card key={index} className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 text-2xl">
                              {blurb.emoji}
                            </div>
                            <div className="flex-1 space-y-2">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                                {blurb.title}
                              </h3>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {blurb.content}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6">
                      <div 
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: translatedTopic.why_this_matters }}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sources Tab */}
              <TabsContent value="sources" className="mt-6">
                {isLoadingSources ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                          <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : allSources.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        All information in this quiz is sourced from verified, credible sources
                      </p>
                    </div>
                    <div className="grid gap-4">
                                             {allSources.map((source, index) => (
                         <SourceMetadataCard
                           key={index}
                           source={source}
                         />
                       ))}
                    </div>
                  </div>
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="p-8 text-center">
                      <div className="space-y-3">
                        <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                          Sources Loading
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Sources and citations will appear when the quiz is available
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Social Sharing - moved to bottom with better integration */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <EnhancedSocialShare
              title={translatedTopic.topic_title}
              description={translatedTopic.description || "Test your civic knowledge with this important topic"}
              emoji={topicData.emoji || "🏛️"}
              type="topic"
            />
          </div>
        </div>

        {/* Right Column: Quiz Selector (1/3 width on desktop) */}
        <div className="hidden xl:block xl:w-1/3">
          <div className="sticky top-8 space-y-6">
            {hasQuestions && !isCheckingQuestions ? (
              <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                <CardContent className="p-6">
                  <QuizModeSelector
                    selectedMode={selectedMode}
                    onModeSelect={onModeChange || (() => {})}
                    isPremium={isPremium}
                    hasFeatureAccess={hasFeatureAccess || (() => false)}
                    onLoginClick={onAuthRequired || (() => {})}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Quiz Coming Soon
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isCheckingQuestions ? "Checking availability..." : "Interactive quiz is being prepared"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Quiz count for desktop */}
            {remainingQuizzes !== undefined && hasQuestions && !isPremium && (
              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">{remainingQuizzes}</span> quiz{remainingQuizzes === 1 ? '' : 'es'} remaining today
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  )
}
