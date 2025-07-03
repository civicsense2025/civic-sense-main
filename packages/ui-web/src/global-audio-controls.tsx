"use client"

import React, { createContext, useContext, useState } from 'react'

// Stub audio state
interface AudioState {
  isPlaying: boolean
  isPaused: boolean
  currentText: string
  autoPlay: boolean
  loop: boolean
  highlighting: boolean
}

// Stub audio context
interface AudioContextType {
  state: AudioState
  playText: (text: string, options?: any) => void
  pause: () => void
  resume: () => void
  stop: () => void
  setAutoPlay: (enabled: boolean) => void
  setLoop: (enabled: boolean) => void
  setHighlighting: (enabled: boolean) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

// Global audio provider
export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    currentText: '',
    autoPlay: false,
    loop: false,
    highlighting: true
  })

  const playText = (text: string, options?: any) => {
    console.log('Playing text:', text, options)
    setState(prev => ({ ...prev, isPlaying: true, currentText: text }))
  }

  const pause = () => {
    console.log('Pausing audio')
    setState(prev => ({ ...prev, isPlaying: false, isPaused: true }))
  }

  const resume = () => {
    console.log('Resuming audio')
    setState(prev => ({ ...prev, isPlaying: true, isPaused: false }))
  }

  const stop = () => {
    console.log('Stopping audio')
    setState(prev => ({ ...prev, isPlaying: false, isPaused: false, currentText: '' }))
  }

  const setAutoPlay = (enabled: boolean) => {
    setState(prev => ({ ...prev, autoPlay: enabled }))
  }

  const setLoop = (enabled: boolean) => {
    setState(prev => ({ ...prev, loop: enabled }))
  }

  const setHighlighting = (enabled: boolean) => {
    setState(prev => ({ ...prev, highlighting: enabled }))
  }

  const value = {
    state,
    playText,
    pause,
    resume,
    stop,
    setAutoPlay,
    setLoop,
    setHighlighting
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

// Hook to use global audio
export function useGlobalAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useGlobalAudio must be used within a GlobalAudioProvider')
  }
  return context
}

// Global audio controls component
export function GlobalAudioControls({ className }: { className?: string }) {
  const { state, playText, pause, resume, stop } = useGlobalAudio()

  return (
    <div className={className}>
      <button onClick={() => playText('Sample text')}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={resume}>Resume</button>
      <button onClick={stop}>Stop</button>
      <span>Status: {state.isPlaying ? 'Playing' : state.isPaused ? 'Paused' : 'Stopped'}</span>
    </div>
  )
}

// Global audio toggle component
export function GlobalAudioToggle() {
  const { state, playText, stop } = useGlobalAudio()

  const toggle = () => {
    if (state.isPlaying) {
      stop()
    } else {
      playText('Sample text')
    }
  }

  return (
    <button onClick={toggle}>
      {state.isPlaying ? 'Stop Audio' : 'Start Audio'}
    </button>
  )
}