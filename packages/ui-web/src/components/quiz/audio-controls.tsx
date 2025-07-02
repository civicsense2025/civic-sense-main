"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Slider } from "../ui/slider"
import { 
  Volume2, VolumeX, Play, Pause, RotateCcw, 
  Settings, ChevronDown, Headphones, Zap
} from "lucide-react"
import { cn } from "../../utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

interface AudioControlsProps {
  text: string
  autoPlay?: boolean
  className?: string
  variant?: 'compact' | 'full' | 'minimal'
  label?: string
  onPlayStart?: () => void
  onPlayEnd?: () => void
}

interface VoiceOption {
  voice: SpeechSynthesisVoice
  name: string
  lang: string
  quality: 'high' | 'medium' | 'low'
}

export function AudioControls({ 
  text, 
  autoPlay = false, 
  className, 
  variant = 'compact',
  label,
  onPlayStart,
  onPlayEnd
}: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [rate, setRate] = useState([1.0])
  const [pitch, setPitch] = useState([1.0])
  const [volume, setVolume] = useState([0.8])
  const [isMuted, setIsMuted] = useState(false)
  const [autoPlayMode, setAutoPlayMode] = useState(false)
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const previousVolumeRef = useRef(0.8)

  // Check for speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      
      // Load auto-play preference from localStorage
      const savedAutoPlay = localStorage.getItem('audioAutoPlayMode')
      if (savedAutoPlay === 'true') {
        setAutoPlayMode(true)
      }
      
      // Load voices (optimized for quiz components)
      let voicesLoaded = false
      
      const loadVoices = () => {
        // Prevent multiple loads
        if (voicesLoaded) return
        
        const availableVoices = speechSynthesis.getVoices()
        if (availableVoices.length === 0) return
        
        voicesLoaded = true
        
        // Pre-filter and optimize for quiz performance
        const voiceOptions: VoiceOption[] = availableVoices
          .filter(voice => voice.lang.startsWith('en'))
          .filter(voice => {
            const name = voice.name.toLowerCase()
            return !['espeak', 'festival', 'flite', 'pico', 'robot'].some(pattern => name.includes(pattern))
          })
          .map(voice => ({
            voice,
            name: voice.name,
            lang: voice.lang,
            quality: getVoiceQuality(voice)
          }))
          .sort((a, b) => {
            const qualityOrder = { high: 3, medium: 2, low: 1 }
            const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality]
            return qualityDiff !== 0 ? qualityDiff : a.name.localeCompare(b.name)
          })
          .slice(0, 5) // Limit to 5 voices for quiz components

        setVoices(voiceOptions)
        
        // Select best default voice
        const defaultVoice = voiceOptions.find(v => v.quality === 'high') || voiceOptions[0]
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.voice)
        }
      }

      // Single load attempt
      loadVoices()
      
      // Only add event listener if voices weren't loaded immediately
      if (!voicesLoaded && speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', loadVoices)
      }
      
      return () => {
        try {
          speechSynthesis.removeEventListener('voiceschanged', loadVoices)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && isSupported && text && selectedVoice) {
      const timer = setTimeout(() => {
        handlePlay()
      }, 500) // Small delay to ensure everything is loaded
      
      return () => clearTimeout(timer)
    }
  }, [autoPlay, isSupported, text, selectedVoice])

  const getVoiceQuality = (voice: SpeechSynthesisVoice): 'high' | 'medium' | 'low' => {
    const name = voice.name.toLowerCase()
    
    // High quality indicators (neural, premium voices)
    if (name.includes('neural') || 
        name.includes('premium') || 
        name.includes('enhanced') ||
        name.includes('natural') ||
        name.includes('siri') ||
        name.includes('alex') ||
        name.includes('samantha')) {
      return 'high'
    }
    
    // Medium quality indicators
    if (name.includes('compact') || 
        name.includes('eloquence') ||
        voice.localService) {
      return 'medium'
    }
    
    return 'low'
  }

  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      // Add pauses for better readability
      .replace(/\. /g, '. ')
      .replace(/\? /g, '? ')
      .replace(/! /g, '! ')
      // Handle common abbreviations
      .replace(/\bU\.S\./g, 'United States')
      .replace(/\bU\.K\./g, 'United Kingdom')
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bMr\./g, 'Mister')
      .replace(/\bMrs\./g, 'Missus')
      .replace(/\bMs\./g, 'Miss')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  const handlePlay = () => {
    if (!isSupported || !text || !selectedVoice) return

    // Stop any current speech
    speechSynthesis.cancel()

    const cleanText = cleanTextForSpeech(text)
    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    utterance.voice = selectedVoice
    utterance.rate = rate[0]
    utterance.pitch = pitch[0]
    utterance.volume = isMuted ? 0 : volume[0]

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      onPlayStart?.()
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      onPlayEnd?.()
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsPlaying(false)
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }

  const handlePause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const handleResume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  const handleStop = () => {
    speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  const handleRestart = () => {
    handleStop()
    setTimeout(handlePlay, 100)
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume([previousVolumeRef.current])
    } else {
      previousVolumeRef.current = volume[0]
      setIsMuted(true)
      setVolume([0])
    }
  }

  if (!isSupported) {
    return null // Gracefully hide if not supported
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={isPlaying ? (isPaused ? handleResume : handlePause) : handlePlay}
        className={cn(
          "h-6 w-6 p-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50",
          className
        )}
        aria-label={`${isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'} audio for ${label || 'content'}`}
      >
        {isPlaying ? (
          isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />
        ) : (
          <Volume2 className="h-3 w-3" />
        )}
      </Button>
    )
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center space-x-1", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={isPlaying ? (isPaused ? handleResume : handlePause) : handlePlay}
                className="h-7 px-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
                aria-label={`${isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'} audio`}
              >
                {isPlaying ? (
                  isPaused ? (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      <span className="text-xs">Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      <span className="text-xs">Pause</span>
                    </>
                  )
                ) : (
                  <>
                    <Headphones className="h-3 w-3 mr-1" />
                    <span className="text-xs">Listen</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <p className="text-sm">Click to {isPlaying ? (isPaused ? 'resume' : 'pause') : 'play'} audio</p>
                <div className="flex items-center space-x-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newAutoPlayMode = !autoPlayMode
                      setAutoPlayMode(newAutoPlayMode)
                      localStorage.setItem('audioAutoPlayMode', newAutoPlayMode.toString())
                    }}
                    className={cn(
                      "h-5 px-2 text-xs",
                      autoPlayMode && "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    )}
                  >
                    <Zap className="h-2 w-2 mr-1" />
                    Auto {autoPlayMode ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {isPlaying && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Restart audio"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // Full variant with all controls
  return (
    <div className={cn("space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Headphones className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
            Audio Controls
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Voice Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Voice Selection */}
            <div className="p-2 space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Voice
              </label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find(v => v.voice.name === e.target.value)?.voice
                  if (voice) setSelectedVoice(voice)
                }}
                className="w-full text-xs p-1 border rounded bg-background"
              >
                {voices.map((voiceOption, index) => (
                  <option key={`${voiceOption.voice.name}-${voiceOption.voice.lang}-${index}`} value={voiceOption.voice.name}>
                    {voiceOption.name} ({voiceOption.quality})
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div className="p-2 space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Speed: {rate[0].toFixed(1)}x
              </label>
              <Slider
                value={rate}
                onValueChange={setRate}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Pitch Control */}
            <div className="p-2 space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pitch: {pitch[0].toFixed(1)}
              </label>
              <Slider
                value={pitch}
                onValueChange={setPitch}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Controls */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={isPlaying ? (isPaused ? handleResume : handlePause) : handlePlay}
          className="flex-shrink-0"
        >
          {isPlaying ? (
            isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          disabled={!isPlaying && !isPaused}
          className="flex-shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 flex-grow">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            {isMuted || volume[0] === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
                     <Slider
             value={volume}
             onValueChange={(value: number[]) => {
               setVolume(value)
               setIsMuted(value[0] === 0)
             }}
             min={0}
             max={1}
             step={0.1}
             className="flex-grow"
           />
        </div>
      </div>

      {/* Status */}
      {isPlaying && (
        <div className="text-xs text-slate-600 dark:text-slate-300 text-center">
          {isPaused ? 'Paused' : 'Playing'} • {selectedVoice?.name}
        </div>
      )}
    </div>
  )
} 