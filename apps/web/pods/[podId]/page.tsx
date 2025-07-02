"use client"

import { useState, useEffect } from 'react'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@civicsense/ui-web/components/header'
import { Card } from '@civicsense/ui-web/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@civicsense/ui-web/components/ui/tabs'
import { Users, BarChart3, Star, School, Activity, Settings, Shield, Calendar, Target, Trophy, BookOpen, Brain } from 'lucide-react'
import { arePodsEnabled } from '@civicsense/shared/lib/comprehensive-feature-flags'
import { createClient } from '@civicsense/shared/lib/supabase/client'
import { useAuth } from '@civicsense/ui-web/components/auth/auth-provider'

// Import all the comprehensive pod components
import { EnhancedPodAnalytics } from '@civicsense/ui-web/components/learning-pods/enhanced-pod-analytics'
import { PodMemberManagement } from '@civicsense/ui-web/components/learning-pods/pod-member-management'
import { PodActivityFeed } from '@civicsense/ui-web/components/learning-pods/pod-activity-feed'
import { ParentalControls } from '@civicsense/ui-web/components/learning-pods/parental-controls'

interface PodDetails {
  pod_name: string
  pod_emoji: string | undefined
  pod_motto: string | undefined
  pod_type: string
  user_role: string
  member_count: number
  content_filter_level: string
  description?: string
  personality_type?: string
  theme?: {
    name: string
    display_name: string
    emoji: string
    primary_color: string
  } | null
  accessibility_mode?: string
}

