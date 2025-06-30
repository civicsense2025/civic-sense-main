import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { X, Crown, Settings, Users, Zap, MessageCircle, Timer, Trophy, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import useUIStrings from '@/apps/mobile/lib/hooks/useUIStrings'

interface HostSettings {
  allowNewPlayers: boolean
  allowBoosts: boolean
  allowHints: boolean
  autoAdvanceQuestions: boolean
  showRealTimeScores: boolean
  chatEnabled: boolean
}

interface HostSettingsMenuProps {
  settings: HostSettings
  onSettingsChange: (settings: HostSettings) => void
  onClose: () => void
  playerCount: number
  maxPlayers: number
  gameMode: string
}

export function HostSettingsMenu({
  settings,
  onSettingsChange,
  onClose,
  playerCount,
  maxPlayers,
  gameMode
}: HostSettingsMenuProps) {
  const { uiStrings } = useUIStrings()
  
  const updateSetting = (key: keyof HostSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    })
  }

  const settingsOptions = [
    {
      key: 'allowNewPlayers' as keyof HostSettings,
      label: uiStrings.multiplayer.allowNewPlayers,
      description: uiStrings.multiplayer.allowNewPlayersDesc,
      icon: Users,
      enabled: settings.allowNewPlayers
    },
    {
      key: 'allowBoosts' as keyof HostSettings,
      label: uiStrings.multiplayer.enableBoosts,
      description: uiStrings.multiplayer.enableBoostsDesc,
      icon: Zap,
      enabled: settings.allowBoosts
    },
    {
      key: 'allowHints' as keyof HostSettings,
      label: uiStrings.multiplayer.showHints,
      description: uiStrings.multiplayer.showHintsDesc,
      icon: MessageCircle,
      enabled: settings.allowHints
    },
    {
      key: 'autoAdvanceQuestions' as keyof HostSettings,
      label: uiStrings.multiplayer.autoAdvance,
      description: uiStrings.multiplayer.autoAdvanceDesc,
      icon: Timer,
      enabled: settings.autoAdvanceQuestions
    },
    {
      key: 'showRealTimeScores' as keyof HostSettings,
      label: uiStrings.multiplayer.realTimeScores,
      description: uiStrings.multiplayer.realTimeScoresDesc,
      icon: Trophy,
      enabled: settings.showRealTimeScores
    },
    {
      key: 'chatEnabled' as keyof HostSettings,
      label: uiStrings.multiplayer.enableChat,
      description: uiStrings.multiplayer.enableChatDesc,
      icon: MessageCircle,
      enabled: settings.chatEnabled
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Host {uiStrings.multiplayer.settings}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Badge variant="outline">{gameMode}</Badge>
            <span>•</span>
            <span>{playerCount}/{maxPlayers} {uiStrings.multiplayer.players}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {settingsOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  <option.icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-slate-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {option.description}
                  </div>
                </div>
              </div>
              
              <Switch
                checked={option.enabled}
                onCheckedChange={(checked) => updateSetting(option.key, checked)}
              />
            </div>
          ))}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="h-3 w-3" />
              <span>Settings apply to current game session</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 