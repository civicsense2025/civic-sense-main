'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DraggableProps {
  children: React.ReactNode
  className?: string
  onDragEnd?: (e: React.DragEvent) => void
  onDragStart?: (e: React.DragEvent) => void
}

export function Draggable({ children, className, onDragEnd, onDragStart }: DraggableProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    if (onDragStart) onDragStart(e)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    if (onDragEnd) onDragEnd(e)
  }

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'cursor-move',
        isDragging && 'opacity-50',
        className
      )}
    >
      {children}
    </div>
  )
} 