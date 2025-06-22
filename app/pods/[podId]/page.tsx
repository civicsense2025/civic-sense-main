"use client"

import { useState, useEffect } from 'react'
import { notFound, useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, BarChart3, Star, School, Activity, Settings, Shield } from 'lucide-react'
import { arePodsEnabled } from '@/lib/feature-flags'
import { createClient } from '@/lib/supabase/client'

interface PodDetails {
  pod_name: string
  pod_emoji: string | undefined
  pod_motto: string | undefined
}

export default function PodPage() {
  const params = useParams()
  const [podDetails, setPodDetails] = useState<PodDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Feature flag check - hide pods in production
  if (!arePodsEnabled()) {
    notFound()
  }

  // Basic validation
  if (!params?.podId) {
    notFound()
  }

  useEffect(() => {
    async function loadPodDetails() {
      try {
        const supabase = createClient()
        const { data: pod, error } = await supabase
          .from('learning_pods')
          .select('pod_name, pod_emoji, pod_motto')
          .eq('id', params.podId)
          .single()

        if (error || !pod) {
          notFound()
        }

        setPodDetails({
          pod_name: pod.pod_name,
          pod_emoji: pod.pod_emoji || undefined,
          pod_motto: pod.pod_motto || undefined
        })
      } catch (error) {
        console.error('Failed to load pod details:', error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    loadPodDetails()
  }, [params.podId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <main className="w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="space-y-4 animate-pulse">
              <div className="h-12 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-6 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      
      <main className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          {/* Pod Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-light text-slate-900 dark:text-white mb-3 flex items-center gap-3">
              <span className="text-3xl">{podDetails?.pod_emoji || '👥'}</span>
              {podDetails?.pod_name}
            </h1>
            {podDetails?.pod_motto && (
              <p className="text-xl text-slate-500 dark:text-slate-400 font-light">
                {podDetails.pod_motto}
              </p>
            )}
          </div>

          {/* Pod Navigation */}
          <Tabs defaultValue="members" className="space-y-8">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 gap-1">
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Pod Settings
              </TabsTrigger>
              <TabsTrigger value="safety" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Safety
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="members">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-2">Pod Members</h2>
                  <p className="text-slate-500 dark:text-slate-400">Manage your pod's members and roles</p>
                </div>

                {/* Member management content will go here */}
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  Member management interface coming soon
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-8">
                {/* Analytics Overview */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-2">Pod Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Performance insights and member engagement data</p>
                  </div>

                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Members</h3>
                          <Users className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 dark:text-white">1</p>
                        <p className="text-sm text-green-600">1 active (100.0%)</p>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Questions Answered</h3>
                          <BarChart3 className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 dark:text-white">0</p>
                        <p className="text-sm text-slate-500">0.0% accuracy</p>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Time Spent</h3>
                          <Activity className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 dark:text-white">0m</p>
                        <p className="text-sm text-slate-500">0m avg/member</p>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Engagement Score</h3>
                          <School className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 dark:text-white">1.0</p>
                        <p className="text-sm text-green-600">↑ avg daily active</p>
                      </div>
                    </Card>
                  </div>

                  {/* Activity Section */}
                  <section className="space-y-6 pt-12">
                    <div>
                      <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Daily Activity</h3>
                      <p className="text-slate-500 dark:text-slate-400">Track member engagement and participation over time</p>
                    </div>
                    
                    <Card className="p-6">
                      <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                        Activity chart will be rendered here
                      </div>
                    </Card>
                  </section>

                  {/* Member Performance Section */}
                  <section className="space-y-6 pt-12">
                    <div>
                      <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Member Performance</h3>
                      <p className="text-slate-500 dark:text-slate-400">Individual member progress and achievements</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Role Distribution</h4>
                        <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                          Role distribution chart will be rendered here
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Activity Heatmap</h4>
                        <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                          Activity heatmap will be rendered here
                        </div>
                      </Card>
                    </div>
                  </section>

                  {/* Learning Progress Section */}
                  <section className="space-y-6 pt-12">
                    <div>
                      <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Learning Progress</h3>
                      <p className="text-slate-500 dark:text-slate-400">Topic mastery and difficulty progression</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Topic Performance</h4>
                        <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                          Topic performance chart will be rendered here
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Difficulty Distribution</h4>
                        <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                          Difficulty distribution chart will be rendered here
                        </div>
                      </Card>
                    </div>
                  </section>

                  {/* Insights Section */}
                  <section className="space-y-6 pt-12">
                    <div>
                      <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Key Insights</h3>
                      <p className="text-slate-500 dark:text-slate-400">AI-powered insights and recommendations</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Card className="p-6">
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-slate-900 dark:text-white">Engagement Patterns</h4>
                          <p className="text-slate-600 dark:text-slate-300">
                            No significant patterns detected yet. Continue using the platform to generate insights.
                          </p>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-slate-900 dark:text-white">Learning Recommendations</h4>
                          <p className="text-slate-600 dark:text-slate-300">
                            Start by completing some activities to receive personalized recommendations.
                          </p>
                        </div>
                      </Card>
                    </div>
                  </section>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="challenges">
              {/* Challenges content */}
            </TabsContent>

            <TabsContent value="settings">
              {/* Settings content */}
            </TabsContent>

            <TabsContent value="safety">
              {/* Safety content */}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 