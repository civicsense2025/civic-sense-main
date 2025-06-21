"use client"

import { NPCPersonality } from "@/lib/multiplayer-npcs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"

export interface WaitingPhaseProps {
  opponent: NPCPersonality
  onStart: () => void
}

export function WaitingPhase({ opponent, onStart }: WaitingPhaseProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">NPC Battle</h2>
        <p className="text-xl text-muted-foreground">
          Test your knowledge against {opponent.name}, a {opponent.skillLevel.toLowerCase()} AI opponent!
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="text-6xl">{opponent.emoji}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{opponent.name}</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>Skill Level:</strong> {opponent.skillLevel}
              </p>
              <p>
                <strong>Specialties:</strong> {opponent.specialties.join(", ")}
              </p>
              <p>
                <strong>Weaknesses:</strong> {opponent.weaknesses.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={onStart}>
          Start Battle
        </Button>
      </div>
    </div>
  )
} 