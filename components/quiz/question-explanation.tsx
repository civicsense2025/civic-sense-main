import type { QuizQuestion } from "@/lib/quiz-data"
import { SourceMetadataCard } from "@/components/source-metadata-card"

interface QuestionExplanationProps {
  question: QuizQuestion
  className?: string
}

export function QuestionExplanation({ question, className }: QuestionExplanationProps) {
  return (
    <div className={className}>
      {/* Explanation text */}
      <div className="text-left max-w-2xl mx-auto space-y-6">
        <p className="text-slate-700 dark:text-slate-300 font-light leading-relaxed text-lg">
          {question.explanation}
        </p>
        
        {/* Sources using the existing SourceMetadataCard component */}
        {question.sources && question.sources.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sources</p>
              <div className="grid gap-3">
                {question.sources.map((source, index) => (
                  <SourceMetadataCard
                    key={index}
                    source={source}
                    showThumbnail={true}
                    compact={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 