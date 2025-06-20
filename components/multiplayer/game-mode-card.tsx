"use client"

import { Badge } from '@/components/ui/badge'
import { Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GameMode {
  id: string
  name: string
  description: string
  emoji: string
  features: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
  playerRange: [number, number]
  estimatedTime: string
  isPremium?: boolean
}

interface GameModeCardProps {
  mode: GameMode
  isSelected: boolean
  onSelect: (modeId: string) => void
  isPremium: boolean
  isPro: boolean
  className?: string
}

export function GameModeCard({ 
  mode, 
  isSelected, 
  onSelect, 
  isPremium, 
  isPro,
  className 
}: GameModeCardProps) {
  return (
    <button
      className={cn(
        "relative p-6 text-left transition-all duration-200 rounded-xl border",
        "hover:scale-[1.01] hover:shadow-sm",
        isSelected
          ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/30",
        className
      )}
      onClick={() => onSelect(mode.id)}
    >
      {mode.isPremium && !isPremium && !isPro && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="secondary" className="text-xs">
            Premium
          </Badge>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{mode.emoji}</span>
          <h4 className="text-base font-medium text-slate-900 dark:text-white">{mode.name}</h4>
        </div>
        
        <p className="text-sm font-light text-slate-600 dark:text-slate-400 leading-relaxed">
          {mode.description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {mode.playerRange[0]}-{mode.playerRange[1]}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {mode.estimatedTime}
          </span>
        </div>
      </div>
    </button>
  )
} 