import { Metadata } from 'next'
import { LearningPodManager } from '@/components/learning-pods/family-pod-manager'
import { PodDiscovery } from '@/components/learning-pods/pod-discovery'
import { EnhancedPodAnalytics } from '@/components/learning-pods/enhanced-pod-analytics'
import { ParentalControls } from '@/components/learning-pods/parental-controls'
import { LearningPodsErrorBoundary } from '@/components/learning-pods/error-boundary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Search, 
  BarChart3, 
  Shield, 
  Star
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Learning Pods | CivicSense',
  description: 'Create and manage learning pods for collaborative civic education with family, friends, classrooms, and organizations.',
}

export default function LearningPodsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Clean header with lots of whitespace */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-light mb-4">
            <Star className="h-4 w-4" />
            Learning Pods
          </div>
          <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
            Collaborative Learning
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Create safe learning environments for families, friends, classrooms, campaigns, and organizations
          </p>
        </div>

        {/* Main interface */}
        <Tabs defaultValue="my-pods" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-16 bg-slate-100 dark:bg-slate-800 h-12">
            <TabsTrigger value="my-pods" className="gap-2 font-light">
              <Users className="h-4 w-4" />
              My Pods
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2 font-light">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 font-light">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 font-light">
              <Shield className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-pods">
            <LearningPodsErrorBoundary>
              <LearningPodManager />
            </LearningPodsErrorBoundary>
          </TabsContent>

          <TabsContent value="discover">
            <LearningPodsErrorBoundary>
              <div className="text-center space-y-6 mb-12">
                <h2 className="text-3xl font-light text-slate-900 dark:text-white">
                  Discover Learning Pods
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                  Find and join public learning pods that match your interests and learning goals
                </p>
              </div>
              <PodDiscovery />
            </LearningPodsErrorBoundary>
          </TabsContent>

          <TabsContent value="analytics">
            <LearningPodsErrorBoundary>
              <div className="text-center space-y-6 mb-12">
                <h2 className="text-3xl font-light text-slate-900 dark:text-white">
                  Pod Analytics
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                  Get detailed insights into your pod's performance and member engagement
                </p>
              </div>
              <EnhancedPodAnalytics podId="demo-pod-id" />
            </LearningPodsErrorBoundary>
          </TabsContent>

          <TabsContent value="settings">
            <LearningPodsErrorBoundary>
              <div className="text-center space-y-6 mb-12">
                <h2 className="text-3xl font-light text-slate-900 dark:text-white">
                  Parental Controls
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                  Manage content filtering and safety settings for your children's learning experience
                </p>
              </div>
              <ParentalControls />
            </LearningPodsErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 