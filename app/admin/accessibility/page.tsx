import { Metadata } from 'next'
import { AccessibilityChecker } from '@/components/admin/accessibility-checker'
import { AccessibilityStatusDashboard } from '@/components/accessibility-status-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Users, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Accessibility Management | CivicSense Admin',
  description: 'Manage and monitor accessibility compliance for CivicSense civic education platform',
}

export default function AccessibilityAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Management</h1>
          <p className="text-muted-foreground mt-2">
            Ensure CivicSense is accessible to every citizen who wants to learn about democracy
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          WCAG 2.1 AA Target
        </Badge>
      </div>

      {/* Mission Statement */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Accessibility is Democracy in Action</AlertTitle>
        <AlertDescription>
          Every accessibility barrier we remove is a step toward more inclusive democracy. 
          When we exclude people from civic education, we exclude them from democracy itself.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">WCAG Compliance</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assistive Tech Users</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">+12%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Accessibility Status</CardTitle>
        </CardHeader>
        <CardContent>
          <AccessibilityStatusDashboard 
            showDetailed={false}
            enableUserActions={false}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Priority Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800 dark:text-red-200">
                  Critical: Quiz navigation keyboard trap
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Users cannot escape quiz modal using keyboard only. Blocks civic learning for keyboard users.
                </p>
                <p className="text-xs text-red-500 mt-1">Reported 2 hours ago • Affects civic quiz engine</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  High: Screen reader announcements for multiplayer progress
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  Multiplayer quiz progress not announced to screen readers. Reduces engagement for blind users.
                </p>
                <p className="text-xs text-yellow-500 mt-1">Reported 1 day ago • Affects multiplayer civic games</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Enhancement: Audio descriptions for news analysis graphics
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  News bias visualization charts need audio descriptions for comprehensive accessibility.
                </p>
                <p className="text-xs text-blue-500 mt-1">Suggested enhancement • Affects news ticker component</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Accessibility Checker Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Testing & Compliance</CardTitle>
          <p className="text-muted-foreground">
            Use this tool to test components and pages for accessibility compliance. 
            All components must pass before deployment.
          </p>
        </CardHeader>
        <CardContent>
          <AccessibilityChecker />
        </CardContent>
      </Card>

      {/* Testing Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Guidelines for Civic Education</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Required Testing Scenarios</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Quiz questions with keyboard-only navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Screen reader testing for multiplayer games</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>High contrast mode for news analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Voice control compatibility for audio content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Cognitive load assessment for complex topics</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Civic Education Priorities</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Constitutional quiz questions must be 100% accessible</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Voting information cannot have accessibility barriers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Government structure content needs full screen reader support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Political news analysis must include bias detection for all users</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Links */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">WCAG 2.1 Guidelines</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Official Web Content Accessibility Guidelines for democratic platforms
              </p>
              <a 
                href="https://www.w3.org/WAI/WCAG21/quickref/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline"
              >
                View Guidelines →
              </a>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Assistive Technology Testing</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Tools and techniques for testing with screen readers and other AT
              </p>
              <a 
                href="https://webaim.org/articles/screenreader_testing/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline"
              >
                Testing Guide →
              </a>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Democratic Accessibility</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Research on accessibility in civic education and political participation
              </p>
              <a 
                href="https://www.disability.gov/voting-and-election-information" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline"
              >
                Learn More →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 