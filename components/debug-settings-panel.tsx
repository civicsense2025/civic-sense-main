"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, X, RotateCcw } from "lucide-react"
import { debug } from "@/lib/debug-config"
import { cn } from "@/lib/utils"

interface DebugSettingsPanelProps {
  className?: string
}

export function DebugSettingsPanel({ className }: DebugSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState(debug.getConfig())

  // Only show in development
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const updateConfig = () => {
    setConfig(debug.getConfig())
  }

  const handleToggleCategory = (category: keyof typeof config.categories) => {
    debug.toggle(category as keyof typeof config.categories)
    updateConfig()
  }

  const handleToggleMinimized = () => {
    debug.toggleMinimized()
    updateConfig()
  }

  const handleReset = () => {
    // Reset all categories to default
    debug.enable()
    debug.enable('quiz')
    debug.enable('multiplayer')
    debug.enable('premium')
    debug.enable('general')
    debug.disable('pwa')
    debug.disable('storage')
    debug.disable('analytics')
    debug.disable('auth')
    debug.disable('api')
    updateConfig()
  }

  const categoryDescriptions = {
    quiz: "Quiz engine, question processing, and quiz flow",
    multiplayer: "Multiplayer rooms, game modes, and real-time updates",
    pwa: "Progressive Web App registration and caching",
    storage: "LocalStorage operations and state persistence",
    analytics: "User tracking and performance metrics",
    auth: "Authentication and user management",
    api: "API calls and server communications",
    premium: "Premium subscriptions, feature access, and billing",
    general: "General application debug messages"
  }

  const categoryColors = {
    quiz: "bg-blue-100 text-blue-800 border-blue-200",
    multiplayer: "bg-green-100 text-green-800 border-green-200",
    pwa: "bg-purple-100 text-purple-800 border-purple-200",
    storage: "bg-yellow-100 text-yellow-800 border-yellow-200",
    analytics: "bg-pink-100 text-pink-800 border-pink-200",
    auth: "bg-indigo-100 text-indigo-800 border-indigo-200",
    api: "bg-orange-100 text-orange-800 border-orange-200",
    premium: "bg-emerald-100 text-emerald-800 border-emerald-200",
    general: "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 left-4 z-50", className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="bg-black/80 text-white border-white/20 hover:bg-black/90 backdrop-blur-sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Debug Settings
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("fixed bottom-4 left-4 z-50 w-80", className)}>
      <Card className="bg-white/95 dark:bg-black/95 backdrop-blur-xl border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Debug Settings</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleReset}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Reset to defaults"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global debug toggle */}
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <div className="text-sm font-medium">Debug Enabled</div>
              <div className="text-xs text-muted-foreground">
                Master toggle for all debug messages
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={() => {
                debug.toggle()
                updateConfig()
              }}
            />
          </div>

          {/* Minimized toggle */}
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <div className="text-sm font-medium">Minimized Logs</div>
              <div className="text-xs text-muted-foreground">
                Show condensed debug messages
              </div>
            </div>
            <Switch
              checked={config.minimized}
              onCheckedChange={handleToggleMinimized}
              disabled={!config.enabled}
            />
          </div>

          {/* Category toggles */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Categories</div>
            <div className="grid gap-2">
              {(Object.entries(config.categories) as Array<[keyof typeof config.categories, boolean]>).map(([category, enabled]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-mono",
                          categoryColors[category]
                        )}
                      >
                        {category}
                      </Badge>
                      <Switch
                        checked={enabled && config.enabled}
                        onCheckedChange={() => handleToggleCategory(category)}
                        disabled={!config.enabled}
                        className="scale-75"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    {categoryDescriptions[category]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Console help */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium mb-1">Console Commands:</div>
              <div className="font-mono space-y-0.5">
                <div>window.debug.help()</div>
                <div>window.debug.showStatus()</div>
                <div>window.debug.toggle("quiz")</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 