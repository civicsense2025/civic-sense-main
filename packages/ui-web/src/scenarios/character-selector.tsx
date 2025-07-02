"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { 
  User, 
  Briefcase, 
  Megaphone, 
  PenTool, 
  Building, 
  Users,
  Star,
  Zap,
  Target
} from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"
import type { CharacterSelectorProps, ScenarioCharacter } from "./types"

// =============================================================================
// CHARACTER TYPE ICONS
// =============================================================================

const characterTypeIcons = {
  citizen: User,
  official: Briefcase,
  advocate: Megaphone,
  journalist: PenTool,
  business_leader: Building,
  community_organizer: Users,
  elected_official: Briefcase,
  judicial_official: Briefcase,
  law_enforcement: User,
  legal_advocate: Megaphone,
  vulnerable_individual: User,
  government_official: Briefcase,
  activist: Megaphone
} as const

const characterTypeColors = {
  citizen: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  official: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  advocate: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  journalist: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  business_leader: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  community_organizer: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  elected_official: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  judicial_official: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  law_enforcement: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  legal_advocate: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  vulnerable_individual: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  government_official: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  activist: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
} as const

// =============================================================================
// CHARACTER CARD COMPONENT
// =============================================================================

interface CharacterCardProps {
  character: ScenarioCharacter
  isSelected: boolean
  onSelect: () => void
  isCompatible: boolean
}

function CharacterCard({ character, isSelected, onSelect, isCompatible }: CharacterCardProps) {
  const IconComponent = characterTypeIcons[character.character_type] || User
  const colorClasses = characterTypeColors[character.character_type] || characterTypeColors.citizen

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        isSelected 
          ? "ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5" 
          : "hover:shadow-lg",
        !isCompatible && "opacity-50 cursor-not-allowed"
      )}
      onClick={isCompatible ? onSelect : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {character.character_emoji ? (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-2xl">
                  {character.character_emoji}
                </div>
              ) : (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={character.avatar_url} alt={character.character_name} />
                  <AvatarFallback className={colorClasses}>
                    <IconComponent className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              )}
              {isSelected && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{character.character_name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {character.character_title}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={cn("text-xs", colorClasses)}>
            {character.character_type.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Character Description */}
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {character.character_description}
        </p>

        {/* Background Story */}
        {character.background_story && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
              <Star className="h-3 w-3" />
              Background
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {character.background_story}
            </p>
          </div>
        )}

        {/* Starting Resources */}
        {character.starting_resources && Object.keys(character.starting_resources).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Starting Resources
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(character.starting_resources).map(([resource, value]) => (
                <div 
                  key={resource}
                  className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded px-2 py-1"
                >
                  <span className="text-xs capitalize">
                    {resource.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Abilities */}
        {character.special_abilities && Object.keys(character.special_abilities).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Special Abilities
            </h4>
            <div className="space-y-1">
              {Object.entries(character.special_abilities).map(([ability, description]) => (
                <div key={ability} className="text-xs">
                  <span className="font-medium capitalize">{ability.replace('_', ' ')}:</span>
                  <span className="text-slate-600 dark:text-slate-400 ml-1">
                    {String(description)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selection Button */}
        <Button 
          onClick={onSelect}
          disabled={!isCompatible}
          className={cn(
            "w-full mt-4",
            isSelected && "bg-blue-600 hover:bg-blue-700"
          )}
          variant={isSelected ? "default" : "outline"}
        >
          {isSelected ? "Selected" : "Choose Character"}
        </Button>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN CHARACTER SELECTOR COMPONENT
// =============================================================================

export function CharacterSelector({ 
  characters, 
  onCharacterSelect, 
  scenario,
  className 
}: CharacterSelectorProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<ScenarioCharacter | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  // Filter characters compatible with this scenario
  const compatibleCharacters = characters.filter(character => {
    if (!character.usable_in_scenario_types) return true
    return character.usable_in_scenario_types.includes(scenario?.scenario_type || '')
  })

  const handleCharacterSelect = (character: ScenarioCharacter) => {
    setSelectedCharacter(character)
  }

  const handleConfirmSelection = () => {
    if (selectedCharacter) {
      onCharacterSelect(selectedCharacter)
    }
  }

  const isCharacterCompatible = (character: ScenarioCharacter) => {
    if (!character.usable_in_scenario_types) return true
    return character.usable_in_scenario_types.includes(scenario?.scenario_type || '')
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className={cn(
        "text-center transform transition-all duration-1000 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Choose Your Character
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Select the character you'll play in this scenario. Each character has unique resources, 
          abilities, and perspectives that will shape your experience.
        </p>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compatibleCharacters.map((character, index) => (
          <div
            key={character.id}
            className={cn(
              "transform transition-all duration-700 ease-out",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
            style={{ transitionDelay: `${400 + index * 150}ms` }}
          >
            <CharacterCard
              character={character}
              isSelected={selectedCharacter?.id === character.id}
              onSelect={() => handleCharacterSelect(character)}
              isCompatible={isCharacterCompatible(character)}
            />
          </div>
        ))}
      </div>

      {/* No Compatible Characters */}
      {compatibleCharacters.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Characters Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No characters are compatible with this scenario type.
          </p>
        </div>
      )}

      {/* Incompatible Characters Info */}
      {characters.length > compatibleCharacters.length && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-1">
              <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                Some Characters Not Available
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {characters.length - compatibleCharacters.length} character(s) are not compatible 
                with this scenario type and have been hidden.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Selection */}
      {selectedCharacter && (
        <div className={cn(
          "transform transition-all duration-500 ease-out",
          "translate-y-0 opacity-100 scale-100"
        )}>
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedCharacter.character_emoji ? (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-3xl border-2 border-primary/30">
                      {selectedCharacter.character_emoji}
                    </div>
                  ) : (
                    <Avatar className="h-14 w-14 border-2 border-primary/30">
                      <AvatarImage src={selectedCharacter.avatar_url} alt={selectedCharacter.character_name} />
                      <AvatarFallback className={characterTypeColors[selectedCharacter.character_type]}>
                        {React.createElement(characterTypeIcons[selectedCharacter.character_type], { className: "h-6 w-6" })}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center animate-pulse">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                    {selectedCharacter.character_name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedCharacter.character_title}
                  </p>
                  <p className="text-xs text-primary font-medium mt-1">
                    Character selected ✨
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleConfirmSelection}
                size="lg"
                className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Zap className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                Begin Journey
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 