"use client"

import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { cn } from "@civicsense/shared/lib/utils"

interface BattlePlayerPanelProps {
  name: string
  score: number
  emoji: string
  isNPC?: boolean
  className?: string
}

export function BattlePlayerPanel({
  name,
  score,
  emoji,
  isNPC = false,
  className
}: BattlePlayerPanelProps) {
  return (
    <Card className={cn("p-4 w-48", className)}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <h3 className="font-medium text-sm truncate">{name}</h3>
            {isNPC && (
              <Badge variant="secondary" className="text-xs">
                AI
              </Badge>
            )}
          </div>
          <div className="text-lg font-bold">{score.toLocaleString()}</div>
        </div>
      </div>
    </Card>
  )
} 