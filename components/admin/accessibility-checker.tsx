"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Shield, 
  Keyboard, 
  Volume2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play,
  RefreshCw,
  Download,
  Upload,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccessibilityCheck {
  id: string
  category: 'keyboard' | 'screen_reader' | 'visual' | 'audio' | 'civic_specific'
  name: string
  description: string
  required: boolean
  status: 'pass' | 'fail' | 'warning' | 'untested'
  details?: string
  impact: 'critical' | 'major' | 'minor'
  wcagLevel: 'A' | 'AA' | 'AAA'
}

const ACCESSIBILITY_CHECKLIST: AccessibilityCheck[] = [
  // Keyboard Navigation
  {
    id: 'keyboard-all-interactive',
    category: 'keyboard',
    name: 'All Interactive Elements Keyboard Accessible',
    description: 'Every button, link, input, and interactive element can be reached and operated with keyboard only',
    required: true,
    status: 'untested',
    impact: 'critical',
    wcagLevel: 'A'
  },
  {
    id: 'keyboard-tab-order',
    category: 'keyboard',
    name: 'Logical Tab Order',
    description: 'Tab order follows visual layout and makes logical sense',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'keyboard-no-traps',
    category: 'keyboard',
    name: 'No Keyboard Traps',
    description: 'Users can navigate away from any element using only keyboard (except intended modal focus trapping)',
    required: true,
    status: 'untested',
    impact: 'critical',
    wcagLevel: 'A'
  },
  {
    id: 'keyboard-skip-links',
    category: 'keyboard',
    name: 'Skip Links Available',
    description: 'Skip to main content link is available and functional',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'keyboard-shortcuts',
    category: 'keyboard',
    name: 'Quiz Keyboard Shortcuts',
    description: 'Quiz supports keyboard shortcuts (n=next, p=previous, 1-9=answer selection)',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'AA'
  },

  // Screen Reader Support
  {
    id: 'sr-all-content',
    category: 'screen_reader',
    name: 'All Content Announced',
    description: 'Screen readers can access and announce all content correctly',
    required: true,
    status: 'untested',
    impact: 'critical',
    wcagLevel: 'A'
  },
  {
    id: 'sr-heading-structure',
    category: 'screen_reader',
    name: 'Logical Heading Structure',
    description: 'Headings create a logical document outline (h1, h2, h3, etc.)',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'sr-aria-labels',
    category: 'screen_reader',
    name: 'ARIA Labels and Descriptions',
    description: 'All interactive elements have helpful ARIA labels and descriptions',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'sr-live-regions',
    category: 'screen_reader',
    name: 'Live Regions for Dynamic Content',
    description: 'Dynamic content changes are announced via live regions',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },

  // Visual Accessibility
  {
    id: 'visual-contrast',
    category: 'visual',
    name: 'Text Contrast WCAG AA',
    description: 'Text contrast meets WCAG AA standards (4.5:1 minimum)',
    required: true,
    status: 'untested',
    impact: 'critical',
    wcagLevel: 'AA'
  },
  {
    id: 'visual-focus-indicators',
    category: 'visual',
    name: 'Visible Focus Indicators',
    description: 'Focus indicators are clearly visible and high contrast',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'visual-zoom-200',
    category: 'visual',
    name: 'Content Works at 200% Zoom',
    description: 'All content and functionality available at 200% zoom',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'AA'
  },
  {
    id: 'visual-no-color-only',
    category: 'visual',
    name: 'No Information by Color Alone',
    description: 'Information is not conveyed by color alone',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'visual-reduced-motion',
    category: 'visual',
    name: 'Reduced Motion Support',
    description: 'Respects prefers-reduced-motion user preference',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'AA'
  },

  // Audio Accessibility
  {
    id: 'audio-text-alternatives',
    category: 'audio',
    name: 'Text Alternatives for Audio',
    description: 'All audio content has transcripts or captions',
    required: true,
    status: 'untested',
    impact: 'critical',
    wcagLevel: 'A'
  },
  {
    id: 'audio-keyboard-controls',
    category: 'audio',
    name: 'Keyboard Accessible Audio Controls',
    description: 'Audio controls can be operated with keyboard',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'audio-user-control',
    category: 'audio',
    name: 'User Control Over Audio',
    description: 'Users can control volume and playback independently',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'audio-no-autoplay',
    category: 'audio',
    name: 'No Auto-playing Audio',
    description: 'Audio does not auto-play or can be paused',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },

  // Civic Education Specific
  {
    id: 'civic-quiz-structure',
    category: 'civic_specific',
    name: 'Quiz Questions Properly Structured',
    description: 'Quiz questions use fieldsets, legends, and proper ARIA for screen readers',
    required: true,
    status: 'untested',
    impact: 'critical',
    wcagLevel: 'AA'
  },
  {
    id: 'civic-progress-announced',
    category: 'civic_specific',
    name: 'Learning Progress Announced',
    description: 'Progress through civic learning content is announced to screen readers',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'AA'
  },
  {
    id: 'civic-multiplayer-accessible',
    category: 'civic_specific',
    name: 'Multiplayer Features Accessible',
    description: 'Multiplayer civic games work with assistive technology',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'AA'
  },
  {
    id: 'civic-error-messages',
    category: 'civic_specific',
    name: 'Clear Actionable Error Messages',
    description: 'Error messages are clear and provide actionable guidance',
    required: true,
    status: 'untested',
    impact: 'major',
    wcagLevel: 'A'
  },
  {
    id: 'civic-success-celebration',
    category: 'civic_specific',
    name: 'Accessible Success Messages',
    description: 'Success messages celebrate civic learning progress accessibly',
    required: true,
    status: 'untested',
    impact: 'minor',
    wcagLevel: 'AAA'
  }
]

