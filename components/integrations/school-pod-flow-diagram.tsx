"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Building, 
  School, 
  BookOpen, 
  Users, 
  ArrowRight,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Database,
  Shield,
  CheckCircle,
  Zap
} from 'lucide-react'

export function SchoolPodFlowDiagram() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white">
          School-Pod Integration Architecture
        </h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-3xl mx-auto">
          How CivicSense seamlessly integrates with educational institutions while maintaining 
          compliance and enabling rich civic learning experiences.
        </p>
      </div>

      {/* Institutional Side */}
      <div className="space-y-8">
        <div className="text-center">
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0 mb-4">
            Institutional Side (Compliance)
          </Badge>
          <h3 className="text-xl font-light text-slate-900 dark:text-white">
            Educational Data & Administration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* District Level */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
            <CardHeader className="text-center">
              <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg font-light">District</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Springfield USD</p>
                <p className="text-xs text-slate-500">50,000 students</p>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">FERPA Compliant</Badge>
                <Badge variant="outline" className="text-xs">Policy Management</Badge>
              </div>
            </CardContent>
          </Card>

          {/* School Level */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader className="text-center">
              <School className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg font-light">School</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Lincoln High School</p>
                <p className="text-xs text-slate-500">1,200 students</p>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Student Records</Badge>
                <Badge variant="outline" className="text-xs">Attendance</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Course Level */}
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="text-center">
              <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg font-light">Course</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">AP Government</p>
                <p className="text-xs text-slate-500">28 students</p>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Google Classroom</Badge>
                <Badge variant="outline" className="text-xs">Gradebook</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connection Layer */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-600"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-white dark:bg-slate-950 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-full">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Seamless Integration
              </span>
              <Database className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Learning Community Side */}
      <div className="space-y-8">
        <div className="text-center">
          <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-0 mb-4">
            Learning Community Side (Engagement)
          </Badge>
          <h3 className="text-xl font-light text-slate-900 dark:text-white">
            Civic Learning & Community Building
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* District Program Pod */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
            <CardHeader className="text-center">
              <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg font-light">District Program</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Constitution Challenge 2024</p>
                <p className="text-xs text-slate-500">All high schools</p>
              </div>
              <div className="space-y-1">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-0 text-xs">
                  District-wide Competition
                </Badge>
                <Badge variant="outline" className="text-xs">Cross-curricular</Badge>
              </div>
            </CardContent>
          </Card>

          {/* School Program Pod */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
            <CardHeader className="text-center">
              <School className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg font-light">School Program</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Lincoln Democracy Week</p>
                <p className="text-xs text-slate-500">School-wide event</p>
              </div>
              <div className="space-y-1">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs">
                  Community Engagement
                </Badge>
                <Badge variant="outline" className="text-xs">Mock Election</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Classroom Pod */}
          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
            <CardHeader className="text-center">
              <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg font-light">Classroom Pod</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">AP Gov - Civic Learning</p>
                <p className="text-xs text-slate-500">Daily civic activities</p>
              </div>
              <div className="space-y-1">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0 text-xs">
                  Grade Passback
                </Badge>
                <Badge variant="outline" className="text-xs">Real-time Sync</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6">
            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Compliance</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              FERPA & COPPA compliant data handling
            </p>
          </CardContent>
        </Card>

        <Card className="text-center border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6">
            <RefreshCw className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Integration</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Seamless grade passback to LMS
            </p>
          </CardContent>
        </Card>

        <Card className="text-center border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Community</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rich civic learning features
            </p>
          </CardContent>
        </Card>

        <Card className="text-center border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6">
            <Zap className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Scalability</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              From classroom to district-wide
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Example Flow */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-light text-slate-900 dark:text-white">
            Example: Student Takes Civic Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Step 1 */}
            <div className="flex-1 text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">Student Access</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Opens Google Classroom assignment
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-400 hidden md:block" />
            <ArrowDown className="h-5 w-5 text-slate-400 md:hidden" />

            {/* Step 2 */}
            <div className="flex-1 text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">2</span>
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">Civic Learning</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Takes CivicSense quiz in pod
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-400 hidden md:block" />
            <ArrowDown className="h-5 w-5 text-slate-400 md:hidden" />

            {/* Step 3 */}
            <div className="flex-1 text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">Auto Sync</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Grade syncs to Classroom automatically
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-400 hidden md:block" />
            <ArrowDown className="h-5 w-5 text-slate-400 md:hidden" />

            {/* Step 4 */}
            <div className="flex-1 text-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-medium text-slate-900 dark:text-white">Complete</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Full compliance maintained
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-light text-slate-900 dark:text-white">
          Ready to integrate your institution?
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Integration Guide
          </Button>
          <Button variant="outline">
            <School className="h-4 w-4 mr-2" />
            Test Integration
          </Button>
        </div>
      </div>
    </div>
  )
} 