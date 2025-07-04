"use client"

import React from "react"
import { Card, CardContent, CardHeader } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { 
  Coins, 
  Users, 
  Clock, 
  Info, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap
} from "lucide-react"
import { cn } from '@civicsense/business-logic/utils'
import type { ResourceTrackerProps } from "./types"

// =============================================================================
// RESOURCE TYPE CONFIGURATIONS
// =============================================================================

const resourceConfig = {
  political_capital: {
    icon: Coins,
    label: "Political Capital",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900",
    maxValue: 100,
    description: "Your influence and leverage in political circles"
  },
  public_support: {
    icon: Users,
    label: "Public Support", 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    maxValue: 100,
    description: "How much the public trusts and supports you"
  },
  budget: {
    icon: Coins,
    label: "Budget",
    color: "text-green-600 dark:text-green-400", 
    bgColor: "bg-green-100 dark:bg-green-900",
    maxValue: 1000000,
    description: "Available financial resources"
  },
  time: {
    icon: Clock,
    label: "Time",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900", 
    maxValue: 100,
    description: "Time remaining to complete objectives"
  },
  information: {
    icon: Info,
    label: "Information",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900",
    maxValue: 100,
    description: "Knowledge and intel you've gathered"
  },
  relationships: {
    icon: Users,
    label: "Relationships", 
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900",
    maxValue: 100,
    description: "Strength of your professional relationships"
  },
  credibility: {
    icon: CheckCircle,
    label: "Credibility",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900", 
    maxValue: 100,
    description: "How trustworthy others perceive you to be"
  },
  media_attention: {
    icon: TrendingUp,
    label: "Media Attention",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900",
    maxValue: 100,
    description: "Level of media focus on your actions"
  }
}

// =============================================================================
// RESOURCE BAR COMPONENT
// =============================================================================

interface ResourceBarProps {
  resourceType: string
  value: number
  maxValue?: number
  showTrend?: boolean
  previousValue?: number
}

function ResourceBar({ 
  resourceType, 
  value, 
  maxValue, 
  showTrend = false, 
  previousValue 
}: ResourceBarProps) {
  const config = resourceConfig[resourceType as keyof typeof resourceConfig]
  const max = maxValue || config?.maxValue || 100
  const percentage = Math.min((value / max) * 100, 100)
  
  // Calculate trend
  const trend = showTrend && previousValue !== undefined 
    ? value - previousValue 
    : 0

  const getStatusColor = () => {
    if (percentage >= 75) return "text-green-600 dark:text-green-400"
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400"
    if (percentage >= 25) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getProgressColor = () => {
    if (percentage >= 75) return "bg-green-500"
    if (percentage >= 50) return "bg-yellow-500"
    if (percentage >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  const formatValue = (val: number) => {
    if (resourceType === 'budget') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact'
      }).format(val)
    }
    return val.toString()
  }

  const IconComponent = config?.icon || Zap

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1 rounded", config?.bgColor)}>
            <IconComponent className={cn("h-3 w-3", config?.color)} />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {config?.label || resourceType.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {showTrend && trend !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend > 0 ? '+' : ''}{trend}
            </div>
          )}
          
          <span className={cn("text-sm font-medium", getStatusColor())}>
            {formatValue(value)}
            {resourceType !== 'budget' && (
              <span className="text-slate-500 dark:text-slate-400">
                /{max}
              </span>
            )}
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <Progress 
          value={percentage} 
          className="h-2"
          style={{
            '--progress-foreground': getProgressColor()
          } as React.CSSProperties}
        />
        
        {config?.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {config.description}
          </p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// RESOURCE STATUS INDICATOR
// =============================================================================

interface ResourceStatusProps {
  resources: Record<string, number>
  character: any
}

function ResourceStatus({ resources, character }: ResourceStatusProps) {
  const getOverallStatus = () => {
    const resourceValues = Object.values(resources)
    if (resourceValues.length === 0) return 'unknown'
    
    const averagePercentage = resourceValues.reduce((sum, value, index) => {
      const resourceType = Object.keys(resources)[index]
      const config = resourceConfig[resourceType as keyof typeof resourceConfig]
      const max = config?.maxValue || 100
      return sum + (value / max) * 100
    }, 0) / resourceValues.length
    
    if (averagePercentage >= 75) return 'excellent'
    if (averagePercentage >= 50) return 'good'
    if (averagePercentage >= 25) return 'concerning'
    return 'critical'
  }

  const status = getOverallStatus()
  
  const statusConfig = {
    excellent: {
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      icon: CheckCircle,
      label: "Excellent Position"
    },
    good: {
      color: "text-blue-600 dark:text-blue-400", 
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      icon: TrendingUp,
      label: "Good Position"
    },
    concerning: {
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20", 
      borderColor: "border-yellow-200 dark:border-yellow-800",
      icon: AlertTriangle,
      label: "Needs Attention"
    },
    critical: {
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800", 
      icon: AlertTriangle,
      label: "Critical Situation"
    },
    unknown: {
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-50 dark:bg-slate-900/20",
      borderColor: "border-slate-200 dark:border-slate-800",
      icon: Info,
      label: "Status Unknown"
    }
  }

  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <div className={cn("border rounded-lg p-3", config.bgColor, config.borderColor)}>
      <div className="flex items-center gap-2">
        <IconComponent className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN RESOURCE TRACKER COMPONENT
// =============================================================================

export function ResourceTracker({ 
  resources, 
  character,
  className 
}: ResourceTrackerProps) {
  const sortedResources = Object.entries(resources).sort(([a], [b]) => {
    // Sort by resource type priority for better UX
    const priority = [
      'political_capital',
      'public_support', 
      'budget',
      'time',
      'information',
      'relationships',
      'credibility',
      'media_attention'
    ]
    
    const aIndex = priority.indexOf(a)
    const bIndex = priority.indexOf(b)
    
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })

  const criticalResources = sortedResources.filter(([type, value]) => {
    const config = resourceConfig[type as keyof typeof resourceConfig]
    const max = config?.maxValue || 100
    return (value / max) < 0.25
  })

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Resources
            </h3>
            {character && (
              <Badge variant="outline" className="text-xs">
                {character.character_name}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Overall Status */}
          <ResourceStatus resources={resources} character={character} />
          
          {/* Critical Resources Alert */}
          {criticalResources.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                    Critical Resources
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {criticalResources.length} resource{criticalResources.length === 1 ? '' : 's'} 
                    {criticalResources.length === 1 ? ' is' : ' are'} running dangerously low:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {criticalResources.map(([type]) => {
                      const config = resourceConfig[type as keyof typeof resourceConfig]
                      return (
                        <Badge key={type} variant="destructive" className="text-xs">
                          {config?.label || type.replace('_', ' ')}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Resource Bars */}
          <div className="space-y-4">
            {sortedResources.map(([resourceType, value]) => (
              <ResourceBar
                key={resourceType}
                resourceType={resourceType}
                value={value}
                showTrend={false} // Could be enhanced to show trends
              />
            ))}
          </div>
          
          {/* No Resources */}
          {sortedResources.length === 0 && (
            <div className="text-center py-6">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No resources to display
              </p>
            </div>
          )}
          
          {/* Character Special Abilities Reminder */}
          {character?.special_abilities && Object.keys(character.special_abilities).length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Special Abilities Available
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(character.special_abilities).map(([ability, description]) => (
                      <div key={ability} className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium capitalize">
                          {ability.replace('_', ' ')}:
                        </span>
                        <span className="ml-1">{String(description)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 