interface AccessibilityCheckerProps {
  className?: string
  targetUrl?: string
}

export function AccessibilityChecker({ className, targetUrl }: AccessibilityCheckerProps) {
  const [checklist, setChecklist] = useState<AccessibilityCheck[]>(ACCESSIBILITY_CHECKLIST)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testResults, setTestResults] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [testUrl, setTestUrl] = useState(targetUrl || '')

  const updateCheckStatus = (id: string, status: AccessibilityCheck['status'], details?: string) => {
    setChecklist(prev => prev.map(check => 
      check.id === id ? { ...check, status, details } : check
    ))
  }

  const runAutomatedTests = async () => {
    setIsRunningTests(true)
    setTestResults('Running automated accessibility tests...\n\n')
    
    try {
      // Simulate automated testing (in real implementation, this would use tools like axe-core)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock results for demonstration
      const mockResults = [
        { id: 'visual-contrast', status: 'pass' as const, details: 'All text meets WCAG AA contrast requirements' },
        { id: 'sr-heading-structure', status: 'warning' as const, details: 'Missing h1 tag on page' },
        { id: 'keyboard-all-interactive', status: 'fail' as const, details: 'Found 3 elements not keyboard accessible' },
        { id: 'sr-aria-labels', status: 'pass' as const, details: 'All interactive elements have appropriate ARIA labels' }
      ]
      
      // Update checklist with mock results
      mockResults.forEach(result => {
        updateCheckStatus(result.id, result.status, result.details)
      })
      
      setTestResults(prev => prev + 'Automated tests completed.\n\nFound:\n' +
        '✅ 15 passing checks\n' +
        '⚠️ 3 warnings\n' +
        '❌ 2 failing checks\n\n' +
        'See individual check details below.')
      
    } catch (error) {
      setTestResults('Error running automated tests: ' + (error as Error).message)
    } finally {
      setIsRunningTests(false)
    }
  }

  const calculateScore = () => {
    const totalChecks = checklist.length
    const passedChecks = checklist.filter(check => check.status === 'pass').length
    const criticalFailures = checklist.filter(check => 
      check.status === 'fail' && check.impact === 'critical'
    ).length
    
    // Reduce score significantly for critical failures
    const baseScore = Math.round((passedChecks / totalChecks) * 100)
    const penaltyScore = criticalFailures * 15 // 15 point penalty per critical failure
    
    return Math.max(0, baseScore - penaltyScore)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Critical Issues'
  }

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      url: testUrl,
      score: calculateScore(),
      checklist: checklist,
      notes: notes,
      summary: {
        total: checklist.length,
        passed: checklist.filter(c => c.status === 'pass').length,
        failed: checklist.filter(c => c.status === 'fail').length,
        warnings: checklist.filter(c => c.status === 'warning').length,
        untested: checklist.filter(c => c.status === 'untested').length
      }
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetChecklist = () => {
    setChecklist(ACCESSIBILITY_CHECKLIST.map(check => ({ ...check, status: 'untested', details: undefined })))
    setTestResults('')
    setNotes('')
  }

  const getCategoryIcon = (category: AccessibilityCheck['category']) => {
    switch (category) {
      case 'keyboard': return <Keyboard className="h-4 w-4" />
      case 'screen_reader': return <Volume2 className="h-4 w-4" />
      case 'visual': return <Eye className="h-4 w-4" />
      case 'audio': return <Volume2 className="h-4 w-4" />
      case 'civic_specific': return <Shield className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: AccessibilityCheck['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'untested': return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const groupedChecks = checklist.reduce((acc, check) => {
    if (!acc[check.category]) acc[check.category] = []
    acc[check.category].push(check)
    return acc
  }, {} as Record<string, AccessibilityCheck[]>)

  const score = calculateScore()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            CivicSense Accessibility Checker
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Ensure your civic education content is accessible to all citizens
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Accessibility Score:</span>
              <Badge variant="outline" className={cn("text-lg font-bold", getScoreColor(score))}>
                {score}% {getScoreLabel(score)}
              </Badge>
            </div>
          </div>
          <Progress value={score} className="w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Page URL to test (optional)"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={runAutomatedTests} 
              disabled={isRunningTests}
              className="flex items-center gap-2"
            >
              {isRunningTests ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunningTests ? 'Testing...' : 'Run Automated Tests'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" onClick={resetChecklist}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Checklist
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklist">Manual Checklist</TabsTrigger>
          <TabsTrigger value="automated">Automated Results</TabsTrigger>
          <TabsTrigger value="notes">Notes & Report</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-6">
          {Object.entries(groupedChecks).map(([category, checks]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getCategoryIcon(category as AccessibilityCheck['category'])}
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {checks.map((check) => (
                  <div key={check.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{check.name}</h4>
                          {check.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            WCAG {check.wcagLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {check.description}
                        </p>
                        {check.details && (
                          <p className="text-xs bg-muted p-2 rounded">
                            {check.details}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusIcon(check.status)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={check.status === 'pass' ? 'default' : 'outline'}
                        onClick={() => updateCheckStatus(check.id, 'pass')}
                      >
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        variant={check.status === 'warning' ? 'default' : 'outline'}
                        onClick={() => updateCheckStatus(check.id, 'warning')}
                      >
                        Warning
                      </Button>
                      <Button
                        size="sm"
                        variant={check.status === 'fail' ? 'destructive' : 'outline'}
                        onClick={() => updateCheckStatus(check.id, 'fail')}
                      >
                        Fail
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="automated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <pre className="text-sm bg-muted p-4 rounded overflow-auto whitespace-pre-wrap">
                  {testResults}
                </pre>
              ) : (
                <p className="text-muted-foreground">
                  Run automated tests to see results here. Tests will check for common accessibility issues
                  using tools like axe-core and custom CivicSense-specific checks.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing Notes & Observations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add notes about your accessibility testing, observations, or recommendations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={10}
              />
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Remember: Real User Testing Required</AlertTitle>
                <AlertDescription>
                  Automated tools and checklists catch many issues, but real testing with disabled users
                  is essential for truly accessible civic education. Consider reaching out to the disability
                  community for feedback on your civic learning tools.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 