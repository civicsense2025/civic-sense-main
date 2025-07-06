"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Accessibility, 
  Volume2, 
  VolumeX, 
  Eye, 
  Settings,
  HelpCircle,
  MessageSquare,
  Pause,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccessibility } from '@/components/accessibility/accessibility-provider'
import { AccessibilitySettings } from '@/components/accessibility-settings'

interface AccessibilityNavigationProps {
  className?: string
  variant?: 'button' | 'menu' | 'floating'
}

export function AccessibilityNavigation({ 
  className, 
  variant = 'button'
}: AccessibilityNavigationProps) {
  const { preferences, speak, stopSpeaking, isSpeaking, announceToScreenReader, updatePreference } = useAccessibility()

  const quickToggleAudio = () => {
    const newValue = !preferences.audioEnabled
    updatePreference('audioEnabled', newValue)
    announceToScreenReader(newValue ? 'Audio enabled' : 'Audio disabled')
  }

  const quickToggleContrast = () => {
    const newValue = !preferences.highContrast
    updatePreference('highContrast', newValue)
    announceToScreenReader(newValue ? 'High contrast enabled' : 'High contrast disabled')
  }

  const announcePageInfo = () => {
    const pageInfo = `
      Accessibility status:
      Audio ${preferences.audioEnabled ? 'enabled' : 'disabled'}.
      High contrast ${preferences.highContrast ? 'enabled' : 'disabled'}.
      Large text ${preferences.largeText ? 'enabled' : 'disabled'}.
      Keyboard shortcuts ${preferences.keyboardShortcuts ? 'enabled' : 'disabled'}.
    `
    speak(pageInfo)
  }

  if (variant === 'menu') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("flex items-center gap-2", className)}
            aria-label="Accessibility menu"
          >
            <Accessibility className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Accessibility</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Accessibility className="h-4 w-4" />
            Accessibility Options
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={quickToggleAudio} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {preferences.audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Audio
            </span>
            <Badge variant={preferences.audioEnabled ? "default" : "secondary"} className="text-xs">
              {preferences.audioEnabled ? "On" : "Off"}
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={quickToggleContrast} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              High Contrast
            </span>
            <Badge variant={preferences.highContrast ? "default" : "secondary"} className="text-xs">
              {preferences.highContrast ? "On" : "Off"}
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={announcePageInfo} className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Announce Status
          </DropdownMenuItem>
          
          {isSpeaking && (
            <DropdownMenuItem onClick={stopSpeaking} className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              Stop Speaking
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <AccessibilitySettings 
            trigger={
              <DropdownMenuItem className="flex items-center gap-2" onSelect={(e) => e.preventDefault()}>
                <Settings className="h-4 w-4" />
                All Settings
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default button variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AccessibilitySettings 
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            aria-label="Open accessibility settings"
          >
            <Accessibility className="h-4 w-4" />
            <span className="hidden sm:inline">Accessibility</span>
          </Button>
        }
      />
      
      {/* Quick toggle buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={quickToggleAudio}
          aria-label={preferences.audioEnabled ? 'Disable audio' : 'Enable audio'}
          title={preferences.audioEnabled ? 'Disable audio' : 'Enable audio'}
        >
          {preferences.audioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={quickToggleContrast}
          aria-label={preferences.highContrast ? 'Disable high contrast' : 'Enable high contrast'}
          title={preferences.highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        >
          <Eye className={cn("h-3 w-3", preferences.highContrast && "text-yellow-600")} />
        </Button>
        
        {isSpeaking && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={stopSpeaking}
            aria-label="Stop speaking"
            title="Stop speaking"
          >
            <Pause className="h-3 w-3 text-red-600" />
          </Button>
        )}
      </div>

      {/* Accessibility status indicators */}
      <div className="hidden lg:flex items-center gap-1">
        {preferences.audioEnabled && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            🔊 Audio
          </Badge>
        )}
        {preferences.highContrast && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            👁️ High Contrast
          </Badge>
        )}
        {preferences.largeText && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            🔤 Large Text
          </Badge>
        )}
        {preferences.reducedMotion && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            ⏸️ Reduced Motion
          </Badge>
        )}
      </div>
    </div>
  )
} 