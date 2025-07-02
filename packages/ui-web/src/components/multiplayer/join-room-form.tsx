"use client"

import { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { UserPlus } from 'lucide-react'

interface JoinRoomFormProps {
  onJoin: (roomCode: string) => void
  isJoining: boolean
  className?: string
  variant?: 'desktop' | 'mobile'
}

export function JoinRoomForm({ onJoin, isJoining, className, variant = 'desktop' }: JoinRoomFormProps) {
  const [roomCode, setRoomCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.trim()) {
      onJoin(roomCode.toUpperCase())
    }
  }

  if (variant === 'mobile') {
    return (
      <div className={className}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="text-center mb-3">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Join Room</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Enter a room code</p>
          </div>
          
          <Input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="text-center font-mono text-lg tracking-wider h-12 border-slate-200 dark:border-slate-700 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-slate-800"
            maxLength={8}
          />
          
          <Button
            type="submit"
            disabled={isJoining || !roomCode.trim()}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Joining...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Join Room
              </>
            )}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-1 lg:space-y-2">
        <h2 className="text-xl lg:text-2xl font-light text-slate-900 dark:text-white tracking-tight">
          Join Room
        </h2>
        <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 font-light">
          Enter a room code
        </p>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-6"></div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          className="text-center font-mono text-xl tracking-wider h-14 border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600"
          maxLength={8}
        />
        
        <Button
          type="submit"
          disabled={isJoining || !roomCode.trim()}
          className="w-full h-12 bg-slate-600 hover:bg-slate-700 dark:bg-slate-400 dark:hover:bg-slate-300 text-white dark:text-slate-900 font-light transition-colors"
        >
          {isJoining ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-slate-900 mr-2" />
              Joining...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Join Room
            </>
          )}
        </Button>
      </form>
    </div>
  )
} 