"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Accessibility, 
  Users, 
  Settings,
  MessageSquare,
  Heart,
  Keyboard,
  Volume2,
  Eye,
  Target
} from 'lucide-react'
import { AccessibilitySettings } from '@/components/accessibility-settings'
import { AccessibilityStatusDashboard } from '@/components/accessibility-status-dashboard'
import { AccessibilityFeedbackForm } from '@/components/accessibility-feedback-form'

export default function AccessibilityTestPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">CivicSense Accessibility Demo</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience how we make civic education accessible to every citizen. Test our accessibility 
          features, report issues, and see how democracy works better when everyone can participate.
        </p>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-lg px-4 py-2">
          <Shield className="h-5 w-5 mr-2" />
          WCAG 2.1 AA Compliant
        </Badge>
      </div>

      {/* Mission Statement */}
      <Alert>
        <Heart className="h-4 w-4" />
        <AlertTitle>Accessibility is Democracy in Action</AlertTitle>
        <AlertDescription>
          Every accessibility feature you see here advances our mission: ensuring that all citizens, 
          regardless of ability, can access civic education and participate meaningfully in democracy. 
          When we remove barriers to learning about government, we strengthen democracy itself.
        </AlertDescription>
      </Alert>

      {/* Accessibility Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-6 w-6" />
            Accessibility Features Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Keyboard className="h-8 w-8 text-blue-600" />
                <h3 className="font-semibold">Keyboard Navigation</h3>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Complete keyboard access to all features</li>
                <li>• Quiz shortcuts (1-4 for answers, n/p for navigation)</li>
                <li>• Skip links to main content</li>
                <li>• Logical tab order throughout</li>
                <li>• No keyboard traps</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Volume2 className="h-8 w-8 text-green-600" />
                <h3 className="font-semibold">Screen Reader Support</h3>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• ARIA labels for all interactive elements</li>
                <li>• Live regions for dynamic content</li>
                <li>• Semantic HTML structure</li>
                <li>• Progress announcements</li>
                <li>• Error and success message alerts</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Eye className="h-8 w-8 text-purple-600" />
                <h3 className="font-semibold">Visual Accessibility</h3>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• WCAG AA contrast ratios (4.5:1+)</li>
                <li>• High contrast mode available</li>
                <li>• Zoom support up to 200%</li>
                <li>• Large text options</li>
                <li>• Reduced motion preferences</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Volume2 className="h-8 w-8 text-orange-600" />
                <h3 className="font-semibold">Audio Features</h3>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Text-to-speech for all content</li>
                <li>• Customizable speech rate and pitch</li>
                <li>• Transcripts for audio content</li>
                <li>• Keyboard accessible audio controls</li>
                <li>• No auto-playing content</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-8 w-8 text-red-600" />
                <h3 className="font-semibold">Civic Education Focus</h3>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Quiz questions properly structured</li>
                <li>• Multiplayer games fully accessible</li>
                <li>• News analysis with bias detection</li>
                <li>• Progress tracking for all users</li>
                <li>• Government content 100% accessible</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-8 w-8 text-teal-600" />
                <h3 className="font-semibold">Community Support</h3>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• User feedback and issue reporting</li>
                <li>• Real user testing with disabled community</li>
                <li>• Continuous improvement based on feedback</li>
                <li>• Support for assistive technology users</li>
                <li>• Democratic participation for all</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Settings</CardTitle>
            <p className="text-muted-foreground text-sm">
              Customize your civic learning experience
            </p>
          </CardHeader>
          <CardContent>
            <AccessibilitySettings 
              trigger={
                <Button size="lg" className="w-full">
                  <Settings className="h-5 w-5 mr-2" />
                  Open Settings
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Issues</CardTitle>
            <p className="text-muted-foreground text-sm">
              Help us improve accessibility for all
            </p>
          </CardHeader>
          <CardContent>
            <AccessibilityFeedbackForm 
              trigger={
                <Button size="lg" className="w-full" variant="outline">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Report Issue
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Status</CardTitle>
            <p className="text-muted-foreground text-sm">
              See our accessibility compliance
            </p>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full" variant="secondary" asChild>
              <a href="#dashboard">
                <Shield className="h-5 w-5 mr-2" />
                View Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Dashboard */}
      <div id="dashboard">
        <AccessibilityStatusDashboard />
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          CivicSense is committed to accessibility and democratic participation for all citizens. 
          <br />
          Built with WCAG 2.1 AA compliance • Tested with real users • Continuously improving
        </p>
      </div>
    </div>
  )
} 