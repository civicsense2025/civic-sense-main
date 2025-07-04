"use client"

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  className?: string
}

const emojis = [
  '🎯', '📚', '🎓', '✏️', '📝', '🔍', '💡', '🌟', '🎨', '🎭',
  '🎬', '🎮', '🎲', '🎪', '🎸', '🎹', '🎺', '🎻', '🥁', '🎼',
  '🎧', '🎤', '📷', '📹', '🎥', '📺', '💻', '📱', '🖥️', '⌨️',
  '🖱️', '🎰', '🎳', '🎯', '🎱', '🎮', '🎲', '🎨', '🎭', '🎪'
]

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 w-8 p-0 hover:bg-muted",
            className
          )}
        >
          <span className="sr-only">Pick an emoji</span>
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-8 gap-2">
          {emojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onChange(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
} 