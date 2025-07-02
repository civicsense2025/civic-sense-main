"use client"

import { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Smile } from 'lucide-react'

interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  children?: React.ReactNode
}

const POPULAR_EMOJIS = [
  '👨‍👩‍👧‍👦', '👥', '🏫', '📚', '🗳️', '🏢', '📖', '⚖️', '✨', '🎯',
  '🚀', '💡', '🌟', '🎓', '📊', '🔥', '💪', '🏆', '🎉', '❤️',
  '👍', '✅', '🌈', '🔬', '🎨', '🎭', '🎪', '🎲', '🎳', '🎮',
  '⭐', '🌙', '☀️', '🌍', '🌎', '🌏', '🌲', '🌺', '🌸', '🌻'
]

export function EmojiPicker({ value, onChange, children }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">
            Choose an emoji
          </h4>
          <div className="grid grid-cols-8 gap-1">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className={`
                  w-8 h-8 text-lg hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors
                  ${value === emoji ? 'bg-blue-100 dark:bg-blue-900/20' : ''}
                `}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 