'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { cn } from '../../utils'
import { AlertTriangle, CheckCircle, Clock, AlertOctagon } from 'lucide-react'
import type { AssessmentFramework } from '@civicsense/shared/lib/assessment-framework/types'

interface FrameworkOverviewProps {
  framework: AssessmentFramework
  className?: string
}

export function FrameworkOverview({ framework, className }: FrameworkOverviewProps) {
  const { metadata } = framework
  const threatLevel = metadata.overallThreatLevel

  const getThreatColor = (level: number) => {
    if (level >= 80) return 'text-red-500'
    if (level >= 60) return 'text-orange-500'
    if (level >= 40) return 'text-yellow-500'
    if (level >= 20) return 'text-blue-500'
    return 'text-green-500'
  }

  const getThreatLabel = (level: number) => {
    if (level >= 80) return 'Critical'
    if (level >= 60) return 'Severe'
    if (level >= 40) return 'Elevated'
    if (level >= 20) return 'Guarded'
    return 'Low'
  }

  const stats = [
    {
      label: 'Total Indicators',
      value: metadata.totalIndicators,
      color: 'bg-blue-500'
    },
    {
      label: 'Triggered',
      value: metadata.triggeredCount,
      color: 'bg-red-500'
    },
    {
      label: 'Partial',
      value: metadata.partialCount,
      color: 'bg-yellow-500'
    },
    {
      label: 'Not Yet',
      value: metadata.notYetCount,
      color: 'bg-green-500'
    }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle>{framework.name}</CardTitle>
          <CardDescription>{framework.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className={cn(
                  'text-4xl font-bold mb-2',
                  stat.color.replace('bg-', 'text-')
                )}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall Threat Level</CardTitle>
          <CardDescription>
            Based on weighted scoring of all indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
            <Progress value={metadata.overallThreatLevel} className="h-4" />
            <div className="text-center font-medium">
              {metadata.overallThreatLevel}% Threat Level
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Framework Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Type:</strong> {framework.frameworkType}
          </div>
          <div>
            <strong>Scoring System:</strong> {framework.scoringSystem.type} ({framework.scoringSystem.scale})
          </div>
          <div>
            <strong>Last Updated:</strong> {new Date(framework.lastUpdated).toLocaleDateString()}
          </div>
          {framework.methodologyUrl && (
            <div>
              <strong>Methodology:</strong>{' '}
              <a 
                href={framework.methodologyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Documentation
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 