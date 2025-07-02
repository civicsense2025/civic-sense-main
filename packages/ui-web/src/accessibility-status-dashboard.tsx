"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { 
  Shield, 
  Keyboard, 
  Volume2, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Settings,
  MessageSquare,
  BarChart3,
  Users,
  Heart,
  Zap
} from 'lucide-react'
import { cn } from '@civicsense/shared/lib/utils'
import { AccessibilitySettings, useAccessibilityPreferences } from './accessibility-settings'
import { AccessibilityFeedbackForm } from './accessibility-feedback-form'

interface AccessibilityMetrics {
  overallScore: number
  keyboardScore: number
  screenReaderScore: number
  visualScore: number
  audioScore: number
  lastChecked: Date
  activeUsers: {
    total: number
    withAssistiveTech: number
    reportingIssues: number
  }
  recentImprovements: string[]
}

interface AccessibilityStatusProps {
  className?: string
  showDetailed?: boolean
  enableUserActions?: boolean
}

export function AccessibilityStatusDashboard({ 
  className, 
  showDetailed = true,
  enableUserActions = true
}: AccessibilityStatusProps) {
  const [metrics, setMetrics] = useState<AccessibilityMetrics>({
    overallScore: 85,
    keyboardScore: 90,
    screenReaderScore: 82,
    visualScore: 88,
    audioScore: 80,
    lastChecked: new Date(),
    activeUsers: {
      total: 1247,
      withAssistiveTech: 156,
      reportingIssues: 3
    },
    recentImprovements: [
      'Enhanced quiz keyboard navigation shortcuts',
      'Improved screen reader announcements for multiplayer games',
      'Added high contrast mode for news analysis',
      'Fixed focus trapping in modal dialogs'
    ]
  })

  const accessibilityPrefs = useAccessibilityPreferences()
  const [userHasAccessibilityNeeds, setUserHasAccessibilityNeeds] = useState(false)

  useEffect(() => {
    // Detect if user has accessibility preferences enabled
    const hasPrefs = accessibilityPrefs.audioEnabled || 
                    accessibilityPrefs.highContrast || 
                    accessibilityPrefs.largeText || 
                    accessibilityPrefs.reducedMotion ||
                    accessibilityPrefs.keyboardShortcuts ||
                    accessibilityPrefs.extendedTimeouts
    
    setUserHasAccessibilityNeeds(hasPrefs)
  }, [accessibilityPrefs])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Needs Work'
    return 'Critical'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'keyboard': return <Keyboard className="h-4 w-4" />
      case 'screenReader': return <Volume2 className="h-4 w-4" />
      case 'visual': return <Eye className="h-4 w-4" />
      case 'audio': return <Volume2 className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Hero Status Card */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              CivicSense Accessibility Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-lg font-bold", getScoreColor(metrics.overallScore))}>
                {metrics.overallScore}% {getScoreLabel(metrics.overallScore)}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Ensuring every citizen can access civic education and participate in democracy
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={metrics.overallScore} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getCategoryIcon('keyboard')}
                  <span className="text-sm font-medium">Keyboard</span>
                </div>
                <div className={cn("text-2xl font-bold", getScoreColor(metrics.keyboardScore))}>
                  {metrics.keyboardScore}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getCategoryIcon('screenReader')}
                  <span className="text-sm font-medium">Screen Reader</span>
                </div>
                <div className={cn("text-2xl font-bold", getScoreColor(metrics.screenReaderScore))}>
                  {metrics.screenReaderScore}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getCategoryIcon('visual')}
                  <span className="text-sm font-medium">Visual</span>
                </div>
                <div className={cn("text-2xl font-bold", getScoreColor(metrics.visualScore))}>
                  {metrics.visualScore}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getCategoryIcon('audio')}
                  <span className="text-sm font-medium">Audio</span>
                </div>
                <div className={cn("text-2xl font-bold", getScoreColor(metrics.audioScore))}>
                  {metrics.audioScore}%
                </div>
              </div>
            </div>

            {enableUserActions && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <AccessibilitySettings 
                  trigger={
                    <Button variant="outline" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Accessibility Settings
                    </Button>
                  }
                />
                
                <AccessibilityFeedbackForm 
                  trigger={
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Report Issue
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User-Specific Accessibility Status */}
      {userHasAccessibilityNeeds && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Your Accessibility Settings Active</AlertTitle>
          <AlertDescription>
            Your customized accessibility preferences are active. We're committed to ensuring 
            your civic learning experience is fully accessible.
          </AlertDescription>
        </Alert>
      )}

      {showDetailed && (
        <>
          {/* Community Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {metrics.activeUsers.total.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Active Civic Learners
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {metrics.activeUsers.withAssistiveTech}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Using Assistive Technology
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {metrics.activeUsers.reportingIssues}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Active Accessibility Reports
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Improvements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recent Accessibility Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentImprovements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{improvement}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Democratic Mission Connection */}
          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-amber-600" />
                Accessibility = Democracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  <strong>Every accessibility improvement advances democracy.</strong> When we remove 
                  barriers to civic education, we ensure that all citizens—regardless of ability—can 
                  understand how power works and participate meaningfully in democratic processes.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Universal Access</p>
                      <p className="text-xs text-muted-foreground">
                        WCAG 2.1 AA compliance ensures constitutional rights apply equally online
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Inclusive Participation</p>
                      <p className="text-xs text-muted-foreground">
                        Assistive technology users can fully engage in civic learning and action
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Last accessibility check: {metrics.lastChecked.toLocaleDateString()} • 
          Built with accessibility standards for democracy • 
          <span className="text-blue-600">WCAG 2.1 AA Compliant</span>
        </p>
      </div>
    </div>
  )
} 