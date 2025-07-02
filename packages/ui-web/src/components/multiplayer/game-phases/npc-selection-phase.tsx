"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { NPCPersonality } from "@civicsense/shared/lib/multiplayer-npcs"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { cn } from "../../utils"

export interface NPCSelectionPhaseProps {
  difficulty: 'easy' | 'medium' | 'hard'
  onNPCSelect: (npc: NPCPersonality) => void
  className?: string
}

export function NPCSelectionPhase({ 
  difficulty, 
  onNPCSelect, 
  className 
}: NPCSelectionPhaseProps) {
  const [npcs, setNpcs] = useState<NPCPersonality[]>([])
  const [selectedNPC, setSelectedNPC] = useState<NPCPersonality | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load NPCs based on difficulty
  useEffect(() => {
    const loadNPCs = async () => {
      try {
        setIsLoading(true)
        
        // Call the API route to get NPCs
        const response = await fetch(`/api/npc/list?difficulty=${difficulty}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch NPCs')
        }
        
        if (data.success && data.npcs) {
          setNpcs(data.npcs)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error loading NPCs:', error)
        // Set empty array so component doesn't break
        setNpcs([])
      } finally {
        setIsLoading(false)
      }
    }

    loadNPCs()
  }, [difficulty])

  const handleNPCSelect = (npc: NPCPersonality) => {
    setSelectedNPC(npc)
  }

  const handleConfirmSelection = () => {
    if (selectedNPC) {
      onNPCSelect(selectedNPC)
    }
  }

  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { label: 'Easy', color: 'text-green-600 dark:text-green-400', icon: '🎯' }
      case 'medium':
        return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', icon: '🧠' }
      case 'hard':
        return { label: 'Hard', color: 'text-red-600 dark:text-red-400', icon: '✨' }
      default:
        return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', icon: '🧠' }
    }
  }

  const difficultyInfo = getDifficultyInfo(difficulty)

  if (isLoading) {
    return (
      <div className={cn("py-32", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-2xl font-light text-slate-900 dark:text-white mb-2">
            Finding Your AI Opponents...
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
            Loading the perfect study partners for {difficulty} level
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("py-16 relative", className)}>
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-slate-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-2xl">{difficultyInfo.icon}</span>
            <h1 className="text-4xl lg:text-5xl font-extralight text-slate-900 dark:text-white">
              Choose Your AI Opponent
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
            These AI opponents are designed to challenge you at the <span className={difficultyInfo.color}>{difficultyInfo.label}</span> level. 
            Each has unique expertise and teaching styles.
          </p>
        </motion.div>

        {/* NPC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {npcs.map((npc, index) => (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-800/30 rounded-3xl blur-xl"></div>
                <Card 
                  className={cn(
                    "relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-0 shadow-2xl shadow-slate-500/10 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-3xl",
                    selectedNPC?.id === npc.id && "ring-2 ring-blue-500 shadow-blue-500/25"
                  )}
                  onClick={() => handleNPCSelect(npc)}
                >
                  <CardContent className="p-8">
                    <div className="text-center space-y-6">
                      {/* NPC Avatar */}
                      <div className="relative">
                        <div className="w-20 h-20 mx-auto mb-4 text-5xl flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                          {npc.emoji}
                        </div>
                        {selectedNPC?.id === npc.id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">→</span>
                          </div>
                        )}
                      </div>

                      {/* NPC Info */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {npc.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed min-h-[2.5rem]">
                          {npc.description || `A ${npc.skillLevel.toLowerCase()}-level civic learning companion`}
                        </p>
                      </div>

                      {/* Skill Level Badge */}
                      <div className="flex justify-center">
                        <Badge 
                          className={cn(
                            "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800",
                            difficultyInfo.color
                          )}
                        >
                          {npc.skillLevel} Level
                        </Badge>
                      </div>

                      {/* Specialties */}
                      {npc.specialties && npc.specialties.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                            Specializes in:
                          </p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {npc.specialties.slice(0, 2).map((specialty, idx) => (
                              <span 
                                key={idx}
                                className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selection Confirmation */}
        {selectedNPC && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl max-w-md mx-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">{selectedNPC.emoji}</span>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                    Ready to battle {selectedNPC.name}?
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                  Test your civic knowledge against this {selectedNPC.skillLevel.toLowerCase()}-level opponent
                </p>
                <Button 
                  onClick={handleConfirmSelection}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg font-light shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Start Battle
                  <span className="ml-2">→</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
} 