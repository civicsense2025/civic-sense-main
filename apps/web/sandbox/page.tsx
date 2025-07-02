"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { Container } from '@civicsense/ui-web/components/ui/container'

export default function SandboxPage() {
  const demos = [
    {
      title: 'Admin Content Demo',
      description: 'AI-powered content generation and management tools',
      path: '/sandbox/admin-content',
      category: 'Admin',
      status: 'stable'
    },
    {
      title: 'Donation Demo',
      description: 'Stripe integration and donation flow testing',
      path: '/sandbox/donation',
      category: 'Payments',
      status: 'stable'
    },
    {
      title: 'Learning Pods Demo',
      description: 'Collaborative learning pod management system',
      path: '/sandbox/learning-pods',
      category: 'Social',
      status: 'stable'
    },
    {
      title: 'News Ticker Demo',
      description: 'Real-time news ticker with bias analysis',
      path: '/sandbox/news-ticker',
      category: 'Content',
      status: 'stable'
    },
    {
      title: 'NPC Demo',
      description: 'AI-powered civic education chatbot',
      path: '/sandbox/npc',
      category: 'AI',
      status: 'stable'
    },
    {
      title: 'Survey Demo',
      description: 'Dynamic survey builder and response system',
      path: '/sandbox/survey',
      category: 'Forms',
      status: 'stable'
    },
    {
      title: 'Example Template',
      description: 'Template demonstrating sandbox development patterns',
      path: '/sandbox/example',
      category: 'UI',
      status: 'stable'
    }
  ]

  const tests = [
    {
      title: 'AI Content Extraction',
      description: 'Test AI-powered content extraction from articles',
      path: '/sandbox/test/ai-extraction',
      category: 'AI',
      status: 'experimental'
    },
    {
      title: 'Analytics Testing',
      description: 'Test analytics data collection and visualization',
      path: '/sandbox/test/analytics',
      category: 'Analytics',
      status: 'experimental'
    },
    {
      title: 'Educational Access',
      description: 'Test educational email domain verification',
      path: '/sandbox/test/educational-access',
      category: 'Auth',
      status: 'experimental'
    },
    {
      title: 'Gift Analytics',
      description: 'Test gift link analytics and tracking',
      path: '/sandbox/test/gift-analytics',
      category: 'Analytics',
      status: 'experimental'
    },
    {
      title: 'JSONB Translation',
      description: 'Test multilingual content storage and retrieval',
      path: '/sandbox/test/jsonb-translation',
      category: 'i18n',
      status: 'experimental'
    },
    {
      title: 'localStorage Fix',
      description: 'Test localStorage progress restoration fixes',
      path: '/sandbox/test/localStorage-fix',
      category: 'Storage',
      status: 'experimental'
    },
    {
      title: 'Media Bias Analysis',
      description: 'Test AI-powered media bias detection',
      path: '/sandbox/test/media-bias-analysis',
      category: 'AI',
      status: 'experimental'
    },
    {
      title: 'Multiplayer System',
      description: 'Test multiplayer quiz functionality',
      path: '/sandbox/test/multiplayer',
      category: 'Games',
      status: 'experimental'
    },
    {
      title: 'Multiplayer Debug',
      description: 'Debug multiplayer room management',
      path: '/sandbox/test/multiplayer-debug',
      category: 'Games',
      status: 'debug'
    },
    {
      title: 'Multiplayer Modes',
      description: 'Test different multiplayer game modes',
      path: '/sandbox/test/multiplayer-modes',
      category: 'Games',
      status: 'experimental'
    },
    {
      title: 'NPC Integration',
      description: 'Test NPC chatbot integration',
      path: '/sandbox/test/npc-integration',
      category: 'AI',
      status: 'experimental'
    },
    {
      title: 'Room Management',
      description: 'Test multiplayer room lifecycle management',
      path: '/sandbox/test/room-management',
      category: 'Games',
      status: 'experimental'
    },
    {
      title: 'Source Maintenance',
      description: 'Test source URL validation and maintenance',
      path: '/sandbox/test/source-maintenance',
      category: 'Content',
      status: 'experimental'
    },
    {
      title: 'Stripe Integration',
      description: 'Test Stripe payment processing',
      path: '/sandbox/test/stripe',
      category: 'Payments',
      status: 'experimental'
    },
    {
      title: 'Toast Notifications',
      description: 'Test toast notification system',
      path: '/sandbox/test/toast',
      category: 'UI',
      status: 'experimental'
    },
    {
      title: 'Translation System',
      description: 'Test multilingual content translation',
      path: '/sandbox/test/translation',
      category: 'i18n',
      status: 'experimental'
    },
    {
      title: 'Text-to-Speech',
      description: 'Test TTS functionality for accessibility',
      path: '/sandbox/test/tts',
      category: 'Accessibility',
      status: 'experimental'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 text-green-800'
      case 'experimental':
        return 'bg-yellow-100 text-yellow-800'
      case 'debug':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Admin': 'bg-purple-100 text-purple-800',
      'AI': 'bg-blue-100 text-blue-800',
      'Analytics': 'bg-indigo-100 text-indigo-800',
      'Auth': 'bg-orange-100 text-orange-800',
      'Content': 'bg-green-100 text-green-800',
      'Forms': 'bg-pink-100 text-pink-800',
      'Games': 'bg-red-100 text-red-800',
      'Payments': 'bg-emerald-100 text-emerald-800',
      'Social': 'bg-cyan-100 text-cyan-800',
      'Storage': 'bg-gray-100 text-gray-800',
      'UI': 'bg-violet-100 text-violet-800',
      'i18n': 'bg-yellow-100 text-yellow-800',
      'Accessibility': 'bg-teal-100 text-teal-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🧪 CivicSense Sandbox</h1>
        <p className="text-gray-600 mb-4">
          Development environment for testing components, demos, and experimental features.
          All sandbox content is excluded from version control.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-green-100 text-green-800">Stable</Badge>
          <Badge className="bg-yellow-100 text-yellow-800">Experimental</Badge>
          <Badge className="bg-red-100 text-red-800">Debug</Badge>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Demos Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">🎭 Demos</h2>
          <p className="text-gray-600 mb-4">
            Stable demonstrations of completed features and components.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demos.map((demo) => (
              <Link key={demo.path} href={demo.path}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{demo.title}</CardTitle>
                      <div className="flex gap-1">
                        <Badge className={getCategoryColor(demo.category)} variant="secondary">
                          {demo.category}
                        </Badge>
                        <Badge className={getStatusColor(demo.status)}>
                          {demo.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{demo.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Tests Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">🔧 Tests & Experiments</h2>
          <p className="text-gray-600 mb-4">
            Experimental features, debugging tools, and integration tests.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <Link key={test.path} href={test.path}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      <div className="flex gap-1">
                        <Badge className={getCategoryColor(test.category)} variant="secondary">
                          {test.category}
                        </Badge>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{test.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Development Guidelines */}
        <section className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl">📋 Development Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Adding New Components to Sandbox:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Create new sandbox pages under <code>/app/sandbox/</code></li>
                  <li>Use the sandbox layout for consistent styling</li>
                  <li>Add to this index page with proper categorization and status</li>
                  <li>Include Storybook stories for reusable components</li>
                  <li>Document any special setup or API keys required</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Component Development Flow:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Build component in sandbox with test data</li>
                  <li>Create Storybook story with all variants</li>
                  <li>Add unit tests for core functionality</li>
                  <li>Move to production app when stable</li>
                  <li>Keep sandbox version for continued testing</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </Container>
  )
} 