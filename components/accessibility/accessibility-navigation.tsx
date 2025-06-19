"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Keyboard, 
  Settings,
  HelpCircle,
  MessageSquare,
  Shield,
  Pause,
  Play,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccessibility } from './accessibility-provider'
import { AccessibilitySettings } from '@/components/accessibility-settings'
import { AccessibilityFeedbackForm } from '@/components/accessibility-feedback-form'

interface AccessibilityNavigationProps {
  className?: string
  variant?: 'button' | 'menu' | 'floating'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function AccessibilityNavigation({ 
  className, 
  variant = 'button',
  position = 'top-right'
}: AccessibilityNavigationProps) {
  const { preferences, speak, stopSpeaking, isSpeaking, announceToScreenReader, updatePreference } = useAccessibility()
  const [showHelp, setShowHelp] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

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

  const quickToggleLargeText = () => {
    const newValue = !preferences.largeText
    updatePreference('largeText', newValue)
    announceToScreenReader(newValue ? 'Large text enabled' : 'Large text disabled')
  }

  const quickToggleReducedMotion = () => {
    const newValue = !preferences.reducedMotion
    updatePreference('reducedMotion', newValue)
    announceToScreenReader(newValue ? 'Reduced motion enabled' : 'Reduced motion disabled')
  }

  const announcePageInfo = () => {
    const pageInfo = `
      Current page accessibility status:
      Audio ${preferences.audioEnabled ? 'enabled' : 'disabled'}.
      High contrast ${preferences.highContrast ? 'enabled' : 'disabled'}.
      Large text ${preferences.largeText ? 'enabled' : 'disabled'}.
      Reduced motion ${preferences.reducedMotion ? 'enabled' : 'disabled'}.
      Keyboard shortcuts ${preferences.keyboardShortcuts ? 'enabled' : 'disabled'}.
    `
    speak(pageInfo)
  }

  if (variant === 'floating') {
    return (
      <div className={cn(
        "fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2",
        position === 'top-right' && "top-4 right-4",
        position === 'top-left' && "top-4 left-4", 
        position === 'bottom-right' && "bottom-4 right-4",
        position === 'bottom-left' && "bottom-4 left-4",
        className
      )}>
        <div className="flex items-center gap-2">
          <AccessibilitySettings 
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Open accessibility settings"
              >
                <Accessibility className="h-4 w-4" />
              </Button>
            }
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={quickToggleAudio}
            aria-label={preferences.audioEnabled ? 'Disable audio' : 'Enable audio'}
          >
            {preferences.audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={quickToggleContrast}
            aria-label={preferences.highContrast ? 'Disable high contrast' : 'Enable high contrast'}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {isSpeaking && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={stopSpeaking}
              aria-label="Stop speaking"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
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
            <MoreVertical className="h-3 w-3 ml-1" />
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
          
          <DropdownMenuItem onClick={quickToggleLargeText} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Large Text
            </span>
            <Badge variant={preferences.largeText ? "default" : "secondary"} className="text-xs">
              {preferences.largeText ? "On" : "Off"}
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={quickToggleReducedMotion} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Reduced Motion
            </span>
            <Badge variant={preferences.reducedMotion ? "default" : "secondary"} className="text-xs">
              {preferences.reducedMotion ? "On" : "Off"}
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
          
          <DropdownMenuItem onClick={() => setShowFeedback(true)} className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Report Issue
          </DropdownMenuItem>
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

      {/* Help and feedback dialogs */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Accessibility help"
          >
            <HelpCircle className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              Accessibility Help
            </DialogTitle>
            <DialogDescription>
              Learn how to use CivicSense's accessibility features for the best civic education experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Audio Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  CivicSense can read articles, quiz questions, and other content aloud using text-to-speech.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Enable auto-play to have questions read automatically</li>
                  <li>• Adjust speech rate, pitch, and volume in settings</li>
                  <li>• Press 'R' to read current content aloud</li>
                  <li>• Press 'Escape' to stop reading</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Visual Enhancements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Customize the visual appearance for better readability and comfort.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• High contrast mode for better visibility</li>
                  <li>• Large text mode scales up all text</li>
                  <li>• Reduced motion minimizes animations</li>
                  <li>• All settings work with your browser's zoom</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Keyboard Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Navigate CivicSense entirely with your keyboard for efficient civic learning.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Quiz Navigation</h4>
                    <ul className="space-y-1">
                      <li><kbd className="bg-gray-100 px-1 rounded text-xs">1-4</kbd> Select answers</li>
                      <li><kbd className="bg-gray-100 px-1 rounded text-xs">Tab</kbd> Navigate elements</li>
                      <li><kbd className="bg-gray-100 px-1 rounded text-xs">Enter</kbd> Activate buttons</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Audio Controls</h4>
                    <ul className="space-y-1">
                      <li><kbd className="bg-gray-100 px-1 rounded text-xs">R</kbd> Read content</li>
                      <li><kbd className="bg-gray-100 px-1 rounded text-xs">O</kbd> Read options</li>
                      <li><kbd className="bg-gray-100 px-1 rounded text-xs">Esc</kbd> Stop reading</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Accessibility Feedback</DialogTitle>
            <DialogDescription>
              Help us improve CivicSense's accessibility by reporting issues or suggesting improvements.
            </DialogDescription>
          </DialogHeader>
          <AccessibilityFeedbackForm onSubmit={() => setShowFeedback(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
} 