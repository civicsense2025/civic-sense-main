"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Settings, 
  Clock, 
  Target, 
  Brain, 
  Zap, 
  Users,
  Bot,
  Trophy,
  BookOpen,
  MessageSquare
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'

export interface GameConfig {
  gameMode: string
  questionCount: number
  timePerQuestion: number
  difficultyAdaptation: boolean
  competitiveMode: boolean
  explanationsEnabled: boolean
  hintSystem: boolean
  chatEnabled: boolean
  maxPlayers: number
  allowNPCs: boolean
  npcPersonalities: string[]
}

interface GameSettingsProps {
  config: GameConfig
  onUpdate: (updates: Partial<GameConfig>) => void
  isHost: boolean
  gameMode: {
    id: string
    name: string
    features: string[]
    playerRange: [number, number]
  }
  className?: string
}

export function GameSettings({ config, onUpdate, isHost, gameMode, className }: GameSettingsProps) {
  const [expanded, setExpanded] = useState(false)

  const questionCountOptions = [5, 10, 15, 20, 25]
  const timeOptions = [15, 30, 45, 60, 90]

  const handleQuestionCountChange = (count: number) => {
    if (isHost) {
      onUpdate({ questionCount: count })
    }
  }

  const handleTimeChange = (time: number) => {
    if (isHost) {
      onUpdate({ timePerQuestion: time })
    }
  }

  const handleMaxPlayersChange = (count: number) => {
    if (isHost && count >= gameMode.playerRange[0] && count <= gameMode.playerRange[1]) {
      onUpdate({ maxPlayers: count })
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Game Settings
          </div>
          {isHost && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Less' : 'More'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Mode Display */}
        <div>
          <Label className="text-sm font-medium">Game Mode</Label>
          <div className="mt-1">
            <Badge variant="outline" className="capitalize">
              {gameMode.name}
            </Badge>
          </div>
        </div>

        {/* Basic Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Question Count */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Questions
            </Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {questionCountOptions.map((count) => (
                <Button
                  key={count}
                  variant={config.questionCount === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuestionCountChange(count)}
                  disabled={!isHost}
                  className="px-3"
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Per Question */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time (seconds)
            </Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {timeOptions.map((time) => (
                <Button
                  key={time}
                  variant={config.timePerQuestion === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeChange(time)}
                  disabled={!isHost}
                  className="px-3"
                >
                  {time}s
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Count */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Max Players
          </Label>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: gameMode.playerRange[1] - gameMode.playerRange[0] + 1 }, (_, i) => {
              const count = gameMode.playerRange[0] + i
              return (
                <Button
                  key={count}
                  variant={config.maxPlayers === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMaxPlayersChange(count)}
                  disabled={!isHost}
                  className="px-3"
                >
                  {count}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Experience Toggles */}
        <div className="space-y-3">
          <Separator />
          <Label className="text-sm font-medium">Experience Settings</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Competitive Mode</span>
              </div>
              <Switch
                checked={config.competitiveMode}
                onCheckedChange={(checked) => isHost && onUpdate({ competitiveMode: checked })}
                disabled={!isHost}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Detailed Explanations</span>
              </div>
              <Switch
                checked={config.explanationsEnabled}
                onCheckedChange={(checked) => isHost && onUpdate({ explanationsEnabled: checked })}
                disabled={!isHost}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Hint System</span>
              </div>
              <Switch
                checked={config.hintSystem}
                onCheckedChange={(checked) => isHost && onUpdate({ hintSystem: checked })}
                disabled={!isHost}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Chat During Game</span>
              </div>
              <Switch
                checked={config.chatEnabled}
                onCheckedChange={(checked) => isHost && onUpdate({ chatEnabled: checked })}
                disabled={!isHost}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Allow AI Players</span>
              </div>
              <Switch
                checked={config.allowNPCs}
                onCheckedChange={(checked) => isHost && onUpdate({ allowNPCs: checked })}
                disabled={!isHost}
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings (Expandable) */}
        {expanded && isHost && (
          <div className="space-y-3">
            <Separator />
            <Label className="text-sm font-medium">Advanced Settings</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Adaptive Difficulty</span>
                </div>
                <Switch
                  checked={config.difficultyAdaptation}
                  onCheckedChange={(checked) => onUpdate({ difficultyAdaptation: checked })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Settings Summary */}
        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>🎯 {config.questionCount} questions • ⏱️ {config.timePerQuestion}s each</p>
            <p>👥 Up to {config.maxPlayers} players • {config.allowNPCs ? '🤖 AI enabled' : '🚫 No AI'}</p>
            <p>
              {config.competitiveMode ? '🏆 Competitive' : '🤝 Collaborative'} • 
              {config.explanationsEnabled ? ' 📚 Explanations' : ' ⚡ Quick play'}
            </p>
          </div>
        </div>

        {!isHost && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              Only the host can change game settings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 