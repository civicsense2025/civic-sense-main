import { Button } from "@/components/ui/button"

interface CompletedPhaseProps {
  onComplete: () => void
}

export function CompletedPhase({ onComplete }: CompletedPhaseProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-green-600">
          🎉 Game Complete!
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Great job everyone! Check the leaderboard to see how you did.
        </p>
      </div>
      
      <Button onClick={onComplete} size="lg" className="px-8">
        Continue
      </Button>
    </div>
  )
} 