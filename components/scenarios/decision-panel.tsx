"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Coins,
  TrendingUp,
  TrendingDown,
  Star,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DecisionPanelProps, ScenarioDecision } from "./types"

// =============================================================================
// DECISION CARD COMPONENT
// =============================================================================

interface DecisionCardProps {
  decision: ScenarioDecision
  onSelect: () => void
  canAfford: boolean
  resources: Record<string, number>
  isSelected: boolean
  showHint: boolean
}

function DecisionCard({ 
  decision, 
  onSelect, 
  canAfford, 
  resources, 
  isSelected,
  showHint 
}: DecisionCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getAffordabilityStatus = () => {
    if (!decision.resource_costs) return 'affordable'
    
    const missingResources = Object.entries(decision.resource_costs).filter(
      ([resource, cost]) => (resources[resource] || 0) < (cost as number)
    )
    
    if (missingResources.length === 0) return 'affordable'
    if (missingResources.length <= 2) return 'stretch'
    return 'unaffordable'
  }

  const affordabilityStatus = getAffordabilityStatus()

  const getCardStyle = () => {
    if (isSelected) return "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
    if (!canAfford) return "opacity-60 cursor-not-allowed"
    if (decision.is_optimal) return "border-green-200 dark:border-green-800"
    return "hover:shadow-md"
  }

  const getAffordabilityColor = () => {
    switch (affordabilityStatus) {
      case 'affordable': return 'text-green-600 dark:text-green-400'
      case 'stretch': return 'text-yellow-600 dark:text-yellow-400'
      case 'unaffordable': return 'text-red-600 dark:text-red-400'
    }
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200",
        getCardStyle()
      )}
      onClick={canAfford ? onSelect : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-slate-900 dark:text-white mb-1">
              {decision.decision_text}
            </h3>
            {decision.decision_description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {decision.decision_description}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1 ml-3">
            {decision.is_optimal && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Star className="h-3 w-3 mr-1" />
                Optimal
              </Badge>
            )}
            
            {decision.difficulty_modifier && decision.difficulty_modifier !== 0 && (
              <Badge variant="outline" className="text-xs">
                {decision.difficulty_modifier > 0 ? '+' : ''}{decision.difficulty_modifier} difficulty
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Resource Costs */}
        {decision.resource_costs && Object.keys(decision.resource_costs).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Resource Costs
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(decision.resource_costs).map(([resource, cost]) => {
                const current = resources[resource] || 0
                const hasEnough = current >= (cost as number)
                
                return (
                  <div 
                    key={resource}
                    className={cn(
                      "flex justify-between items-center rounded px-2 py-1 text-xs",
                      hasEnough 
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    )}
                  >
                    <span className="capitalize">
                      {resource.replace('_', ' ')}
                    </span>
                    <span className="font-medium">
                      -{cost}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Immediate Effects */}
        {decision.immediate_effects && Object.keys(decision.immediate_effects).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Immediate Effects
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(decision.immediate_effects).map(([resource, effect]) => {
                const isPositive = (effect as number) > 0
                
                return (
                  <div 
                    key={resource}
                    className={cn(
                      "flex justify-between items-center rounded px-2 py-1 text-xs",
                      isPositive
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        : "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                    )}
                  >
                    <span className="capitalize">
                      {resource.replace('_', ' ')}
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? '+' : ''}{effect}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Teaching Concepts */}
        {decision.teaches_concepts && decision.teaches_concepts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Teaches</h4>
            <div className="flex flex-wrap gap-1">
              {decision.teaches_concepts.map((concept) => (
                <Badge key={concept} variant="outline" className="text-xs">
                  {concept.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        {showHint && decision.hint_text && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Hint
                </h5>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  {decision.hint_text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Long-term Consequences Preview */}
        {showDetails && decision.long_term_consequences && Object.keys(decision.long_term_consequences).length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-3">
            <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Long-term Consequences
            </h5>
            <div className="space-y-1">
              {Object.entries(decision.long_term_consequences).map(([key, value]) => (
                <div key={key} className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                  <span className="ml-1">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(!showDetails)
            }}
            className="text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium", getAffordabilityColor())}>
              {affordabilityStatus === 'affordable' && <CheckCircle className="h-3 w-3 inline mr-1" />}
              {affordabilityStatus === 'stretch' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
              {affordabilityStatus === 'unaffordable' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
              {affordabilityStatus === 'affordable' ? 'Can afford' : 
               affordabilityStatus === 'stretch' ? 'Risky' : 'Too expensive'}
            </span>
            
            <Button 
              size="sm" 
              onClick={onSelect}
              disabled={!canAfford}
              className={cn(
                "text-xs",
                isSelected && "bg-blue-600 hover:bg-blue-700"
              )}
              variant={isSelected ? "default" : "outline"}
            >
              {isSelected ? 'Selected' : 'Choose'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN DECISION PANEL COMPONENT
// =============================================================================

export function DecisionPanel({ 
  decisions, 
  onDecisionSelect, 
  character, 
  resources,
  showHint,
  onShowHint,
  enableHints,
  className 
}: DecisionPanelProps) {
  const [selectedDecision, setSelectedDecision] = useState<ScenarioDecision | null>(null)

  const canAffordDecision = (decision: ScenarioDecision): boolean => {
    if (!decision.resource_costs) return true
    
    return Object.entries(decision.resource_costs).every(
      ([resource, cost]) => (resources[resource] || 0) >= (cost as number)
    )
  }

  const handleDecisionSelect = (decision: ScenarioDecision) => {
    setSelectedDecision(decision)
  }

  const handleConfirmSelection = () => {
    if (selectedDecision) {
      onDecisionSelect(selectedDecision)
    }
  }

  const affordableDecisions = decisions.filter(canAffordDecision)
  const unaffordableDecisions = decisions.filter(d => !canAffordDecision(d))

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Choose Your Action
        </h3>
        
        {enableHints && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowHint}
            className="text-xs"
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            {showHint ? 'Hide Hints' : 'Show Hints'}
          </Button>
        )}
      </div>

      {/* Character Context */}
      {character && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            As <span className="font-medium text-slate-900 dark:text-white">
              {character.character_name}
            </span>, consider how each decision aligns with your role and resources.
          </p>
        </div>
      )}

      {/* Affordable Decisions */}
      {affordableDecisions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Available Actions ({affordableDecisions.length})
          </h4>
          
          <div className="space-y-3">
            {affordableDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                onSelect={() => handleDecisionSelect(decision)}
                canAfford={true}
                resources={resources}
                isSelected={selectedDecision?.id === decision.id}
                showHint={showHint}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unaffordable Decisions */}
      {unaffordableDecisions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Unavailable Actions ({unaffordableDecisions.length})
          </h4>
          
          <div className="space-y-3">
            {unaffordableDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                onSelect={() => {}} // No-op for unaffordable decisions
                canAfford={false}
                resources={resources}
                isSelected={false}
                showHint={showHint}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Decisions Available */}
      {decisions.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Decisions Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Waiting for the next situation to load...
          </p>
        </div>
      )}

      {/* Confirm Selection */}
      {selectedDecision && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Ready to proceed?
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You've selected: "{selectedDecision.decision_text}"
              </p>
            </div>
            <Button 
              onClick={handleConfirmSelection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm Decision
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 