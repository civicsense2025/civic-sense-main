/**
 * Reusable keyboard shortcuts utility for CivicSense
 * Provides type-safe keyboard event handling with proper cleanup and state management
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { debug } from './debug-config'

// Types for keyboard shortcut configuration
export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  condition?: () => boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

export interface KeyboardShortcutGroup {
  name: string
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export interface KeyboardShortcutState {
  enabled: boolean
  activeGroups: string[]
  inputFocused: boolean
}

// Hook for managing keyboard shortcuts
export function useKeyboardShortcuts(
  groups: KeyboardShortcutGroup[],
  options: {
    enableLogging?: boolean
    autoDisableOnInput?: boolean
    captureEvents?: boolean
  } = {}
) {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    autoDisableOnInput = true,
    captureEvents = true
  } = options

  const [state, setState] = useState<KeyboardShortcutState>({
    enabled: true,
    activeGroups: groups.map(g => g.name),
    inputFocused: false
  })

  // Use ref to avoid stale closures
  const stateRef = useRef(state)
  const groupsRef = useRef(groups)

  // Update refs when state or groups change
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    groupsRef.current = groups
  }, [groups])

  // Check if target element should disable shortcuts
  const shouldIgnoreTarget = useCallback((target: HTMLElement): boolean => {
    return target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable]') !== null ||
      target.closest('[data-keyboard-ignore]') !== null
    )
  }, [])

  // Main keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const currentState = stateRef.current
    const currentGroups = groupsRef.current

    // Check if shortcuts are globally disabled
    if (!currentState.enabled) {
      if (enableLogging) {
        debug.log('general', 'Shortcuts globally disabled')
      }
      return
    }

    // Check if we should ignore this target
    const target = event.target as HTMLElement
    if (autoDisableOnInput && shouldIgnoreTarget(target)) {
      if (enableLogging) {
        debug.log('general', 'Ignoring key event on input element:', target.tagName)
      }
      return
    }

    const key = event.key.toLowerCase()
    
    if (enableLogging) {
      debug.log('general', `Key pressed: ${key}, Target: ${target.tagName}`)
    }

    // Process shortcuts from active groups
    for (const group of currentGroups) {
      if (!currentState.activeGroups.includes(group.name) || group.enabled === false) {
        continue
      }

      for (const shortcut of group.shortcuts) {
        if (shortcut.key.toLowerCase() === key) {
          // Check condition if provided
          if (shortcut.condition && !shortcut.condition()) {
            if (enableLogging) {
              debug.log('general', 'Shortcut condition not met:', shortcut.key)
            }
            continue
          }

          // Prevent default and stop propagation if requested
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          if (shortcut.stopPropagation !== false) {
            event.stopPropagation()
          }

          if (enableLogging) {
            debug.log('general', `Executing shortcut: ${shortcut.key} - ${shortcut.description}`)
          }

          // Execute the action
          try {
            shortcut.action()
          } catch (error) {
            console.error('Keyboard shortcut error:', error)
          }

          return // Only execute first matching shortcut
        }
      }
    }
  }, [enableLogging, autoDisableOnInput, shouldIgnoreTarget])

  // Focus handlers for auto-disable on input
  useEffect(() => {
    if (!autoDisableOnInput) return

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (shouldIgnoreTarget(target)) {
        setState(prev => ({ ...prev, inputFocused: true }))
        if (enableLogging) {
          debug.log('general', 'Input focused - shortcuts may be disabled')
        }
      }
    }

    const handleFocusOut = () => {
      setState(prev => ({ ...prev, inputFocused: false }))
      if (enableLogging) {
        debug.log('general', 'Input unfocused - shortcuts re-enabled')
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [autoDisableOnInput, shouldIgnoreTarget, enableLogging])

  // Register keyboard event listener
  useEffect(() => {
    const handleKeyDownWrapper = (event: KeyboardEvent) => {
      try {
        handleKeyDown(event)
      } catch (error) {
        console.error('Keyboard shortcut handler error:', error)
      }
    }

    document.addEventListener('keydown', handleKeyDownWrapper, {
      passive: false,
      capture: captureEvents
    })

    if (enableLogging) {
      debug.log('general', `Keyboard shortcuts registered for groups: ${groups.map(g => g.name).join(', ')}`)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDownWrapper, { capture: captureEvents })
      if (enableLogging) {
        debug.log('general', 'Keyboard shortcuts unregistered')
      }
    }
  }, [handleKeyDown, captureEvents, enableLogging, groups])

  // Control functions
  const enableShortcuts = useCallback(() => {
    setState(prev => ({ ...prev, enabled: true }))
  }, [])

  const disableShortcuts = useCallback(() => {
    setState(prev => ({ ...prev, enabled: false }))
  }, [])

  const toggleGroup = useCallback((groupName: string, enabled?: boolean) => {
    setState(prev => ({
      ...prev,
      activeGroups: enabled === false 
        ? prev.activeGroups.filter(name => name !== groupName)
        : enabled === true
          ? [...new Set([...prev.activeGroups, groupName])]
          : prev.activeGroups.includes(groupName)
            ? prev.activeGroups.filter(name => name !== groupName)
            : [...prev.activeGroups, groupName]
    }))
  }, [])

  const setActiveGroups = useCallback((groupNames: string[]) => {
    setState(prev => ({ ...prev, activeGroups: groupNames }))
  }, [])

  return {
    state,
    enableShortcuts,
    disableShortcuts,
    toggleGroup,
    setActiveGroups
  }
}

// Utility function to create quiz-specific shortcuts
export function createQuizShortcuts(handlers: {
  onSelectOption?: (optionIndex: number) => void
  onSelectTrue?: () => void
  onSelectFalse?: () => void
  onSubmitAnswer?: () => void
  onSkipQuestion?: () => void
  onNextQuestion?: () => void
  onToggleHint?: () => void
  currentQuestion?: any
  isAnswerSubmitted?: boolean
  selectedAnswer?: string | null
}): KeyboardShortcutGroup[] {
  const {
    onSelectOption,
    onSelectTrue,
    onSelectFalse,
    onSubmitAnswer,
    onSkipQuestion,
    onNextQuestion,
    onToggleHint,
    currentQuestion,
    isAnswerSubmitted,
    selectedAnswer
  } = handlers

  return [
    {
      name: 'quiz-navigation',
      shortcuts: [
        {
          key: 'enter',
          description: 'Submit answer',
          action: () => onSubmitAnswer?.(),
          condition: () => !isAnswerSubmitted && !!selectedAnswer
        },
        {
          key: ' ',
          description: 'Toggle hint',
          action: () => onToggleHint?.()
        },
        {
          key: 's',
          description: 'Skip question',
          action: () => onSkipQuestion?.(),
          condition: () => !isAnswerSubmitted
        },
        {
          key: 'n',
          description: 'Next question',
          action: () => onNextQuestion?.(),
          condition: () => !!isAnswerSubmitted
        }
      ]
    },
    {
      name: 'quiz-answers',
      shortcuts: [
        {
          key: '1',
          description: 'Select option A',
          action: () => onSelectOption?.(0),
          condition: () => currentQuestion?.question_type === 'multiple_choice' && !isAnswerSubmitted
        },
        {
          key: '2',
          description: 'Select option B',
          action: () => onSelectOption?.(1),
          condition: () => currentQuestion?.question_type === 'multiple_choice' && !isAnswerSubmitted
        },
        {
          key: '3',
          description: 'Select option C',
          action: () => onSelectOption?.(2),
          condition: () => currentQuestion?.question_type === 'multiple_choice' && !isAnswerSubmitted
        },
        {
          key: '4',
          description: 'Select option D',
          action: () => onSelectOption?.(3),
          condition: () => currentQuestion?.question_type === 'multiple_choice' && !isAnswerSubmitted
        },
        {
          key: 't',
          description: 'Select True',
          action: () => onSelectTrue?.(),
          condition: () => currentQuestion?.question_type === 'true_false' && !isAnswerSubmitted
        },
        {
          key: 'f',
          description: 'Select False',
          action: () => onSelectFalse?.(),
          condition: () => currentQuestion?.question_type === 'true_false' && !isAnswerSubmitted
        }
      ]
    }
  ]
}

// Component for displaying keyboard shortcuts help
export function KeyboardShortcutsHelp({ 
  groups, 
  currentState,
  className = ""
}: { 
  groups: KeyboardShortcutGroup[]
  currentState: KeyboardShortcutState
  className?: string
}) {
  const activeShortcuts = groups
    .filter(group => currentState.activeGroups.includes(group.name) && group.enabled !== false)
    .flatMap(group => group.shortcuts)
    .filter(shortcut => !shortcut.condition || shortcut.condition())

  if (activeShortcuts.length === 0) return null

  return (
    <div className={`text-center border-t border-slate-100 dark:border-slate-800 pt-4 animate-in fade-in duration-300 ${className}`}>
      <p className="text-sm text-slate-500 dark:text-slate-500 font-light">
        {activeShortcuts.map((shortcut, index) => (
          <span key={shortcut.key}>
            {index > 0 && ' • '}
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">
              {shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase()}
            </span>
            {' '}
            {shortcut.description.toLowerCase()}
          </span>
        ))}
      </p>
    </div>
  )
}

export default useKeyboardShortcuts 