"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomData {
  room: {
    id: string
    room_code: string
    room_name?: string
    game_mode: string
    room_status: 'waiting' | 'starting' | 'in_progress'
    current_players: number
    max_players: number
    topic_id: string
  }
  player: {
    id: string
    is_host: boolean
  }
  topic?: {
    emoji?: string
    topic_title?: string
  }
}

interface RoomCardProps {
  roomData: RoomData
  onJoin: (roomData: RoomData) => void
  className?: string
}

export function RoomCard({ roomData, onJoin, className }: RoomCardProps) {
  const getStatusBadge = () => {
    const status = roomData.room.room_status
    const statusConfig = {
      waiting: {
        text: '⏳ Waiting',
        className: 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
      },
      starting: {
        text: '🚀 Starting',
        className: 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
      },
      in_progress: {
        text: '🎮 In Progress',
        className: 'text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
      }
    }

    const config = statusConfig[status]
    return (
      <Badge variant="outline" className={cn("text-xs", config.className)}>
        {config.text}
      </Badge>
    )
  }

  return (
    <div className={cn(
      "p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900/30",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-slate-900 dark:text-white text-sm">
            {roomData.room.room_name || `${roomData.room.game_mode} Room`}
          </h4>
          {roomData.player.is_host && (
            <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-0">
              👑 Host
            </Badge>
          )}
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          {roomData.topic?.emoji || '📝'} {roomData.topic?.topic_title || 'Civic Knowledge'}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {roomData.room.current_players}/{roomData.room.max_players}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
          {roomData.room.room_code}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-500">
          {roomData.room.game_mode}
        </span>
      </div>
      
      <Button
        size="sm"
        variant="outline"
        className="w-full border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
        onClick={() => onJoin(roomData)}
      >
        {roomData.room.room_status === 'waiting' ? 'Join Room' : 'Rejoin Game'}
      </Button>
    </div>
  )
} 