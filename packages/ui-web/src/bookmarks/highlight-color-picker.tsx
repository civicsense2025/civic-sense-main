// =============================================================================
// HIGHLIGHT COLOR PICKER
// =============================================================================

import React from "react"
import { cn } from "../../utils"

/**
 * Preset colours offered for text highlights. Feel free to extend this list – keep
 * pastel/high-contrast tones so text remains readable when the background is applied.
 */
export const DEFAULT_HIGHLIGHT_COLORS: string[] = [
  "#FEF08A", // yellow
  "#BBF7D0", // green
  "#BFDBFE", // blue
  "#FBCFE8", // pink
  "#FCA5A5"  // red
]

export interface HighlightColorPickerProps {
  /** Callback fired when the user picks a colour */
  onSelect: (color: string) => void
  /** Currently selected colour (optional – for visual cue) */
  selected?: string
  /** Palette to show – defaults to DEFAULT_HIGHLIGHT_COLORS */
  colors?: string[]
  /** Optional additional class names */
  className?: string
}

/**
 * Renders a simple grid of colour swatches. Intended for use inside a Popover or
 * any small panel. Emits the chosen colour via `onSelect`.
 */
export function HighlightColorPicker({
  onSelect,
  selected,
  colors = DEFAULT_HIGHLIGHT_COLORS,
  className
}: HighlightColorPickerProps) {
  return (
    <div className={cn("grid grid-cols-5 gap-2", className)}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          aria-label={`Use highlight colour ${color}`}
          style={{ backgroundColor: color }}
          className={cn(
            "h-6 w-6 rounded-full border shadow-sm transition-opacity",
            selected === color ? "ring-2 ring-offset-2 ring-blue-500" : "hover:opacity-80"
          )}
        />
      ))}
    </div>
  )
} 