"use client"

import type { TopicMetadata } from "@/lib/quiz-data"
import { useMemo, useEffect } from "react"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { StartQuizButton } from "@/components/start-quiz-button"

interface TopicInfoProps {
  topicData: TopicMetadata
  onStartQuiz: () => void
  requireAuth?: boolean
  onAuthRequired?: () => void
}

interface ParsedBlurb {
  title: string
  content: string
  emoji: string
}

export function TopicInfo({ topicData, onStartQuiz, requireAuth = false, onAuthRequired }: TopicInfoProps) {
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
    const paragraphs = tempDiv.querySelectorAll('p')
    
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
    } else if (paragraphs.length > 1) {
      // Parse paragraphs if no list items
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
    } else {
      // Fallback: split by common patterns
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

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 py-8">
      <div className="mb-8">
        {/* Quiz title and emoji */}
        <div className="mb-6 text-center">
          <div className="text-6xl sm:text-8xl mb-4">
            {topicData.emoji}
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-6">
            {topicData.topic_title}
          </h1>

          {/* Begin button placed above Why This Matters for better mobile UX */}
          <div className="flex justify-center mb-6">
            {requireAuth ? (
              <StartQuizButton label="Sign Up to Begin" onClick={onAuthRequired} />
            ) : (
              <StartQuizButton label="Begin" onClick={onStartQuiz} />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
            Why This Matters
          </h2>
        </div>

        {/* Blurbs as a single-column list */}
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
    </div>
  )
}
