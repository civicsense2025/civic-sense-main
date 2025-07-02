"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@civicsense/ui-web/components/ui/tabs'
import { Alert, AlertDescription } from '@civicsense/ui-web/components/ui/alert'
import { LMSIntegrationPanel } from '@civicsense/ui-web/components/integrations/lms-integration-panel'
import { ClassroomShareButton } from '@civicsense/ui-web/components/integrations/google-classroom-share-button'
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Settings, 
  ExternalLink, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Calendar,
  Download
} from 'lucide-react'

export default function TestMultiLMSIntegration() {
  const [selectedPlatform, setSelectedPlatform] = useState<'google_classroom' | 'clever' | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  const testScenarios = [
    {
      id: 'oauth-flow',
      title: 'OAuth Authentication',
      description: 'Test OAuth flow for both Google Classroom and Clever',
      status: 'pending'
    },
    {
      id: 'roster-sync',
      title: 'Roster Synchronization',
      description: 'Test student and teacher roster sync',
      status: 'pending'
    },
    {
      id: 'assignment-creation',
      title: 'Assignment Creation',
      description: 'Test creating assignments in both platforms',
      status: 'pending'
    },
    {
      id: 'grade-passback',
      title: 'Grade Passback',
      description: 'Test grade synchronization (Google Classroom only)',
      status: 'pending'
    },
    {
      id: 'share-buttons',
      title: 'Share Button Functionality',
      description: 'Test share-to-LMS buttons',
      status: 'pending'
    }
  ]

  const mockPodData = {
    id: 'test-pod-123',
    name: 'Test Civic Learning Pod',
    googleClassroomId: 'gc-course-456',
    cleverSectionId: 'clever-section-789',
    syncEnabled: true,
    gradePassbackEnabled: true,
    lastSync: new Date().toISOString(),
    userRole: 'teacher'
  }

  const runTest = async (testId: string) => {
    console.log(`Running test: ${testId}`)
    
    // Simulate test execution
    setTestResults(prev => ({
      ...prev,
      [testId]: { status: 'running', startTime: Date.now() }
    }))

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock test results
    const mockResults = {
      'oauth-flow': {
        google_classroom: { success: true, token: 'mock-gc-token' },
        clever: { success: true, token: 'mock-clever-token' }
      },
      'roster-sync': {
        google_classroom: { studentsAdded: 24, teachersAdded: 2 },
        clever: { studentsAdded: 28, teachersAdded: 1 }
      },
      'assignment-creation': {
        google_classroom: { assignmentId: 'gc-assignment-123' },
        clever: { assignmentId: 'clever-assignment-456' }
      },
      'grade-passback': {
        google_classroom: { gradesProcessed: 15, errors: 0 },
        clever: { note: 'Internal tracking only' }
      },
      'share-buttons': {
        google_classroom: { shareUrl: 'https://classroom.google.com/...' },
        clever: { copySuccess: true }
      }
    }

    setTestResults(prev => ({
      ...prev,
      [testId]: { 
        status: 'completed', 
        duration: Date.now() - prev[testId].startTime,
        results: mockResults[testId as keyof typeof mockResults]
      }
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Multi-LMS Integration Test Suite</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Test and validate the integration between CivicSense and multiple Learning Management Systems.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="google-classroom">Google Classroom</TabsTrigger>
          <TabsTrigger value="clever">Clever</TabsTrigger>
          <TabsTrigger value="share-buttons">Share Buttons</TabsTrigger>
          <TabsTrigger value="test-suite">Test Suite</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Google Classroom Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OAuth Setup</span>
                    <Badge variant="outline">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grade Passback</span>
                    <Badge variant="secondary">Automatic</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Roster Sync</span>
                    <Badge variant="secondary">Bi-directional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assignment Creation</span>
                    <Badge variant="secondary">Supported</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Clever Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OAuth Setup</span>
                    <Badge variant="outline">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grade Tracking</span>
                    <Badge variant="secondary">Internal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Roster Sync</span>
                    <Badge variant="secondary">Import Only</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assignment Creation</span>
                    <Badge variant="secondary">Manual Process</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Hybrid School-Pod System</h4>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div>• District → Schools → Courses/Sections</div>
                    <div>• LMS Integration (Google Classroom OR Clever)</div>
                    <div>• Institutional Learning Pods</div>
                    <div>• Role-based Access Control</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Google Classroom Flow
                    </h5>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <div>1. OAuth Authentication</div>
                      <div>2. Course Import & Selection</div>
                      <div>3. Bi-directional Roster Sync</div>
                      <div>4. Assignment Creation</div>
                      <div>5. Automatic Grade Passback</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Clever Flow
                    </h5>
                    <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <div>1. OAuth Authentication</div>
                      <div>2. Section Import & Selection</div>
                      <div>3. Roster Import</div>
                      <div>4. Manual Assignment Creation</div>
                      <div>5. Internal Grade Tracking</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google-classroom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Classroom Integration Test</CardTitle>
            </CardHeader>
            <CardContent>
              <LMSIntegrationPanel
                podId={mockPodData.id}
                podName={mockPodData.name}
                lmsPlatform="google_classroom"
                googleClassroomId={mockPodData.googleClassroomId}
                syncEnabled={mockPodData.syncEnabled}
                gradePassbackEnabled={mockPodData.gradePassbackEnabled}
                lastSync={mockPodData.lastSync}
                userRole={mockPodData.userRole}
                onUpdate={() => console.log('Google Classroom pod updated')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clever" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Clever Integration Test</CardTitle>
            </CardHeader>
            <CardContent>
              <LMSIntegrationPanel
                podId={mockPodData.id}
                podName={mockPodData.name}
                lmsPlatform="clever"
                cleverSectionId={mockPodData.cleverSectionId}
                syncEnabled={mockPodData.syncEnabled}
                gradePassbackEnabled={false} // Clever uses internal tracking
                lastSync={mockPodData.lastSync}
                userRole={mockPodData.userRole}
                onUpdate={() => console.log('Clever pod updated')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share-buttons" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Google Classroom Share Button
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Test the Google Classroom share button functionality.
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <ClassroomShareButton
                    url="https://civicsense.one/quiz/constitutional-rights"
                    title="CivicSense Quiz: Constitutional Rights"
                    body="Test your knowledge of constitutional protections and civil liberties"
                    itemType="assignment"
                    size={48}
                  />
                  
                  <ClassroomShareButton
                    url="https://civicsense.one/quiz/separation-of-powers"
                    title="CivicSense Quiz: Separation of Powers"
                    body="Understand how the three branches of government balance each other"
                    itemType="assignment"
                    size={32}
                    theme="light"
                  />
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Google Classroom share requires Google's platform.js to be loaded.
                    In production, this happens automatically.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test-suite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Automated Test Suite</span>
                <Button
                  onClick={() => testScenarios.forEach(test => runTest(test.id))}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run All Tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testScenarios.map((test) => {
                  const result = testResults[test.id]
                  const isRunning = result?.status === 'running'
                  const isCompleted = result?.status === 'completed'
                  
                  return (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            isCompleted ? 'bg-green-500' : 
                            isRunning ? 'bg-yellow-500 animate-pulse' : 
                            'bg-gray-300'
                          }`} />
                          <h4 className="font-medium">{test.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && result.duration && (
                            <Badge variant="outline">
                              {result.duration}ms
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runTest(test.id)}
                            disabled={isRunning}
                          >
                            {isRunning ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              'Run Test'
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {test.description}
                      </p>
                      
                      {isCompleted && result.results && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-sm">
                          <pre className="text-xs">
                            {JSON.stringify(result.results, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Google Classroom Endpoints</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">POST</Badge>
                      <code>/api/integrations/classroom/sync-roster</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">POST</Badge>
                      <code>/api/integrations/classroom/create-assignment</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">POST</Badge>
                      <code>/api/integrations/classroom/process-grades</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">GET</Badge>
                      <code>/api/integrations/classroom/import</code>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Clever Endpoints</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">POST</Badge>
                      <code>/api/integrations/clever/sync-roster</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">POST</Badge>
                      <code>/api/integrations/clever/create-assignment</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">POST</Badge>
                      <code>/api/integrations/clever/process-grades</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">GET</Badge>
                      <code>/api/integrations/clever/import</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 