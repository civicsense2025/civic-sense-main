"use client"

interface ProTip {
  emoji: string
  text: string
}

const PRO_TIPS: ProTip[] = [
  {
    emoji: "🤖",
    text: "AI players adapt to your skill level"
  },
  {
    emoji: "🧪", 
    text: "Learning Lab encourages deep discussion"
  },
  {
    emoji: "⚡",
    text: "Speed rounds test quick decision-making"
  },
  {
    emoji: "🎯",
    text: "Mix humans and AI for diverse perspectives"
  }
]

interface ProTipsProps {
  className?: string
}

export function ProTips({ className }: ProTipsProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Pro Tips</h4>
      
      <div className="flex flex-wrap gap-2">
        {PRO_TIPS.map((tip, index) => (
          <div 
            key={index}
            className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-full px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
          >
            <span className="text-sm flex-shrink-0">{tip.emoji}</span>
            <span className="font-light">{tip.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 