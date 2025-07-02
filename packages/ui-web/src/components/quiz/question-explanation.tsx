import { useState, memo } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "../ui/button"
import type { QuizQuestion } from "@civicsense/shared/lib/quiz-data"
import { SourceMetadataCard } from "@/components/source-metadata-card"
import { cn } from "../../utils"
import { GlossaryLinkText } from '@/components/glossary/glossary-link-text'

interface QuestionExplanationProps {
  question: QuizQuestion
  className?: string
}

export const QuestionExplanation = memo(function QuestionExplanation({ 
  question, 
  className 
}: QuestionExplanationProps) {
  const [showSources, setShowSources] = useState(false)

  // Don't render if no explanation
  if (!question.explanation) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Explanation */}
      <div 
        className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
        data-audio-content="true"
      >
        <GlossaryLinkText text={question.explanation} />
      </div>
      
      {/* Collapsible Sources Section */}
      {question.sources && question.sources.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <Button
            onClick={() => setShowSources(!showSources)}
            variant="ghost"
            className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            <span>View Sources ({question.sources.length})</span>
            {showSources ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {showSources && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {question.sources.map((source, index) => (
                <SourceMetadataCard
                  key={index}
                  source={{
                    ...source,
                    name: source.title
                  }}
                  showThumbnail={true}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// Add displayName for easier debugging
QuestionExplanation.displayName = 'QuestionExplanation' 