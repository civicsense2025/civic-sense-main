import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizQuestion } from "@/lib/quiz-data"
import { SourceMetadataCard } from "@/components/source-metadata-card"

interface QuestionExplanationProps {
  question: QuizQuestion
  className?: string
}

export function QuestionExplanation({ question, className }: QuestionExplanationProps) {
  const [showSources, setShowSources] = useState(false)

  return (
    <div className={className}>
      {/* Explanation text */}
      <div className="text-left max-w-2xl mx-auto space-y-6">
        <p className="text-slate-700 dark:text-slate-300 font-light leading-relaxed text-lg">
          {question.explanation}
        </p>
        
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
                    source={source}
                    showThumbnail={true}
                    compact={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 