export default function PodPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [podDetails, setPodDetails] = useState<PodDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Tab state with query parameter support
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'overview')

  // Feature flag check - hide pods in production
  if (!arePodsEnabled()) {
    notFound()
  }

  // Basic validation
  if (!params?.podId) {
    notFound()
  }

  // Handle tab changes with URL updates
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const urlParams = new URLSearchParams(searchParams?.toString())
    urlParams.set('tab', value)
    router.push(`/pods/${params.podId}?${urlParams.toString()}`, { scroll: false })
  }

  useEffect(() => {
    async function loadPodDetails() {
      try {
        const supabase = createClient()
        
        // Get pod details and user's role in the pod
        const { data: pod, error: podError } = await supabase
          .from('learning_pods')
          .select(`
            pod_name, 
            pod_emoji, 
            pod_motto, 
            pod_type,
            description,
            personality_type,
            content_filter_level,
            accessibility_mode,
            theme:pod_themes(name, display_name, emoji, primary_color)
          `)
          .eq('id', params.podId)
          .single()

        if (podError || !pod) {
          notFound()
        }

        // Get user's role in this pod and member count
        let userRole = 'member'
        let memberCount = 0

        if (user) {
          const { data: membership } = await supabase
            .from('pod_memberships')
            .select('role')
            .eq('pod_id', params.podId)
            .eq('user_id', user.id)
            .eq('membership_status', 'active')
            .single()

          if (membership) {
            userRole = membership.role
          }
        }

        // Get member count
        const { count } = await supabase
          .from('pod_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('pod_id', params.podId)
          .eq('membership_status', 'active')

        memberCount = count || 0

        setPodDetails({
          pod_name: pod.pod_name,
          pod_emoji: pod.pod_emoji || undefined,
          pod_motto: pod.pod_motto || undefined,
          pod_type: pod.pod_type,
          user_role: userRole,
          member_count: memberCount,
          content_filter_level: pod.content_filter_level || 'moderate',
          description: pod.description,
          personality_type: pod.personality_type,
          theme: Array.isArray(pod.theme) && pod.theme.length > 0 ? pod.theme[0] : null,
          accessibility_mode: pod.accessibility_mode
        })
      } catch (error) {
        console.error('Failed to load pod details:', error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    loadPodDetails()
  }, [params.podId, user])

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

  // Helper function to determine if user has admin/management permissions
  const canManagePod = () => {
    return ['admin', 'teacher', 'parent', 'organizer'].includes(podDetails?.user_role || '')
  }

  // Helper function to get pod personality styling
  const getPodStyling = () => {
    if (podDetails?.theme) {
      return {
        accentColor: podDetails.theme.primary_color,
        emoji: podDetails.theme.emoji || podDetails.pod_emoji || '👥'
      }
    }
    return {
      accentColor: '#3b82f6',
      emoji: podDetails?.pod_emoji || '👥'
    }
  }

  const styling = getPodStyling()

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          {/* Enhanced Pod Header - Apple Style */}
          <div className="text-center space-y-6 mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border border-slate-700"
                style={{ 
                  backgroundColor: `${styling.accentColor}20`,
                  borderColor: styling.accentColor
                }}
              >
                {styling.emoji}
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight">
                {podDetails?.pod_name}
              </h1>
              {podDetails?.pod_motto && (
                <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                  {podDetails.pod_motto}
                </p>
              )}
              <p className="text-slate-400 font-light max-w-3xl mx-auto">
                Performance insights and member engagement data
              </p>
            </div>

            {/* Pod metadata */}
            <div className="flex items-center justify-center gap-8 text-sm text-slate-400 pt-4">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {podDetails?.member_count} member{podDetails?.member_count !== 1 ? 's' : ''}
              </span>
              <span className="capitalize">{podDetails?.pod_type} Pod</span>
              {podDetails?.personality_type && (
                <span className="capitalize">{podDetails.personality_type} Style</span>
              )}
              <span className="capitalize">Your Role: {podDetails?.user_role}</span>
            </div>
          </div>

          {/* Key Metrics - Apple Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center space-y-2">
              <div className="text-4xl font-light text-white">
                {podDetails?.member_count || 0}
              </div>
              <p className="text-slate-400 font-light">Total Members</p>
              <div className="text-sm text-green-400">
                {podDetails?.member_count || 0} active (100%)
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="text-4xl font-light text-white">
                0
              </div>
              <p className="text-slate-400 font-light">Questions Answered</p>
              <div className="text-sm text-slate-500">
                0.0% accuracy
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="text-4xl font-light text-white">
                0m
              </div>
              <p className="text-slate-400 font-light">Time Spent</p>
              <div className="text-sm text-slate-500">
                0m avg/member
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="text-4xl font-light text-white">
                0.0
              </div>
              <p className="text-slate-400 font-light">Engagement Score</p>
              <div className="text-sm text-slate-500">
                -- avg daily active
              </div>
            </div>
          </div>

          {/* Enhanced Pod Navigation - Apple Style */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-12">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 mb-12 bg-slate-800 h-12">
              <TabsTrigger value="overview" className="font-light text-slate-400 data-[state=active]:text-white">
                Activity
              </TabsTrigger>
              <TabsTrigger value="members" className="font-light text-slate-400 data-[state=active]:text-white">
                Members
              </TabsTrigger>
              <TabsTrigger value="analytics" className="font-light text-slate-400 data-[state=active]:text-white">
                Performance
              </TabsTrigger>
              <TabsTrigger value="challenges" className="font-light text-slate-400 data-[state=active]:text-white">
                Insights
              </TabsTrigger>
              {canManagePod() && (
                <>
                  <TabsTrigger value="settings" className="font-light text-slate-400 data-[state=active]:text-white">
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="safety" className="font-light text-slate-400 data-[state=active]:text-white">
                    Safety
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Overview Tab - Apple Style Activity */}
            <TabsContent value="overview">
              <div className="space-y-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-light text-white">
                    Daily Activity
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <PodActivityFeed 
                      podId={params.podId as string}
                      showPodName={false}
                      limit={30}
                      className="space-y-4"
                    />
                  </div>
                  <div className="space-y-6">
                    <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                      <div className="p-6 space-y-6">
                        <h3 className="text-xl font-light text-white text-center">
                          Pod Summary
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between py-2">
                            <span className="text-slate-400 font-light">Pod Type</span>
                            <span className="text-white font-light capitalize">
                              {podDetails?.pod_type}
                            </span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-slate-400 font-light">Content Filter</span>
                            <span className="text-white font-light capitalize">
                              {podDetails?.content_filter_level}
                            </span>
                          </div>
                          {podDetails?.personality_type && (
                            <div className="flex justify-between py-2">
                              <span className="text-slate-400 font-light">Learning Style</span>
                              <span className="text-white font-light capitalize">
                                {podDetails.personality_type}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>

                    {podDetails?.theme && (
                      <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                        <div className="p-6 space-y-6">
                          <h3 className="text-xl font-light text-white text-center">
                            Active Theme
                          </h3>
                          <div className="flex items-center justify-center gap-4">
                            <div 
                              className="w-16 h-16 rounded-xl flex items-center justify-center text-xl"
                              style={{ 
                                backgroundColor: `${podDetails.theme.primary_color}30`,
                                color: podDetails.theme.primary_color
                              }}
                            >
                              {podDetails.theme.emoji}
                            </div>
                            <div className="text-center">
                              <p className="text-white font-light">
                                {podDetails.theme.display_name}
                              </p>
                              <p className="text-sm text-slate-400 font-light">
                                Premium Theme
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Members Tab - Apple Style */}
            <TabsContent value="members">
              <div className="space-y-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-light text-white">
                    Pod Members
                  </h2>
                  <p className="text-slate-400 font-light max-w-2xl mx-auto">
                    Manage member access, roles, and participation
                  </p>
                </div>
                <PodMemberManagement 
                  podId={params.podId as string}
                  userRole={podDetails?.user_role || 'member'}
                />
              </div>
            </TabsContent>

            {/* Analytics Tab - Apple Style */}
            <TabsContent value="analytics">
              <div className="space-y-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-light text-white">
                    {podDetails?.pod_name} Analytics
                  </h2>
                  <p className="text-slate-400 font-light max-w-2xl mx-auto">
                    Performance insights and member engagement data
                  </p>
                  <div className="flex justify-center">
                    <select className="bg-slate-800 text-slate-400 border border-slate-700 rounded-lg px-4 py-2 font-light">
                      <option value="30">Last 30 days</option>
                      <option value="7">Last 7 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </div>
                </div>

                {/* Key Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {/* Most Active Day */}
                  <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                    <div className="p-8 text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                        <Calendar className="h-5 w-5" />
                        <span className="font-light">Most Active Day</span>
                      </div>
                      <div className="text-3xl font-light text-white">
                        Invalid Date
                      </div>
                      <p className="text-slate-400 font-light">
                        0 active members
                      </p>
                    </div>
                  </Card>

                  {/* Best Accuracy Day */}
                  <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                    <div className="p-8 text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                        <Target className="h-5 w-5" />
                        <span className="font-light">Best Accuracy Day</span>
                      </div>
                      <div className="text-3xl font-light text-white">
                        0.0%
                      </div>
                      <p className="text-slate-400 font-light">
                        on Invalid Date
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Pod Health Score */}
                <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                  <div className="p-8 space-y-8">
                    <h3 className="text-xl font-light text-white text-center">
                      Pod Health Score
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-light">Member Engagement</span>
                          <span className="text-sm text-white font-light">0%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <div className="bg-green-600 h-3 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-light">Learning Quality</span>
                          <span className="text-sm text-white font-light">0%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-light">Activity Level</span>
                          <span className="text-sm text-white font-light">0%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <div className="bg-purple-600 h-3 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Top Performers Section */}
                <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                  <div className="p-8 space-y-8">
                    <h3 className="text-xl font-light text-white text-center">
                      Top Performers
                    </h3>
                    
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400 font-light">No performance data yet</p>
                      <p className="text-sm text-slate-500 font-light mt-2">
                        Start completing quizzes to see member rankings and analytics
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Category Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                    <div className="p-8 space-y-6">
                      <h3 className="text-lg font-light text-white text-center">
                        Category Performance
                      </h3>
                      <div className="text-center py-8">
                        <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-400 font-light">
                          No category data yet
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                    <div className="p-8 space-y-6">
                      <h3 className="text-lg font-light text-white text-center">
                        Difficulty Distribution
                      </h3>
                      <div className="text-center py-8">
                        <Brain className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-400 font-light">
                          No difficulty data yet
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Challenges Tab - Apple Style */}
            <TabsContent value="challenges">
              <div className="space-y-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-light text-white">
                    Insights & Challenges
                  </h2>
                  <p className="text-slate-400 font-light max-w-2xl mx-auto">
                    Advanced analytics and learning challenges
                  </p>
                </div>

                <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                  <div className="p-12 text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                      <Star className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-light text-white">
                      Advanced Insights Coming Soon
                    </h3>
                    <p className="text-slate-400 font-light max-w-md mx-auto">
                      Detailed learning analytics and pod challenges will be available in a future update.
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab - Apple Style */}
            {canManagePod() && (
              <TabsContent value="settings">
                <div className="space-y-12">
                  <div className="text-center space-y-6">
                    <h2 className="text-3xl font-light text-white">
                      Pod Settings
                    </h2>
                    <p className="text-slate-400 font-light max-w-2xl mx-auto">
                      Configure your learning environment and preferences
                    </p>
                  </div>

                  <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                    <div className="p-12 text-center space-y-6">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                        <Settings className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-light text-white">
                        Settings Panel Coming Soon
                      </h3>
                      <p className="text-slate-400 font-light max-w-md mx-auto">
                        Advanced pod configuration tools will be available in a future update.
                      </p>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Safety Tab - Apple Style */}
            {canManagePod() && (
              <TabsContent value="safety">
                <div className="space-y-12">
                  <div className="text-center space-y-6">
                    <h2 className="text-3xl font-light text-white">
                      Safety & Parental Controls
                    </h2>
                    <p className="text-slate-400 font-light max-w-2xl mx-auto">
                      Comprehensive safety controls and parental oversight for your learning pod
                    </p>
                  </div>

                  {/* Integrate the full Parental Controls component */}
                  {(podDetails?.pod_type === 'family' || podDetails?.content_filter_level === 'strict') ? (
                    <ParentalControls />
                  ) : (
                    <Card className="border-0 bg-slate-900/50 backdrop-blur-sm">
                      <div className="p-12 text-center space-y-6">
                        <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                          <Shield className="h-8 w-8 text-green-400" />
                        </div>
                        <h3 className="text-xl font-light text-white">
                          Basic Safety Controls Active
                        </h3>
                        <p className="text-slate-400 font-light max-w-2xl mx-auto">
                          This pod has content filtering level: <strong className="text-white">{podDetails?.content_filter_level}</strong>. 
                          For family pods or advanced parental controls, upgrade your pod settings.
                        </p>
                        <div className="pt-4">
                          <p className="text-sm text-slate-500 font-light">
                            Parental controls are automatically available for family pods and strict content filtering.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
} 