'use client'

import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { cn } from '@civicsense/shared/lib/utils'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { Indicator } from '@civicsense/shared/lib/assessment-framework/types'

interface IndicatorCardProps {
  indicator: Indicator
  className?: string
  compact?: boolean
}

const statusConfig = {
  TRIGGERED: {
    color: 'bg-red-500',
    icon: AlertTriangle,
    label: 'Triggered',
    textColor: 'text-red-500'
  },
  PARTIAL: {
    color: 'bg-yellow-500',
    icon: Clock,
    label: 'Partial',
    textColor: 'text-yellow-500'
  },
  NOT_YET: {
    color: 'bg-green-500',
    icon: CheckCircle,
    label: 'Not Yet',
    textColor: 'text-green-500'
  }
}

export function IndicatorCard({ indicator, className, compact = false }: IndicatorCardProps) {
  const status = statusConfig[indicator.status]
  const Icon = status.icon

  const categoryLabels = {
    level1: 'Early Warning',
    level2: 'Democratic Erosion',
    level3: 'Authoritarian Consolidation',
    level4: 'Fascist State'
  }

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200',
      compact ? 'p-2' : 'p-4'
    )}>
      <div className={cn(
        'absolute top-0 right-0 w-2 h-full',
        status.color
      )} />
      
      <CardHeader className={cn(
        'space-y-1',
        compact ? 'p-2' : 'p-4'
      )}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={cn(
            'line-clamp-2',
            compact ? 'text-sm' : 'text-lg'
          )}>
            {indicator.name}
          </CardTitle>
          <Badge variant="outline" className={cn(
            'shrink-0',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <Icon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        
        <Badge variant="secondary" className={cn(
          'mt-1',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {categoryLabels[indicator.categoryId as keyof typeof categoryLabels]}
        </Badge>
      </CardHeader>
      
      {!compact && (
        <CardContent className="space-y-2">
          <CardDescription>
            {indicator.description}
          </CardDescription>
          
          <div className="text-sm">
            <strong>Evidence Threshold:</strong>
            <p className="mt-1 text-muted-foreground">
              {indicator.evidenceThreshold}
            </p>
          </div>
          
          <div className="text-sm">
            <strong>Current Status:</strong>
            <p className="mt-1 text-muted-foreground">
              {indicator.currentStatus}
            </p>
          </div>
          
          {indicator.sources.length > 0 && (
            <div className="text-sm">
              <strong>Sources:</strong>
              <ul className="mt-1 space-y-1">
                {indicator.sources.map(source => (
                  <li key={source.id}>
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
} 