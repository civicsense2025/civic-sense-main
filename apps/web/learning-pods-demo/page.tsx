import { Metadata } from 'next'
import { LearningPodManager } from '@civicsense/ui-web/components/learning-pods/family-pod-manager'
import { ParentalControls } from '@civicsense/ui-web/components/learning-pods/parental-controls'
import { PodDiscovery } from '@civicsense/ui-web/components/learning-pods/pod-discovery'
import { EnhancedPodAnalytics } from '@civicsense/ui-web/components/learning-pods/enhanced-pod-analytics'
import { LearningPodsErrorBoundary } from '@civicsense/ui-web/components/learning-pods/error-boundary'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@civicsense/ui-web/components/ui/tabs'
import { Alert, AlertDescription } from '@civicsense/ui-web/components/ui/alert'
import { 
  Users, 
  Shield, 
  Clock, 
  Eye, 
  Heart,
  Star,
  BookOpen,
  Info,
  CheckCircle,
  Search,
  Share2,
  BarChart3,
  Bell
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Learning Pods | CivicSense',
  description: 'Experience how learning pods create safe environments for families, friends, classrooms, campaigns, and organizations.',
}

export default function LearningPodsDemo() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-16">
        {/* Clean hero section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-light mb-8">
            <Star className="h-4 w-4" />
            Now Available
          </div>
          <h1 className="text-5xl md:text-6xl font-light mb-6 text-slate-900 dark:text-white tracking-tight">
            Learning Pods
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-3xl mx-auto mb-12">
            Create safe, collaborative learning environments for families, friends, classrooms, campaigns, and organizations. 
            Complete with content filtering, analytics, and social sharing features.
          </p>
          
          {/* Key features grid - minimal design */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-4xl mx-auto mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium mb-2 text-slate-900 dark:text-white">Learning Groups</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Connect people in supervised learning environments</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium mb-2 text-slate-900 dark:text-white">Content Filtering</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Age-appropriate content with customizable restrictions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium mb-2 text-slate-900 dark:text-white">Advanced Analytics</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Detailed insights and performance tracking</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-medium mb-2 text-slate-900 dark:text-white">Easy Sharing</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Social sharing with invite links and notifications</p>
            </div>
          </div>
        </div>

        {/* Status alert */}
        <Alert className="mb-12 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 max-w-4xl mx-auto">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Fully Functional:</strong> This learning pods system is now complete with database integration, 
            analytics, sharing features, and notifications. Run the migrations to enable full functionality.
          </AlertDescription>
        </Alert>

        {/* Main demo interface */}
        <Tabs defaultValue="pods" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-5 mb-16 bg-slate-100 dark:bg-slate-800 h-12">
            <TabsTrigger value="pods" className="gap-2 font-light">
              <Users className="h-4 w-4" />
              My Pods
            </TabsTrigger>
            <TabsTrigger value="discovery" className="gap-2 font-light">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 font-light">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2 font-light">
              <Shield className="h-4 w-4" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2 font-light">
              <Heart className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pods">
            <LearningPodsErrorBoundary>
              <LearningPodManager />
            </LearningPodsErrorBoundary>
          </TabsContent>

          <TabsContent value="discovery">
            <LearningPodsErrorBoundary>
              <PodDiscovery />
            </LearningPodsErrorBoundary>
          </TabsContent>

          <TabsContent value="analytics">
            <LearningPodsErrorBoundary>
              <div className="text-center py-12 mb-8">
                <h2 className="text-3xl font-light text-slate-900 dark:text-white mb-4">
                  Advanced Analytics
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                  Get detailed insights into your pod's performance, member engagement, and learning progress
                </p>
              </div>
              <EnhancedPodAnalytics podId="demo-pod-id" />
            </LearningPodsErrorBoundary>
          </TabsContent>

          <TabsContent value="controls">
            <LearningPodsErrorBoundary>
              <ParentalControls />
            </LearningPodsErrorBoundary>
          </TabsContent>

          <TabsContent value="features">
            {/* Features showcase */}
            <div className="space-y-16">
              <div className="text-center">
                <h2 className="text-3xl font-light text-slate-900 dark:text-white mb-4">
                  Complete Feature Set
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                  Everything you need for safe, effective group learning
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* For Administrators */}
                <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-xl font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      For Administrators
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Advanced Analytics</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            Track member engagement, learning progress, and pod health with detailed charts and insights
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Smart Notifications</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            Receive real-time alerts for join requests, member activity, and important updates
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Easy Sharing</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            Create shareable invite links with expiration dates, usage limits, and social media integration
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Content Control</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            Set age-appropriate filters and customize content access for different member types
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* For Members */}
                <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-xl font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      For Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Safe Learning Environment</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            Learn in a protected space with age-appropriate content and supervised interactions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Group Progress Tracking</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            See how you're doing compared to other pod members with friendly competition
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Easy Discovery</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            Find and join public pods that match your interests and learning goals
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Flexible Learning</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                            Learn at your own pace with content that adapts to your age and skill level
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Filtering Examples */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Content Filtering Examples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">🟢</span>
                        </div>
                        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Elementary (Ages 5-11)</h4>
                        <Badge variant="outline" className="mb-2">Strict Filtering</Badge>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Basic government structure</li>
                          <li>• Community helpers</li>
                          <li>• Simple voting concepts</li>
                          <li>• Local government roles</li>
                        </ul>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">🔵</span>
                        </div>
                        <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Middle School (Ages 12-14)</h4>
                        <Badge variant="outline" className="mb-2">Moderate Filtering</Badge>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Constitutional basics</li>
                          <li>• Election processes</li>
                          <li>• Historical context</li>
                          <li>• Policy impacts</li>
                        </ul>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">🟡</span>
                        </div>
                        <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">High School (Ages 15-18)</h4>
                        <Badge variant="outline" className="mb-2">Light Filtering</Badge>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Complex policy issues</li>
                          <li>• Political debates</li>
                          <li>• Current events analysis</li>
                          <li>• Critical thinking skills</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to action */}
        <Card className="mt-20 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-0">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl font-light mb-4">Ready to Start Learning Together?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto font-light">
              Create your first learning pod and experience safe, collaborative civic education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Badge variant="secondary" className="text-lg px-8 py-3 bg-white/10 border-white/20 text-white">
                🚀 Now Available
              </Badge>
              <Badge variant="outline" className="text-lg px-8 py-3 bg-white/10 border-white/20 text-white">
                📧 Full Database Integration
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 